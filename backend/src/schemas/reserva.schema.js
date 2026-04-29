import { z } from 'zod'

export const reservaSchema = z.object({
    canchaId: z.string({ required_error: 'La cancha es obligatoria' }),
    fecha: z.string({ required_error: 'La fecha es obligatoria' }),
    horaInicio: z.string({ required_error: 'La hora de inicio es obligatoria' }),
    horaFin: z.string({ required_error: 'La hora de fin es obligatoria' }),
    cantidadHoras: z.number({ required_error: 'La cantidad de horas es obligatoria' }).min(1).max(6),
    nombreContacto: z.string({ required_error: 'El nombre es obligatorio' }).min(2, 'Mínimo 2 caracteres'),
    telefono: z.string({ required_error: 'El teléfono es obligatorio' }).min(7, 'Teléfono inválido'),
})