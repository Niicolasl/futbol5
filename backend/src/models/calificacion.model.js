import mongoose from 'mongoose'

const calificacionSchema = new mongoose.Schema({
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    cancha: { type: mongoose.Schema.Types.ObjectId, ref: 'Cancha', required: true },
    puntuacion: { type: Number, required: true, min: 1, max: 5 },
    comentario: { type: String, trim: true, default: '' },
}, { timestamps: true })

// Un usuario solo puede calificar una cancha una vez
calificacionSchema.index({ usuario: 1, cancha: 1 }, { unique: true })

export default mongoose.model('Calificacion', calificacionSchema)