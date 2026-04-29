import { useAuth } from '../context/AuthContext'
import { Navigate, Outlet } from 'react-router-dom'

// ProtectedRoute: si no está autenticado, redirige al login.
// El loading ya fue resuelto por AuthProvider (devuelve null hasta confirmar sesión),
// así que cuando llegamos aquí ya sabemos el estado real del usuario.
function ProtectedRoute() {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) return <Navigate to='/login' replace />

  return <Outlet />
}

export default ProtectedRoute