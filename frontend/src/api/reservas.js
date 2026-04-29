import axios from 'axios'

const API = '/api/reservas'

export const crearReservaRequest = (data) =>
    axios.post(API, data, { withCredentials: true })

export const getMisReservasRequest = () =>
    axios.get(`${API}/mis-reservas`, { withCredentials: true })

export const cancelarReservaRequest = (id) =>
    axios.delete(`${API}/${id}`, { withCredentials: true })

export const getDisponibilidadRequest = (canchaId, fecha) =>
    axios.get(`${API}/disponibilidad`, { params: { canchaId, fecha } })

// Admin
export const getTodasReservasRequest = () =>
    axios.get(`${API}/todas`, { withCredentials: true })