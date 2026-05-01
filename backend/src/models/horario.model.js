import mongoose from 'mongoose'

const diaSchema = new mongoose.Schema({
    activo: { type: Boolean, default: true },
    horaApertura: { type: String, default: '06:00' },
    horaCierre: { type: String, default: '22:00' },
}, { _id: false })

// Un único documento guarda los horarios de los 7 días.
// Se crea automáticamente con defaults si no existe.
const horarioSchema = new mongoose.Schema({
    lunes: { type: diaSchema, default: () => ({}) },
    martes: { type: diaSchema, default: () => ({}) },
    miercoles: { type: diaSchema, default: () => ({}) },
    jueves: { type: diaSchema, default: () => ({}) },
    viernes: { type: diaSchema, default: () => ({}) },
    sabado: { type: diaSchema, default: () => ({}) },
    domingo: { type: diaSchema, default: () => ({}) },
}, { timestamps: true })

export default mongoose.model('Horario', horarioSchema)