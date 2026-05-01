import Cancha from '../models/cancha.model.js'
import Calificacion from '../models/calificacion.model.js'
import Reserva from '../models/reserva.model.js'

export const getCanchas = async (req, res) => {
    try {
        const canchas = await Cancha.find()
        res.json(canchas)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const getCancha = async (req, res) => {
    try {
        const cancha = await Cancha.findById(req.params.id)
        if (!cancha)
            return res.status(404).json({ message: 'Cancha no encontrada' })
        res.json(cancha)
    } catch (error) {
        if (error.name === 'CastError')
            return res.status(400).json({ message: 'ID de cancha inválido' })
        res.status(500).json({ message: error.message })
    }
}

export const createCancha = async (req, res) => {
    try {
        const { nombre, descripcion, precio, imagen, disponible } = req.body
        const newCancha = new Cancha({ nombre, descripcion, precio: Number(precio), imagen, disponible })
        const saved = await newCancha.save()
        res.status(201).json(saved)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const updateCancha = async (req, res) => {
    try {
        const data = { ...req.body }
        if (data.precio !== undefined) data.precio = Number(data.precio)
        const cancha = await Cancha.findByIdAndUpdate(
            req.params.id,
            data,
            { new: true, runValidators: true }
        )
        if (!cancha)
            return res.status(404).json({ message: 'Cancha no encontrada' })
        res.json(cancha)
    } catch (error) {
        if (error.name === 'CastError')
            return res.status(400).json({ message: 'ID de cancha inválido' })
        res.status(500).json({ message: error.message })
    }
}

export const deleteCancha = async (req, res) => {
    try {
        const cancha = await Cancha.findByIdAndDelete(req.params.id)
        if (!cancha)
            return res.status(404).json({ message: 'Cancha no encontrada' })
        res.json({ message: 'Cancha eliminada correctamente' })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// ─────────────────────────────────────────────────────────────
// POST /api/canchas/:id/calificar — auth requerida
// Solo usuarios que hayan reservado la cancha pueden calificar.
// Si ya calificó antes, actualiza su calificación existente.
// ─────────────────────────────────────────────────────────────
export const calificarCancha = async (req, res) => {
    try {
        const canchaId = req.params.id
        const usuarioId = req.user.id
        const { puntuacion, comentario } = req.body

        if (!puntuacion || puntuacion < 1 || puntuacion > 5)
            return res.status(400).json({ message: 'La puntuación debe ser entre 1 y 5' })

        // Verificar que el usuario tenga al menos una reserva confirmada o pendiente en esta cancha
        const reserva = await Reserva.findOne({
            usuario: usuarioId,
            cancha: canchaId,
            estado: { $in: ['confirmada', 'pendiente'] },
        })

        if (!reserva)
            return res.status(403).json({ message: 'Solo puedes calificar canchas que hayas reservado' })

        // upsert: crea o actualiza la calificación del usuario para esta cancha
        await Calificacion.findOneAndUpdate(
            { usuario: usuarioId, cancha: canchaId },
            { puntuacion: Number(puntuacion), comentario: comentario || '' },
            { upsert: true, new: true }
        )

        // Recalcular promedio y total en el documento de la cancha
        const stats = await Calificacion.aggregate([
            { $match: { cancha: new (await import('mongoose')).default.Types.ObjectId(canchaId) } },
            { $group: { _id: null, promedio: { $avg: '$puntuacion' }, total: { $sum: 1 } } }
        ])

        const promedio = stats.length > 0 ? Math.round(stats[0].promedio * 10) / 10 : 0
        const total = stats.length > 0 ? stats[0].total : 0

        await Cancha.findByIdAndUpdate(canchaId, {
            promedioCalificacion: promedio,
            totalCalificaciones: total,
        })

        res.json({ message: 'Calificación guardada', promedio, total })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// ─────────────────────────────────────────────────────────────
// GET /api/canchas/:id/calificaciones — pública
// Devuelve las últimas 10 calificaciones con nombre del usuario
// y si el usuario actual ya calificó esta cancha
// ─────────────────────────────────────────────────────────────
export const getCalificaciones = async (req, res) => {
    try {
        const canchaId = req.params.id

        const calificaciones = await Calificacion.find({ cancha: canchaId })
            .populate('usuario', 'nombre')
            .sort({ createdAt: -1 })
            .limit(10)

        // Si viene un usuario autenticado, informamos su calificación actual
        let miCalificacion = null
        if (req.user) {
            const mia = await Calificacion.findOne({ usuario: req.user.id, cancha: canchaId })
            if (mia) miCalificacion = { puntuacion: mia.puntuacion, comentario: mia.comentario }
        }

        res.json({ calificaciones, miCalificacion })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}