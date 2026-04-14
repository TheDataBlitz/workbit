import { z } from 'zod'

export const ProjectId = z
  .string()
  .min(1)
  .describe('Project id. If unknown: call `getProject` and match by name.')
export const TeamId = z
  .string()
  .min(1)
  .describe('Team id. If unknown: call `teamMembers` or `getProject`.')
export const IssueId = z
  .string()
  .min(1)
  .describe('Issue id. If unknown: call `getIssue` (or list issues first).')
export const MemberId = z
  .string()
  .min(1)
  .describe('Member id. If unknown: call `teamMembers`.')
export const DecisionId = z
  .string()
  .min(1)
  .describe('Decision id. If unknown: call `getDecision` (or list decisions).')
export const DocumentId = z
  .string()
  .min(1)
  .describe('Document id. If unknown: call `getProjectDocuments`.')

export const DecisionType = z.enum(['major', 'minor'])
export const DecisionStatus = z.enum([
  'proposed',
  'approved',
  'rejected',
  'superseded',
])

export const ProjectHealthStatus = z.enum(['on-track', 'at-risk', 'off-track'])
