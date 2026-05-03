import { useState } from 'react'
import { AuthContext } from './auth-context'

const VALID_USER = 'administrador'
const VALID_PASSWORD = 'viu2026'

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => sessionStorage.getItem('auth') === 'true'
  )

  const login = (username, password) => {
    if (username === VALID_USER && password === VALID_PASSWORD) {
      setIsAuthenticated(true)
      sessionStorage.setItem('auth', 'true')
      return true
    }
    return false
  }

  const logout = () => {
    setIsAuthenticated(false)
    sessionStorage.removeItem('auth')
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
