import cookieParser from 'cookie-parser'
import cors from 'cors'
import express, { Application, Request, Response } from 'express'
import httpStatus from "http-status"
import config from './app/config'
import { AuthRoutes } from './app/module/auth/auth.route'
import { notFound } from './app/middleware/notFound'
import { globalErrorHandler } from './app/middleware/globalErrorHandler'
import { emergencyRequestRouter } from './app/module/emergencyRequest/emergencyRequest.route'
import { serviceTypeRouter } from './app/module/serviceType/serviceType.route'

const app: Application = express()

app.use(
    cors({
        origin: config.frontend_url,
        credentials: true,
    }),
)

// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }))

// Middleware to parse JSON bodies
app.use(express.json())
app.use(cookieParser())


app.use("/api/v1/auth",AuthRoutes)
app.use('/api/v1/emergency-requests',emergencyRequestRouter)
app.use('/api/v1/service-type',serviceTypeRouter)

// Basic route
app.get('/', async (req: Request, res: Response) => {
    res.status(httpStatus.OK).json({
        success: true,
        message: 'Welcome to MediRescue System Backend',
    })
})


app.use(globalErrorHandler)
app.use(notFound)
export default app
