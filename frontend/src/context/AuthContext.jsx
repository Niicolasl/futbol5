import { createContext, useContext, useState, useEffect } from 'react'
import { loginRequest, registerRequest, logoutRequest, profileRequest, updatePerfilRequest } from '../api/auth'

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await profileRequest()
        setUser(res.data)
        setIsAuthenticated(true)
      } catch {
        setUser(null)
        setIsAuthenticated(false)
      } finally {
        setLoading(false)
      }
    }
    checkSession()
  }, [])

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

  // Actualiza el usuario en el contexto sin recargar sesión
  const refreshUser = async () => {
    try {
      const res = await profileRequest()
      setUser(res.data)
    } catch { }
  }

  if (loading) return null

  return (
    <AuthContext.Provider value={{ user, setUser, isAuthenticated, signup, signin, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}