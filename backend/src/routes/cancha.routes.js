import { Router } from 'express'
import { getCanchas, getCancha, createCancha, updateCancha, deleteCancha } from '../controllers/cancha.controller.js'
import { authRequired } from '../middlewares/validateToken.js'
import { isAdmin } from '../middlewares/isAdmin.js'

const router = Router()

// Rutas públicas
router.get('/canchas', getCanchas)
router.get('/canchas/:id', getCancha)

// Rutas solo para admin — authRequired primero (verifica token), luego isAdmin (verifica rol)
router.post('/canchas', authRequired, isAdmin, createCancha)
router.put('/canchas/:id', authRequired, isAdmin, updateCancha)
router.delete('/canchas/:id', authRequired, isAdmin, deleteCancha)

export default router