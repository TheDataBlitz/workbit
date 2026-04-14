import { Router } from 'express'
import * as ctrl from '../controllers/usageController.js'

export const usageRoutes = Router()

usageRoutes.get('/ai-tooling-rounds', ctrl.getAiToolingRounds)
