import { useEffect, useState } from 'react'
import { getCanchasRequest, calificarCanchaRequest, getCalificacionesRequest, getHorariosRequest } from '../api/canchas'
import { crearReservaRequest, getDisponibilidadRequest } from '../api/reservas'
import { useAuth } from '../context/AuthContext'

const SLOTS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00',
]

const DIAS_MAP = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']
const AÑO_ACTUAL = new Date().getFullYear()

function sumarHoras(horaInicio, cantidad) {
  const [h] = horaInicio.split(':').map(Number)
  const fin = h + cantidad
  return fin <= 23 ? `${String(fin).padStart(2, '0')}:00` : null
}

function fechaHoy() {
  return new Date().toISOString().split('T')[0]
}

function slotDentroHorario(slot, horarioDia) {
  if (!horarioDia || !horarioDia.activo) return false
  const [h] = slot.split(':').map(Number)
  const [ap] = (horarioDia.horaApertura || '06:00').split(':').map(Number)
  const [ci] = (horarioDia.horaCierre || '22:00').split(':').map(Number)
  return h >= ap && h < ci
}

function slotDisponible(slot, cantidadHoras, horasOcupadas, fecha, horarios) {
  const [h] = slot.split(':').map(Number)
  if (h + cantidadHoras > 24) return false

  // Validar horario de apertura del día
  if (horarios && fecha) {
    const diaSemana = DIAS_MAP[new Date(fecha + 'T12:00:00').getDay()]
    const horarioDia = horarios[diaSemana]
    if (horarioDia && !horarioDia.activo) return false
    if (horarioDia) {
      const [ci] = (horarioDia.horaCierre || '22:00').split(':').map(Number)
      if (h >= ci || h + cantidadHoras > ci) return false
      const [ap] = (horarioDia.horaApertura || '06:00').split(':').map(Number)
      if (h < ap) return false
    }
  }

  // Bloquear slots pasados si es hoy
  const hoy = fechaHoy()
  if (fecha === hoy) {
    const ahora = new Date()
    const horaActual = ahora.getHours() + ahora.getMinutes() / 60
    if (h <= horaActual) return false
  }

  const horaFin = sumarHoras(slot, cantidadHoras)
  return !horasOcupadas.some(({ horaInicio, horaFin: oF }) => slot < oF && horaFin > horaInicio)
}

function Estrellas({ promedio, total, size = 'sm', interactivo = false, valorHover, onHover, onLeave, onClick }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => {
        const activa = interactivo ? n <= (valorHover || 0) : n <= Math.round(promedio)
        return (
          <span key={n}
            onMouseEnter={() => interactivo && onHover?.(n)}
            onMouseLeave={() => interactivo && onLeave?.()}
            onClick={() => interactivo && onClick?.(n)}
            className={`transition-all duration-100 ${interactivo ? 'cursor-pointer hover:scale-125' : ''} ${size === 'lg' ? 'text-2xl' : 'text-sm'}`}
            style={{ color: activa ? '#ff6b35' : 'rgba(255,255,255,0.15)', filter: activa ? 'drop-shadow(0 0 4px #ff6b3566)' : 'none' }}>
            ★
          </span>
        )
      })}
      {!interactivo && total > 0 && <span className="text-gray-500 ml-1" style={{ fontSize: size === 'lg' ? '13px' : '10px' }}>{promedio.toFixed(1)} ({total})</span>}
      {!interactivo && total === 0 && <span className="text-gray-600 ml-1" style={{ fontSize: '10px' }}>Sin calificaciones</span>}
    </div>
  )
}

// Modal de confirmación genérico
function ModalConfirm({ visible, titulo, descripcion, onConfirmar, onCancelar, colorBtn = '#ef4444', textoBtn = 'Confirmar' }) {
  if (!visible) return null
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)' }}>
      <div className="w-full max-w-sm rounded-2xl border border-white/10 p-8 text-center"
        style={{ background: '#0d0d0d' }}>
        <p className="text-white text-lg font-bold mb-2">{titulo}</p>
        <p className="text-gray-400 text-sm mb-8">{descripcion}</p>
        <div className="flex gap-3">
          <button onClick={onCancelar}
            className="flex-1 py-3 rounded-lg text-sm uppercase tracking-widest font-bold border border-white/10 text-gray-400 hover:text-white cursor-pointer transition-all">
            Volver
          </button>
          <button onClick={onConfirmar}
            className="flex-1 py-3 rounded-lg text-sm uppercase tracking-widest font-bold cursor-pointer transition-all"
            style={{ background: colorBtn, color: '#fff' }}>
            {textoBtn}
          </button>
        </div>
      </div>
    </div>
  )
}

