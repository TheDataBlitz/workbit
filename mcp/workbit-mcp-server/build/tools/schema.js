import { z } from 'zod';
export const ProjectId = z
    .string()
    .min(1)
    .describe('Project id.');
export const WorkspaceId = z
    .string()
    .min(1)
    .describe('Workspace id.');
export const IssueId = z
    .string()
    .min(1)
    .describe('Issue id.');
export const MemberId = z
    .string()
    .min(1)
    .describe('Member id.');
export const DecisionId = z
    .string()
    .min(1)
    .describe('Decision id.');
export const DocumentId = z
    .string()
    .min(1)
    .describe('Document id.');
export const DecisionType = z.enum(['major', 'minor']);
export const DecisionStatus = z.enum([
    'proposed',
    'approved',
    'rejected',
    'superseded',
]);
export const ProjectHealthStatus = z.enum(['on-track', 'at-risk', 'off-track']);
