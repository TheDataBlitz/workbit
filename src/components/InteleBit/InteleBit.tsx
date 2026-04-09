import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type FC,
} from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'

import { Alert } from '@thedatablitz/alert'
import { Button } from '@thedatablitz/button'
import { Popup } from '@thedatablitz/popup'

import { Chat } from '@thedatablitz/chat'
import { Text } from '@thedatablitz/text'
import {
  callMcpAppTool,
  getMcpAppResource,
  postAiPrompt,
  type AiChatTurn,
  type PostAiAttachment,
} from '../../api/aiClient'
import { logError } from '../../utils/errorHandling'
import { AppRenderer } from '@mcp-ui/client'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import {
  emitInteleBitClose,
  emitInteleBitOpen,
  type InteleBitOpenDetail,
} from './inteleBitBus'
import { useInteleBitBus } from './useInteleBitBus'
import { InteleBitWelcomeBanner } from './InteleBitWelcomeBanner'
import { MarkdownPreview } from '@thedatablitz/markdown-editor'

type UserTurn = { role: 'user'; content: string }
type AssistantTurn = {
  role: 'assistant'
  content: string
  durationMs: number
  attachments?: PostAiAttachment[]
}
type ChatTurn = UserTurn | AssistantTurn

/** Flex column shell so Chat can flex-1; scroll stays inside Chat.Body, composer stays visible. */
const intePopupPanelStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  maxHeight: 'min(85vh, 560px)',
  minHeight: 0,
  overflow: 'hidden',
  padding: 0,
}

const inteChatFillStyle: CSSProperties = {
  flex: '1 1 0%',
  minHeight: 0,
  minWidth: 0,
}

function getMcpSandboxProxyUrl(): URL {
  const base = import.meta.env.BASE_URL || '/'
  const normalized = base.endsWith('/') ? base : `${base}/`
  return new URL(`${normalized}mcp-sandbox-proxy.html`, window.location.origin)
}

function McpAppAttachmentCard(props: {
  shopId?: string
  projectId: string
  toolName: string
  resourceUri: string
  title?: string
}) {
  const title = props.title?.trim() ? props.title.trim() : 'Interactive app'

  type UiCallToolParams = {
    name: string
    arguments?: Record<string, unknown>
  }

  async function handleCallTool(
    params: UiCallToolParams
  ): Promise<CallToolResult> {
    // Proxy to our API; return as MCP CallToolResult shape expected by AppRenderer.
    const result = await callMcpAppTool({
      shopId: props.shopId,
      projectId: props.projectId,
      toolName: props.toolName,
      name: params.name,
      arguments: params.arguments ?? {},
    })
    return result as CallToolResult
  }
  const q = useQuery({
    queryKey: [
      'mcp-app-resource',
      props.shopId ?? null,
      props.projectId,
      props.toolName,
      props.resourceUri,
    ],
    queryFn: () =>
      getMcpAppResource({
        shopId: props.shopId,
        projectId: props.projectId,
        toolName: props.toolName,
        resourceUri: props.resourceUri,
      }),
    staleTime: 60_000,
  })

  return (
    <div className="mt-3 overflow-hidden rounded-[10px] border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-3 py-2">
        <div className="min-w-0">
          <Text variant="body3">{title}</Text>
          <Text variant="caption2" color="color.text.subtle">
            {props.resourceUri}
          </Text>
        </div>
      </div>
      <div className="h-[360px] w-full bg-white">
        {q.isPending ? (
          <div className="p-3">
            <Text variant="caption2" color="color.text.subtle">
              Loading app…
            </Text>
          </div>
        ) : q.error ? (
          <div className="p-3">
            <Alert
              variant="error"
              placement="inline"
              description={
                q.error instanceof Error ? q.error.message : String(q.error)
              }
            />
          </div>
        ) : (
          <AppRenderer
            toolName="embedded-mcp-app"
            toolResourceUri={props.resourceUri}
            sandbox={{
              url: getMcpSandboxProxyUrl(),
              permissions:
                'allow-scripts allow-forms allow-popups allow-downloads',
            }}
            html={q.data?.html ?? ''}
            onMessage={async () => {
              // Some MCP App SDKs send misc notifications; ignore by default.
              return {}
            }}
            onCallTool={handleCallTool}
            onFallbackRequest={async (req: unknown) => {
              const r = req as { method?: unknown }
              // The embedded app may call additional MCP host methods (resources/list, prompts/list, etc).
              // Log them so we can implement the minimal required proxy surface.
              logError(
                new Error(
                  `Unhandled MCP App request: ${typeof r.method === 'string' ? r.method : ''}`
                ),
                'InteleBit.McpAppAttachmentCard.onFallbackRequest'
              )
              return {}
            }}
            onOpenLink={async ({ url }) => {
              window.open(url, '_blank', 'noopener,noreferrer')
              return {}
            }}
            onError={(e) => {
              logError(e, 'InteleBit.McpAppAttachmentCard')
            }}
          />
        )}
      </div>
    </div>
  )
}

function buildContextualPrompt(
  project: InteleBitOpenDetail,
  userPrompt: string
) {
  const { projectId, projectName } = project
  return projectName
    ? `[Project: ${projectName} (id: ${projectId})]\n\n${userPrompt}`
    : `[Project id: ${projectId}]\n\n${userPrompt}`
}

