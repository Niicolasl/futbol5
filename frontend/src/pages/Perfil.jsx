import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
    updatePerfilRequest,
    changePasswordRequest,
    getMisStatsRequest,
    deleteCuentaRequest,
} from '../api/auth'

// ── Sección con título ───────────────────────────────────────────────────────
function Section({ titulo, subtitulo, children }) {
    return (
        <div className="rounded-2xl p-6 border border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <h3 className="text-white font-bold text-lg mb-0.5">{titulo}</h3>
            {subtitulo && <p className="text-gray-500 text-xs uppercase tracking-widest mb-6">{subtitulo}</p>}
            {!subtitulo && <div className="mb-5" />}
            {children}
        </div>
    )
}

// ── Input reutilizable ───────────────────────────────────────────────────────
function Field({ label, type = 'text', value, onChange, placeholder, disabled }) {
    return (
        <div>
            <label className="text-gray-400 text-xs uppercase tracking-widest mb-2 block">{label}</label>
            <input
                type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/40 transition-all disabled:opacity-40"
            />
        </div>
    )
}

// ── Alerta inline ────────────────────────────────────────────────────────────
function Alert({ msg, type = 'error' }) {
    if (!msg) return null
    const styles = {
        error: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400' },
        success: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400' },
    }
    const s = styles[type]
    return (
        <div className={`mt-4 p-3 rounded-lg ${s.bg} border ${s.border} ${s.text} text-sm`}>
            {msg}
        </div>
    )
}

// ── Modal genérico ───────────────────────────────────────────────────────────
function Modal({ visible, onClose, titulo, children }) {
    if (!visible) return null
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(14px)' }}
            onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="w-full max-w-md rounded-2xl border border-white/10 p-8" style={{ background: '#0d0d0d' }}>
                <h3 className="text-white text-xl font-bold mb-6">{titulo}</h3>
                {children}
            </div>
        </div>
    )
}

