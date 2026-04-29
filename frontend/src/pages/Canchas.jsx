import { useEffect, useState } from 'react'
import { getCanchasRequest } from '../api/canchas'
import { crearReservaRequest, getDisponibilidadRequest } from '../api/reservas'
import { useAuth } from '../context/AuthContext'

const SLOTS = [
  '06:00','07:00','08:00','09:00','10:00','11:00',
  '12:00','13:00','14:00','15:00','16:00','17:00',
  '18:00','19:00','20:00','21:00','22:00',
]

const AÑO_ACTUAL = new Date().getFullYear()

function sumarHoras(horaInicio, cantidad) {
  const [h] = horaInicio.split(':').map(Number)
  const fin = h + cantidad
  return fin <= 23 ? `${String(fin).padStart(2, '0')}:00` : null
}

function fechaHoy() {
  return new Date().toISOString().split('T')[0]
}

function slotDisponible(slot, cantidadHoras, horasOcupadas, fecha) {
  const [h] = slot.split(':').map(Number)
  if (h + cantidadHoras > 23) return false

  const hoy = fechaHoy()
  if (fecha === hoy) {
    const ahora = new Date()
    const horaActual = ahora.getHours() + ahora.getMinutes() / 60
    if (h <= horaActual) return false
  }

  const horaFin = sumarHoras(slot, cantidadHoras)
  return !horasOcupadas.some(({ horaInicio, horaFin: oF }) => slot < oF && horaFin > horaInicio)
}