function Canchas() {
  const { user } = useAuth()

  const [canchas, setCanchas] = useState([])
  const [horarios, setHorarios] = useState(null)
  const [visible, setVisible] = useState(false)

  // Modal reserva
  const [selected, setSelected] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [fecha, setFecha] = useState('')
  const [horaInicio, setHoraInicio] = useState(null)
  const [cantidadHoras, setCantidadHoras] = useState(1)
  const [horasOcupadas, setHorasOcupadas] = useState([])
  const [loadingDisp, setLoadingDisp] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [loadingReserva, setLoadingReserva] = useState(false)

  // Modal confirmación reserva
  const [confirmModal, setConfirmModal] = useState(false)

  // Modal calificación
  const [modalCalif, setModalCalif] = useState(null)
  const [califVisible, setCalifVisible] = useState(false)
  const [califData, setCalifData] = useState(null)
  const [estrellasHover, setEstrellasHover] = useState(0)
  const [estrellasSelec, setEstrellasSelec] = useState(0)
  const [comentario, setComentario] = useState('')
  const [loadingCalif, setLoadingCalif] = useState(false)
  const [mensajeCalif, setMensajeCalif] = useState('')
  const [errorCalif, setErrorCalif] = useState('')

  useEffect(() => {
    getCanchasRequest().then((res) => setCanchas(res.data))
    getHorariosRequest().then((res) => setHorarios(res.data)).catch(() => { })
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!selected || !fecha || selected.soloMensaje) { setHorasOcupadas([]); setHoraInicio(null); return }
    setLoadingDisp(true)
    setHoraInicio(null)
    getDisponibilidadRequest(selected._id, fecha)
      .then((res) => setHorasOcupadas(res.data))
      .catch(() => setHorasOcupadas([]))
      .finally(() => setLoadingDisp(false))
  }, [fecha, selected])

  useEffect(() => {
    if (horaInicio && !slotDisponible(horaInicio, cantidadHoras, horasOcupadas, fecha, horarios))
      setHoraInicio(null)
  }, [cantidadHoras])

  const getDiaCerrado = () => {
    if (!horarios || !fecha) return null
    const diaSemana = DIAS_MAP[new Date(fecha + 'T12:00:00').getDay()]
    const h = horarios[diaSemana]
    if (h && !h.activo) return diaSemana
    return null
  }

  const abrirModal = (cancha) => {
    if (!cancha.disponible) {
      setSelected({ ...cancha, soloMensaje: true })
      setTimeout(() => setModalVisible(true), 10)
      return
    }
    setSelected(cancha)
    setFecha('')
    setHoraInicio(null)
    setCantidadHoras(1)
    setHorasOcupadas([])
    setError('')
    setTimeout(() => setModalVisible(true), 10)
  }

  const cerrarModal = () => {
    setModalVisible(false)
    setConfirmModal(false)
    setTimeout(() => setSelected(null), 300)
  }

  // Paso 1: usuario hace clic en "Reservar" → abre modal de confirmación
  const handleClickReservar = () => {
    if (!fecha) { setError('Selecciona una fecha'); return }
    if (!horaInicio) { setError('Selecciona un horario de inicio'); return }
    setError('')
    setConfirmModal(true)
  }

  // Paso 2: usuario confirma en el modal → se crea la reserva
  const handleConfirmarReserva = async () => {
    setConfirmModal(false)
    const horaFin = sumarHoras(horaInicio, cantidadHoras)
    setLoadingReserva(true)
    try {
      await crearReservaRequest({
        canchaId: selected._id,
        fecha,
        horaInicio,
        horaFin,
        cantidadHoras,
        nombreContacto: user.nombre,
        telefono: user.telefono || '',
      })
      setMensaje(`✓ Reserva confirmada en ${selected.nombre} · ${horaInicio} – ${horaFin}`)
      cerrarModal()
    } catch (err) {
      setError(err.response?.data?.message || 'Error al reservar')
    } finally {
      setLoadingReserva(false)
    }
  }

  const abrirModalCalif = async (e, cancha) => {
    e.stopPropagation()
    setModalCalif(cancha)
    setMensajeCalif(''); setErrorCalif(''); setComentario(''); setEstrellasSelec(0); setEstrellasHover(0)
    try {
      const res = await getCalificacionesRequest(cancha._id)
      setCalifData(res.data)
      if (res.data.miCalificacion) {
        setEstrellasSelec(res.data.miCalificacion.puntuacion)
        setComentario(res.data.miCalificacion.comentario || '')
      }
    } catch { setCalifData({ calificaciones: [], miCalificacion: null }) }
    setTimeout(() => setCalifVisible(true), 10)
  }

  const cerrarModalCalif = () => { setCalifVisible(false); setTimeout(() => setModalCalif(null), 300) }

  const handleCalificar = async () => {
    if (!estrellasSelec) { setErrorCalif('Selecciona una puntuación'); return }
    setErrorCalif('')
    setLoadingCalif(true)
    try {
      const res = await calificarCanchaRequest(modalCalif._id, { puntuacion: estrellasSelec, comentario })
      setCanchas((prev) => prev.map((c) => c._id === modalCalif._id
        ? { ...c, promedioCalificacion: res.data.promedio, totalCalificaciones: res.data.total } : c))
      setMensajeCalif('¡Gracias por tu calificación!')
      const updated = await getCalificacionesRequest(modalCalif._id)
      setCalifData(updated.data)
    } catch (err) { setErrorCalif(err.response?.data?.message || 'Error al calificar') }
    finally { setLoadingCalif(false) }
  }

  const DELAYS = ['delay-0', 'delay-100', 'delay-200', 'delay-300', 'delay-400', 'delay-500']
  const v = visible ? '' : 'pre-anim'
  const horaFin = horaInicio ? sumarHoras(horaInicio, cantidadHoras) : null
  const diaCerrado = getDiaCerrado()

  return (
    <div className="scanline-overlay min-h-screen bg-black pt-24 px-6 pb-12"
      style={{ backgroundImage: 'radial-gradient(ellipse at top, #0a0a1a 0%, #000000 70%)' }}>

      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(255,107,53,0.05) 0%, transparent 70%)' }} />

      <div className="max-w-6xl mx-auto">
        <div className={`${v} anim-fade-up delay-0 mb-12 text-center`}>
          <h2 className="text-4xl font-black uppercase tracking-widest text-white mb-3">
            Nuestras <span style={{ color: '#ff6b35' }}>Canchas</span>
          </h2>
          <p className="text-gray-500 tracking-widest uppercase text-xs">Selecciona una cancha y reserva tu turno</p>
          <div className="w-16 h-0.5 mx-auto mt-4" style={{ background: 'linear-gradient(90deg, transparent, #ff6b35, transparent)' }} />
        </div>

        {mensaje && (
          <div className="anim-pop-in mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-center font-semibold">
            {mensaje}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {canchas.map((cancha, i) => (
            <div key={cancha._id}
              onClick={() => abrirModal(cancha)}
              className={`${v} anim-fade-up ${DELAYS[i] || 'delay-500'} rounded-2xl p-6 border border-white/10 cursor-pointer transition-all duration-300 ${cancha.disponible ? 'card-hover' : 'opacity-60'}`}
              style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(10px)' }}>

              <div className="w-full h-32 rounded-xl mb-4 flex items-center justify-center relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)' }}>
                <span className="text-5xl">⚽</span>
              </div>

              <h3 className="text-white font-bold text-lg mb-1">{cancha.nombre}</h3>
              <p className="text-gray-500 text-sm mb-3">{cancha.descripcion}</p>

              <div className="mb-3">
                <Estrellas promedio={cancha.promedioCalificacion || 0} total={cancha.totalCalificaciones || 0} />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest text-gray-600">Precio/hora</span>
                <span className="font-black text-lg" style={{ color: '#ff6b35' }}>${cancha.precio.toLocaleString()}</span>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`badge-pulse w-2 h-2 rounded-full ${cancha.disponible ? 'bg-green-400' : 'bg-red-400'}`} />
                  <span className={`text-xs ${cancha.disponible ? 'text-gray-500' : 'text-red-400'}`}>
                    {cancha.disponible ? 'Disponible' : 'No disponible'}
                  </span>
                </div>
                <button onClick={(e) => abrirModalCalif(e, cancha)}
                  className="relative overflow-hidden cursor-pointer px-2 py-1 rounded-md text-xs tracking-wider transition-all duration-300 hover:scale-105"
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#6b7280",
                    animation: "califGlow 2.5s ease-in-out infinite",
                  }}>
                  <span className="absolute inset-0 rounded-lg"
                    style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,107,53,0.15) 50%, transparent 100%)', animation: 'califShimmer 2.5s ease-in-out infinite' }} />
                  <span className="relative">★ Calificar</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ MODAL RESERVA ══ */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 transition-all duration-300"
          style={{ background: modalVisible ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0)', backdropFilter: modalVisible ? 'blur(10px)' : 'blur(0px)' }}
          onClick={(e) => e.target === e.currentTarget && cerrarModal()}>

          <div className="w-full max-w-lg rounded-2xl border border-white/10 overflow-hidden transition-all duration-300"
            style={{ background: '#0d0d0d', opacity: modalVisible ? 1 : 0, transform: modalVisible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(20px)', maxHeight: '90vh', overflowY: 'auto' }}>

            {selected.soloMensaje ? (
              <div className="p-10 text-center">
                <div className="text-6xl mb-4">🚫</div>
                <h3 className="text-white text-xl font-bold mb-2">{selected.nombre}</h3>
                <p className="text-red-400 font-semibold mb-2">Cancha no disponible</p>
                <p className="text-gray-500 text-sm mb-8">Esta cancha se encuentra temporalmente fuera de servicio.</p>
                <button onClick={cerrarModal} className="btn-gta px-8 py-3 rounded-lg text-sm uppercase tracking-widest font-bold border border-white/10 text-gray-400 hover:text-white cursor-pointer">Cerrar</button>
              </div>
            ) : (
              <>
                <div className="p-8 pb-4">
                  <h3 className="text-white text-xl font-bold mb-1">Reservar cancha</h3>
                  <p className="text-orange-400 text-xs uppercase tracking-widest">{selected.nombre}</p>
                </div>

                {error && <div className="mx-8 mb-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}

                <div className="px-8 pb-8">
                  <p className="text-gray-500 text-xs uppercase tracking-widest mb-5">Elige fecha y horario</p>

                  <div className="mb-5">
                    <label className="text-gray-400 text-xs uppercase tracking-widest mb-2 block">Fecha <span className="text-gray-600 normal-case">({AÑO_ACTUAL})</span></label>
                    <input type="date" min={fechaHoy()} max={`${AÑO_ACTUAL}-12-31`} value={fecha}
                      onChange={(e) => setFecha(e.target.value)}
                      className="input-gta w-full border border-white/10 rounded-lg px-4 py-3 focus:outline-none"
                      style={{ background: 'rgba(255,255,255,0.08)', color: '#ffffff', colorScheme: 'dark' }} />
                  </div>

                  {/* Aviso si el día está cerrado */}
                  {fecha && diaCerrado && (
                    <div className="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
                      🚫 El lugar está cerrado ese día ({diaCerrado})
                    </div>
                  )}

                  {fecha && !diaCerrado && (
                    <>
                      <div className="mb-5">
                        <label className="text-gray-400 text-xs uppercase tracking-widest mb-3 block">Cantidad de horas</label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5, 6].map((n) => (
                            <button key={n} type="button" onClick={() => setCantidadHoras(n)}
                              className="flex-1 py-2 rounded-lg text-sm font-bold transition-all duration-150 cursor-pointer"
                              style={{ background: cantidadHoras === n ? '#ff6b35' : 'rgba(255,255,255,0.05)', color: cantidadHoras === n ? '#000' : '#9ca3af', border: cantidadHoras === n ? '2px solid #ff6b35' : '1px solid rgba(255,255,255,0.1)', transform: cantidadHoras === n ? 'scale(1.05)' : 'scale(1)' }}>
                              {n}h
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="mb-6 anim-fade-up">
                        <label className="text-gray-400 text-xs uppercase tracking-widest mb-3 block">Hora de inicio</label>
                        <div className="flex gap-4 mb-3">
                          {[['bg-green-500/20 border-green-500/40', 'Libre'], ['bg-red-500/20 border-red-500/40', 'Ocupado'], ['bg-orange-500/20 border-orange-500', 'Seleccionado']].map(([cls, lbl]) => (
                            <div key={lbl} className="flex items-center gap-1">
                              <div className={`w-3 h-3 rounded-sm border ${cls}`} />
                              <span className="text-xs text-gray-500">{lbl}</span>
                            </div>
                          ))}
                        </div>

                        {loadingDisp ? (
                          <div className="py-4 text-center text-gray-500 text-sm animate-pulse">Consultando disponibilidad...</div>
                        ) : (
                          <div className="grid grid-cols-4 gap-2">
                            {SLOTS.map((slot) => {
                              const disp = slotDisponible(slot, cantidadHoras, horasOcupadas, fecha, horarios)
                              const sel = horaInicio === slot
                              const finSlot = sumarHoras(slot, cantidadHoras)
                              return (
                                <button key={slot} type="button" disabled={!disp} onClick={() => setHoraInicio(slot)}
                                  className={`py-2 px-1 rounded-lg text-xs font-bold transition-all duration-150 ${!disp ? 'bg-red-500/20 border border-red-500/40 text-red-400/50 cursor-not-allowed' : sel ? 'border-2 text-white scale-105 cursor-pointer' : 'bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 cursor-pointer'}`}
                                  style={sel ? { borderColor: '#ff6b35', background: 'rgba(255,107,53,0.2)', color: '#ff6b35' } : {}}>
                                  {slot}
                                  <span className="block font-normal" style={{ fontSize: '10px', color: !disp ? undefined : sel ? '#ff6b3599' : '#4b5563' }}>
                                    {!disp ? 'ocup.' : finSlot ? `→${finSlot}` : 'límite'}
                                  </span>
                                </button>
                              )
                            })}
                          </div>
                        )}

                        {horaInicio && horaFin && (
                          <div className="anim-pop-in mt-4 p-3 rounded-lg border text-sm text-center"
                            style={{ borderColor: 'rgba(255,107,53,0.3)', background: 'rgba(255,107,53,0.05)', color: '#ff6b35' }}>
                            ✓ <strong>{horaInicio}</strong> → <strong>{horaFin}</strong>
                            <span className="text-orange-400/60 ml-2">({cantidadHoras}h)</span>
                            <span className="block text-xs text-orange-400/50 mt-1">
                              Total: ${(selected.precio * cantidadHoras).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  <div className="mb-5 p-3 rounded-lg border border-white/5" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <p className="text-gray-600 text-xs uppercase tracking-widest mb-2">Reservando como</p>
                    <p className="text-white text-sm font-semibold">{user?.nombre}</p>
                    {user?.telefono && <p className="text-gray-500 text-xs mt-0.5">{user.telefono}</p>}
                  </div>

                  <div className="flex gap-3">
                    <button onClick={cerrarModal}
                      className="btn-gta flex-1 py-3 rounded-lg text-sm uppercase tracking-widest font-bold border border-white/10 text-gray-400 hover:text-white cursor-pointer">
                      Cancelar
                    </button>
                    <button onClick={handleClickReservar}
                      disabled={!fecha || !horaInicio || loadingReserva || !!diaCerrado}
                      className="btn-gta flex-1 py-3 rounded-lg text-sm uppercase tracking-widest font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: 'linear-gradient(135deg, #ff6b35, #f7c59f)', color: '#000' }}>
                      {loadingReserva ? 'Reservando...' : 'Reservar'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ══ MODAL CONFIRMACIÓN RESERVA ══ */}
      <ModalConfirm
        visible={confirmModal}
        titulo="¿Confirmar reserva?"
        descripcion={selected && horaInicio
          ? `${selected.nombre} · ${fecha} · ${horaInicio} – ${sumarHoras(horaInicio, cantidadHoras)} (${cantidadHoras}h) · Total: $${(selected?.precio * cantidadHoras).toLocaleString()}`
          : ''}
        onConfirmar={handleConfirmarReserva}
        onCancelar={() => setConfirmModal(false)}
        colorBtn="#ff6b35"
        textoBtn="Sí, reservar"
      />

      {/* ══ MODAL CALIFICACIÓN ══ */}
      {modalCalif && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 transition-all duration-300"
          style={{ background: califVisible ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0)', backdropFilter: califVisible ? 'blur(10px)' : 'blur(0px)' }}
          onClick={(e) => e.target === e.currentTarget && cerrarModalCalif()}>
          <div className="w-full max-w-md rounded-2xl border border-white/10 overflow-hidden transition-all duration-300"
            style={{ background: '#0d0d0d', opacity: califVisible ? 1 : 0, transform: califVisible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(20px)', maxHeight: '85vh', overflowY: 'auto' }}>
            <div className="p-8 pb-4">
              <h3 className="text-white text-xl font-bold mb-1">Calificar cancha</h3>
              <p className="text-orange-400 text-xs uppercase tracking-widest">{modalCalif.nombre}</p>
            </div>
            <div className="px-8 pb-8">
              {califData?.miCalificacion && !mensajeCalif && (
                <div className="mb-4 p-3 rounded-lg border border-orange-500/20 text-xs text-orange-400/70" style={{ background: 'rgba(255,107,53,0.05)' }}>
                  Ya calificaste esta cancha. Puedes actualizar tu puntuación.
                </div>
              )}
              {mensajeCalif && <div className="anim-pop-in mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm text-center">{mensajeCalif}</div>}
              {errorCalif && <div className="anim-fade-up mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{errorCalif}</div>}
              <div className="mb-6 text-center">
                <p className="text-gray-400 text-xs uppercase tracking-widest mb-4">Tu puntuación</p>
                <div className="flex justify-center gap-2">
                  <Estrellas promedio={estrellasSelec} total={0} size="lg" interactivo={true} valorHover={estrellasHover || estrellasSelec} onHover={setEstrellasHover} onLeave={() => setEstrellasHover(0)} onClick={setEstrellasSelec} />
                </div>
                {(estrellasHover || estrellasSelec) > 0 && <p className="text-gray-500 text-xs mt-2">{['', 'Muy mala', 'Mala', 'Regular', 'Buena', 'Excelente'][estrellasHover || estrellasSelec]}</p>}
              </div>
              <div className="mb-6">
                <label className="text-gray-400 text-xs uppercase tracking-widest mb-2 block">Comentario <span className="text-gray-600 normal-case">(opcional)</span></label>
                <textarea value={comentario} onChange={(e) => setComentario(e.target.value)} placeholder="¿Cómo fue tu experiencia?" rows={3}
                  className="input-gta w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none resize-none" />
              </div>
              {califData?.calificaciones?.length > 0 && (
                <div className="mb-6">
                  <p className="text-gray-600 text-xs uppercase tracking-widest mb-3">Últimas reseñas</p>
                  <div className="space-y-3">
                    {califData.calificaciones.map((c) => (
                      <div key={c._id} className="p-3 rounded-lg border border-white/5" style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-white text-xs font-semibold">{c.usuario?.nombre}</span>
                          <Estrellas promedio={c.puntuacion} total={0} />
                        </div>
                        {c.comentario && <p className="text-gray-500 text-xs">{c.comentario}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={cerrarModalCalif} className="btn-gta flex-1 py-3 rounded-lg text-sm uppercase tracking-widest font-bold border border-white/10 text-gray-400 hover:text-white cursor-pointer">Cerrar</button>
                <button onClick={handleCalificar} disabled={loadingCalif || !estrellasSelec}
                  className="btn-gta flex-1 py-3 rounded-lg text-sm uppercase tracking-widest font-bold cursor-pointer disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, #ff6b35, #f7c59f)', color: '#000' }}>
                  {loadingCalif ? 'Guardando...' : 'Enviar calificación'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Keyframes para el botón calificar */}
      <style>{`
        @keyframes califGlow {
          0%, 100% { box-shadow: 0 0 6px rgba(255,107,53,0.2), 0 0 0px rgba(255,107,53,0); }
          50%       { box-shadow: 0 0 12px rgba(255,107,53,0.5), 0 0 20px rgba(255,107,53,0.2); }
        }
        @keyframes califShimmer {
          0%   { transform: translateX(-100%); }
          60%, 100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  )
}

export default Canchas