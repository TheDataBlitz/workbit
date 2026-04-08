import { Router } from 'express'
import * as ctrl from '../controllers/workspaceMcpToolsController.js'

export const workspaceMcpToolsRoutes = Router({ mergeParams: true })

workspaceMcpToolsRoutes.get('/', ctrl.listTools)
workspaceMcpToolsRoutes.put('/:toolKey', ctrl.setTool)
workspaceMcpToolsRoutes.post('/:toolKey/test', ctrl.testTool)
