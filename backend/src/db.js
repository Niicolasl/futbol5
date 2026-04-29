import mongoose from 'mongoose'

export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI)
        console.log('Base de datos está conectada')
    } catch (error) {
        console.log(error)
    }
}