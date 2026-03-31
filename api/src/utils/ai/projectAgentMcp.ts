import { PROJECT_AGENT_SYSTEM_PROMPT } from '../../agents/project_agent.js'
import type { WorkbitUpstreamAuth } from '../../middleware/auth.js'
import { runMcpLlmLoop } from './mcpLlmLoop.js'
import { nvidiaOpenAiChatCompletion } from './nvedia.js'

/** Tools the project agent may use (project, issues, decisions, status update). */
export const PROJECT_AGENT_TOOL_ALLOWLIST = [
  'getProject',
  'getIssuesByProject',
  'getIssue',
  'getProjectDecisions',
  'updateProjectDecision',
  'createProjectDecision',
  'updateIssue',
  'createSubIssue',
  'createIssue',
  'getProjectStatusUpdates',
  'getProjectStatusComment',
  'getProjectStatusUpdateComments',
  'createProjectStatusUpdateComment',
  'createProjectStatusUpdate',
] as const

const DEFAULT_AGENT_MAX_ROUNDS = 36

const PLANNER_SYSTEM_PROMPT = `You are a planning assistant for Workbit. You do NOT call tools. You only output a clear numbered plan (markdown or plain text) that a separate worker will execute using Workbit tools (getProject, getIssuesByProject, getIssue, getProjectDecisions, updateProjectDecision, updateIssue, createSubIssue, createIssue, getProjectStatusUpdates, getProjectStatusComment, getProjectStatusUpdateComments, createProjectStatusUpdateComment, createProjectDecision, createProjectStatusUpdate).

The plan must:
- Reference the project by ID.
- Be ordered: observe state first (including decisions, updates/comments), then propose specific edits or new issues/sub-issues.
- Include steps to observe project status updates and their comments where relevant.
- Include a step to inspect relevant issues with getIssue and use both title + description as planning inputs.
- Include a step to record user-facing decision callouts using createProjectDecision when needed.
- When the user provides a pasted report/snapshot/spec as input, the plan must explicitly translate it into a concrete issue tree (action items, not summary). Use a strict two-phase creation plan:
  Phase 1: create all parent issues first (createIssue, no parentIssueId).
  Phase 2: create sub-issues per parent (createSubIssue), finishing one parent before moving to the next.
- For each issue/sub-issue you plan to create, include the exact title and a concrete description with sections:
  Insight, Action, Expected impact metric, Acceptance criteria, Instrumentation/data needed, Timebox.
- Include a final step to create one project status update summarizing overall changes made during execution.
- Use no placeholder IDs; say "use id from getIssuesByProject" where needed.`

const WORKER_AFTER_PLAN_SYSTEM_PROMPT = `You are a Workbit project worker. Execute the numbered plan from the user message using MCP tools only for the given project. One tool per turn. Use real issue and project IDs from tool results.

Hard rules:
- Before modifying an issue or adding sub-issues under a parent, call getIssue and consider both title and description.
- Prefer createSubIssue for work under an existing parent issue.
- Respect existing project decisions while executing.
- Every createIssue/createSubIssue call must include a non-empty description.
- For bulk trees, follow the strict two-phase workflow: create all parents first, then create sub-issues per parent; do not interleave.

Use createProjectDecision for key decisions the user must make and createProjectStatusUpdate for user-facing progress summaries. Read and use relevant project updates/comments using getProjectStatusUpdates, getProjectStatusUpdateComments, getProjectStatusComment, and createProjectStatusUpdateComment when needed. When the plan is done or blocked, reply with a concise summary.`

export type AgentRunMode = 'auto' | 'single' | 'planner_worker'

export type RunProjectAgentOptions = {
  projectId: string
  instructions?: string
  maxRounds?: number
  mode?: AgentRunMode
}

export type RunProjectAgentResult = {
  summary: string
  finishedReason: 'max_rounds' | 'model_done' | 'empty_reply' | 'no_message'
  mode: AgentRunMode
  plan?: string
}

function looksLikePastedReportOrSnapshot(text: string): boolean {
  const t = text.trim()
  if (t.length < 280) return false
  const lower = t.toLowerCase()
  // Common markers for pasted reports/snapshots/spec-like blobs.
  if (lower.includes('generated on:')) return true
  if (lower.includes('---') && lower.includes('overview')) return true
  if (lower.includes('snapshot') && lower.includes('period')) return true
  if (
    /\b(revenue|orders|aov|avg order value|growth|segmentation)\b/.test(lower)
  )
    return true
  // Dense bullet lists often indicate “paste-to-structure”.
  const bulletLines = t.split('\n').filter((l) => /^\s*[-*]\s+/.test(l))
  if (bulletLines.length >= 8) return true
  return false
}

