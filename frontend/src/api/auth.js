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