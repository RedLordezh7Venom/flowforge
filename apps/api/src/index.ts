import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import websocket from '@fastify/websocket'
import { registerAuth } from './middleware/auth'
import { authRoutes } from './routes/auth'
import { workflowRoutes } from './routes/workflows'
import { executionRoutes } from './routes/executions'
import { projectRoutes } from './routes/projects'
import { credentialRoutes } from './routes/credentials'
import { nodeRoutes } from './routes/nodes'
import { setupWebSocket } from './websocket/handler'
import { registerBuiltinNodes } from '@flowforge/core'

registerBuiltinNodes()

const app = Fastify({ logger: { transport: { target: 'pino-pretty', options: { colorize: true } } } })
const PORT = parseInt(process.env['PORT'] || '3001')
const JWT_SECRET = process.env['JWT_SECRET'] || 'dev-secret-change-me'

async function start() {
  await app.register(cors, { origin: true, credentials: true })
  await app.register(jwt, { secret: JWT_SECRET })
  await app.register(websocket)
  await registerAuth(app)

  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }))

  await app.register(authRoutes)
  await app.register(workflowRoutes)
  await app.register(executionRoutes)
  await app.register(projectRoutes)
  await app.register(credentialRoutes)
  await app.register(nodeRoutes)

  await setupWebSocket(app)

  try {
    await app.listen({ port: PORT, host: '0.0.0.0' })
    console.log('FlowForge API running on port ' + PORT)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
