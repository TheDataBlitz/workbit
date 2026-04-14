import { Router } from 'express'
import * as ctrl from '../controllers/issuesController.js'
import * as decisionsCtrl from '../controllers/decisionsController.js'
import * as projectDocsCtrl from '../controllers/projectDocumentsController.js'
import * as projectsCtrl from '../controllers/projectsController.js'
import * as projectAgentsCtrl from '../controllers/projectAgentsController.js'

export const projectRoutes = Router()

projectRoutes.get('/:projectId/documents', projectDocsCtrl.listProjectDocuments)
projectRoutes.post(
  '/:projectId/documents',
  projectDocsCtrl.createProjectDocument
)
projectRoutes.get(
  '/:projectId/documents/:documentId',
  projectDocsCtrl.getProjectDocument
)
projectRoutes.patch(
  '/:projectId/documents/:documentId',
  projectDocsCtrl.patchProjectDocument
)
projectRoutes.get('/:projectId/issues', ctrl.getProjectIssues)
projectRoutes.get('/:projectId/properties', projectsCtrl.getProjectProperties)
projectRoutes.get(
  '/:projectId/status-updates',
  projectsCtrl.getProjectStatusUpdates
)
projectRoutes.post(
  '/:projectId/members/from-team',
  projectsCtrl.addTeamMembersToProject
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
projectRoutes.get('/:projectId/agents', projectAgentsCtrl.listProjectAgents)
projectRoutes.post('/:projectId/agents', projectAgentsCtrl.enableProjectAgent)
projectRoutes.delete(
  '/:projectId/agents/:agentKey',
  projectAgentsCtrl.disableProjectAgent
)
projectRoutes.get('/:projectId', projectsCtrl.getProject)
