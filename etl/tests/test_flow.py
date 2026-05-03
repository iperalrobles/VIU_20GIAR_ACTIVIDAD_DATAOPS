import json
import sqlite3

import pandas as pd
import pytest

from etl.flow import (
    TICKERS,
    _mock_data,
    extract_ticker,
    financial_etl_pipeline,
    init_database,
    load_to_sqlite,
    publish_json,
    transform_ticker,
    validate_ticker,
)


@pytest.fixture
def extracted():
    return _mock_data("AAPL", days=40)


@pytest.fixture
def transformed(extracted):
    return transform_ticker.fn(extracted)


def test_mock_data_is_deterministic():
    assert _mock_data("AAPL", days=5) == _mock_data("AAPL", days=5)


def test_extract_uses_mock_when_api_fails(monkeypatch):
    def fail_request(*_args, **_kwargs):
        raise OSError("network unavailable")

    monkeypatch.setattr("etl.flow.urlopen", fail_request)
    result = extract_ticker.fn("MSFT")
    assert result["ticker"] == "MSFT"
    assert result["source"] == "mock"
    assert len(result["raw"]) == 140


def test_transform_adds_expected_columns(transformed):
    expected = {
        "ticker",
        "date",
        "open",
        "high",
        "low",
        "close",
        "volume",
        "source",
        "daily_return",
        "price_range",
        "ma_7",
        "ma_30",
        "extracted_at",
    }
    assert expected.issubset(transformed.columns)
    assert pd.api.types.is_datetime64_any_dtype(transformed["date"])
    assert transformed["date"].is_monotonic_increasing


def test_validate_accepts_clean_data(transformed):
    validated = validate_ticker.fn(transformed)
    assert len(validated) == len(transformed)


def test_validate_rejects_negative_prices(transformed):
    broken = transformed.copy()
    broken.loc[0, "close"] = -1
    with pytest.raises(ValueError, match="Prices must be positive"):
        validate_ticker.fn(broken)


def test_init_database_creates_table(tmp_path):
    db_path = tmp_path / "stocks.db"
    init_database.fn(db_path)
    with sqlite3.connect(db_path) as connection:
        tables = connection.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
    assert ("stock_prices",) in tables


def test_load_to_sqlite_replaces_ticker_partition(tmp_path, transformed):
    db_path = tmp_path / "stocks.db"
    init_database.fn(db_path)
    first_count = load_to_sqlite.fn(transformed, db_path)
    second_count = load_to_sqlite.fn(transformed, db_path)
    with sqlite3.connect(db_path) as connection:
        total = connection.execute("SELECT COUNT(*) FROM stock_prices").fetchone()[0]
    assert first_count == len(transformed)
    assert second_count == len(transformed)
    assert total == len(transformed)


def test_publish_json_writes_frontend_contract(tmp_path, transformed):
    output_path = tmp_path / "stocks.json"
    result = publish_json.fn([transformed], output_path)
    payload = json.loads(output_path.read_text(encoding="utf-8"))
    assert result["rows"] == len(transformed)
    assert payload["schema_version"] == 1
    assert "AAPL" in payload["tickers"]
    assert {"date", "close", "volume", "ma_7", "ma_30"}.issubset(payload["tickers"]["AAPL"][0])


def test_full_pipeline_processes_selected_tickers(tmp_path):
    result = financial_etl_pipeline(
        tickers=["AAPL", "MSFT"],
        db_path=tmp_path / "stocks.db",
        json_output_path=tmp_path / "stocks.json",
    )
    assert result["rows_by_ticker"]["AAPL"] > 0
    assert result["rows_by_ticker"]["MSFT"] > 0
    assert result["published"]["tickers"] == ["AAPL", "MSFT"]


def test_configured_tickers_are_supported():
    assert TICKERS == ["AAPL", "GOOGL", "MSFT", "AMZN", "TSLA"]
