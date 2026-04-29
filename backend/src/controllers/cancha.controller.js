import Cancha from '../models/cancha.model.js'

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