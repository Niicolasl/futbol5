import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
    nombre:   { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },
    telefono: { type: String, trim: true, default: '' },
    rol:      { type: String, enum: ['usuario', 'admin'], default: 'usuario' },
}, { timestamps: true })

export default mongoose.model('User', userSchema)