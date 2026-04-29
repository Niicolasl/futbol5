import mongoose from 'mongoose'

const reservaSchema = new mongoose.Schema({
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    cancha: { type: mongoose.Schema.Types.ObjectId, ref: 'Cancha', required: true },
    fecha: { type: Date, required: true },
    horaInicio: { type: String, required: true },
    horaFin: { type: String, required: true },
    cantidadHoras: { type: Number, required: true, min: 1, max: 6 },
    nombreContacto: { type: String, required: true, trim: true },
    telefono: { type: String, required: true, trim: true },
    estado: { type: String, enum: ['pendiente', 'confirmada', 'cancelada'], default: 'pendiente' },
}, { timestamps: true })

export default mongoose.model('Reserva', reservaSchema)