import axios from 'axios'

const API = '/api/auth'

export const registerRequest = (data) =>
    axios.post(`${API}/register`, data, { withCredentials: true })

export const loginRequest = (data) =>
    axios.post(`${API}/login`, data, { withCredentials: true })

export const logoutRequest = () =>
    axios.post(`${API}/logout`, {}, { withCredentials: true })

export const profileRequest = () =>
    axios.get(`${API}/profile`, { withCredentials: true })

export const updatePerfilRequest = (data) =>
    axios.put(`${API}/perfil`, data, { withCredentials: true })

export const changePasswordRequest = (data) =>
    axios.put(`${API}/cambiar-password`, data, { withCredentials: true })

export const getMisStatsRequest = () =>
    axios.get(`${API}/mis-stats`, { withCredentials: true })

export const deleteCuentaRequest = (data) =>
    axios.delete(`${API}/cuenta`, { data, withCredentials: true })