import { z } from 'zod'

export const registerSchema = z.object({
    nombre: z.string({ required_error: 'El nombre es obligatorio' }),
    email: z.string({ required_error: 'El email es obligatorio' })
        .refine((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), {
            message: 'Email no válido',
        }),
    password: z.string({ required_error: 'La contraseña es obligatoria' })
        .min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
})

export const loginSchema = z.object({
    email: z.string({ required_error: 'El email es obligatorio' })
        .refine((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), {
            message: 'Email no válido',
        }),
    password: z.string({ required_error: 'La contraseña es obligatoria' })
        .min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
})