function InteleBitPanel() {
  const [open, setOpen] = useState(false)
  const [project, setProject] = useState<InteleBitOpenDetail | null>(null)
  const [prompt, setPrompt] = useState('')
  const [turns, setTurns] = useState<ChatTurn[]>([])
  const requestStartedAtRef = useRef<number | null>(null)
  const bodyScrollRef = useRef<HTMLDivElement>(null)

  const askMutation = useMutation({
    mutationFn: (vars: {
      messages: AiChatTurn[]
      projectId: string
      shopId?: string
    }) =>
      postAiPrompt({
        messages: vars.messages,
        projectId: vars.projectId,
        ...(vars.shopId?.trim() ? { shopId: vars.shopId.trim() } : {}),
      }),
    onSuccess: (data) => {
      const start = requestStartedAtRef.current
      requestStartedAtRef.current = null
      const durationMs = start != null ? Math.max(0, Date.now() - start) : 0
      setTurns((t) => [
        ...t,
        {
          role: 'assistant',
          content: data.reply,
          durationMs,
          attachments: data.attachments,
        },
      ])
    },
    onError: (e) => {
      requestStartedAtRef.current = null
      logError(e, 'InteleBit.postAiPrompt')
    },
  })

  const mutationRef = useRef(askMutation)
  mutationRef.current = askMutation

  const sendPending = Boolean(open && project && askMutation.isPending)
  const mutationError =
    open && project
      ? askMutation.error instanceof Error
        ? askMutation.error.message
        : askMutation.error
          ? String(askMutation.error)
          : null
      : null

  const handleBusOpen = useCallback((d: InteleBitOpenDetail) => {
    setProject(d)
    setPrompt('')
    setTurns([])
    mutationRef.current.reset()
    setOpen(true)
  }, [])

  const handleBusClose = useCallback(() => {
    setOpen(false)
    setProject(null)
    setPrompt('')
    setTurns([])
    mutationRef.current.reset()
  }, [])

  useInteleBitBus(handleBusOpen, handleBusClose)

  useLayoutEffect(() => {
    const el = bodyScrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [turns, sendPending, mutationError])

  const handleClose = useCallback(() => {
    emitInteleBitClose()
  }, [])

  const handleSend = useCallback(() => {
    const trimmed = prompt.trim()
    if (!trimmed || !project || askMutation.isPending) return
    const isFirstUserMessage = turns.length === 0
    const userContent = isFirstUserMessage
      ? buildContextualPrompt(project, trimmed)
      : trimmed
    const messages: AiChatTurn[] = [
      ...turns.map((t) => ({
        role: t.role,
        content: t.content,
      })),
      { role: 'user', content: userContent },
    ]
    setTurns((t) => [...t, { role: 'user', content: trimmed }])
    setPrompt('')
    requestStartedAtRef.current = Date.now()
    askMutation.mutate({
      messages,
      projectId: project.projectId,
      ...(project.shopId?.trim() ? { shopId: project.shopId.trim() } : {}),
    })
  }, [askMutation, project, prompt, turns])

  if (!open || !project) {
    return null
  }

  const projectSubtitle =
    project.projectName?.trim() ||
    (project.projectId.length > 12
      ? `${project.projectId.slice(0, 8)}…`
      : project.projectId)

  return (
    <Popup
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleClose()
      }}
      trigger={
        <button
          type="button"
          tabIndex={-1}
          aria-hidden
          className="pointer-events-none size-0 min-h-0 min-w-0 overflow-hidden border-0 p-0 opacity-0"
        />
      }
      placement="top-right"
      offset={16}
      zIndex={10_000}
      width="min(420px, calc(100vw - 2rem))"
      minWidth={280}
      closeOnOutsideClick
      closeOnEscape
      showCloseButton={false}
      style={intePopupPanelStyle}
    >
      <Chat style={inteChatFillStyle}>
        <Chat.Header
          avatarName="InteleBit"
          title="InteleBit"
          subtitle={projectSubtitle}
          trailing={
            <Button
              buttonType="icon"
              variant="danger"
              size="small"
              icon={<X size={16} />}
              aria-label="Close"
              onClick={handleClose}
            />
          }
        />
        <Chat.Body ref={bodyScrollRef}>
          {turns.length === 0 && !sendPending && !mutationError ? (
            <InteleBitWelcomeBanner />
          ) : null}
          {turns.map((turn, i) =>
            turn.role === 'user' ? (
              <Chat.Request key={i}>{turn.content}</Chat.Request>
            ) : (
              <Chat.Response key={i} durationMs={turn.durationMs}>
                <MarkdownPreview value={turn.content} />
                {turn.attachments?.map((a, idx) =>
                  a.kind === 'mcp_app' ? (
                    <McpAppAttachmentCard
                      key={`${i}-app-${idx}`}
                      title={a.title}
                      shopId={project.shopId}
                      projectId={project.projectId}
                      toolName={a.toolName}
                      resourceUri={a.resourceUri}
                    />
                  ) : null
                )}
              </Chat.Response>
            )
          )}
          {sendPending ? <Chat.Loading /> : null}
          {mutationError && !sendPending ? (
            <Alert
              variant="error"
              placement="inline"
              description={mutationError}
            />
          ) : null}
        </Chat.Body>
        <Chat.Input
          value={prompt}
          onChange={setPrompt}
          onSubmit={handleSend}
          placeholder="Type here…"
          disabled={false}
          sendPending={sendPending}
        />
      </Chat>
    </Popup>
  )
}

export type InteleBitType = FC & {
  /** Open the panel for a project (callable from anywhere). */
  ask: (params: InteleBitOpenDetail) => void
  /** Close the panel and reset state. */
  thanks: () => void
}

export const InteleBit = Object.assign(InteleBitPanel, {
  ask(params: InteleBitOpenDetail) {
    const projectId = params.projectId?.trim()
    if (!projectId) return
    emitInteleBitOpen({
      projectId,
      ...(params.projectName !== undefined
        ? { projectName: params.projectName }
        : {}),
      ...(params.shopId?.trim() ? { shopId: params.shopId.trim() } : {}),
    })
  },
  thanks() {
    emitInteleBitClose()
  },
}) as InteleBitType
