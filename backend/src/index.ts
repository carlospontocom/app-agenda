import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'
import { testConnection } from './database'
import authRoutes from './routes/auth'
import appointmentRoutes from './routes/appointments'
import profileRoutes from './routes/profile'
import adminRoutes from './routes/admin'

dotenv.config()

const app = express()
const PORT = Number(process.env.PORT) || 3000

// Middleware
app.use(cors())
app.use(express.json())

// Swagger
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Agendamento Bancário API',
    version: '1.0.0',
    description: 'API REST do sistema de agendamento de serviços bancários',
    contact: {
      name: 'Suporte',
      email: 'suporte@agendabancaria.com.br'
    }
  },
  servers: [
    { url: `http://localhost:${PORT}`, description: 'Servidor de desenvolvimento' },
    { url: 'https://agenda-api.onrender.com', description: 'Produção (Render)' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  }
}

const swaggerSpec = swaggerJsdoc({
  swaggerDefinition,
  apis: ['./src/routes/*.ts']
})

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Agendamento Bancário - API Docs'
}))

// JSON endpoint for swagger spec
app.get('/api/docs.json', (_req, res) => {
  res.json(swaggerSpec)
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/appointments', appointmentRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/admin', adminRoutes)

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Start
async function start() {
  try {
    await testConnection()
    app.listen(PORT, () => {
      console.log(`\n========================================`)
      console.log(`  API rodando em http://localhost:${PORT}`)
      console.log(`  Swagger UI: http://localhost:${PORT}/api/docs`)
      console.log(`========================================\n`)
    })
  } catch (err) {
    console.error('Erro ao conectar no banco:', err)
    console.log('Iniciando servidor sem banco de dados...')
    app.listen(PORT, () => {
      console.log(`\n========================================`)
      console.log(`  API rodando em http://localhost:${PORT}`)
      console.log(`  Swagger UI: http://localhost:${PORT}/api/docs`)
      console.log(`  ⚠ Sem conexão com o banco de dados`)
      console.log(`========================================\n`)
    })
  }
}

start()
