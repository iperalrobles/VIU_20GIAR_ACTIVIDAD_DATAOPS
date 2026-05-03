import { getMockData } from './mockData'

const API_KEY = import.meta.env.VITE_ALPHA_VANTAGE_KEY || 'demo'
const BASE_URL = 'https://www.alphavantage.co/query'

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

export async function getStockData(ticker) {
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
