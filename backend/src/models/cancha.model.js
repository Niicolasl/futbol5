import mongoose from 'mongoose'

const canchaSchema = new mongoose.Schema({
    nombre: { type: String, required: true, trim: true },
    descripcion: { type: String, trim: true },
    precio: { type: Number, required: true },
    disponible: { type: Boolean, default: true },
    imagen: { type: String, default: '' },
}, { timestamps: true })

export default mongoose.model('Cancha', canchaSchema)