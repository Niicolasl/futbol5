import axios from 'axios'

const API = '/api/canchas'

export const getCanchasRequest = () =>
    axios.get(API, { withCredentials: true })

export const getCanchaRequest = (id) =>
    axios.get(`${API}/${id}`, { withCredentials: true })

// Admin
export const crearCanchaRequest = (data) =>
    axios.post(API, data, { withCredentials: true })

export const actualizarCanchaRequest = (id, data) =>
    axios.put(`${API}/${id}`, data, { withCredentials: true })

export const eliminarCanchaRequest = (id) =>
    axios.delete(`${API}/${id}`, { withCredentials: true })
// Horarios
export const getHorariosRequest = () =>
    axios.get('/api/horarios')

export const updateHorariosRequest = (data) =>
    axios.put('/api/horarios', data, { withCredentials: true })

// Calificaciones
export const calificarCanchaRequest = (id, data) =>
    axios.post(`${API}/${id}/calificar`, data, { withCredentials: true })

export const getCalificacionesRequest = (id) =>
    axios.get(`${API}/${id}/calificaciones`, { withCredentials: true })