function buildInitialUserMessage(
  projectId: string,
  instructions?: string
): string {
  const trimmedInstructions = instructions?.trim()
  const extra = trimmedInstructions
    ? `User-provided input (treat as authoritative; convert into concrete action items):\n${trimmedInstructions}\n\n`
    : `No additional instructions were provided.
Run in autonomous mode for this project: after loading context, execute sensible issue/sub-issue actions that move the project forward.\n\n`
  return `Project ID: ${projectId}

${extra}Your workflow:
1) Call getProject with projectId "${projectId}".
2) Call getIssuesByProject with projectId "${projectId}".
3) Call getProjectDecisions with projectId "${projectId}" and consider all listed decisions as constraints.
4) From getProject, identify teamId and call getProjectStatusUpdates; inspect related comments with getProjectStatusUpdateComments and getProjectStatusComment when useful for context.
5) Before planning changes for a specific issue or parent issue, call getIssue and read both title and description (including sub-issue context if present).
6) Carry out changes that match the project goal and any additional instructions, using one tool per turn.
7) Use createProjectDecision or updateProjectDecision to record/refine key decisions the user must make during execution when needed.
8) For creation-focused work, consider creating the right artifacts: issues/sub-issues and decision records where appropriate.
9) If context gaps remain in existing updates, add clarifying notes with createProjectStatusUpdateComment.
10) Create one project status update using createProjectStatusUpdate. Include:
   - Completed actions
   - Current state after changes
   - Next actions
11) Finish with a brief summary of what you did or why you stopped.`
}

export async function runProjectAgent(
  auth: WorkbitUpstreamAuth,
  options: RunProjectAgentOptions
): Promise<RunProjectAgentResult> {
  const projectId = options.projectId.trim()
  const instructionsTrimmed = options.instructions?.trim() ?? ''
  const mode: AgentRunMode =
    options.mode ??
    (instructionsTrimmed && looksLikePastedReportOrSnapshot(instructionsTrimmed)
      ? 'planner_worker'
      : 'single')
  const maxRounds = options.maxRounds ?? DEFAULT_AGENT_MAX_ROUNDS
  const effectiveMode =
    mode === 'auto'
      ? instructionsTrimmed &&
        looksLikePastedReportOrSnapshot(instructionsTrimmed)
        ? 'planner_worker'
        : 'single'
      : mode

  if (effectiveMode === 'planner_worker') {
    const planUser = `Project ID: ${projectId}

${instructionsTrimmed ? `Goal / input:\n${instructionsTrimmed}\n\n` : ''}Produce a numbered plan for improving or maintaining this project using Workbit issues and sub-issues. If the user pasted a report/snapshot/spec, translate it into concrete action items with measurable acceptance criteria. The worker can only call tools; do not assume hidden state.`

    const planCompletion = await nvidiaOpenAiChatCompletion({
      messages: [
        { role: 'system', content: PLANNER_SYSTEM_PROMPT },
        { role: 'user', content: planUser },
      ],
    })

    const planMsg = planCompletion.choices?.[0]?.message
    const planText =
      typeof planMsg?.content === 'string' ? planMsg.content.trim() : ''
    if (!planText) {
      return {
        summary: 'Planner returned no plan text.',
        finishedReason: 'no_message',
        mode,
      }
    }

    const workerUser = `Project ID: ${projectId}

Execute this plan using tools. One tool per turn.

---
${planText}
---`

    const workerResult = await runMcpLlmLoop({
      auth,
      systemPrompt: WORKER_AFTER_PLAN_SYSTEM_PROMPT,
      initialUserMessage: workerUser,
      toolNameAllowlist: [...PROJECT_AGENT_TOOL_ALLOWLIST],
      maxRounds,
      enableChatNudges: false,
    })

    return {
      summary: workerResult.text,
      finishedReason: workerResult.finishedReason,
      mode: effectiveMode,
      plan: planText,
    }
  }

  const result = await runMcpLlmLoop({
    auth,
    systemPrompt: PROJECT_AGENT_SYSTEM_PROMPT,
    initialUserMessage: buildInitialUserMessage(
      projectId,
      instructionsTrimmed || undefined
    ),
    toolNameAllowlist: [...PROJECT_AGENT_TOOL_ALLOWLIST],
    maxRounds,
    enableChatNudges: false,
  })

  return {
    summary: result.text,
    finishedReason: result.finishedReason,
    mode: effectiveMode,
  }
}
