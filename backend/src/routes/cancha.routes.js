import { Router } from 'express'
import { getCanchas, getCancha, createCancha, updateCancha, deleteCancha, calificarCancha, getCalificaciones } from '../controllers/cancha.controller.js'
import { authRequired } from '../middlewares/validateToken.js'
import { isAdmin } from '../middlewares/isAdmin.js'

const router = Router()

// Rutas públicas
router.get('/canchas', getCanchas)
router.get('/canchas/:id', getCancha)

// Calificaciones — GET público (con info opcional del usuario), POST requiere auth
router.get('/canchas/:id/calificaciones', getCalificaciones)
router.post('/canchas/:id/calificar', authRequired, calificarCancha)

// Solo admin
router.post('/canchas', authRequired, isAdmin, createCancha)
router.put('/canchas/:id', authRequired, isAdmin, updateCancha)
router.delete('/canchas/:id', authRequired, isAdmin, deleteCancha)

export default router