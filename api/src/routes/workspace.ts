import { Router } from 'express'
import * as ctrl from '../controllers/workspaceController.js'

export const workspaceRoutes = Router()

workspaceRoutes.get('/projects', ctrl.getProjects)
workspaceRoutes.post('/projects', ctrl.createProject)
workspaceRoutes.get('/members', ctrl.getMembers)
workspaceRoutes.post('/members', ctrl.createMember)
workspaceRoutes.patch('/members/:memberId', ctrl.updateMember)
workspaceRoutes.post('/members/invite', ctrl.inviteMember)
workspaceRoutes.post('/members/:memberId/provision', ctrl.provisionMember)
