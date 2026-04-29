import { useAuth } from '../context/AuthContext'
import { Navigate, Outlet } from 'react-router-dom'

// Igual que ProtectedRoute pero además verifica que el rol sea 'admin'.
// Si no está logueado → /login
// Si está logueado pero no es admin → / (home)
function AdminRoute() {
    const { isAuthenticated, user } = useAuth()

    if (!isAuthenticated) return <Navigate to='/login' replace />
    if (user?.rol !== 'admin') return <Navigate to='/' replace />

    return <Outlet />
}

export default AdminRoute