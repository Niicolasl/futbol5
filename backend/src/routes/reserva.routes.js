import { Router } from 'express'
import { createReserva, getMisReservas, cancelarReserva, getDisponibilidad, getTodasReservas } from '../controllers/reserva.controller.js'
import { authRequired } from '../middlewares/validateToken.js'
import { isAdmin } from '../middlewares/isAdmin.js'
import { validateSchema } from '../middlewares/validator.middleware.js'
import { reservaSchema } from '../schemas/reserva.schema.js'

const router = Router()

// Pública — consultar disponibilidad
router.get('/reservas/disponibilidad', getDisponibilidad)

// Admin — ver todas las reservas del sistema
router.get('/reservas/todas', authRequired, isAdmin, getTodasReservas)

// Usuario autenticado
router.post('/reservas', authRequired, validateSchema(reservaSchema), createReserva)
router.get('/reservas/mis-reservas', authRequired, getMisReservas)
router.delete('/reservas/:id', authRequired, cancelarReserva)

export default router