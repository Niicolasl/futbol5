import { useEffect, useState, useCallback } from 'react'
import { getCanchasRequest, crearCanchaRequest, actualizarCanchaRequest, eliminarCanchaRequest, getHorariosRequest, updateHorariosRequest } from '../api/canchas'
import { getTodasReservasRequest, editarReservaAdminRequest, cancelarReservaAdminRequest, getReportesRequest } from '../api/reservas'

const TABS = ['Canchas', 'Reservas', 'Horarios', 'Reportes']
const EMPTY_FORM = { nombre: '', descripcion: '', precio: '', disponible: true, imagen: '' }
const BADGE = {
    pendiente:  { bg: 'rgba(234,179,8,0.15)',  border: 'rgba(234,179,8,0.4)',  text: '#eab308' },
    confirmada: { bg: 'rgba(34,197,94,0.15)',  border: 'rgba(34,197,94,0.4)',  text: '#22c55e' },
    cancelada:  { bg: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.4)',  text: '#ef4444' },
}
const DIAS_LABELS = [
    { key: 'lunes',     label: 'Lunes' },
    { key: 'martes',    label: 'Martes' },
    { key: 'miercoles', label: 'Miércoles' },
    { key: 'jueves',    label: 'Jueves' },
    { key: 'viernes',   label: 'Viernes' },
    { key: 'sabado',    label: 'Sábado' },
    { key: 'domingo',   label: 'Domingo' },
]
const HORAS = Array.from({ length: 19 }, (_, i) => {
    const h = i + 5
    return `${String(h).padStart(2, '0')}:00`
})

// ── Modal genérico de confirmación ──────────────────────────────────────────
function ModalConfirm({ visible, titulo, descripcion, onConfirmar, onCancelar, textoBtn = 'Confirmar', colorBtn = '#ef4444' }) {
    if (!visible) return null
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4"
            style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)' }}>
            <div className="w-full max-w-sm rounded-2xl border border-white/10 p-8 text-center" style={{ background: '#0d0d0d' }}>
                <div className="text-4xl mb-4">⚠️</div>
                <p className="text-white text-lg font-bold mb-2">{titulo}</p>
                {descripcion && <p className="text-gray-400 text-sm mb-8">{descripcion}</p>}
                <div className="flex gap-3">
                    <button onClick={onCancelar} className="flex-1 py-3 rounded-lg text-sm uppercase tracking-widest font-bold border border-white/10 text-gray-400 hover:text-white cursor-pointer">Volver</button>
                    <button onClick={onConfirmar} className="flex-1 py-3 rounded-lg text-sm uppercase tracking-widest font-bold cursor-pointer" style={{ background: colorBtn, color: '#fff' }}>{textoBtn}</button>
                </div>
            </div>
        </div>
    )
}

