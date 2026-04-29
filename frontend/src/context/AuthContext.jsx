import { createContext, useContext, useState, useEffect } from 'react'
import { loginRequest, registerRequest, logoutRequest, profileRequest } from '../api/auth'

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true) // ← NUEVO: evita el flash de redirección

  // ─────────────────────────────────────────────────────────────
  // Al montar la app, verificamos si la cookie JWT sigue válida.
  // Si el backend responde con datos → el usuario ya estaba logueado.
  // Si responde 401 → la cookie expiró o no existe. No pasa nada.
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await profileRequest()
        setUser(res.data)
        setIsAuthenticated(true)
      } catch {
        // Cookie inválida o inexistente — estado por defecto (no autenticado)
        setUser(null)
        setIsAuthenticated(false)
      } finally {
        setLoading(false) // ← siempre quitamos el loading, pase lo que pase
      }
    }

    checkSession()
  }, []) // [] → se ejecuta solo una vez al montar

  const signup = async (data) => {
    const res = await registerRequest(data)
    setUser(res.data)
    setIsAuthenticated(true)
  }

  const signin = async (data) => {
    const res = await loginRequest(data)
    setUser(res.data)
    setIsAuthenticated(true)
  }

  const logout = async () => {
    await logoutRequest()
    setUser(null)
    setIsAuthenticated(false)
  }

  // Mientras verificamos la sesión, no renderizamos nada.
  // Esto evita que ProtectedRoute redirija a /login por un instante.
  if (loading) return null

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, signup, signin, logout }}>
      {children}
    </AuthContext.Provider>
  )
}