// ════════════════════════════════════════════════════════════════════════════
function Perfil() {
    const { user, setUser, logout } = useAuth()
    const navigate = useNavigate()

    // ── Datos personales ──
    const [form, setForm] = useState({ nombre: '', email: '', telefono: '' })
    const [loadingForm, setLoadingForm] = useState(false)
    const [msgForm, setMsgForm] = useState({ text: '', type: 'error' })

    // ── Contraseña ──
    const [pwForm, setPwForm] = useState({ passwordActual: '', passwordNueva: '', confirmar: '' })
    const [loadingPw, setLoadingPw] = useState(false)
    const [msgPw, setMsgPw] = useState({ text: '', type: 'error' })

    // ── Stats ──
    const [stats, setStats] = useState(null)

    // ── Eliminar cuenta ──
    const [modalElim, setModalElim] = useState(false)
    const [elimStep, setElimStep] = useState(1) // 1: confirmar texto, 2: ingresar password
    const [elimTexto, setElimTexto] = useState('')
    const [elimPw, setElimPw] = useState('')
    const [loadingElim, setLoadingElim] = useState(false)
    const [msgElim, setMsgElim] = useState('')

    // ── Animación de entrada ──
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        if (user) setForm({ nombre: user.nombre || '', email: user.email || '', telefono: user.telefono || '' })
        getMisStatsRequest().then((res) => setStats(res.data)).catch(() => { })
        setTimeout(() => setVisible(true), 50)
    }, [user])

    const v = visible ? '' : 'pre-anim'

    // ── Guardar datos personales ──────────────────────────────────────────────
    const handleGuardarPerfil = async () => {
        setLoadingForm(true)
        setMsgForm({ text: '', type: 'error' })
        try {
            const res = await updatePerfilRequest(form)
            setUser(res.data)
            setMsgForm({ text: '✓ Datos actualizados correctamente', type: 'success' })
        } catch (err) {
            setMsgForm({ text: err.response?.data?.message || 'Error al guardar', type: 'error' })
        } finally {
            setLoadingForm(false)
        }
    }

    // ── Cambiar contraseña ────────────────────────────────────────────────────
    const handleCambiarPassword = async () => {
        if (pwForm.passwordNueva !== pwForm.confirmar) {
            setMsgPw({ text: 'Las contraseñas nuevas no coinciden', type: 'error' })
            return
        }
        if (pwForm.passwordNueva.length < 6) {
            setMsgPw({ text: 'La nueva contraseña debe tener al menos 6 caracteres', type: 'error' })
            return
        }
        setLoadingPw(true)
        setMsgPw({ text: '', type: 'error' })
        try {
            await changePasswordRequest({ passwordActual: pwForm.passwordActual, passwordNueva: pwForm.passwordNueva })
            setMsgPw({ text: '✓ Contraseña actualizada correctamente', type: 'success' })
            setPwForm({ passwordActual: '', passwordNueva: '', confirmar: '' })
        } catch (err) {
            setMsgPw({ text: err.response?.data?.message || 'Error al cambiar contraseña', type: 'error' })
        } finally {
            setLoadingPw(false)
        }
    }

    // ── Eliminar cuenta ───────────────────────────────────────────────────────
    const abrirEliminar = () => {
        setElimStep(1); setElimTexto(''); setElimPw(''); setMsgElim(''); setModalElim(true)
    }

    const handleEliminarCuenta = async () => {
        setLoadingElim(true); setMsgElim('')
        try {
            await deleteCuentaRequest({ password: elimPw })
            await logout()
            navigate('/login')
        } catch (err) {
            setMsgElim(err.response?.data?.message || 'Error al eliminar la cuenta')
            setLoadingElim(false)
        }
    }

    // ── Iniciales del avatar ──────────────────────────────────────────────────
    const iniciales = user?.nombre
        ? user.nombre.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
        : '?'

    // ── Fecha de registro ─────────────────────────────────────────────────────
    const fechaRegistro = user?.createdAt
        ? new Date(user.createdAt).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })
        : '—'

    return (
        <div className="scanline-overlay min-h-screen bg-black pt-24 px-6 pb-16"
            style={{ backgroundImage: 'radial-gradient(ellipse at top, #0a0a1a 0%, #000000 70%)' }}>

            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none"
                style={{ background: 'radial-gradient(ellipse, rgba(255,107,53,0.04) 0%, transparent 70%)' }} />

            <div className="max-w-3xl mx-auto relative z-10 space-y-6">

                {/* ── Header con avatar ── */}
                <div className={`${v} anim-fade-up delay-0 flex flex-col sm:flex-row items-center sm:items-end gap-6 mb-2`}>
                    {/* Avatar */}
                    <div className="relative">
                        <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-black select-none"
                            style={{ background: 'linear-gradient(135deg, rgba(255,107,53,0.3), rgba(255,107,53,0.08))', border: '2px solid rgba(255,107,53,0.4)', color: '#ff6b35', boxShadow: '0 0 30px rgba(255,107,53,0.15)' }}>
                            {iniciales}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-black"
                            style={{ background: '#22c55e' }} />
                    </div>

                    <div>
                        <h2 className="text-3xl font-black uppercase tracking-widest text-white">
                            {user?.nombre}
                        </h2>
                        <p className="text-gray-500 text-xs uppercase tracking-widest mt-1">
                            {user?.rol === 'admin' ? '⚡ Administrador' : '👤 Usuario'} · Miembro desde {fechaRegistro}
                        </p>
                    </div>
                </div>

                {/* ── Stats de reservas ── */}
                {stats && (
                    <div className={`${v} anim-fade-up delay-100 grid grid-cols-2 sm:grid-cols-4 gap-3`}>
                        {[
                            { label: 'Total', value: stats.total, color: '#ff6b35' },
                            { label: 'Confirmadas', value: stats.confirmada, color: '#22c55e' },
                            { label: 'Pendientes', value: stats.pendiente, color: '#eab308' },
                            { label: 'Canceladas', value: stats.cancelada, color: '#ef4444' },
                        ].map(({ label, value, color }) => (
                            <Link key={label} to="/mis-reservas"
                                className="rounded-xl p-4 border border-white/10 text-center transition-all hover:border-white/20 cursor-pointer"
                                style={{ background: 'rgba(255,255,255,0.03)' }}>
                                <p className="text-3xl font-black" style={{ color }}>{value}</p>
                                <p className="text-gray-500 text-xs uppercase tracking-widest mt-1">{label}</p>
                            </Link>
                        ))}
                    </div>
                )}

                {/* ── Datos personales ── */}
                <div className={`${v} anim-fade-up delay-200`}>
                    <Section titulo="Datos personales" subtitulo="Actualiza tu información de contacto">
                        <div className="space-y-4">
                            <Field label="Nombre completo" value={form.nombre}
                                onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
                            <Field label="Email" type="email" value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })} />
                            <Field label="Teléfono" value={form.telefono} placeholder="Opcional"
                                onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button onClick={handleGuardarPerfil} disabled={loadingForm}
                                className="px-6 py-2.5 rounded-lg text-sm uppercase tracking-widest font-bold cursor-pointer transition-all hover:scale-105 disabled:opacity-50"
                                style={{ background: 'linear-gradient(135deg, #ff6b35, #f7c59f)', color: '#000' }}>
                                {loadingForm ? 'Guardando...' : 'Guardar cambios'}
                            </button>
                        </div>
                        <Alert msg={msgForm.text} type={msgForm.type} />
                    </Section>
                </div>

                {/* ── Cambiar contraseña ── */}
                <div className={`${v} anim-fade-up delay-300`}>
                    <Section titulo="Cambiar contraseña" subtitulo="Requiere tu contraseña actual">
                        <div className="space-y-4">
                            <Field label="Contraseña actual" type="password" value={pwForm.passwordActual}
                                onChange={(e) => setPwForm({ ...pwForm, passwordActual: e.target.value })} />
                            <Field label="Nueva contraseña" type="password" value={pwForm.passwordNueva}
                                onChange={(e) => setPwForm({ ...pwForm, passwordNueva: e.target.value })} />
                            <Field label="Confirmar nueva contraseña" type="password" value={pwForm.confirmar}
                                onChange={(e) => setPwForm({ ...pwForm, confirmar: e.target.value })} />
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button onClick={handleCambiarPassword} disabled={loadingPw || !pwForm.passwordActual || !pwForm.passwordNueva}
                                className="px-6 py-2.5 rounded-lg text-sm uppercase tracking-widest font-bold cursor-pointer transition-all hover:scale-105 disabled:opacity-50"
                                style={{ background: 'linear-gradient(135deg, #ff6b35, #f7c59f)', color: '#000' }}>
                                {loadingPw ? 'Cambiando...' : 'Cambiar contraseña'}
                            </button>
                        </div>
                        <Alert msg={msgPw.text} type={msgPw.type} />
                    </Section>
                </div>

                {/* ── Zona de peligro ── */}
                <div className={`${v} anim-fade-up delay-400`}>
                    <div className="rounded-2xl p-6 border border-red-500/20" style={{ background: 'rgba(239,68,68,0.04)' }}>
                        <h3 className="text-red-400 font-bold text-lg mb-0.5">Zona de peligro</h3>
                        <p className="text-gray-500 text-xs uppercase tracking-widest mb-5">Acciones irreversibles</p>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white text-sm font-semibold">Eliminar mi cuenta</p>
                                <p className="text-gray-500 text-xs mt-0.5">Se cancelarán todas tus reservas activas. Esta acción no se puede deshacer.</p>
                            </div>
                            <button onClick={abrirEliminar}
                                className="ml-4 flex-shrink-0 px-4 py-2 rounded-lg text-xs uppercase tracking-widest font-bold cursor-pointer border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all">
                                Eliminar cuenta
                            </button>
                        </div>
                    </div>
                </div>

            </div>

            {/* ── Modal eliminar cuenta ── */}
            <Modal visible={modalElim} onClose={() => setModalElim(false)} titulo="Eliminar cuenta">
                {elimStep === 1 && (
                    <>
                        <p className="text-gray-400 text-sm mb-2">
                            Esta acción es <span className="text-red-400 font-bold">permanente e irreversible</span>. Se cancelarán todas tus reservas activas y tu cuenta será eliminada.
                        </p>
                        <p className="text-gray-400 text-sm mb-6">
                            Escribe <span className="text-white font-mono font-bold">ELIMINAR</span> para continuar:
                        </p>
                        <input
                            type="text" value={elimTexto}
                            onChange={(e) => setElimTexto(e.target.value)}
                            placeholder="ELIMINAR"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-red-500/40 mb-6 font-mono tracking-widest"
                        />
                        <div className="flex gap-3">
                            <button onClick={() => setModalElim(false)}
                                className="flex-1 py-3 rounded-lg text-sm uppercase tracking-widest font-bold border border-white/10 text-gray-400 hover:text-white cursor-pointer transition-all">
                                Cancelar
                            </button>
                            <button
                                disabled={elimTexto !== 'ELIMINAR'}
                                onClick={() => setElimStep(2)}
                                className="flex-1 py-3 rounded-lg text-sm uppercase tracking-widest font-bold cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                style={{ background: '#ef4444', color: '#fff' }}>
                                Continuar
                            </button>
                        </div>
                    </>
                )}

                {elimStep === 2 && (
                    <>
                        <p className="text-gray-400 text-sm mb-6">
                            Confirma tu identidad ingresando tu contraseña actual:
                        </p>
                        <Field label="Contraseña" type="password" value={elimPw}
                            onChange={(e) => setElimPw(e.target.value)} />
                        {msgElim && <Alert msg={msgElim} type="error" />}
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => { setElimStep(1); setElimPw(''); setMsgElim('') }}
                                className="flex-1 py-3 rounded-lg text-sm uppercase tracking-widest font-bold border border-white/10 text-gray-400 hover:text-white cursor-pointer transition-all">
                                Atrás
                            </button>
                            <button onClick={handleEliminarCuenta} disabled={loadingElim || !elimPw}
                                className="flex-1 py-3 rounded-lg text-sm uppercase tracking-widest font-bold cursor-pointer disabled:opacity-50 transition-all"
                                style={{ background: '#ef4444', color: '#fff' }}>
                                {loadingElim ? 'Eliminando...' : 'Eliminar cuenta'}
                            </button>
                        </div>
                    </>
                )}
            </Modal>
        </div>
    )
}

export default Perfil