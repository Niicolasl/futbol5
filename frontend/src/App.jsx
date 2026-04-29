import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Canchas from './pages/Canchas'
import MisReservas from './pages/MisReservas'
import Admin from './pages/Admin'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/login' element={<Login />} />
          <Route path='/register' element={<Register />} />

          {/* Rutas protegidas para usuarios autenticados */}
          <Route element={<ProtectedRoute />}>
            <Route path='/canchas' element={<Canchas />} />
            <Route path='/mis-reservas' element={<MisReservas />} />
          </Route>

          {/* Rutas protegidas solo para admin */}
          <Route element={<AdminRoute />}>
            <Route path='/admin' element={<Admin />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App