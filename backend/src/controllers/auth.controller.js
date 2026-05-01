import User from '../models/user.model.js'
import Reserva from '../models/reserva.model.js'
import bcrypt from 'bcryptjs'
import { createAccessToken } from '../libs/jwt.js'

const userPayload = (u) => ({
    id: u._id,
    nombre: u.nombre,
    email: u.email,
    telefono: u.telefono,
    rol: u.rol,
    createdAt: u.createdAt,
})

export const register = async (req, res) => {
    const { nombre, email, password, telefono } = req.body
    try {
        if (await User.findOne({ email }))
            return res.status(400).json({ message: 'El email ya está registrado' })

        const passwordHash = await bcrypt.hash(password, 10)
        const userSaved = await new User({ nombre, email, password: passwordHash, telefono: telefono || '' }).save()

        const token = await createAccessToken({ id: userSaved._id, rol: userSaved.rol })
        res.cookie('token', token, { httpOnly: true, sameSite: 'strict' })
        res.json(userPayload(userSaved))
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const login = async (req, res) => {
    const { email, password } = req.body
    try {
        const userFound = await User.findOne({ email })
        if (!userFound)
            return res.status(400).json({ message: 'Usuario no encontrado' })

        if (!await bcrypt.compare(password, userFound.password))
            return res.status(400).json({ message: 'Contraseña incorrecta' })

        const token = await createAccessToken({ id: userFound._id, rol: userFound.rol })
        res.cookie('token', token, { httpOnly: true, sameSite: 'strict' })
        res.json(userPayload(userFound))
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const logout = (req, res) => {
    res.cookie('token', '', { expires: new Date(0), httpOnly: true, sameSite: 'strict' })
    return res.status(200).json({ message: 'Sesión cerrada' })
}

export const profile = async (req, res) => {
    try {
        const userFound = await User.findById(req.user.id)
        if (!userFound)
            return res.status(400).json({ message: 'Usuario no encontrado' })
        res.json(userPayload(userFound))
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// PUT /api/auth/perfil — actualizar nombre, email, teléfono
export const updatePerfil = async (req, res) => {
    try {
        const { nombre, email, telefono } = req.body
        const user = await User.findById(req.user.id)
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' })

        // Si cambia el email, verificar que no esté en uso
        if (email && email !== user.email) {
            const existe = await User.findOne({ email })
            if (existe) return res.status(400).json({ message: 'Ese email ya está registrado por otro usuario' })
            user.email = email
        }

        if (nombre !== undefined) user.nombre = nombre
        if (telefono !== undefined) user.telefono = telefono

        await user.save()
        res.json(userPayload(user))
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// PUT /api/auth/cambiar-password
export const changePassword = async (req, res) => {
    try {
        const { passwordActual, passwordNueva } = req.body
        const user = await User.findById(req.user.id)
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' })

        if (!await bcrypt.compare(passwordActual, user.password))
            return res.status(400).json({ message: 'La contraseña actual es incorrecta' })

        user.password = await bcrypt.hash(passwordNueva, 10)
        await user.save()
        res.json({ message: 'Contraseña actualizada correctamente' })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// GET /api/auth/mis-stats — resumen de actividad del usuario
export const getMisStats = async (req, res) => {
    try {
        const stats = await Reserva.aggregate([
            { $match: { usuario: req.user.id } },
            { $group: { _id: '$estado', total: { $sum: 1 } } },
        ])
        // También contar todas sin filtro de visibilidad
        const all = await Reserva.countDocuments({ usuario: req.user.id })
        const map = { confirmada: 0, pendiente: 0, cancelada: 0 }
        for (const s of stats) map[s._id] = s.total
        res.json({ total: all, ...map })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// DELETE /api/auth/cuenta — eliminar cuenta propia
export const deleteCuenta = async (req, res) => {
    try {
        const { password } = req.body
        const user = await User.findById(req.user.id)
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' })

        if (!await bcrypt.compare(password, user.password))
            return res.status(400).json({ message: 'Contraseña incorrecta' })

        // Marcar todas sus reservas como canceladas e invisibles
        await Reserva.updateMany(
            { usuario: req.user.id, estado: { $ne: 'cancelada' } },
            { estado: 'cancelada', visibleParaUsuario: false }
        )

        await User.findByIdAndDelete(req.user.id)
        res.cookie('token', '', { expires: new Date(0), httpOnly: true, sameSite: 'strict' })
        res.json({ message: 'Cuenta eliminada correctamente' })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}