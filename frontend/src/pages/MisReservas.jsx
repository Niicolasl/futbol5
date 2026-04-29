import { useEffect, useState } from 'react'
import { getMisReservasRequest, cancelarReservaRequest } from '../api/reservas'

const ESTADO_STYLES = {
  pendiente:  { bg: 'rgba(234,179,8,0.15)',  border: 'rgba(234,179,8,0.4)',  text: '#eab308' },
  confirmada: { bg: 'rgba(34,197,94,0.15)',  border: 'rgba(34,197,94,0.4)',  text: '#22c55e' },
  cancelada:  { bg: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.4)',  text: '#ef4444' },
}

function MisReservas() {
  const [reservas, setReservas] = useState([])
  const [loading, setLoading] = useState(true)
  const [visible, setVisible] = useState(false)
  const [cancelando, setCancelando] = useState(null)

  useEffect(() => {
    getMisReservasRequest()
      .then((res) => setReservas(res.data))
      .finally(() => {
        setLoading(false)
        setTimeout(() => setVisible(true), 50)
      })
  }, [])

  const handleCancelar = async (id) => {
    setCancelando(id)
    try {
      await cancelarReservaRequest(id)
      setReservas((prev) => prev.map((r) => r._id === id ? { ...r, estado: 'cancelada' } : r))
    } catch (err) {
      console.error(err)
    } finally {
      setCancelando(null)
    }
  }

  const v = visible ? '' : 'pre-anim'
  const DELAYS = ['delay-0','delay-100','delay-200','delay-300','delay-400','delay-500','delay-600','delay-700']

  return (
    <div className="scanline-overlay min-h-screen bg-black pt-24 px-6 pb-12"
      style={{ backgroundImage: 'radial-gradient(ellipse at top, #0a0a1a 0%, #000000 70%)' }}>

      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(255,107,53,0.04) 0%, transparent 70%)' }} />

      <div className="max-w-4xl mx-auto relative z-10">

        {/* Header */}
        <div className={`${v} anim-fade-up delay-0 mb-12 text-center`}>
          <h2 className="text-4xl font-black uppercase tracking-widest text-white mb-3">
            Mis <span style={{ color: '#ff6b35' }}>Reservas</span>
          </h2>
          <p className="text-gray-500 tracking-widest uppercase text-xs">Historial de tus reservas</p>
          <div className="w-16 h-0.5 mx-auto mt-4"
            style={{ background: 'linear-gradient(90deg, transparent, #ff6b35, transparent)' }} />
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 rounded-full border-2 border-orange-500/30 border-t-orange-500 animate-spin" />
          </div>
        )}

        {/* Sin reservas */}
        {!loading && reservas.length === 0 && (
          <div className={`${v} anim-fade-up delay-100 text-center py-20`}>
            <p className="text-6xl mb-4 anim-float inline-block">⚽</p>
            <p className="text-gray-500 uppercase tracking-widest text-sm mt-4">
              No tienes reservas aún
            </p>
          </div>
        )}

        {/* Lista */}
        <div className="space-y-4">
          {reservas.map((reserva, i) => {
            const s = ESTADO_STYLES[reserva.estado] || ESTADO_STYLES.pendiente
            return (
              <div key={reserva._id}
                className={`${v} anim-fade-up ${DELAYS[i] || 'delay-700'} card-hover rounded-2xl p-6 border border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4`}
                style={{ background: 'rgba(255,255,255,0.03)' }}>

                <div className="flex items-center gap-4">
                  {/* Icono con glow de color según estado */}
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 transition-all duration-300"
                    style={{ background: `${s.bg}`, border: `1px solid ${s.border}` }}>
                    ⚽
                  </div>

                  <div>
                    <h3 className="text-white font-bold">{reserva.cancha?.nombre}</h3>
                    <p className="text-gray-500 text-sm capitalize">
                      {new Date(reserva.fecha).toLocaleDateString('es-CO', {
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </p>
                    <p className="text-gray-600 text-xs mt-1">
                      {reserva.horaInicio} — {reserva.horaFin}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  {/* Badge con borde animado según estado */}
                  <span className="badge-pulse px-3 py-1 rounded-full text-xs uppercase tracking-widest font-bold"
                    style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.text }}>
                    {reserva.estado}
                  </span>

                  {reserva.estado !== 'cancelada' && (
                    <button onClick={() => handleCancelar(reserva._id)}
                      disabled={cancelando === reserva._id}
                      className="btn-gta px-4 py-2 rounded-lg text-xs uppercase tracking-widest font-bold border border-red-500/30 text-red-400 hover:bg-red-500/10 cursor-pointer disabled:opacity-50">
                      {cancelando === reserva._id ? '...' : 'Cancelar'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default MisReservas