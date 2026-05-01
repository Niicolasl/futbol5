import { Router } from 'express'
import { getHorarios, updateHorarios } from '../controllers/horario.controller.js'
import { authRequired } from '../middlewares/validateToken.js'
import { isAdmin } from '../middlewares/isAdmin.js'

const router = Router()

router.get('/horarios', getHorarios)
router.put('/horarios', authRequired, isAdmin, updateHorarios)

export default router