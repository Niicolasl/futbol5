import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEffect, useState } from 'react'

function Navbar() {
  const { isAuthenticated, logout, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)

  // Navbar se vuelve más opaca al hacer scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path

  return (
    <nav className="anim-fade-in fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(0,0,0,0.95)' : 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(20px)',
        borderBottom: scrolled ? '1px solid rgba(255,107,53,0.15)' : '1px solid rgba(255,255,255,0.05)',
        boxShadow: scrolled ? '0 4px 30px rgba(0,0,0,0.5)' : 'none',
      }}>

      {/* Logo */}
      <Link to="/">
        <h1 className="text-2xl font-black tracking-widest uppercase transition-all duration-300 hover:scale-105"
          style={{ color: '#ff6b35', textShadow: '0 0 20px #ff6b3566' }}>
          FUTBOL5
        </h1>
      </Link>

      {/* Links */}
      <div className="flex items-center gap-6">
        {isAuthenticated ? (
          <>
            <span className="text-gray-400 text-sm hidden sm:block">
              Hola, <span className="text-white font-semibold">{user?.nombre}</span>
            </span>
            {[
              { to: '/canchas', label: 'Canchas' },
              { to: '/mis-reservas', label: 'Mis Reservas' },
            ].map(({ to, label }) => (
              <Link key={to} to={to}
                className="relative text-sm uppercase tracking-widest transition-all duration-300 pb-1"
                style={{ color: isActive(to) ? '#ff6b35' : '#9ca3af' }}>
                {label}
                {/* Línea inferior activa */}
                <span className="absolute bottom-0 left-0 h-0.5 transition-all duration-300"
                  style={{
                    width: isActive(to) ? '100%' : '0%',
                    background: '#ff6b35',
                  }} />
              </Link>
            ))}
            {user?.rol === 'admin' && (
              <Link to="/admin"
                className="px-3 py-1 rounded-md text-xs uppercase tracking-widest font-bold transition-all hover:scale-105"
                style={{ background: 'rgba(255,107,53,0.15)', border: '1px solid rgba(255,107,53,0.4)', color: '#ff6b35' }}>
                Admin
              </Link>
            )}
            <button onClick={handleLogout}
              className="btn-gta px-4 py-2 rounded-lg text-xs uppercase tracking-widest font-bold cursor-pointer"
              style={{ border: '1px solid #ff6b3550', color: '#ff6b35' }}>
              Salir
            </button>
          </>
        ) : (
          <>
            <Link to="/login"
              className="text-gray-400 hover:text-white text-sm uppercase tracking-widest transition-colors">
              Login
            </Link>
            <Link to="/register"
              className="btn-gta px-4 py-2 rounded-lg text-xs uppercase tracking-widest font-bold"
              style={{ background: 'linear-gradient(135deg, #ff6b35, #f7c59f)', color: '#000' }}>
              Registro
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}

export default Navbar