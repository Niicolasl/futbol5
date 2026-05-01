import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEffect, useState, useRef } from 'react'

function Navbar() {
  const { isAuthenticated, logout, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Cerrar dropdown al cambiar de ruta
  useEffect(() => { setDropdownOpen(false) }, [location.pathname])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path

  const iniciales = user?.nombre
    ? user.nombre.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

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
            {[
              { to: '/canchas', label: 'Canchas' },
              { to: '/mis-reservas', label: 'Mis Reservas' },
            ].map(({ to, label }) => (
              <Link key={to} to={to}
                className="relative text-sm uppercase tracking-widest transition-all duration-300 pb-1 hidden sm:block"
                style={{ color: isActive(to) ? '#ff6b35' : '#9ca3af' }}>
                {label}
                <span className="absolute bottom-0 left-0 h-0.5 transition-all duration-300"
                  style={{ width: isActive(to) ? '100%' : '0%', background: '#ff6b35' }} />
              </Link>
            ))}

            {user?.rol === 'admin' && (
              <Link to="/admin"
                className="px-3 py-1 rounded-md text-xs uppercase tracking-widest font-bold transition-all hover:scale-105 hidden sm:block"
                style={{ background: 'rgba(255,107,53,0.15)', border: '1px solid rgba(255,107,53,0.4)', color: '#ff6b35' }}>
                Admin
              </Link>
            )}

            {/* Avatar / dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 cursor-pointer group"
                aria-label="Menú de usuario">
                {/* Círculo de iniciales */}
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black select-none transition-all duration-200 group-hover:scale-105"
                  style={{
                    background: dropdownOpen ? 'rgba(255,107,53,0.25)' : 'rgba(255,107,53,0.12)',
                    border: `1px solid ${dropdownOpen ? 'rgba(255,107,53,0.6)' : 'rgba(255,107,53,0.3)'}`,
                    color: '#ff6b35',
                  }}>
                  {iniciales}
                </div>
                {/* Chevron */}
                <svg className="w-3 h-3 text-gray-500 transition-transform duration-200 hidden sm:block"
                  style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown */}
              {dropdownOpen && (
                <div className="absolute right-0 top-12 w-56 rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
                  style={{ background: '#0d0d0d', boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }}>

                  {/* Info usuario */}
                  <div className="px-4 py-4 border-b border-white/5">
                    <p className="text-white font-bold text-sm truncate">{user?.nombre}</p>
                    <p className="text-gray-500 text-xs truncate">{user?.email}</p>
                    {user?.rol === 'admin' && (
                      <span className="mt-1.5 inline-block px-2 py-0.5 rounded text-xs font-bold uppercase"
                        style={{ background: 'rgba(255,107,53,0.15)', color: '#ff6b35', border: '1px solid rgba(255,107,53,0.3)' }}>
                        Admin
                      </span>
                    )}
                  </div>

                  {/* Links del menú */}
                  <div className="py-2">
                    {[
                      { to: '/canchas', label: '⚽ Canchas', sm: true },
                      { to: '/mis-reservas', label: '📋 Mis Reservas', sm: true },
                      { to: '/perfil', label: '👤 Mi Perfil', sm: false },
                      ...(user?.rol === 'admin' ? [{ to: '/admin', label: '⚡ Panel Admin', sm: true }] : []),
                    ].map(({ to, label, sm }) => (
                      <Link key={to} to={to}
                        className={`flex items-center px-4 py-2.5 text-sm transition-all hover:text-white ${sm ? 'sm:hidden' : ''}`}
                        style={{ color: isActive(to) ? '#ff6b35' : '#9ca3af', background: isActive(to) ? 'rgba(255,107,53,0.06)' : 'transparent' }}>
                        {label}
                      </Link>
                    ))}
                  </div>

                  {/* Cerrar sesión */}
                  <div className="border-t border-white/5 p-2">
                    <button onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/5 rounded-lg transition-all cursor-pointer">
                      🚪 Cerrar sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
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