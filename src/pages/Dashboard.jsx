import { useState, useEffect, useMemo } from 'react'
import Navbar from '../components/Navbar'
import PriceChart from '../components/PriceChart'
import VolumeChart from '../components/VolumeChart'
import TickerSelector from '../components/TickerSelector'
import RangeSelector from '../components/RangeSelector'
import { getStockData } from '../services/stockService'
import './Dashboard.css'

const SOURCE_LABELS = {
  dataops: 'Dataset DataOps validado',
  api: 'Alpha Vantage API',
  mock: 'Datos mock',
}

export default function Dashboard() {
  const [ticker, setTicker] = useState('AAPL')
  const [range, setRange] = useState(90)
  const [stockData, setStockData] = useState(null)
  const [dataSource, setDataSource] = useState(null)
  const [loadedTicker, setLoadedTicker] = useState(null)

  useEffect(() => {
    let cancelled = false
    getStockData(ticker).then((result) => {
      if (!cancelled) {
        setStockData(result.data)
        setDataSource(result.source)
        setLoadedTicker(ticker)
      }
    })
    return () => { cancelled = true }
  }, [ticker])

  const filteredData = useMemo(() => {
    if (!stockData) return []
    return stockData.slice(-range)
  }, [stockData, range])

  const loading = loadedTicker !== ticker

  return (
    <div className="dashboard">
      <Navbar />
      <main className="dashboard-content">
        <section className="dashboard-filters">
          <TickerSelector selected={ticker} onChange={setTicker} />
          <RangeSelector selected={range} onChange={setRange} />
        </section>
        {dataSource && !loading && (
          <p className="data-source">Fuente: {SOURCE_LABELS[dataSource] || dataSource}</p>
        )}
        <section className="dashboard-charts">
          {loading || !stockData ? (
            <p>Cargando datos...</p>
          ) : (
            <>
              <PriceChart data={filteredData} />
              <VolumeChart data={filteredData} />
            </>
          )}
        </section>
      </main>
    </div>
  )
}
