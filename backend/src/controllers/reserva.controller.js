import Reserva from '../models/reserva.model.js'
import Cancha from '../models/cancha.model.js'

export const createReserva = async (req, res) => {
    try {
        const { canchaId, fecha, horaInicio, horaFin, cantidadHoras, nombreContacto, telefono } = req.body

        const cancha = await Cancha.findById(canchaId)
        if (!cancha)
            return res.status(404).json({ message: 'Cancha no encontrada' })

        if (!cancha.disponible)
            return res.status(400).json({ message: 'La cancha no está disponible' })

        const reservaExiste = await Reserva.findOne({
            cancha: canchaId,
            fecha: new Date(fecha),
            estado: { $ne: 'cancelada' },
            $or: [{ horaInicio: { $lt: horaFin }, horaFin: { $gt: horaInicio } }],
        })

        if (reservaExiste)
            return res.status(400).json({ message: 'La cancha ya está reservada en ese horario' })

        const newReserva = new Reserva({
            usuario: req.user.id,
            cancha: canchaId,
            fecha: new Date(fecha),
            horaInicio,
            horaFin,
            cantidadHoras,
            nombreContacto,
            telefono,
        })

        const saved = await newReserva.save()
        const populated = await saved.populate('cancha', 'nombre precio')
        res.status(201).json(populated)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const getMisReservas = async (req, res) => {
    try {
        const reservas = await Reserva.find({ usuario: req.user.id })
            .populate('cancha', 'nombre precio imagen')
            .sort({ fecha: 1 })
        res.json(reservas)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const cancelarReserva = async (req, res) => {
    try {
        const reserva = await Reserva.findById(req.params.id)
        if (!reserva)
            return res.status(404).json({ message: 'Reserva no encontrada' })

        if (reserva.usuario.toString() !== req.user.id)
            return res.status(403).json({ message: 'No autorizado' })

        reserva.estado = 'cancelada'
        await reserva.save()
        res.json({ message: 'Reserva cancelada correctamente', reserva })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// GET /api/reservas/disponibilidad?canchaId=xxx&fecha=2024-12-01
// Pública — devuelve los bloques horarios ocupados para esa cancha y fecha
export const getDisponibilidad = async (req, res) => {
    try {
        const { canchaId, fecha } = req.query

        if (!canchaId || !fecha)
            return res.status(400).json({ message: 'canchaId y fecha son requeridos' })

        const reservas = await Reserva.find({
            cancha: canchaId,
            fecha: new Date(fecha),
            estado: { $ne: 'cancelada' },
        }).select('horaInicio horaFin -_id')

        res.json(reservas)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// GET /api/reservas/todas — solo admin
// Devuelve todas las reservas del sistema con datos del usuario y cancha
export const getTodasReservas = async (req, res) => {
    try {
        const reservas = await Reserva.find()
            .populate('usuario', 'nombre email')
            .populate('cancha', 'nombre precio')
            .sort({ fecha: -1 })
        res.json(reservas)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}