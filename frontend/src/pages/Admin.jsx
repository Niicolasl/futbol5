import { useEffect, useState } from 'react'
import { getCanchasRequest, crearCanchaRequest, actualizarCanchaRequest, eliminarCanchaRequest } from '../api/canchas'
import { getTodasReservasRequest, cancelarReservaRequest } from '../api/reservas'

const TABS = ['Canchas', 'Reservas']

const EMPTY_FORM = { nombre: '', descripcion: '', precio: '', disponible: true, imagen: '' }

// Colores de badge según estado de reserva
const BADGE = {
    pendiente:   { bg: 'rgba(234,179,8,0.15)',  border: 'rgba(234,179,8,0.4)',  text: '#eab308' },
    confirmada:  { bg: 'rgba(34,197,94,0.15)',  border: 'rgba(34,197,94,0.4)',  text: '#22c55e' },
    cancelada:   { bg: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.4)',  text: '#ef4444' },
}

function Admin() {
    const [tab, setTab] = useState('Canchas')

    // ── Estado de canchas ──
    const [canchas, setCanchas] = useState([])
    const [form, setForm] = useState(EMPTY_FORM)
    const [editando, setEditando] = useState(null) // cancha siendo editada (o null si es nueva)
    const [showForm, setShowForm] = useState(false)
    const [loadingForm, setLoadingForm] = useState(false)
    const [errorForm, setErrorForm] = useState('')

    // ── Estado de reservas ──
    const [reservas, setReservas] = useState([])
    const [loadingReservas, setLoadingReservas] = useState(false)

    // ── Carga inicial ──
    useEffect(() => { fetchCanchas() }, [])
    useEffect(() => { if (tab === 'Reservas') fetchReservas() }, [tab])

    const fetchCanchas = async () => {
        const res = await getCanchasRequest()
        setCanchas(res.data)
    }

    const fetchReservas = async () => {
        setLoadingReservas(true)
        try {
            const res = await getTodasReservasRequest()
            setReservas(res.data)
        } finally {
            setLoadingReservas(false)
        }
    }

    // ── Formulario de cancha ──
    const abrirCrear = () => {
        setEditando(null)
        setForm(EMPTY_FORM)
        setErrorForm('')
        setShowForm(true)
    }

    const abrirEditar = (cancha) => {
        setEditando(cancha)
        setForm({
            nombre: cancha.nombre,
            descripcion: cancha.descripcion,
            precio: cancha.precio,
            disponible: cancha.disponible,
            imagen: cancha.imagen || '',
        })
        setErrorForm('')
        setShowForm(true)
    }

    const cerrarForm = () => { setShowForm(false); setEditando(null); setForm(EMPTY_FORM) }

    const handleSubmit = async () => {
        if (!form.nombre || !form.descripcion || !form.precio) {
            setErrorForm('Nombre, descripción y precio son requeridos')
            return
        }
        setLoadingForm(true)
        setErrorForm('')
        try {
            if (editando) {
                await actualizarCanchaRequest(editando._id, form)
            } else {
                await crearCanchaRequest(form)
            }
            await fetchCanchas()
            cerrarForm()
        } catch (err) {
            setErrorForm(err.response?.data?.message || 'Error al guardar')
        } finally {
            setLoadingForm(false)
        }
    }

    const handleEliminar = async (id) => {
        if (!confirm('¿Eliminar esta cancha? Esta acción no se puede deshacer.')) return
        try {
            await eliminarCanchaRequest(id)
            await fetchCanchas()
        } catch (err) {
            alert(err.response?.data?.message || 'Error al eliminar')
        }
    }

    // ── Cancelar reserva desde admin ──
    const handleCancelarReserva = async (id) => {
        if (!confirm('¿Cancelar esta reserva?')) return
        try {
            await cancelarReservaRequest(id)
            await fetchReservas()
        } catch (err) {
            alert(err.response?.data?.message || 'Error al cancelar')
        }
    }

    return (
        <div className="min-h-screen bg-black pt-24 px-6 pb-12"
            style={{ backgroundImage: 'radial-gradient(ellipse at top, #0a0a1a 0%, #000000 70%)' }}>

            <div className="max-w-6xl mx-auto">

                {/* Header */}
                <div className="mb-10">
                    <h2 className="text-4xl font-black uppercase tracking-widest text-white mb-1">
                        Panel <span style={{ color: '#ff6b35' }}>Admin</span>
                    </h2>
                    <p className="text-gray-500 text-xs uppercase tracking-widest">
                        Gestión total del sistema
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-8 border-b border-white/10 pb-0">
                    {TABS.map((t) => (
                        <button key={t} onClick={() => setTab(t)}
                            className="px-6 py-3 text-sm uppercase tracking-widest font-bold transition-all cursor-pointer"
                            style={{
                                color: tab === t ? '#ff6b35' : '#6b7280',
                                borderBottom: tab === t ? '2px solid #ff6b35' : '2px solid transparent',
                            }}>
                            {t}
                        </button>
                    ))}
                </div>

                {/* ══════════════ TAB CANCHAS ══════════════ */}
                {tab === 'Canchas' && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <p className="text-gray-500 text-sm">{canchas.length} canchas registradas</p>
                            <button onClick={abrirCrear}
                                className="px-5 py-2 rounded-lg text-sm uppercase tracking-widest font-bold cursor-pointer transition-all hover:scale-105"
                                style={{ background: 'linear-gradient(135deg, #ff6b35, #f7c59f)', color: '#000' }}>
                                + Nueva cancha
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {canchas.map((cancha) => (
                                <div key={cancha._id}
                                    className="rounded-2xl p-5 border border-white/10"
                                    style={{ background: 'rgba(255,255,255,0.03)' }}>

                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h3 className="text-white font-bold text-base">{cancha.nombre}</h3>
                                            <p className="text-gray-500 text-xs mt-1">{cancha.descripcion}</p>
                                        </div>
                                        <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${cancha.disponible ? 'bg-green-400' : 'bg-red-400'}`}></div>
                                    </div>

                                    <p className="font-black text-lg mb-4" style={{ color: '#ff6b35' }}>
                                        ${Number(cancha.precio).toLocaleString()}<span className="text-gray-600 font-normal text-xs">/hr</span>
                                    </p>

                                    <div className="flex gap-2">
                                        <button onClick={() => abrirEditar(cancha)}
                                            className="flex-1 py-2 rounded-lg text-xs uppercase tracking-widest font-bold border border-white/10 text-gray-300 hover:text-white hover:border-white/30 transition-all cursor-pointer">
                                            Editar
                                        </button>
                                        <button onClick={() => handleEliminar(cancha._id)}
                                            className="flex-1 py-2 rounded-lg text-xs uppercase tracking-widest font-bold border border-red-500/20 text-red-400 hover:border-red-500/50 transition-all cursor-pointer">
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ══════════════ TAB RESERVAS ══════════════ */}
                {tab === 'Reservas' && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <p className="text-gray-500 text-sm">{reservas.length} reservas en el sistema</p>
                            <button onClick={fetchReservas}
                                className="px-4 py-2 rounded-lg text-xs uppercase tracking-widest font-bold border border-white/10 text-gray-400 hover:text-white transition-all cursor-pointer">
                                ↻ Actualizar
                            </button>
                        </div>

                        {loadingReservas ? (
                            <div className="text-center py-12 text-gray-500 animate-pulse">Cargando reservas...</div>
                        ) : (
                            <div className="space-y-3">
                                {reservas.length === 0 && (
                                    <div className="text-center py-12 text-gray-600">No hay reservas aún</div>
                                )}
                                {reservas.map((r) => (
                                    <div key={r._id}
                                        className="rounded-xl p-4 border border-white/10 flex flex-col sm:flex-row sm:items-center gap-4"
                                        style={{ background: 'rgba(255,255,255,0.02)' }}>

                                        {/* Info principal */}
                                        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                                            <div>
                                                <p className="text-gray-600 text-xs uppercase tracking-widest mb-1">Usuario</p>
                                                <p className="text-white font-semibold">{r.usuario?.nombre}</p>
                                                <p className="text-gray-500 text-xs">{r.usuario?.email}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-600 text-xs uppercase tracking-widest mb-1">Cancha</p>
                                                <p className="text-white">{r.cancha?.nombre}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-600 text-xs uppercase tracking-widest mb-1">Fecha y hora</p>
                                                <p className="text-white">{new Date(r.fecha).toLocaleDateString('es-CO')}</p>
                                                <p className="text-gray-400 text-xs">{r.horaInicio} – {r.horaFin}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-600 text-xs uppercase tracking-widest mb-1">Estado</p>
                                                <span className="px-2 py-1 rounded-md text-xs font-bold uppercase"
                                                    style={{
                                                        background: BADGE[r.estado]?.bg,
                                                        border: `1px solid ${BADGE[r.estado]?.border}`,
                                                        color: BADGE[r.estado]?.text,
                                                    }}>
                                                    {r.estado}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Acción */}
                                        {r.estado !== 'cancelada' && (
                                            <button onClick={() => handleCancelarReserva(r._id)}
                                                className="px-4 py-2 rounded-lg text-xs uppercase tracking-widest font-bold border border-red-500/20 text-red-400 hover:border-red-500/50 transition-all cursor-pointer flex-shrink-0">
                                                Cancelar
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ══════════════ MODAL FORM CANCHA ══════════════ */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
                    style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}>
                    <div className="w-full max-w-md rounded-2xl p-8 border border-white/10"
                        style={{ background: '#0d0d0d' }}>

                        <h3 className="text-white text-xl font-bold mb-1">
                            {editando ? 'Editar cancha' : 'Nueva cancha'}
                        </h3>
                        <p className="text-orange-400 text-xs uppercase tracking-widest mb-6">
                            {editando ? editando.nombre : 'Completa los datos'}
                        </p>

                        {errorForm && (
                            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                                {errorForm}
                            </div>
                        )}

                        <div className="space-y-4">
                            {[
                                { label: 'Nombre', key: 'nombre', type: 'text' },
                                { label: 'Descripción', key: 'descripcion', type: 'text' },
                                { label: 'Precio por hora', key: 'precio', type: 'number' },
                                { label: 'URL imagen (opcional)', key: 'imagen', type: 'text' },
                            ].map(({ label, key, type }) => (
                                <div key={key}>
                                    <label className="text-gray-400 text-xs uppercase tracking-widest mb-2 block">{label}</label>
                                    <input type={type}
                                        value={form[key]}
                                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 transition-all"
                                    />
                                </div>
                            ))}

                            {/* Toggle disponible */}
                            <div className="flex items-center justify-between">
                                <label className="text-gray-400 text-xs uppercase tracking-widest">Disponible</label>
                                <button type="button"
                                    onClick={() => setForm({ ...form, disponible: !form.disponible })}
                                    className="relative w-12 h-6 rounded-full transition-all cursor-pointer"
                                    style={{ background: form.disponible ? '#ff6b35' : '#374151' }}>
                                    <span className="absolute top-1 w-4 h-4 bg-white rounded-full transition-all"
                                        style={{ left: form.disponible ? '26px' : '4px' }}></span>
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button onClick={cerrarForm}
                                className="flex-1 py-3 rounded-lg text-sm uppercase tracking-widest font-bold border border-white/10 text-gray-400 hover:text-white transition-all cursor-pointer">
                                Cancelar
                            </button>
                            <button onClick={handleSubmit} disabled={loadingForm}
                                className="flex-1 py-3 rounded-lg text-sm uppercase tracking-widest font-bold transition-all cursor-pointer disabled:opacity-50"
                                style={{ background: 'linear-gradient(135deg, #ff6b35, #f7c59f)', color: '#000' }}>
                                {loadingForm ? 'Guardando...' : editando ? 'Actualizar' : 'Crear'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Admin