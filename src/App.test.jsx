import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach } from 'vitest'
import { AuthProvider } from './context/AuthContext'
import App from './App'

function renderApp(route = '/') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>
  )
}

beforeEach(() => {
  sessionStorage.clear()
})

describe('Login', () => {
  it('redirects to login when not authenticated', () => {
    renderApp('/')
    expect(screen.getByText('Iniciar sesión')).toBeInTheDocument()
  })

  it('renders login form fields', () => {
    renderApp('/login')
    expect(screen.getByLabelText('Usuario')).toBeInTheDocument()
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument()
  })

  it('shows error with wrong credentials', async () => {
    const user = userEvent.setup()
    renderApp('/login')

    await user.type(screen.getByLabelText('Usuario'), 'wrong')
    await user.type(screen.getByLabelText('Contraseña'), 'wrong')
    await user.click(screen.getByText('Iniciar sesión'))

    expect(screen.getByText('Usuario o contraseña incorrectos')).toBeInTheDocument()
  })

  it('redirects to dashboard with correct credentials', async () => {
    const user = userEvent.setup()
    renderApp('/login')

    await user.type(screen.getByLabelText('Usuario'), 'administrador')
    await user.type(screen.getByLabelText('Contraseña'), 'viu2026')
    await user.click(screen.getByText('Iniciar sesión'))

    expect(screen.getByText('Cerrar sesión')).toBeInTheDocument()
  })
})

describe('Logout', () => {
  it('redirects to login after logout', async () => {
    const user = userEvent.setup()
    renderApp('/login')

    await user.type(screen.getByLabelText('Usuario'), 'administrador')
    await user.type(screen.getByLabelText('Contraseña'), 'viu2026')
    await user.click(screen.getByText('Iniciar sesión'))

    await user.click(screen.getByText('Cerrar sesión'))

    expect(screen.getByText('Iniciar sesión')).toBeInTheDocument()
  })
})

describe('Protected routes', () => {
  it('redirects to login when accessing / without auth', () => {
    renderApp('/')
    expect(screen.getByLabelText('Usuario')).toBeInTheDocument()
  })

  it('redirects authenticated user from /login to dashboard', async () => {
    const user = userEvent.setup()
    renderApp('/login')

    await user.type(screen.getByLabelText('Usuario'), 'administrador')
    await user.type(screen.getByLabelText('Contraseña'), 'viu2026')
    await user.click(screen.getByText('Iniciar sesión'))

    expect(screen.queryByLabelText('Usuario')).not.toBeInTheDocument()
    expect(screen.getByText('Cerrar sesión')).toBeInTheDocument()
  })
})
