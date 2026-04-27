import { Router } from 'express'
import * as ctrl from '../controllers/workspaceController.js'

export const workspacesRoutes = Router()

workspacesRoutes.get('/', ctrl.getWorkspaces)
workspacesRoutes.post('/', ctrl.createWorkspace)
workspacesRoutes.patch('/:workspaceId', ctrl.updateWorkspace)
