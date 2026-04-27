import type { Issue, IssueComment } from './types.js'
import { GoogleGenAI } from '@google/genai'
import { generateId } from './store.js'
import * as db from '../db/issues.js'
import * as dbIssueComments from '../db/issueComments.js'
import { getMemberById } from '../db/members.js'
import { getProjectById } from '../db/projects.js'

export type IssueListItemApi = {
  id: string
  title: string
  assignee: { id: string; name: string } | null
  date: string
  status: string
  parentIssueId: string | null
  subIssueCount: number
}

export type SubIssueApi = {
  id: string
  title: string
  status: string
  date: string
}

export type GeneratedSubIssueDraft = {
  title: string
  description?: string
}

export type IssueDetailApi = {
  id: string
  title: string
  description?: string
  assignee: { id: string; name: string } | null
  date: string
  status: string
  project: { id: string; name: string } | null
  parentIssueId?: string
}

export async function getProjectIssues(
  projectId: string,
  filter?: 'all' | 'active' | 'backlog'
): Promise<Issue[]> {
  return db.getIssuesByProjectId(projectId, filter)
}

export async function getSubIssues(parentIssueId: string): Promise<Issue[]> {
  return db.getIssuesByParentIssueId(parentIssueId)
}

export async function getSubIssuesForApi(
  parentIssueId: string
): Promise<SubIssueApi[]> {
  const issues = await getSubIssues(parentIssueId)
  return issues.map((i) => ({
    id: i.id,
    title: i.title,
    status: i.status,
    date: i.date,
  }))
}

const DEFAULT_MODEL = 'gemini-2.0-flash'

export async function generateSubIssuesDraftForIssue(
  issueId: string
): Promise<GeneratedSubIssueDraft[]> {
  const issue = await getIssueById(issueId)
  if (!issue) throw new Error('Issue not found')

  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY ?? ''
  if (!apiKey.trim()) {
    throw new Error('GEMINI_API_KEY (or GOOGLE_API_KEY) is required')
  }

  const ai = new GoogleGenAI({ apiKey })
  const prompt = `Break down the following issue into 4 to 8 actionable sub-issues.
Return ONLY valid JSON in this shape:
{"subIssues":[{"title":"string","description":"string"}]}

Issue:
- id: ${issue.id}
- title: ${issue.title}
- description: ${issue.description ?? ''}
- status: ${issue.status}

Rules:
- Keep each title short and actionable.
- description is optional, max 1 short sentence.
- No markdown, no code fences, JSON only.`

  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL ?? DEFAULT_MODEL,
    contents: prompt,
  })

  const raw = response.text?.trim() ?? ''
  if (!raw) throw new Error('AI returned an empty response')

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('AI returned invalid JSON')
  }

  const obj = parsed as {
    subIssues?: Array<{ title?: string; description?: string }>
  }
  const items = Array.isArray(obj.subIssues) ? obj.subIssues : []
  const normalized = items
    .map((it) => ({
      title: (it.title ?? '').trim(),
      description: (it.description ?? '').trim() || undefined,
    }))
    .filter((it) => it.title.length > 0)

  if (normalized.length === 0) {
    throw new Error('AI did not return valid sub-issues')
  }

  return normalized
}

export async function updateIssue(
  issueId: string,
  patch: Partial<
    Pick<
      Issue,
      | 'status'
      | 'assigneeId'
      | 'assigneeName'
      | 'projectId'
      | 'description'
      | 'parentIssueId'
    >
  >
): Promise<Issue | null> {
  return db.updateIssue(issueId, patch)
}

export async function getIssueById(issueId: string): Promise<Issue | null> {
  return db.getIssueById(issueId)
}

export async function getIssueComments(
  issueId: string
): Promise<IssueComment[]> {
  return dbIssueComments.getIssueCommentsByIssueId(issueId)
}

