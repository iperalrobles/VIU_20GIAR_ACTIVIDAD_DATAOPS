import { getMockData } from './mockData'

const API_KEY = import.meta.env.VITE_ALPHA_VANTAGE_KEY || 'demo'
const BASE_URL = 'https://www.alphavantage.co/query'
const DATASET_URL = `${import.meta.env.BASE_URL}data/stocks.json`

function parseApiResponse(data) {
  const timeSeries = data['Time Series (Daily)']
  if (!timeSeries) return null

  return Object.entries(timeSeries)
    .map(([date, values]) => ({
      date,
      open: +parseFloat(values['1. open']).toFixed(2),
      high: +parseFloat(values['2. high']).toFixed(2),
      low: +parseFloat(values['3. low']).toFixed(2),
      close: +parseFloat(values['4. close']).toFixed(2),
      volume: parseInt(values['5. volume'], 10),
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

function normalizeProcessedRows(rows) {
  return rows.map((row) => ({
    ...row,
    open: Number(row.open),
    high: Number(row.high),
    low: Number(row.low),
    close: Number(row.close),
    volume: Number(row.volume),
    daily_return: Number(row.daily_return ?? 0),
    price_range: Number(row.price_range ?? 0),
    ma_7: Number(row.ma_7 ?? row.close),
    ma_30: Number(row.ma_30 ?? row.close),
  }))
}

async function getProcessedDataset(ticker) {
  const response = await fetch(DATASET_URL, { cache: 'no-store' })
  if (!response.ok) return null

  const dataset = await response.json()
  const rows = dataset?.tickers?.[ticker]
  if (!Array.isArray(rows) || rows.length === 0) return null

  return normalizeProcessedRows(rows).sort((a, b) => a.date.localeCompare(b.date))
}

export async function getStockData(ticker) {
  try {
    const processed = await getProcessedDataset(ticker)
    if (processed) {
      return { data: processed, source: 'dataops' }
    }
  } catch {
    // If the generated dataset is not available locally, continue with fallbacks.
  }

  try {
    const url = `${BASE_URL}?function=TIME_SERIES_DAILY&symbol=${ticker}&outputsize=full&apikey=${API_KEY}`
    const response = await fetch(url)
    const data = await response.json()

    const parsed = parseApiResponse(data)
    if (parsed && parsed.length > 0) {
      return { data: parsed, source: 'api' }
    }

    return { data: getMockData(ticker), source: 'mock' }
  } catch {
    return { data: getMockData(ticker), source: 'mock' }
  }
}
