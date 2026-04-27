import { Router } from 'express'
import * as ctrl from '../controllers/issuesController.js'
import * as decisionsCtrl from '../controllers/decisionsController.js'
import * as projectsCtrl from '../controllers/projectsController.js'
import * as commentsCtrl from '../controllers/commentsController.js'

export const projectRoutes = Router()

projectRoutes.get('/:projectId/documents', projectsCtrl.listProjectDocuments)
projectRoutes.post(
  '/:projectId/documents',
  projectsCtrl.createProjectDocument
)
projectRoutes.get(
  '/:projectId/documents/:documentId',
  projectsCtrl.getProjectDocument
)
projectRoutes.patch(
  '/:projectId/documents/:documentId',
  projectsCtrl.patchProjectDocument
)
projectRoutes.get('/:projectId/issues', ctrl.getProjectIssues)
projectRoutes.get('/:projectId/properties', projectsCtrl.getProjectProperties)
projectRoutes.get(
  '/:projectId/status-updates',
  projectsCtrl.getProjectStatusUpdates
)
projectRoutes.post('/:projectId/status-updates', projectsCtrl.postProjectStatusUpdate)
projectRoutes.get('/:projectId/ai-usage', projectsCtrl.getProjectAiUsage)
projectRoutes.get(
  '/:projectId/status-updates/:updateId/comments',
  commentsCtrl.getStatusUpdateComments
)
projectRoutes.post(
  '/:projectId/status-updates/:updateId/comments',
  commentsCtrl.postStatusUpdateComment
)
projectRoutes.post('/:projectId/lead', projectsCtrl.assignProjectLead)
projectRoutes.get('/:projectId/decisions', decisionsCtrl.listProjectDecisions)
projectRoutes.post('/:projectId/decisions', decisionsCtrl.createProjectDecision)
projectRoutes.patch(
  '/:projectId/decisions/:decisionId',
  decisionsCtrl.updateProjectDecision
)
projectRoutes.delete(
  '/:projectId/decisions/:decisionId',
  decisionsCtrl.deleteProjectDecision
)
projectRoutes.get('/:projectId/agents', projectsCtrl.listProjectAgents)
projectRoutes.post('/:projectId/agents', projectsCtrl.enableProjectAgent)
projectRoutes.delete(
  '/:projectId/agents/:agentKey',
  projectsCtrl.disableProjectAgent
)
projectRoutes.get('/:projectId', projectsCtrl.getProject)
