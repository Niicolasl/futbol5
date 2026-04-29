import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'

function Register() {
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', password: '' })
  const [errores, setErrores] = useState({})
  const [errorServidor, setErrorServidor] = useState('')
  const [visible, setVisible] = useState(false)
  const { signup } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  const validar = () => {
    const e = {}
    if (!form.nombre.trim()) e.nombre = 'El nombre es obligatorio'
    if (!form.email.trim()) e.email = 'El email es obligatorio'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'El email no es válido'
    if (!form.telefono.trim()) e.telefono = 'El teléfono es obligatorio'
    else if (form.telefono.trim().length < 7) e.telefono = 'Ingresa un teléfono válido (mínimo 7 dígitos)'
    if (!form.password) e.password = 'La contraseña es obligatoria'
    else if (form.password.length < 6) e.password = 'Mínimo 6 caracteres'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorServidor('')
    const err = validar()
    if (Object.keys(err).length > 0) { setErrores(err); return }
    setErrores({})
    try {
      await signup(form)
      navigate('/canchas')
    } catch (err) {
      setErrorServidor(err.response?.data?.message || 'Error al registrarse')
    }
  }

  const v = visible ? '' : 'pre-anim'

  const campos = [
    { key: 'nombre',   label: 'Nombre',    type: 'text',     placeholder: 'Tu nombre completo',  delay: 'delay-300' },
    { key: 'email',    label: 'Email',     type: 'text',     placeholder: 'usuario@gmail.com',   delay: 'delay-400' },
    { key: 'telefono', label: 'Teléfono',  type: 'tel',      placeholder: 'Ej: 3001234567',      delay: 'delay-500' },
    { key: 'password', label: 'Contraseña',type: 'password', placeholder: 'Mínimo 6 caracteres', delay: 'delay-600' },
  ]

  return (
    <div className="scanline-overlay min-h-screen bg-black flex items-center justify-center px-4"
      style={{ backgroundImage: 'radial-gradient(ellipse at top, #1a0a2e 0%, #000000 70%)' }}>

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,107,53,0.07) 0%, transparent 70%)' }} />

      <div className="w-full max-w-md relative z-10">

        <div className={`${v} anim-fade-up delay-0 text-center mb-10`}>
          <h1 className="text-5xl font-black tracking-widest uppercase anim-glow-pulse"
            style={{ color: '#ff6b35', textShadow: '0 0 30px #ff6b3588, 0 0 60px #ff6b3544' }}>
            FUTBOL5
          </h1>
          <p className="text-gray-500 tracking-[0.3em] uppercase text-xs mt-2">
            Reserve your field
          </p>
        </div>

        <div className={`${v} anim-pop-in delay-200 rounded-2xl p-8 border border-white/10`}
          style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)' }}>

          <h2 className="text-white text-2xl font-bold mb-6 tracking-wide">Crear Cuenta</h2>

          {errorServidor && (
            <div className="anim-fade-up mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {errorServidor}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {campos.map(({ key, label, type, placeholder, delay }) => (
              <div key={key} className={`${v} anim-fade-up ${delay}`}>
                <label className="text-gray-400 text-xs uppercase tracking-widest mb-2 block">{label}</label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  placeholder={placeholder}
                  className={`input-gta w-full bg-white/5 border rounded-lg px-4 py-3 text-white placeholder-gray-600 ${errores[key] ? 'border-red-500/60' : 'border-white/10'}`}
                />
                {errores[key] && <p className="text-red-400 text-xs mt-1 anim-fade-in">{errores[key]}</p>}
              </div>
            ))}

            <div className={`${v} anim-fade-up delay-700`}>
              <button type="submit"
                className="btn-gta w-full py-3 rounded-lg font-bold uppercase tracking-widest text-sm mt-2 cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #ff6b35, #f7c59f)', color: '#000' }}>
                Registrarse
              </button>
            </div>
          </form>

          <p className={`${v} anim-fade-in delay-700 text-gray-600 text-sm text-center mt-6`}>
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-orange-400 hover:text-orange-300 transition-colors">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register