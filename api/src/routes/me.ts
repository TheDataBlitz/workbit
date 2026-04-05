import { Router } from 'express'
import * as ctrl from '../controllers/meController.js'

export const meRoutes = Router()

meRoutes.get('/member', ctrl.getMember)
meRoutes.get('/teams', ctrl.getTeams)
meRoutes.get('/ai-usage', ctrl.getAiUsage)
meRoutes.get('/notifications', ctrl.getNotifications)