export async function addIssueComment(
  issueId: string,
  content: string,
  author: { name: string; avatarSrc?: string },
  options?: { parentCommentId?: string | null }
): Promise<IssueComment> {
  const issue = await db.getIssueById(issueId)
  if (!issue) throw new Error('Issue not found')
  const parentCommentId = options?.parentCommentId ?? null
  if (parentCommentId) {
    const parent = await dbIssueComments.getIssueCommentById(parentCommentId)
    if (!parent || parent.entityId !== issueId) {
      throw new Error('Parent comment not found')
    }
  }
  const comment: IssueComment = {
    id: generateId(),
    entityId: issueId,
    authorName: author.name,
    authorAvatarSrc: author.avatarSrc,
    content,
    createdAt: new Date().toISOString(),
    parentCommentId,
    likes: 0,
    mentionAuthorIds: [],
    commentOptions: { hideReplies: false, hideLikes: false },
  }
  await dbIssueComments.insertIssueComment(comment)
  return comment
}

/** Two letters from name: first + last (e.g. "Project" -> "PT", "Team" -> "TM"). Single char doubled; empty -> "IS". */
function prefixFromName(name: string): string {
  const s = (name || '').trim().toUpperCase()
  if (s.length === 0) return 'IS'
  if (s.length === 1) return s + s
  return s[0] + s[s.length - 1]
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Get the next issue id for the given project: NN-PP (e.g. 01-PJ). Finds last issue with same prefix in that project and uses counter + 1. */
export async function getNextIssueId(
  projectId?: string | null,
): Promise<string> {
  let prefix: string
  let existingIssues: Issue[]

  if (projectId != null && projectId !== '') {
    const project = await getProjectById(projectId)
    prefix = prefixFromName(project?.name ?? 'Project')
    existingIssues = await db.getIssuesByProjectId(projectId)
  } else {
    prefix = 'IS'
    existingIssues = []
  }

  const pattern = new RegExp(`^(\\d+)-${escapeRegex(prefix)}$`, 'i')
  let maxCounter = 0
  for (const issue of existingIssues) {
    const m = issue.id.match(pattern)
    if (m) {
      const n = parseInt(m[1], 10)
      if (n > maxCounter) maxCounter = n
    }
  }
  const nextCounter = maxCounter + 1
  const counterStr = String(nextCounter).padStart(2, '0')
  return `${counterStr}-${prefix}`
}

/** Next id after a duplicate insert (e.g. "05-WT" -> "06-WT"). Does not rely on re-listing issues—avoids stale reads returning the same candidate. */
function bumpIssueIdAfterDuplicate(currentId: string): string | null {
  const m = currentId.match(/^(\d+)-(.+)$/i)
  if (!m) return null
  const n = parseInt(m[1], 10)
  if (!Number.isFinite(n) || n < 0) return null
  const suffix = m[2]
  const next = n + 1
  const counterStr = String(next).padStart(2, '0')
  return `${counterStr}-${suffix}`
}

const ISSUE_ID_ALLOCATION_MAX_ATTEMPTS = 256

function isPrimaryKeyDuplicateError(err: unknown): boolean {
  if (err && typeof err === 'object' && 'code' in err) {
    const code = (err as { code: string }).code
    if (code === '23505') return true
  }
  const msg =
    err instanceof Error
      ? err.message
      : err && typeof err === 'object' && 'message' in err
        ? String((err as { message: unknown }).message)
        : String(err)
  return (
    msg.includes('duplicate key') ||
    msg.includes('issues_pkey') ||
    msg.includes('unique constraint')
  )
}

export async function createIssue(input: {
  title: string
  projectId?: string
  assigneeId?: string
  status?: string
  description?: string
  parentIssueId?: string
}): Promise<Issue> {
  if (!input.projectId || input.projectId.trim() === '') {
    throw new Error('projectId is required')
  }
  const project = await getProjectById(input.projectId)
  if (!project) throw new Error('Project not found: ' + input.projectId)

  let lastErr: unknown
  let id = await getNextIssueId(input.projectId)
  for (let attempt = 0; attempt < ISSUE_ID_ALLOCATION_MAX_ATTEMPTS; attempt++) {
    const issue: Issue = {
      id,
      title: input.title,
      projectId: input.projectId,
      assigneeId: input.assigneeId,
      status: input.status ?? 'todo',
      date: new Date().toISOString(),
      description: input.description,
      parentIssueId: input.parentIssueId,
    }
    try {
      await db.insertIssue(issue)
      return issue
    } catch (e) {
      lastErr = e
      if (!isPrimaryKeyDuplicateError(e)) throw e
      const bumped = bumpIssueIdAfterDuplicate(id)
      id = bumped ?? (await getNextIssueId(input.projectId))
    }
  }
  throw lastErr instanceof Error
    ? lastErr
    : new Error('Could not allocate a unique issue id after concurrent creates')
}

export async function getProjectIssuesForApi(
  projectId: string,
  filter?: 'all' | 'active' | 'backlog'
): Promise<IssueListItemApi[]> {
  const issues = await getProjectIssues(projectId, filter)
  const subCounts = await db.countDirectSubIssuesByParentIds(
    issues.map((i) => i.id)
  )
  return Promise.all(
    issues.map(async (i) => {
      const assignee = i.assigneeId ? await getMemberById(i.assigneeId) : null
      return {
        id: i.id,
        title: i.title,
        description: i.description,
        assignee: assignee
          ? { id: assignee.id, name: assignee.name }
          : i.assigneeName
            ? { id: '', name: i.assigneeName }
            : null,
        date: i.date,
        status: i.status,
        parentIssueId: i.parentIssueId ?? null,
        subIssueCount: subCounts[i.id] ?? 0,
      }
    })
  )
}

export async function getIssueDetailForApi(
  issueId: string
): Promise<IssueDetailApi | null> {
  const issue = await getIssueById(issueId)
  if (!issue) return null
  const [assignee, project] = await Promise.all([
    issue.assigneeId ? getMemberById(issue.assigneeId) : null,
    issue.projectId ? getProjectById(issue.projectId) : null,
  ])
  return {
    id: issue.id,
    title: issue.title,
    description: issue.description,
    assignee: assignee
      ? { id: assignee.id, name: assignee.name }
      : issue.assigneeName
        ? { id: '', name: issue.assigneeName }
        : null,
    date: issue.date,
    status: issue.status,
    project: project ? { id: project.id, name: project.name } : null,
    parentIssueId: issue.parentIssueId,
  }
}

export async function createIssueForApi(input: {
  projectId: string
  title: string
  description?: string
  status?: string
  parentIssueId?: string
}): Promise<Issue> {
  const projectId = input.projectId?.trim()
  if (!projectId) throw new Error('projectId is required')

  if (input.parentIssueId) {
    const parentIssue = await getIssueById(input.parentIssueId)
    if (!parentIssue) {
      throw new Error('Parent issue not found: ' + input.parentIssueId)
    }
    // Parent-child constraints are enforced by projectId on the issue itself.
  }

  const issue = await createIssue({
    projectId,
    title: input.title.trim(),
    description: input.description,
    status: input.status,
    parentIssueId: input.parentIssueId,
  })
  return issue
}

export async function updateIssueForApi(
  issueId: string,
  patch: {
    status?: string
    assigneeId?: string
    assigneeName?: string
    projectId?: string | null
    description?: string
    parentIssueId?: string | null
  }
): Promise<IssueDetailApi | null> {
  const existing = await getIssueById(issueId)
  if (!existing) return null
  let projectId: string | undefined | null = patch.projectId
  if (projectId !== undefined) {
    if (projectId != null && projectId !== '') {
      const project = await getProjectById(projectId)
      if (!project) throw new Error('Project not found: ' + projectId)
    } else {
      projectId = undefined
    }
  }
  const updatePayload: Partial<
    Pick<
      Issue,
      | 'status'
      | 'assigneeId'
      | 'assigneeName'
      | 'projectId'
      | 'description'
      | 'parentIssueId'
    >
  > = {
    ...(patch.status !== undefined && { status: patch.status }),
    ...(patch.assigneeId !== undefined && { assigneeId: patch.assigneeId }),
    ...(patch.assigneeName !== undefined && {
      assigneeName: patch.assigneeName,
    }),
    ...(projectId !== undefined && { projectId: projectId ?? undefined }),
    ...(patch.description !== undefined && { description: patch.description }),
    ...(patch.parentIssueId !== undefined && {
      parentIssueId: patch.parentIssueId ?? undefined,
    }),
  }
  const issue = await updateIssue(issueId, updatePayload)
  if (!issue) return null
  return getIssueDetailForApi(issue.id)
}
