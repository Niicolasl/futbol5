import User from '../models/user.model.js'
import bcrypt from 'bcryptjs'
import { createAccessToken } from '../libs/jwt.js'

export const register = async (req, res) => {
    const { nombre, email, password, telefono } = req.body

    try {
        const userExiste = await User.findOne({ email })
        if (userExiste)
            return res.status(400).json({ message: 'El email ya está registrado' })

        const passwordHash = await bcrypt.hash(password, 10)

        const newUser = new User({ nombre, email, password: passwordHash, telefono: telefono || '' })
        const userSaved = await newUser.save()

        const token = await createAccessToken({ id: userSaved._id, rol: userSaved.rol })
        res.cookie('token', token, { httpOnly: true, sameSite: 'strict' })

        res.json({
            id:        userSaved._id,
            nombre:    userSaved.nombre,
            email:     userSaved.email,
            telefono:  userSaved.telefono,
            rol:       userSaved.rol,
            createdAt: userSaved.createdAt,
        })
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

        const isMatch = await bcrypt.compare(password, userFound.password)
        if (!isMatch)
            return res.status(400).json({ message: 'Contraseña incorrecta' })

        const token = await createAccessToken({ id: userFound._id, rol: userFound.rol })
        res.cookie('token', token, { httpOnly: true, sameSite: 'strict' })

        res.json({
            id:        userFound._id,
            nombre:    userFound.nombre,
            email:     userFound.email,
            telefono:  userFound.telefono,
            rol:       userFound.rol,
            createdAt: userFound.createdAt,
        })
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

        res.json({
            id:        userFound._id,
            nombre:    userFound.nombre,
            email:     userFound.email,
            telefono:  userFound.telefono,
            rol:       userFound.rol,
            createdAt: userFound.createdAt,
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}