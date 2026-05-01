import Reserva from '../models/reserva.model.js'
import Cancha from '../models/cancha.model.js'
import User from '../models/user.model.js'

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
            estado: 'confirmada',
            visibleParaUsuario: true,
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
        const reservas = await Reserva.find({
            usuario: req.user.id,
            visibleParaUsuario: true,
        })
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
        reserva.visibleParaUsuario = false
        await reserva.save()
        res.json({ message: 'Reserva cancelada correctamente', reserva })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

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

export const editarReservaAdmin = async (req, res) => {
    try {
        const reserva = await Reserva.findById(req.params.id)
        if (!reserva)
            return res.status(404).json({ message: 'Reserva no encontrada' })

        const { fecha, horaInicio, horaFin, cantidadHoras, estado, canchaId } = req.body

        const nuevaFecha = fecha ? new Date(fecha) : reserva.fecha
        const nuevaInicio = horaInicio || reserva.horaInicio
        const nuevaFin = horaFin || reserva.horaFin
        const nuevaCancha = canchaId || reserva.cancha.toString()

        if (fecha || horaInicio || horaFin || canchaId) {
            const conflicto = await Reserva.findOne({
                _id: { $ne: reserva._id },
                cancha: nuevaCancha,
                fecha: nuevaFecha,
                estado: { $ne: 'cancelada' },
                $or: [{ horaInicio: { $lt: nuevaFin }, horaFin: { $gt: nuevaInicio } }],
            })
            if (conflicto)
                return res.status(400).json({ message: 'Conflicto de horario con otra reserva existente' })
        }

        if (fecha) reserva.fecha = nuevaFecha
        if (horaInicio) reserva.horaInicio = nuevaInicio
        if (horaFin) reserva.horaFin = nuevaFin
        if (cantidadHoras) reserva.cantidadHoras = cantidadHoras
        if (canchaId) reserva.cancha = canchaId
        if (estado) {
            reserva.estado = estado
            reserva.visibleParaUsuario = (estado !== 'cancelada')
        }

        await reserva.save()
        const populated = await reserva.populate([
            { path: 'usuario', select: 'nombre email' },
            { path: 'cancha', select: 'nombre precio' },
        ])
        res.json(populated)
    } catch (error) {
        if (error.name === 'CastError')
            return res.status(400).json({ message: 'ID inválido' })
        res.status(500).json({ message: error.message })
    }
}

export const cancelarReservaAdmin = async (req, res) => {
    try {
        const reserva = await Reserva.findById(req.params.id)
        if (!reserva)
            return res.status(404).json({ message: 'Reserva no encontrada' })

        reserva.estado = 'cancelada'
        reserva.visibleParaUsuario = false
        await reserva.save()
        res.json({ message: 'Reserva cancelada por admin', reserva })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const getReportes = async (req, res) => {
    try {
        const { desde, hasta } = req.query

        const filtroFecha = {}
        if (desde) filtroFecha.$gte = new Date(desde)
        if (hasta) {
            const h = new Date(hasta)
            h.setHours(23, 59, 59, 999)
            filtroFecha.$lte = h
        }
        const matchFecha = (desde || hasta) ? { fecha: filtroFecha } : {}

        const totalUsuarios = await User.countDocuments()

        const reservasPorEstado = await Reserva.aggregate([
            { $match: matchFecha },
            { $group: { _id: '$estado', total: { $sum: 1 } } },
        ])
        const estadoMap = { confirmada: 0, pendiente: 0, cancelada: 0 }
        for (const r of reservasPorEstado) estadoMap[r._id] = r.total

        const ingresosAgg = await Reserva.aggregate([
            { $match: { estado: 'confirmada', ...matchFecha } },
            { $lookup: { from: 'canchas', localField: 'cancha', foreignField: '_id', as: 'canchaData' } },
            { $unwind: '$canchaData' },
            { $group: { _id: null, total: { $sum: { $multiply: ['$canchaData.precio', '$cantidadHoras'] } } } },
        ])
        const ingresos = ingresosAgg[0]?.total || 0

        const canchaTop = await Reserva.aggregate([
            { $match: { estado: { $ne: 'cancelada' }, ...matchFecha } },
            { $group: { _id: '$cancha', total: { $sum: 1 } } },
            { $sort: { total: -1 } },
            { $limit: 1 },
            { $lookup: { from: 'canchas', localField: '_id', foreignField: '_id', as: 'info' } },
            { $unwind: { path: '$info', preserveNullAndEmptyArrays: true } },
        ])

        const ingresosPorCancha = await Reserva.aggregate([
            { $match: { estado: 'confirmada', ...matchFecha } },
            { $lookup: { from: 'canchas', localField: 'cancha', foreignField: '_id', as: 'canchaData' } },
            { $unwind: '$canchaData' },
            {
                $group: {
                    _id: '$canchaData._id',
                    nombre: { $first: '$canchaData.nombre' },
                    reservas: { $sum: 1 },
                    ingresos: { $sum: { $multiply: ['$canchaData.precio', '$cantidadHoras'] } },
                },
            },
            { $sort: { ingresos: -1 } },
        ])

        const ultimasReservas = await Reserva.find(matchFecha)
            .populate('usuario', 'nombre email')
            .populate('cancha', 'nombre precio')
            .sort({ createdAt: -1 })
            .limit(5)

        res.json({
            periodo: { desde: desde || null, hasta: hasta || null },
            totalUsuarios,
            reservas: {
                confirmadas: estadoMap.confirmada,
                pendientes: estadoMap.pendiente,
                canceladas: estadoMap.cancelada,
                total: estadoMap.confirmada + estadoMap.pendiente + estadoMap.cancelada,
            },
            ingresos,
            canchaTopReservada: canchaTop[0]
                ? { nombre: canchaTop[0].info?.nombre || 'Sin nombre', totalReservas: canchaTop[0].total }
                : null,
            ingresosPorCancha,
            ultimasReservas,
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}