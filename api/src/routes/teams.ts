import { Router } from 'express'
import * as teamsCtrl from '../controllers/teamsController.js'
import * as issuesCtrl from '../controllers/issuesController.js'
import * as commentsCtrl from '../controllers/commentsController.js'

export const teamsRoutes = Router()

teamsRoutes.get('/:teamId', teamsCtrl.getTeam)
teamsRoutes.get('/:teamId/members', teamsCtrl.getTeamMembers)
teamsRoutes.get('/:teamId/project', teamsCtrl.getTeamProject)
teamsRoutes.get('/:teamId/project/issues', teamsCtrl.getTeamProjectIssues)
teamsRoutes.get(
  '/:teamId/project/updates/:updateId/comments',
  commentsCtrl.getStatusUpdateComments
)
teamsRoutes.post('/:teamId/project/updates', teamsCtrl.postStatusUpdate)
teamsRoutes.post(
  '/:teamId/project/updates/:updateId/comments',
  commentsCtrl.postStatusUpdateComment
)
teamsRoutes.patch('/:teamId/project', teamsCtrl.patchProject)
teamsRoutes.get('/:teamId/issues', issuesCtrl.getTeamIssues)
teamsRoutes.post('/:teamId/issues', issuesCtrl.createIssue)
