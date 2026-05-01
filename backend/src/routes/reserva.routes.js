import { Router } from 'express'
import {
    createReserva,
    getMisReservas,
    cancelarReserva,
    getDisponibilidad,
    getTodasReservas,
    editarReservaAdmin,
    cancelarReservaAdmin,
    getReportes,
} from '../controllers/reserva.controller.js'
import { authRequired } from '../middlewares/validateToken.js'
import { isAdmin } from '../middlewares/isAdmin.js'
import { validateSchema } from '../middlewares/validator.middleware.js'
import { reservaSchema } from '../schemas/reserva.schema.js'

const router = Router()

// Pública
router.get('/reservas/disponibilidad', getDisponibilidad)

// Usuario autenticado
router.post('/reservas', authRequired, validateSchema(reservaSchema), createReserva)
router.get('/reservas/mis-reservas', authRequired, getMisReservas)
router.delete('/reservas/:id', authRequired, cancelarReserva)

// Admin
router.get('/reservas/todas', authRequired, isAdmin, getTodasReservas)
router.put('/reservas/:id/admin', authRequired, isAdmin, editarReservaAdmin)
router.delete('/reservas/:id/admin', authRequired, isAdmin, cancelarReservaAdmin)
router.get('/reportes', authRequired, isAdmin, getReportes)

export default router