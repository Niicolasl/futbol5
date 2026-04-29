// Middleware que se usa DESPUÉS de authRequired.
// authRequired ya verificó el JWT y puso req.user con los datos del token.
// Este middleware solo chequea si ese usuario tiene rol 'admin'.
export const isAdmin = (req, res, next) => {
    if (req.user?.rol !== 'admin')
        return res.status(403).json({ message: 'Acceso denegado: se requiere rol admin' })
    next()
}