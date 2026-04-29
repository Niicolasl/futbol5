import express from 'express'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import cors from 'cors'
import { connectDB } from './db.js'

import authRoutes from './routes/auth.routes.js'
import canchaRoutes from './routes/cancha.routes.js'
import reservaRoutes from './routes/reserva.routes.js'

dotenv.config()

const app = express()

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}))
app.use(cookieParser())
app.use(morgan('dev'))
app.use(express.json())

connectDB()

app.use('/api', authRoutes)
app.use('/api', canchaRoutes)
app.use('/api', reservaRoutes)

// Manejo global de errores de Mongoose (IDs malformados, etc.)
app.use((err, req, res, next) => {
    if (err.name === 'CastError')
        return res.status(400).json({ message: 'ID inválido' })
    if (err.name === 'ValidationError')
        return res.status(400).json({ message: err.message })
    console.error(err)
    res.status(500).json({ message: 'Error interno del servidor' })
})

const PORT = process.env.PORT || 5000
app.listen(PORT)
console.log('Servidor corriendo en puerto', PORT)