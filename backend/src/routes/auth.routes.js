import { Router } from 'express'
import { register, login, logout, profile } from '../controllers/auth.controller.js'
import { authRequired } from '../middlewares/validateToken.js'
import { validateSchema } from '../middlewares/validator.middleware.js'
import { registerSchema, loginSchema } from '../schemas/auth.schema.js'
const router = Router()

router.post('/auth/register', validateSchema(registerSchema), register)
router.post('/auth/login', validateSchema(loginSchema), login)
router.post('/auth/logout', logout)
router.get('/auth/profile', authRequired, profile)

export default router