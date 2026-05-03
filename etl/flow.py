"""DataOps ETL pipeline for the Financial Dashboard.

The pipeline extracts daily stock prices, validates and enriches them, stores a
SQLite copy for traceability, and publishes a frontend-ready JSON dataset.
"""

from __future__ import annotations

import json
import os
import random
import sqlite3
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlencode
from urllib.request import urlopen

import pandas as pd

try:
    from prefect import flow, get_run_logger, task
except ImportError:
    def task(*_args, **_kwargs):
        def decorator(func):
            func.fn = func
            return func

        return decorator

    def flow(*_args, **_kwargs):
        def decorator(func):
            return func

        return decorator

    def get_run_logger():
        class Logger:
            def info(self, message: str) -> None:
                print(message)

            def warning(self, message: str) -> None:
                print(f"WARNING: {message}")

        return Logger()


TICKERS = ["AAPL", "GOOGL", "MSFT", "AMZN", "TSLA"]
BASE_URL = "https://www.alphavantage.co/query"
DB_PATH = Path(os.getenv("DB_PATH", "data/stocks.db"))
JSON_OUTPUT_PATH = Path(os.getenv("JSON_OUTPUT_PATH", "public/data/stocks.json"))
API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY", "demo")


def _mock_data(ticker: str, days: int = 140) -> dict[str, Any]:
    """Generate deterministic market-like data for reproducible demos/tests."""
    seed = sum(ord(char) for char in ticker)
    rng = random.Random(seed)
    base_price = {
        "AAPL": 180,
        "GOOGL": 140,
        "MSFT": 380,
        "AMZN": 185,
        "TSLA": 250,
    }.get(ticker, 100)
    raw = {}
    price = float(base_price)
    current = datetime(2026, 5, 1)

    while len(raw) < days:
        if current.weekday() < 5:
            drift = rng.uniform(-2.5, 2.5)
            price = max(price + drift, 1)
            open_price = price + rng.uniform(-1.2, 1.2)
            high = max(open_price, price) + rng.uniform(0.3, 2.5)
            low = min(open_price, price) - rng.uniform(0.3, 2.5)
            raw[current.strftime("%Y-%m-%d")] = {
                "1. open": f"{open_price:.4f}",
                "2. high": f"{high:.4f}",
                "3. low": f"{low:.4f}",
                "4. close": f"{price:.4f}",
                "5. volume": str(rng.randint(10_000_000, 85_000_000)),
            }
        current -= timedelta(days=1)

    return {"ticker": ticker, "raw": raw, "source": "mock"}


@task(name="extract_ticker", retries=2, retry_delay_seconds=10)
def extract_ticker(ticker: str) -> dict[str, Any]:
    """Download daily market data from Alpha Vantage or fall back to mock data."""
    logger = get_run_logger()
    logger.info(f"Extracting stock prices for {ticker}")
    params = urlencode(
        {
            "function": "TIME_SERIES_DAILY",
            "symbol": ticker,
            "outputsize": "compact",
            "apikey": API_KEY,
        }
    )

    try:
        with urlopen(f"{BASE_URL}?{params}", timeout=30) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except Exception as exc:
        logger.warning(f"Alpha Vantage request failed for {ticker}: {exc}")
        return _mock_data(ticker)

    time_series = payload.get("Time Series (Daily)")
    if not time_series:
        logger.warning(f"Alpha Vantage returned no time series for {ticker}; using mock data")
        return _mock_data(ticker)

    return {"ticker": ticker, "raw": time_series, "source": "alpha_vantage"}


@task(name="transform_ticker")
def transform_ticker(extracted: dict[str, Any]) -> pd.DataFrame:
    """Normalize raw API rows and calculate analytics metrics."""
    ticker = extracted["ticker"]
    rows = []

    for date_value, values in extracted["raw"].items():
        rows.append(
            {
                "ticker": ticker,
                "date": date_value,
                "open": float(values["1. open"]),
                "high": float(values["2. high"]),
                "low": float(values["3. low"]),
                "close": float(values["4. close"]),
                "volume": int(values["5. volume"]),
                "source": extracted.get("source", "unknown"),
            }
        )

    df = pd.DataFrame(rows)
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values("date").reset_index(drop=True)
    df["daily_return"] = df["close"].pct_change().fillna(0).round(6)
    df["price_range"] = (df["high"] - df["low"]).round(4)
    df["ma_7"] = df["close"].rolling(7, min_periods=1).mean().round(4)
    df["ma_30"] = df["close"].rolling(30, min_periods=1).mean().round(4)
    df["extracted_at"] = datetime.now(timezone.utc).isoformat()
    return df


