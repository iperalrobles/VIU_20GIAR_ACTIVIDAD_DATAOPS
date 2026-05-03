function generateMockData(ticker, basePrice, volatility) {
  const data = []
  const now = new Date()
  let price = basePrice

  for (let i = 365; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)

    if (date.getDay() === 0 || date.getDay() === 6) continue

    const change = (Math.random() - 0.48) * volatility
    price = Math.max(price + change, 1)

    const open = price + (Math.random() - 0.5) * volatility * 0.3
    const high = Math.max(price, open) + Math.random() * volatility * 0.2
    const low = Math.min(price, open) - Math.random() * volatility * 0.2
    const volume = Math.floor(20000000 + Math.random() * 30000000)

    data.push({
      date: date.toISOString().split('T')[0],
      open: +open.toFixed(2),
      high: +high.toFixed(2),
      low: +low.toFixed(2),
      close: +price.toFixed(2),
      volume,
    })
  }

  return data
}

const MOCK_STOCKS = {
  AAPL: generateMockData('AAPL', 178, 3),
  GOOGL: generateMockData('GOOGL', 140, 4),
  MSFT: generateMockData('MSFT', 370, 5),
  AMZN: generateMockData('AMZN', 180, 4),
  TSLA: generateMockData('TSLA', 245, 8),
}

export function getMockData(ticker) {
  return MOCK_STOCKS[ticker] || MOCK_STOCKS.AAPL
}

export const AVAILABLE_TICKERS = Object.keys(MOCK_STOCKS)
