import { z } from 'zod'

export const canchaSchema = z.object({
    nombre: z.string({ required_error: 'El nombre es obligatorio' }),
    descripcion: z.string().optional(),
    precio: z.number({ required_error: 'El precio es obligatorio' })
        .positive({ message: 'El precio debe ser mayor a 0' }),
    imagen: z.string().optional(),
})