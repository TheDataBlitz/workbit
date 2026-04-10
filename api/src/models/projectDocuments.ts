import * as db from '../db/projectDocuments.js'
import { getProjectById } from '../db/projects.js'
import { coerceAndNormalizeIssueDescription } from '../utils/issueDescriptionLexical.js'

export type ProjectDocumentSummaryApi = {
  id: string
  projectId: string
  title: string
  updatedAt: string | null
  updatedBy: string | null
}

export type ProjectDocumentApi = ProjectDocumentSummaryApi & {
  content: string
  createdAt: string | null
}

function summaryToApi(s: {
  id: string
  projectId: string
  title: string
  updatedAt: string
  updatedBy?: string
}): ProjectDocumentSummaryApi {
  return {
    id: s.id,
    projectId: s.projectId,
    title: s.title,
    updatedAt: s.updatedAt ?? null,
    updatedBy: s.updatedBy ?? null,
  }
}

function fullToApi(d: {
  id: string
  projectId: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
  updatedBy?: string
}): ProjectDocumentApi {
  return {
    ...summaryToApi(d),
    content: d.content,
    createdAt: d.createdAt ?? null,
  }
}

export async function listProjectDocumentsForApi(
  projectId: string
): Promise<ProjectDocumentSummaryApi[]> {
  const project = await getProjectById(projectId)
  if (!project) throw new Error('Project not found')
  const rows = await db.listProjectDocuments(projectId)
  return rows.map(summaryToApi)
}

export async function getProjectDocumentForApi(
  projectId: string,
  documentId: string
): Promise<ProjectDocumentApi> {
  const project = await getProjectById(projectId)
  if (!project) throw new Error('Project not found')
  const doc = await db.getProjectDocument(projectId, documentId)
  if (!doc) throw new Error('Document not found')
  return fullToApi(doc)
}

export async function createProjectDocumentForApi(input: {
  projectId: string
  title: string
  content: string
  updatedBy?: string
}): Promise<ProjectDocumentApi> {
  const project = await getProjectById(input.projectId)
  if (!project) throw new Error('Project not found')
  const content =
    coerceAndNormalizeIssueDescription(input.content) ?? input.content
  const created = await db.insertProjectDocument({ ...input, content })
  return fullToApi(created)
}

export async function updateProjectDocumentForApi(input: {
  projectId: string
  documentId: string
  title?: string
  content?: string
  updatedBy?: string
}): Promise<ProjectDocumentApi> {
  const project = await getProjectById(input.projectId)
  if (!project) throw new Error('Project not found')
  const content =
    input.content !== undefined
      ? (coerceAndNormalizeIssueDescription(input.content) ?? input.content)
      : undefined
  const updated = await db.updateProjectDocument({ ...input, content })
  if (!updated) throw new Error('Document not found')
  return fullToApi(updated)
}
