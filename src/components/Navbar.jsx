import { useAuth } from '../context/useAuth'
import './Navbar.css'

export default function Navbar() {
  const { logout } = useAuth()

  return (
    <nav className="navbar">
      <span className="navbar-title">Financial Dashboard</span>
      <button className="navbar-logout" onClick={logout}>
        Cerrar sesión
      </button>
    </nav>
  )
}
