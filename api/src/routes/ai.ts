import { Router } from 'express'
import * as ctrl from '../controllers/aiController.js'

export const aiRoutes = Router()

aiRoutes.post('/', ctrl.postAi)
aiRoutes.get('/mcp-app-resource', ctrl.getMcpAppResource)
aiRoutes.post('/mcp-app-call-tool', ctrl.postMcpAppCallTool)
