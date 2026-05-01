import { Router } from 'express'
import {
    register, login, logout, profile,
    updatePerfil, changePassword, getMisStats, deleteCuenta,
} from '../controllers/auth.controller.js'
import { authRequired } from '../middlewares/validateToken.js'
import { validateSchema } from '../middlewares/validator.middleware.js'
import { registerSchema, loginSchema, updatePerfilSchema, changePasswordSchema } from '../schemas/auth.schema.js'

const router = Router()

router.post('/auth/register', validateSchema(registerSchema), register)
router.post('/auth/login', validateSchema(loginSchema), login)
router.post('/auth/logout', logout)
router.get('/auth/profile', authRequired, profile)

// Perfil
router.put('/auth/perfil', authRequired, validateSchema(updatePerfilSchema), updatePerfil)
router.put('/auth/cambiar-password', authRequired, validateSchema(changePasswordSchema), changePassword)
router.get('/auth/mis-stats', authRequired, getMisStats)
router.delete('/auth/cuenta', authRequired, deleteCuenta)

export default router