@task(name="validate_ticker")
def validate_ticker(df: pd.DataFrame) -> pd.DataFrame:
    """Apply lightweight data quality checks before publishing data."""
    required = {
        "ticker",
        "date",
        "open",
        "high",
        "low",
        "close",
        "volume",
        "daily_return",
        "price_range",
        "ma_7",
        "ma_30",
    }
    missing = required.difference(df.columns)
    if missing:
        raise ValueError(f"Missing required columns: {sorted(missing)}")
    if df.empty:
        raise ValueError("Transformed data is empty")
    if df["date"].duplicated().any():
        raise ValueError("Duplicate dates detected for ticker")
    if (df[["open", "high", "low", "close"]] <= 0).any().any():
        raise ValueError("Prices must be positive")
    if (df["high"] < df["low"]).any():
        raise ValueError("High price cannot be lower than low price")
    if (df["volume"] < 0).any():
        raise ValueError("Volume cannot be negative")
    return df


@task(name="init_database")
def init_database(db_path: Path | str = DB_PATH) -> None:
    """Create the SQLite table used as an auditable local data store."""
    path = Path(db_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(path) as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS stock_prices (
                ticker TEXT NOT NULL,
                date TEXT NOT NULL,
                open REAL NOT NULL,
                high REAL NOT NULL,
                low REAL NOT NULL,
                close REAL NOT NULL,
                volume INTEGER NOT NULL,
                source TEXT NOT NULL,
                daily_return REAL NOT NULL,
                price_range REAL NOT NULL,
                ma_7 REAL NOT NULL,
                ma_30 REAL NOT NULL,
                extracted_at TEXT NOT NULL,
                PRIMARY KEY (ticker, date)
            )
            """
        )


@task(name="load_to_sqlite")
def load_to_sqlite(df: pd.DataFrame, db_path: Path | str = DB_PATH) -> int:
    """Replace the current ticker partition in SQLite and return rows loaded."""
    path = Path(db_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    ticker = df["ticker"].iloc[0]
    db_df = df.copy()
    db_df["date"] = db_df["date"].dt.strftime("%Y-%m-%d")

    with sqlite3.connect(path) as connection:
        connection.execute("DELETE FROM stock_prices WHERE ticker = ?", (ticker,))
        db_df.to_sql("stock_prices", connection, if_exists="append", index=False)
        return connection.execute(
            "SELECT COUNT(*) FROM stock_prices WHERE ticker = ?", (ticker,)
        ).fetchone()[0]


@task(name="publish_json")
def publish_json(frames: list[pd.DataFrame], output_path: Path | str = JSON_OUTPUT_PATH) -> dict[str, Any]:
    """Write the frontend contract consumed by the React dashboard."""
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "schema_version": 1,
        "tickers": {},
    }

    for frame in frames:
        ticker = frame["ticker"].iloc[0]
        json_df = frame.copy()
        json_df["date"] = json_df["date"].dt.strftime("%Y-%m-%d")
        payload["tickers"][ticker] = json.loads(json_df.to_json(orient="records"))

    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return {"path": str(path), "tickers": sorted(payload["tickers"]), "rows": sum(len(f) for f in frames)}


@flow(name="financial-dataops-pipeline", log_prints=True)
def financial_etl_pipeline(
    tickers: list[str] | None = None,
    db_path: Path | str = DB_PATH,
    json_output_path: Path | str = JSON_OUTPUT_PATH,
) -> dict[str, Any]:
    """Run Extract, Transform, Validate and Load for the dashboard dataset."""
    selected_tickers = tickers or TICKERS
    init_database(db_path)

    frames = []
    rows_by_ticker = {}
    for ticker in selected_tickers:
        extracted = extract_ticker(ticker)
        transformed = transform_ticker(extracted)
        validated = validate_ticker(transformed)
        rows_by_ticker[ticker] = load_to_sqlite(validated, db_path)
        frames.append(validated)

    published = publish_json(frames, json_output_path)
    result = {"rows_by_ticker": rows_by_ticker, "published": published}
    print(f"DataOps pipeline completed: {published['rows']} rows published to {published['path']}")
    return result


if __name__ == "__main__":
    financial_etl_pipeline()
