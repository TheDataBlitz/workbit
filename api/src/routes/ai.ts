import { Router } from 'express'
import * as ctrl from '../controllers/aiController.js'

export const aiRoutes = Router()

aiRoutes.post('/', ctrl.postAi)