function Canchas() {
  const { user } = useAuth()

  const [canchas, setCanchas]                             = useState([])
  const [visible, setVisible]                             = useState(false)
  const [selected, setSelected]                           = useState(null)
  const [modalVisible, setModalVisible]                   = useState(false)
  const [fecha, setFecha]                                 = useState('')
  const [horaInicio, setHoraInicio]                       = useState(null)
  const [cantidadHoras, setCantidadHoras]                 = useState(1)
  const [horasOcupadas, setHorasOcupadas]                 = useState([])
  const [loadingDisponibilidad, setLoadingDisponibilidad] = useState(false)
  const [error, setError]                                 = useState('')
  const [mensaje, setMensaje]                             = useState('')
  const [loadingReserva, setLoadingReserva]               = useState(false)

  useEffect(() => {
    getCanchasRequest().then((res) => setCanchas(res.data))
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!selected || !fecha) { setHorasOcupadas([]); setHoraInicio(null); return }
    setLoadingDisponibilidad(true)
    setHoraInicio(null)
    getDisponibilidadRequest(selected._id, fecha)
      .then((res) => setHorasOcupadas(res.data))
      .catch(() => setHorasOcupadas([]))
      .finally(() => setLoadingDisponibilidad(false))
  }, [fecha, selected])

  useEffect(() => {
    if (horaInicio && !slotDisponible(horaInicio, cantidadHoras, horasOcupadas, fecha)) {
      setHoraInicio(null)
    }
  }, [cantidadHoras])

  const abrirModal = (cancha) => {
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
    setTimeout(() => setSelected(null), 300)
  }

  const handleReservar = async () => {
    if (!fecha)      { setError('Selecciona una fecha'); return }
    if (!horaInicio) { setError('Selecciona un horario de inicio'); return }
    setError('')
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
      setMensaje(`¡Reserva confirmada en ${selected.nombre}! ${horaInicio} – ${horaFin}`)
      cerrarModal()
    } catch (err) {
      setError(err.response?.data?.message || 'Error al reservar')
    } finally {
      setLoadingReserva(false)
    }
  }

  const DELAYS = ['delay-0','delay-100','delay-200','delay-300','delay-400','delay-500']
  const v = visible ? '' : 'pre-anim'
  const horaFin = horaInicio ? sumarHoras(horaInicio, cantidadHoras) : null

  return (
    <div className="scanline-overlay min-h-screen bg-black pt-24 px-6 pb-12"
      style={{ backgroundImage: 'radial-gradient(ellipse at top, #0a0a1a 0%, #000000 70%)' }}>

      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(255,107,53,0.05) 0%, transparent 70%)' }} />

      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className={`${v} anim-fade-up delay-0 mb-12 text-center`}>
          <h2 className="text-4xl font-black uppercase tracking-widest text-white mb-3">
            Nuestras <span style={{ color: '#ff6b35' }}>Canchas</span>
          </h2>
          <p className="text-gray-500 tracking-widest uppercase text-xs">
            Selecciona una cancha y reserva tu turno
          </p>
          <div className="w-16 h-0.5 mx-auto mt-4"
            style={{ background: 'linear-gradient(90deg, transparent, #ff6b35, transparent)' }} />
        </div>

        {/* Mensaje éxito */}
        {mensaje && (
          <div className="anim-pop-in mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-center">
            {mensaje}
          </div>
        )}

        {/* Grid de canchas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {canchas.map((cancha, i) => (
            <div key={cancha._id}
              onClick={() => abrirModal(cancha)}
              className={`${v} anim-fade-up ${DELAYS[i] || 'delay-500'} card-hover rounded-2xl p-6 border border-white/10 cursor-pointer`}
              style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(10px)' }}>

              <div className="w-full h-32 rounded-xl mb-4 flex items-center justify-center relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)' }}>
                <span className="text-5xl">⚽</span>
                <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300"
                  style={{ background: 'linear-gradient(135deg, transparent 40%, rgba(255,107,53,0.05) 50%, transparent 60%)' }} />
              </div>

              <h3 className="text-white font-bold text-lg mb-1">{cancha.nombre}</h3>
              <p className="text-gray-500 text-sm mb-3">{cancha.descripcion}</p>

              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest text-gray-600">Precio/hora</span>
                <span className="font-black text-lg" style={{ color: '#ff6b35' }}>
                  ${cancha.precio.toLocaleString()}
                </span>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <div className={`badge-pulse w-2 h-2 rounded-full ${cancha.disponible ? 'bg-green-400' : 'bg-red-400'}`} />
                <span className="text-xs text-gray-500">
                  {cancha.disponible ? 'Disponible' : 'No disponible'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════ MODAL ══════════════ */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 transition-all duration-300"
          style={{
            background: modalVisible ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0)',
            backdropFilter: modalVisible ? 'blur(10px)' : 'blur(0px)',
          }}
          onClick={(e) => e.target === e.currentTarget && cerrarModal()}>

          <div className="w-full max-w-lg rounded-2xl border border-white/10 overflow-hidden transition-all duration-300"
            style={{
              background: '#0d0d0d',
              opacity: modalVisible ? 1 : 0,
              transform: modalVisible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(20px)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}>

            {/* Header del modal */}
            <div className="p-8 pb-4">
              <h3 className="text-white text-xl font-bold mb-1">Reservar cancha</h3>
              <p className="text-orange-400 text-xs uppercase tracking-widest">{selected.nombre}</p>
            </div>

            {/* Error global */}
            {error && (
              <div className="mx-8 mb-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm anim-fade-up">
                {error}
              </div>
            )}

            <div className="px-8 pb-8">
              <p className="text-gray-500 text-xs uppercase tracking-widest mb-5">
                Elige fecha y horario
              </p>

              {/* Fecha */}
              <div className="mb-5">
                <label className="text-gray-400 text-xs uppercase tracking-widest mb-2 block">
                  Fecha <span className="text-gray-600 normal-case tracking-normal">({AÑO_ACTUAL})</span>
                </label>
                <input type="date"
                  min={fechaHoy()}
                  max={`${AÑO_ACTUAL}-12-31`}
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="input-gta w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none"
                />
              </div>

              {/* Cantidad de horas */}
              <div className="mb-5">
                <label className="text-gray-400 text-xs uppercase tracking-widest mb-3 block">
                  Cantidad de horas
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <button key={n} type="button"
                      onClick={() => setCantidadHoras(n)}
                      className="flex-1 py-2 rounded-lg text-sm font-bold transition-all duration-150 cursor-pointer"
                      style={{
                        background: cantidadHoras === n ? '#ff6b35' : 'rgba(255,255,255,0.05)',
                        color: cantidadHoras === n ? '#000' : '#9ca3af',
                        border: cantidadHoras === n ? '2px solid #ff6b35' : '1px solid rgba(255,255,255,0.1)',
                        transform: cantidadHoras === n ? 'scale(1.05)' : 'scale(1)',
                      }}>
                      {n}h
                    </button>
                  ))}
                </div>
              </div>

              {/* Slots */}
              {fecha && (
                <div className="mb-6 anim-fade-up">
                  <label className="text-gray-400 text-xs uppercase tracking-widest mb-3 block">
                    Hora de inicio
                  </label>

                  <div className="flex gap-4 mb-3">
                    {[
                      ['bg-green-500/20 border-green-500/40', 'Libre'],
                      ['bg-red-500/20 border-red-500/40', 'Ocupado'],
                      ['bg-orange-500/20 border-orange-500', 'Seleccionado'],
                    ].map(([cls, lbl]) => (
                      <div key={lbl} className="flex items-center gap-1">
                        <div className={`w-3 h-3 rounded-sm border ${cls}`} />
                        <span className="text-xs text-gray-500">{lbl}</span>
                      </div>
                    ))}
                  </div>

                  {loadingDisponibilidad ? (
                    <div className="py-4 text-center text-gray-500 text-sm animate-pulse">
                      Consultando disponibilidad...
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {SLOTS.map((slot) => {
                        const disponible = slotDisponible(slot, cantidadHoras, horasOcupadas, fecha)
                        const sel = horaInicio === slot
                        const finSlot = sumarHoras(slot, cantidadHoras)
                        return (
                          <button key={slot} type="button"
                            disabled={!disponible}
                            onClick={() => setHoraInicio(slot)}
                            className={`py-2 px-1 rounded-lg text-xs font-bold transition-all duration-150 ${
                              !disponible
                                ? 'bg-red-500/20 border border-red-500/40 text-red-400/50 cursor-not-allowed'
                                : sel
                                  ? 'border-2 text-white scale-105 cursor-pointer'
                                  : 'bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 cursor-pointer'
                            }`}
                            style={sel ? { borderColor: '#ff6b35', background: 'rgba(255,107,53,0.2)', color: '#ff6b35' } : {}}>
                            {slot}
                            <span className="block font-normal"
                              style={{ fontSize: '10px', color: !disponible ? undefined : sel ? '#ff6b3599' : '#4b5563' }}>
                              {!disponible ? 'ocupado' : finSlot ? `→${finSlot}` : 'límite'}
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
              )}

              {/* Info del usuario que reserva */}
              <div className="mb-5 p-3 rounded-lg border border-white/5"
                style={{ background: 'rgba(255,255,255,0.02)' }}>
                <p className="text-gray-600 text-xs uppercase tracking-widest mb-2">Reservando como</p>
                <p className="text-white text-sm font-semibold">{user?.nombre}</p>
                {user?.telefono && (
                  <p className="text-gray-500 text-xs mt-0.5">{user.telefono}</p>
                )}
              </div>

              <div className="flex gap-3">
                <button onClick={cerrarModal}
                  className="btn-gta flex-1 py-3 rounded-lg text-sm uppercase tracking-widest font-bold border border-white/10 text-gray-400 hover:text-white cursor-pointer">
                  Cancelar
                </button>
                <button
                  onClick={handleReservar}
                  disabled={!fecha || !horaInicio || loadingReserva}
                  className="btn-gta flex-1 py-3 rounded-lg text-sm uppercase tracking-widest font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
                  style={{ background: 'linear-gradient(135deg, #ff6b35, #f7c59f)', color: '#000' }}>
                  {loadingReserva ? 'Reservando...' : 'Confirmar reserva'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Canchas