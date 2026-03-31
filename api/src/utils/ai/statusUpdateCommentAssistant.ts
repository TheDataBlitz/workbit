import type { WorkbitUpstreamAuth } from '../../middleware/auth.js'
import * as teamsModel from '../../models/teams.js'
import * as issuesModel from '../../models/issues.js'
import * as decisionsModel from '../../models/decisions.js'
import { tryLexicalKnifeedgeTransform } from '../lexicalKnifeedge.js'
import { logApiError, logApiWarn } from '../log.js'
import { runChatWithMcp } from './chatMcp.js'

const KNIFEEDGE_PREFIX = '!knifedge'
export const KNIFEEDGE_REPLY_AUTHOR = 'KnifeEdge AI'

export type KnifeedgeCommentResult = {
  visibleCommentContent: string
  aiReplyText?: string
}

export async function prepareKnifeedgeCommentResult(input: {
  auth?: WorkbitUpstreamAuth
  teamId: string
  updateId: string
  content: string
  parentCommentId?: string | null
}): Promise<KnifeedgeCommentResult> {
  const lexicalKnife = tryLexicalKnifeedgeTransform(input.content)
  const trimmedPlain = input.content.trim()
  const shouldInvokeKnifeedge = lexicalKnife
    ? true
    : trimmedPlain.toLowerCase().startsWith(KNIFEEDGE_PREFIX.toLowerCase())
  const knifeedgeMessage = lexicalKnife
    ? lexicalKnife.knifeedgeMessage
    : shouldInvokeKnifeedge
      ? trimmedPlain.slice(KNIFEEDGE_PREFIX.length).trim()
      : ''
  const visibleCommentContent = lexicalKnife
    ? lexicalKnife.visibleSerialized
    : shouldInvokeKnifeedge
      ? knifeedgeMessage
      : input.content

  if (!shouldInvokeKnifeedge || !knifeedgeMessage) {
    return { visibleCommentContent }
  }

  if (!input.auth) {
    logApiWarn('KnifeEdge comment missing auth; skipping AI reply', {
      teamId: input.teamId,
      updateId: input.updateId,
    })
    return { visibleCommentContent }
  }

  if (!process.env.NVIDIA_API_KEY) {
    logApiWarn('KnifeEdge comment skipped; NVIDIA_API_KEY not configured', {
      teamId: input.teamId,
      updateId: input.updateId,
    })
    return { visibleCommentContent }
  }

  try {
    const [teamProject, updateComments] = await Promise.all([
      teamsModel.getTeamProject(input.teamId),
      teamsModel.getStatusUpdateComments(input.updateId),
    ])
    if (!teamProject?.project) {
      return { visibleCommentContent }
    }
    const projectId = teamProject.project.id
    const [issues, decisions] = await Promise.all([
      issuesModel.getProjectIssuesForApi(projectId, 'all'),
      decisionsModel.listDecisionsForApi({
        projectId,
        order: 'desc',
        page: 1,
        pageSize: 15,
      }),
    ])

    const parentCommentId =
      input.parentCommentId == null || input.parentCommentId === ''
        ? null
        : input.parentCommentId
    const parentComment = parentCommentId
      ? (updateComments.find((c) => c.id === parentCommentId) ?? null)
      : null
    const siblingComments = updateComments.filter((c) =>
      parentCommentId
        ? c.parentCommentId === parentCommentId
        : c.parentCommentId == null
    )

    const contextPrompt = `You are replying to a project update comment.
Project context:
- Team: ${teamProject.team.name} (${teamProject.team.id})
- Project ID: ${projectId}
- Project Description: ${teamProject.project.description || 'N/A'}
- Project Status: ${teamProject.project.properties?.status ?? 'N/A'}
- Project Priority: ${teamProject.project.properties?.priority ?? 'N/A'}
- Issues/sub-issues: ${issues.map((i) => `${i.id}: ${i.title} [${i.status}] parent=${i.parentIssueId ?? 'none'} subCount=${i.subIssueCount}`).join(' | ') || 'None'}
- Decisions: ${decisions.items.map((d) => `${d.id}: ${d.title} [${d.status}]`).join(' | ') || 'None'}
- Parent comment context: ${parentComment ? `${parentComment.authorName}: ${parentComment.content}` : 'Top-level update thread'}
- Sibling comments under same parent: ${siblingComments.map((c) => `${c.authorName}: ${c.content}`).join(' | ') || 'None'}
- Full update comment context: ${updateComments.map((c) => `${c.authorName}: ${c.content}`).join(' | ') || 'None'}

User asked:
${knifeedgeMessage}

Respond with a concise, actionable reply grounded in project context, with primary focus on the parent and sibling comment thread.`

    const aiReplyText = (await runChatWithMcp(input.auth, contextPrompt)).trim()
    return { visibleCommentContent, aiReplyText }
  } catch (error) {
    logApiError(
      error,
      'statusUpdateCommentAssistant.prepareKnifeedgeCommentResult',
      {
        teamId: input.teamId,
        updateId: input.updateId,
      }
    )
    return { visibleCommentContent }
  }
}
