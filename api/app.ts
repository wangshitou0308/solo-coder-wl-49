import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { getDb } from './db.js'
import authRoutes from './routes/auth.js'
import compostSiteRoutes from './routes/compost-sites.js'
import depositRoutes from './routes/deposits.js'
import monitoringRoutes from './routes/monitoring.js'
import storeRoutes from './routes/store.js'
import statsRoutes from './routes/stats.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/compost-sites', compostSiteRoutes)
app.use('/api/deposits', depositRoutes)
app.use('/api/monitoring', monitoringRoutes)
app.use('/api/store', storeRoutes)
app.use('/api/stats', statsRoutes)

app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', error)
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

getDb().then(() => {
  console.log('Database initialized')
}).catch((err) => {
  console.error('Database initialization failed:', err)
})

export default app
