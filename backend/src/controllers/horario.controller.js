import Horario from '../models/horario.model.js'

const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']

// GET /api/horarios — público, cualquiera puede consultar los horarios
export const getHorarios = async (req, res) => {
    try {
        let horario = await Horario.findOne()
        if (!horario) {
            horario = await new Horario().save()
        }
        res.json(horario)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// PUT /api/horarios — solo admin, actualiza el documento completo
export const updateHorarios = async (req, res) => {
    try {
        const data = req.body

        // Validar que solo vengan días válidos
        const invalidos = Object.keys(data).filter(k => !DIAS.includes(k))
        if (invalidos.length > 0)
            return res.status(400).json({ message: `Campos inválidos: ${invalidos.join(', ')}` })

        let horario = await Horario.findOne()
        if (!horario) horario = new Horario()

        for (const dia of DIAS) {
            if (data[dia]) {
                if (typeof data[dia].activo === 'boolean')
                    horario[dia].activo = data[dia].activo
                if (data[dia].horaApertura)
                    horario[dia].horaApertura = data[dia].horaApertura
                if (data[dia].horaCierre)
                    horario[dia].horaCierre = data[dia].horaCierre
            }
        }

        await horario.save()
        res.json(horario)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}