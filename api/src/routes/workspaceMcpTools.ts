import { Router } from 'express'
import * as ctrl from '../controllers/workspaceController.js'

export const workspaceMcpToolsRoutes = Router({ mergeParams: true })

workspaceMcpToolsRoutes.get('/', ctrl.listWorkspaceMcpTools)
workspaceMcpToolsRoutes.put('/:toolKey', ctrl.setWorkspaceMcpTool)
