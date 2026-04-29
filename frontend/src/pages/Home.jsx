import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEffect, useRef, useState } from 'react'

// Partículas flotantes de fondo (puntos naranjas difusos)
const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  size: Math.random() * 4 + 1,
  top: Math.random() * 100,
  left: Math.random() * 100,
  delay: Math.random() * 6,
  duration: Math.random() * 4 + 5,
  opacity: Math.random() * 0.3 + 0.1,
}))

function Home() {
  const { isAuthenticated } = useAuth()
  const [visible, setVisible] = useState(false)
  const bgRef = useRef(null)

  // Activa animaciones de entrada al montar
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  // Parallax suave al mover el mouse
  useEffect(() => {
    const handleMouse = (e) => {
      if (!bgRef.current) return
      const x = (e.clientX / window.innerWidth - 0.5) * 20
      const y = (e.clientY / window.innerHeight - 0.5) * 20
      bgRef.current.style.transform = `translate(${x}px, ${y}px)`
    }
    window.addEventListener('mousemove', handleMouse)
    return () => window.removeEventListener('mousemove', handleMouse)
  }, [])

  const v = visible ? '' : 'pre-anim'

  return (
    <div className="scanline-overlay min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden"
      style={{ backgroundImage: 'radial-gradient(ellipse at 50% 0%, #2d0a00 0%, #000000 60%)' }}>

      {/* ── Partículas flotantes ── */}
      {PARTICLES.map((p) => (
        <div key={p.id}
          className="absolute rounded-full pointer-events-none anim-float"
          style={{
            width: p.size, height: p.size,
            top: `${p.top}%`, left: `${p.left}%`,
            background: '#ff6b35',
            opacity: p.opacity,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            filter: 'blur(1px)',
          }} />
      ))}

      {/* ── Fondo con parallax ── */}
      <div ref={bgRef} className="absolute inset-0 pointer-events-none parallax-bg" style={{ willChange: 'transform' }}>
        {/* Círculos concéntricos */}
        {[800, 600, 400, 250].map((size, i) => (
          <div key={size}
            className="absolute top-1/2 left-1/2 rounded-full"
            style={{
              width: size, height: size,
              marginLeft: -size / 2, marginTop: -size / 2,
              border: `1px solid rgba(255,107,53,${0.04 + i * 0.02})`,
              animation: `float ${8 + i * 2}s ease-in-out infinite`,
              animationDelay: `${i * 1.5}s`,
            }} />
        ))}
        {/* Glow central */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,107,53,0.1) 0%, transparent 70%)' }} />
      </div>

      {/* ── Contenido ── */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">

        {/* Etiqueta */}
        <div className={`${v} anim-fade-in delay-0 inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full border border-white/10`}
          style={{ background: 'rgba(255,107,53,0.05)' }}>
          <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
          <span className="text-orange-400 text-xs uppercase tracking-[0.3em]">Reservas en línea</span>
        </div>

        {/* Título con glow */}
        <h1 className={`${v} anim-fade-up delay-100 text-7xl sm:text-9xl font-black uppercase tracking-tighter leading-none mb-4 anim-glow-pulse`}
          style={{
            background: 'linear-gradient(180deg, #ffffff 0%, #ff6b35 60%, #ff3300 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
          FUTBOL
          <br />
          <span style={{
            background: 'linear-gradient(180deg, #ff6b35 0%, #ff3300 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>CINCO</span>
        </h1>

        {/* Subtítulo */}
        <p className={`${v} anim-fade-up delay-300 text-gray-400 text-lg sm:text-xl tracking-[0.2em] uppercase mb-4 mt-6`}>
          Tu cancha. Tu momento. Tu juego.
        </p>
        <p className={`${v} anim-fade-up delay-400 text-gray-600 text-sm tracking-widest uppercase mb-12`}>
          Reserva en segundos — Juega cuando quieras
        </p>

        {/* Botones */}
        <div className={`${v} anim-pop-in delay-500 flex flex-col sm:flex-row gap-4 justify-center items-center`}>
          {isAuthenticated ? (
            <Link to="/canchas"
              className="btn-gta px-10 py-4 rounded-xl font-black uppercase tracking-widest text-sm cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #ff6b35, #f7c59f)', color: '#000', boxShadow: '0 0 30px rgba(255,107,53,0.4)' }}>
              Ver Canchas
            </Link>
          ) : (
            <>
              <Link to="/register"
                className="btn-gta px-10 py-4 rounded-xl font-black uppercase tracking-widest text-sm cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #ff6b35, #f7c59f)', color: '#000', boxShadow: '0 0 30px rgba(255,107,53,0.4)' }}>
                Comenzar ahora
              </Link>
              <Link to="/login"
                className="btn-gta px-10 py-4 rounded-xl font-black uppercase tracking-widest text-sm border border-white/10 text-white cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                Iniciar sesión
              </Link>
            </>
          )}
        </div>

        {/* Stats escalonados */}
        <div className="flex gap-12 justify-center mt-16">
          {[
            { numero: '6', label: 'Canchas', delay: 'delay-600' },
            { numero: '24/7', label: 'Disponible', delay: 'delay-700' },
            { numero: '100%', label: 'Online', delay: 'delay-800' },
          ].map((stat) => (
            <div key={stat.label} className={`${v} anim-count-up ${stat.delay} text-center`}>
              <p className="text-2xl font-black text-white">{stat.numero}</p>
              <p className="text-gray-600 text-xs uppercase tracking-widest mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Texto inferior */}
      <div className={`${v} anim-fade-in delay-1000 absolute bottom-8 left-0 right-0 flex justify-center`}>
        <p className="text-gray-800 text-xs uppercase tracking-[0.5em]">
          Neiva • Huila • Colombia
        </p>
      </div>
    </div>
  )
}

export default Home