// ── Tab Canchas ──────────────────────────────────────────────────────────────
function TabCanchas() {
    const [canchas, setCanchas]         = useState([])
    const [form, setForm]               = useState(EMPTY_FORM)
    const [editando, setEditando]       = useState(null)
    const [showForm, setShowForm]       = useState(false)
    const [loadingForm, setLoadingForm] = useState(false)
    const [errorForm, setErrorForm]     = useState('')
    const [confirmElim, setConfirmElim] = useState(null)

    useEffect(() => { fetchCanchas() }, [])

    const fetchCanchas = async () => {
        const res = await getCanchasRequest()
        setCanchas(res.data)
    }

    const abrirCrear = () => { setEditando(null); setForm(EMPTY_FORM); setErrorForm(''); setShowForm(true) }
    const abrirEditar = (c) => { setEditando(c); setForm({ nombre: c.nombre, descripcion: c.descripcion, precio: c.precio, disponible: c.disponible, imagen: c.imagen || '' }); setErrorForm(''); setShowForm(true) }
    const cerrarForm = () => { setShowForm(false); setEditando(null); setForm(EMPTY_FORM) }

    const handleSubmit = async () => {
        if (!form.nombre || !form.descripcion || !form.precio) { setErrorForm('Nombre, descripción y precio son requeridos'); return }
        setLoadingForm(true); setErrorForm('')
        try {
            if (editando) await actualizarCanchaRequest(editando._id, form)
            else await crearCanchaRequest(form)
            await fetchCanchas(); cerrarForm()
        } catch (err) { setErrorForm(err.response?.data?.message || 'Error al guardar') }
        finally { setLoadingForm(false) }
    }

    const handleEliminar = async () => {
        if (!confirmElim) return
        try { await eliminarCanchaRequest(confirmElim._id); await fetchCanchas() }
        catch (err) { alert(err.response?.data?.message || 'Error al eliminar') }
        finally { setConfirmElim(null) }
    }

    return (
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
                    <div key={cancha._id} className="rounded-2xl p-5 border border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <h3 className="text-white font-bold text-base">{cancha.nombre}</h3>
                                <p className="text-gray-500 text-xs mt-1">{cancha.descripcion}</p>
                            </div>
                            <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${cancha.disponible ? 'bg-green-400' : 'bg-red-400'}`} />
                        </div>
                        <p className="font-black text-lg mb-4" style={{ color: '#ff6b35' }}>
                            ${Number(cancha.precio).toLocaleString()}<span className="text-gray-600 font-normal text-xs">/hr</span>
                        </p>
                        <div className="flex gap-2">
                            <button onClick={() => abrirEditar(cancha)}
                                className="flex-1 py-2 rounded-lg text-xs uppercase tracking-widest font-bold border border-white/10 text-gray-300 hover:text-white hover:border-white/30 transition-all cursor-pointer">
                                Editar
                            </button>
                            <button onClick={() => setConfirmElim(cancha)}
                                className="flex-1 py-2 rounded-lg text-xs uppercase tracking-widest font-bold border border-red-500/20 text-red-400 hover:border-red-500/50 transition-all cursor-pointer">
                                Eliminar
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal form cancha */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
                    style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}>
                    <div className="w-full max-w-md rounded-2xl p-8 border border-white/10" style={{ background: '#0d0d0d' }}>
                        <h3 className="text-white text-xl font-bold mb-1">{editando ? 'Editar cancha' : 'Nueva cancha'}</h3>
                        <p className="text-orange-400 text-xs uppercase tracking-widest mb-6">{editando ? editando.nombre : 'Completa los datos'}</p>
                        {errorForm && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{errorForm}</div>}
                        <div className="space-y-4">
                            {[{ label: 'Nombre', key: 'nombre', type: 'text' }, { label: 'Descripción', key: 'descripcion', type: 'text' }, { label: 'Precio por hora', key: 'precio', type: 'number' }, { label: 'URL imagen (opcional)', key: 'imagen', type: 'text' }].map(({ label, key, type }) => (
                                <div key={key}>
                                    <label className="text-gray-400 text-xs uppercase tracking-widest mb-2 block">{label}</label>
                                    <input type={type} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 transition-all" />
                                </div>
                            ))}
                            <div className="flex items-center justify-between">
                                <label className="text-gray-400 text-xs uppercase tracking-widest">Disponible</label>
                                <button type="button" onClick={() => setForm({ ...form, disponible: !form.disponible })}
                                    className="relative w-12 h-6 rounded-full transition-all cursor-pointer"
                                    style={{ background: form.disponible ? '#ff6b35' : '#374151' }}>
                                    <span className="absolute top-1 w-4 h-4 bg-white rounded-full transition-all" style={{ left: form.disponible ? '26px' : '4px' }} />
                                </button>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={cerrarForm} className="flex-1 py-3 rounded-lg text-sm uppercase tracking-widest font-bold border border-white/10 text-gray-400 hover:text-white transition-all cursor-pointer">Cancelar</button>
                            <button onClick={handleSubmit} disabled={loadingForm}
                                className="flex-1 py-3 rounded-lg text-sm uppercase tracking-widest font-bold transition-all cursor-pointer disabled:opacity-50"
                                style={{ background: 'linear-gradient(135deg, #ff6b35, #f7c59f)', color: '#000' }}>
                                {loadingForm ? 'Guardando...' : editando ? 'Actualizar' : 'Crear'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ModalConfirm visible={!!confirmElim} titulo="¿Eliminar esta cancha?" descripcion={`Esta acción no se puede deshacer: ${confirmElim?.nombre}`} onConfirmar={handleEliminar} onCancelar={() => setConfirmElim(null)} textoBtn="Eliminar" />
        </div>
    )
}

// ── Tab Reservas ─────────────────────────────────────────────────────────────
function TabReservas() {
    const [reservas, setReservas]       = useState([])
    const [loading, setLoading]         = useState(false)
    const [confirmCancel, setConfirmCancel] = useState(null)
    const [editTarget, setEditTarget]   = useState(null)  // reserva siendo editada
    const [editForm, setEditForm]       = useState({})
    const [loadingEdit, setLoadingEdit] = useState(false)
    const [errorEdit, setErrorEdit]     = useState('')
    const [canchas, setCanchas]         = useState([])
    const [filtroEstado, setFiltroEstado] = useState('todos')

    useEffect(() => { fetchReservas(); getCanchasRequest().then((r) => setCanchas(r.data)) }, [])

    const fetchReservas = async () => {
        setLoading(true)
        try { const res = await getTodasReservasRequest(); setReservas(res.data) }
        finally { setLoading(false) }
    }

    const abrirEditar = (r) => {
        setEditTarget(r)
        setEditForm({
            fecha: r.fecha ? r.fecha.split('T')[0] : '',
            horaInicio: r.horaInicio,
            horaFin: r.horaFin,
            cantidadHoras: r.cantidadHoras,
            estado: r.estado,
            canchaId: r.cancha?._id || '',
        })
        setErrorEdit('')
    }

    const handleGuardarEdicion = async () => {
        setLoadingEdit(true); setErrorEdit('')
        try {
            const res = await editarReservaAdminRequest(editTarget._id, editForm)
            setReservas((prev) => prev.map((r) => r._id === editTarget._id ? res.data : r))
            setEditTarget(null)
        } catch (err) { setErrorEdit(err.response?.data?.message || 'Error al guardar') }
        finally { setLoadingEdit(false) }
    }

    const handleCancelarConfirmado = async () => {
        if (!confirmCancel) return
        try {
            await cancelarReservaAdminRequest(confirmCancel._id)
            setReservas((prev) => prev.map((r) => r._id === confirmCancel._id ? { ...r, estado: 'cancelada', visibleParaUsuario: false } : r))
        } catch (err) { alert(err.response?.data?.message || 'Error al cancelar') }
        finally { setConfirmCancel(null) }
    }

    const reservasFiltradas = filtroEstado === 'todos' ? reservas : reservas.filter((r) => r.estado === filtroEstado)

    return (
        <div>
            <div className="flex flex-wrap gap-3 justify-between items-center mb-6">
                <p className="text-gray-500 text-sm">{reservas.length} reservas en el sistema</p>
                <div className="flex gap-2">
                    {['todos','confirmada','pendiente','cancelada'].map((f) => (
                        <button key={f} onClick={() => setFiltroEstado(f)}
                            className="px-3 py-1.5 rounded-lg text-xs uppercase tracking-widest font-bold transition-all cursor-pointer"
                            style={{ background: filtroEstado === f ? '#ff6b35' : 'rgba(255,255,255,0.05)', color: filtroEstado === f ? '#000' : '#6b7280', border: filtroEstado === f ? '1px solid #ff6b35' : '1px solid rgba(255,255,255,0.1)' }}>
                            {f}
                        </button>
                    ))}
                    <button onClick={fetchReservas} className="px-3 py-1.5 rounded-lg text-xs uppercase tracking-widest font-bold border border-white/10 text-gray-400 hover:text-white transition-all cursor-pointer">↻</button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-500 animate-pulse">Cargando reservas...</div>
            ) : (
                <div className="space-y-3">
                    {reservasFiltradas.length === 0 && <div className="text-center py-12 text-gray-600">Sin reservas en este filtro</div>}
                    {reservasFiltradas.map((r) => (
                        <div key={r._id} className="rounded-xl p-4 border border-white/10 flex flex-col sm:flex-row sm:items-center gap-4"
                            style={{ background: 'rgba(255,255,255,0.02)' }}>
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
                                        style={{ background: BADGE[r.estado]?.bg, border: `1px solid ${BADGE[r.estado]?.border}`, color: BADGE[r.estado]?.text }}>
                                        {r.estado}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                                <button onClick={() => abrirEditar(r)}
                                    className="px-3 py-2 rounded-lg text-xs uppercase tracking-widest font-bold border border-white/10 text-gray-300 hover:text-white transition-all cursor-pointer">
                                    Editar
                                </button>
                                {r.estado !== 'cancelada' && (
                                    <button onClick={() => setConfirmCancel(r)}
                                        className="px-3 py-2 rounded-lg text-xs uppercase tracking-widest font-bold border border-red-500/20 text-red-400 hover:border-red-500/50 transition-all cursor-pointer">
                                        Cancelar
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal editar reserva */}
            {editTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
                    style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)' }}>
                    <div className="w-full max-w-md rounded-2xl border border-white/10 p-8" style={{ background: '#0d0d0d' }}>
                        <h3 className="text-white text-xl font-bold mb-1">Editar reserva</h3>
                        <p className="text-orange-400 text-xs uppercase tracking-widest mb-6">{editTarget.usuario?.nombre} · {editTarget.cancha?.nombre}</p>
                        {errorEdit && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{errorEdit}</div>}
                        <div className="space-y-4">
                            <div>
                                <label className="text-gray-400 text-xs uppercase tracking-widest mb-2 block">Fecha</label>
                                <input type="date" value={editForm.fecha} onChange={(e) => setEditForm({ ...editForm, fecha: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500/50"
                                    style={{ colorScheme: 'dark' }} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-gray-400 text-xs uppercase tracking-widest mb-2 block">Hora inicio</label>
                                    <select value={editForm.horaInicio} onChange={(e) => setEditForm({ ...editForm, horaInicio: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-3 text-white focus:outline-none" style={{ colorScheme: 'dark' }}>
                                        {HORAS.map((h) => <option key={h} value={h}>{h}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-gray-400 text-xs uppercase tracking-widest mb-2 block">Hora fin</label>
                                    <select value={editForm.horaFin} onChange={(e) => setEditForm({ ...editForm, horaFin: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-3 text-white focus:outline-none" style={{ colorScheme: 'dark' }}>
                                        {HORAS.map((h) => <option key={h} value={h}>{h}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-gray-400 text-xs uppercase tracking-widest mb-2 block">Cancha</label>
                                <select value={editForm.canchaId} onChange={(e) => setEditForm({ ...editForm, canchaId: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none" style={{ colorScheme: 'dark' }}>
                                    {canchas.map((c) => <option key={c._id} value={c._id}>{c.nombre}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-gray-400 text-xs uppercase tracking-widest mb-2 block">Estado</label>
                                <select value={editForm.estado} onChange={(e) => setEditForm({ ...editForm, estado: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none" style={{ colorScheme: 'dark' }}>
                                    <option value="confirmada">Confirmada</option>
                                    <option value="pendiente">Pendiente</option>
                                    <option value="cancelada">Cancelada</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setEditTarget(null)} className="flex-1 py-3 rounded-lg text-sm uppercase tracking-widest font-bold border border-white/10 text-gray-400 hover:text-white cursor-pointer">Cancelar</button>
                            <button onClick={handleGuardarEdicion} disabled={loadingEdit}
                                className="flex-1 py-3 rounded-lg text-sm uppercase tracking-widest font-bold cursor-pointer disabled:opacity-50"
                                style={{ background: 'linear-gradient(135deg, #ff6b35, #f7c59f)', color: '#000' }}>
                                {loadingEdit ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ModalConfirm visible={!!confirmCancel} titulo="¿Cancelar esta reserva?" descripcion={confirmCancel ? `${confirmCancel.cancha?.nombre} · ${new Date(confirmCancel.fecha).toLocaleDateString('es-CO')} · ${confirmCancel.horaInicio}–${confirmCancel.horaFin}` : ''} onConfirmar={handleCancelarConfirmado} onCancelar={() => setConfirmCancel(null)} textoBtn="Sí, cancelar" />
        </div>
    )
}

// ── Tab Horarios ─────────────────────────────────────────────────────────────
function TabHorarios() {
    const [horarios, setHorarios]     = useState(null)
    const [loading, setLoading]       = useState(true)
    const [guardando, setGuardando]   = useState(false)
    const [mensaje, setMensaje]       = useState('')
    const [error, setError]           = useState('')

    useEffect(() => {
        getHorariosRequest()
            .then((res) => setHorarios(res.data))
            .catch(() => setError('Error al cargar horarios'))
            .finally(() => setLoading(false))
    }, [])

    const handleChange = (dia, campo, valor) => {
        setHorarios((prev) => ({ ...prev, [dia]: { ...prev[dia], [campo]: valor } }))
        setMensaje('')
    }

    const handleGuardar = async () => {
        setGuardando(true); setMensaje(''); setError('')
        const payload = {}
        for (const { key } of DIAS_LABELS) payload[key] = { activo: horarios[key].activo, horaApertura: horarios[key].horaApertura, horaCierre: horarios[key].horaCierre }
        try {
            await updateHorariosRequest(payload)
            setMensaje('Horarios guardados correctamente')
        } catch (err) { setError(err.response?.data?.message || 'Error al guardar') }
        finally { setGuardando(false) }
    }

    if (loading) return <div className="text-center py-12 text-gray-500 animate-pulse">Cargando horarios...</div>

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <p className="text-white font-bold text-lg">Horarios de atención</p>
                    <p className="text-gray-500 text-xs mt-1">Define en qué horario acepta reservas el lugar cada día</p>
                </div>
                <button onClick={handleGuardar} disabled={guardando}
                    className="px-5 py-2 rounded-lg text-sm uppercase tracking-widest font-bold cursor-pointer transition-all hover:scale-105 disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #ff6b35, #f7c59f)', color: '#000' }}>
                    {guardando ? 'Guardando...' : 'Guardar cambios'}
                </button>
            </div>

            {mensaje && <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm">{mensaje}</div>}
            {error   && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}

            <div className="space-y-3">
                {DIAS_LABELS.map(({ key, label }) => {
                    const dia = horarios?.[key] || { activo: true, horaApertura: '06:00', horaCierre: '22:00' }
                    return (
                        <div key={key} className="rounded-xl p-4 border border-white/10 flex flex-col sm:flex-row sm:items-center gap-4"
                            style={{ background: dia.activo ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)', opacity: dia.activo ? 1 : 0.5 }}>
                            {/* Toggle activo */}
                            <div className="flex items-center gap-3 w-36 flex-shrink-0">
                                <button type="button" onClick={() => handleChange(key, 'activo', !dia.activo)}
                                    className="relative w-10 h-5 rounded-full transition-all cursor-pointer flex-shrink-0"
                                    style={{ background: dia.activo ? '#ff6b35' : '#374151' }}>
                                    <span className="absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all" style={{ left: dia.activo ? '22px' : '2px' }} />
                                </button>
                                <span className="text-white text-sm font-semibold">{label}</span>
                            </div>

                            {dia.activo ? (
                                <div className="flex items-center gap-4 flex-1">
                                    <div>
                                        <label className="text-gray-500 text-xs uppercase tracking-widest mb-1 block">Apertura</label>
                                        <select value={dia.horaApertura} onChange={(e) => handleChange(key, 'horaApertura', e.target.value)}
                                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none" style={{ colorScheme: 'dark' }}>
                                            {HORAS.map((h) => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                    </div>
                                    <span className="text-gray-600 mt-5">→</span>
                                    <div>
                                        <label className="text-gray-500 text-xs uppercase tracking-widest mb-1 block">Cierre</label>
                                        <select value={dia.horaCierre} onChange={(e) => handleChange(key, 'horaCierre', e.target.value)}
                                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none" style={{ colorScheme: 'dark' }}>
                                            {HORAS.map((h) => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-600 text-sm italic">Cerrado — no acepta reservas</p>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ── Tab Reportes ─────────────────────────────────────────────────────────────
function TabReportes() {
    const [data, setData]       = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError]     = useState('')
    const [desde, setDesde]     = useState('')
    const [hasta, setHasta]     = useState('')

    const fetchReportes = useCallback(async () => {
        setLoading(true); setError('')
        try {
            const params = {}
            if (desde) params.desde = desde
            if (hasta) params.hasta = hasta
            const res = await getReportesRequest(params)
            setData(res.data)
        } catch (err) { setError(err.response?.data?.message || 'Error al cargar reportes') }
        finally { setLoading(false) }
    }, [desde, hasta])

    useEffect(() => { fetchReportes() }, [])

    const cardStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }

    return (
        <div>
            {/* Filtro de fechas */}
            <div className="flex flex-wrap gap-4 items-end mb-8 p-5 rounded-xl border border-white/10" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div>
                    <label className="text-gray-500 text-xs uppercase tracking-widest mb-2 block">Desde</label>
                    <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none" style={{ colorScheme: 'dark' }} />
                </div>
                <div>
                    <label className="text-gray-500 text-xs uppercase tracking-widest mb-2 block">Hasta</label>
                    <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none" style={{ colorScheme: 'dark' }} />
                </div>
                <button onClick={fetchReportes}
                    className="px-5 py-2 rounded-lg text-sm uppercase tracking-widest font-bold cursor-pointer transition-all hover:scale-105"
                    style={{ background: 'linear-gradient(135deg, #ff6b35, #f7c59f)', color: '#000' }}>
                    Generar
                </button>
                {(desde || hasta) && (
                    <button onClick={() => { setDesde(''); setHasta('') }}
                        className="px-4 py-2 rounded-lg text-xs uppercase tracking-widest font-bold border border-white/10 text-gray-400 hover:text-white cursor-pointer transition-all">
                        Limpiar
                    </button>
                )}
            </div>

            {error   && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}
            {loading && <div className="text-center py-12 text-gray-500 animate-pulse">Cargando reportes...</div>}

            {data && !loading && (
                <div className="space-y-8">
                    {/* KPIs principales */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'Usuarios registrados', value: data.totalUsuarios, icon: '👥', color: '#60a5fa' },
                            { label: 'Reservas confirmadas', value: data.reservas.confirmadas, icon: '✅', color: '#22c55e' },
                            { label: 'Reservas canceladas', value: data.reservas.canceladas, icon: '❌', color: '#ef4444' },
                            { label: 'Total reservas', value: data.reservas.total, icon: '📋', color: '#ff6b35' },
                        ].map(({ label, value, icon, color }) => (
                            <div key={label} className="rounded-2xl p-5" style={cardStyle}>
                                <div className="text-3xl mb-3">{icon}</div>
                                <p className="text-3xl font-black" style={{ color }}>{value}</p>
                                <p className="text-gray-500 text-xs uppercase tracking-widest mt-1">{label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Ingresos totales */}
                    <div className="rounded-2xl p-6" style={cardStyle}>
                        <p className="text-gray-500 text-xs uppercase tracking-widest mb-2">Ingresos totales del período</p>
                        <p className="text-5xl font-black" style={{ color: '#ff6b35' }}>
                            ${data.ingresos.toLocaleString('es-CO')}
                        </p>
                        {data.canchaTopReservada && (
                            <p className="text-gray-500 text-sm mt-3">
                                🏆 Cancha más reservada: <span className="text-white font-semibold">{data.canchaTopReservada.nombre}</span>
                                <span className="text-gray-600 ml-2">({data.canchaTopReservada.totalReservas} reservas)</span>
                            </p>
                        )}
                    </div>

                    {/* Ingresos por cancha */}
                    {data.ingresosPorCancha?.length > 0 && (
                        <div className="rounded-2xl p-6" style={cardStyle}>
                            <p className="text-white font-bold mb-4">Ingresos por cancha</p>
                            <div className="space-y-3">
                                {data.ingresosPorCancha.map((c) => {
                                    const pct = data.ingresos > 0 ? (c.ingresos / data.ingresos) * 100 : 0
                                    return (
                                        <div key={c._id}>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-white text-sm">{c.nombre}</span>
                                                <div className="text-right">
                                                    <span className="text-orange-400 font-bold text-sm">${c.ingresos.toLocaleString('es-CO')}</span>
                                                    <span className="text-gray-600 text-xs ml-2">({c.reservas} res.)</span>
                                                </div>
                                            </div>
                                            <div className="w-full h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                                <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #ff6b35, #f7c59f)' }} />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Últimas reservas */}
                    {data.ultimasReservas?.length > 0 && (
                        <div className="rounded-2xl p-6" style={cardStyle}>
                            <p className="text-white font-bold mb-4">Últimas reservas del período</p>
                            <div className="space-y-3">
                                {data.ultimasReservas.map((r) => (
                                    <div key={r._id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                                        <div>
                                            <p className="text-white text-sm">{r.usuario?.nombre} <span className="text-gray-500">→</span> {r.cancha?.nombre}</p>
                                            <p className="text-gray-500 text-xs">{new Date(r.fecha).toLocaleDateString('es-CO')} · {r.horaInicio}–{r.horaFin}</p>
                                        </div>
                                        <span className="px-2 py-1 rounded-md text-xs font-bold uppercase"
                                            style={{ background: BADGE[r.estado]?.bg, border: `1px solid ${BADGE[r.estado]?.border}`, color: BADGE[r.estado]?.text }}>
                                            {r.estado}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// ── Componente principal Admin ───────────────────────────────────────────────
function Admin() {
    const [tab, setTab] = useState('Canchas')

    return (
        <div className="min-h-screen bg-black pt-24 px-6 pb-12"
            style={{ backgroundImage: 'radial-gradient(ellipse at top, #0a0a1a 0%, #000000 70%)' }}>
            <div className="max-w-6xl mx-auto">
                <div className="mb-10">
                    <h2 className="text-4xl font-black uppercase tracking-widest text-white mb-1">
                        Panel <span style={{ color: '#ff6b35' }}>Admin</span>
                    </h2>
                    <p className="text-gray-500 text-xs uppercase tracking-widest">Gestión total del sistema</p>
                </div>

                <div className="flex gap-2 mb-8 border-b border-white/10 overflow-x-auto">
                    {TABS.map((t) => (
                        <button key={t} onClick={() => setTab(t)}
                            className="px-6 py-3 text-sm uppercase tracking-widest font-bold transition-all cursor-pointer whitespace-nowrap"
                            style={{ color: tab === t ? '#ff6b35' : '#6b7280', borderBottom: tab === t ? '2px solid #ff6b35' : '2px solid transparent' }}>
                            {t}
                        </button>
                    ))}
                </div>

                {tab === 'Canchas'  && <TabCanchas />}
                {tab === 'Reservas' && <TabReservas />}
                {tab === 'Horarios' && <TabHorarios />}
                {tab === 'Reportes' && <TabReportes />}
            </div>
        </div>
    )
}

export default Admin