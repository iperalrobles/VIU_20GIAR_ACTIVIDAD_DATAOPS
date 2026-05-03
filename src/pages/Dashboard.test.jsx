import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuthProvider } from '../context/AuthContext'
import Dashboard from './Dashboard'

vi.mock('../services/stockService', () => ({
  getStockData: vi.fn(() =>
    Promise.resolve({
      data: [
        { date: '2026-01-01', open: 100, high: 105, low: 98, close: 103, volume: 25000000 },
        { date: '2026-01-02', open: 103, high: 107, low: 101, close: 106, volume: 30000000 },
        { date: '2026-01-03', open: 106, high: 110, low: 104, close: 108, volume: 28000000 },
      ],
      source: 'mock',
    })
  ),
}))

function renderDashboard() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Dashboard />
      </AuthProvider>
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Dashboard', () => {
  it('shows loading state initially', () => {
    renderDashboard()
    expect(screen.getByText('Cargando datos...')).toBeInTheDocument()
  })

  it('renders price and volume charts after loading', async () => {
    renderDashboard()
    await waitFor(() => {
      expect(screen.getByText('Precio de cierre')).toBeInTheDocument()
      expect(screen.getByText('Volumen de operaciones')).toBeInTheDocument()
    })
  })

  it('renders ticker selector with default AAPL', async () => {
    renderDashboard()
    await waitFor(() => {
      expect(screen.getByLabelText('Ticker')).toHaveValue('AAPL')
    })
  })

  it('changes ticker when selecting a different option', async () => {
    const user = userEvent.setup()
    const { getStockData } = await import('../services/stockService')

    renderDashboard()
    await waitFor(() => {
      expect(screen.getByLabelText('Ticker')).toBeInTheDocument()
    })

    await user.selectOptions(screen.getByLabelText('Ticker'), 'MSFT')

    expect(screen.getByLabelText('Ticker')).toHaveValue('MSFT')
    expect(getStockData).toHaveBeenCalledWith('MSFT')
  })

  it('renders range selector buttons', async () => {
    renderDashboard()
    await waitFor(() => {
      expect(screen.getByText('1S')).toBeInTheDocument()
      expect(screen.getByText('1M')).toBeInTheDocument()
      expect(screen.getByText('3M')).toBeInTheDocument()
      expect(screen.getByText('6M')).toBeInTheDocument()
      expect(screen.getByText('1A')).toBeInTheDocument()
    })
  })

  it('highlights active range button', async () => {
    const user = userEvent.setup()
    renderDashboard()
    await waitFor(() => {
      expect(screen.getByText('3M')).toHaveClass('active')
    })

    await user.click(screen.getByText('1M'))
    expect(screen.getByText('1M')).toHaveClass('active')
    expect(screen.getByText('3M')).not.toHaveClass('active')
  })

  it('renders navbar with logout button', async () => {
    renderDashboard()
    expect(screen.getByText('Cerrar sesión')).toBeInTheDocument()
  })
})
