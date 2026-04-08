import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type FC,
} from 'react'
import { useMutation } from '@tanstack/react-query'
import { X } from 'lucide-react'

import { Alert } from '@thedatablitz/alert'
import { Button } from '@thedatablitz/button'
import { Popup } from '@thedatablitz/popup'

import { Chat } from '@thedatablitz/chat'
import { Text } from '@thedatablitz/text'
import {
  postAiPrompt,
  type AiChatTurn,
  type PostAiAttachment,
} from '../../api/aiClient'
import { logError } from '../../utils/errorHandling'
import { AppRenderer } from '@mcp-ui/client'
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
  resourceUri: string
  html: string
  title?: string
}) {
  const title = props.title?.trim() ? props.title.trim() : 'Interactive app'

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
        <AppRenderer
          toolName="embedded-mcp-app"
          toolResourceUri={props.resourceUri}
          sandbox={{
            url: getMcpSandboxProxyUrl(),
            permissions:
              'allow-scripts allow-same-origin allow-forms allow-popups allow-downloads',
          }}
          html={props.html}
          onOpenLink={async ({ url }) => {
            window.open(url, '_blank', 'noopener,noreferrer')
            return {}
          }}
          onError={(e) => {
            logError(e, 'InteleBit.McpAppAttachmentCard')
          }}
        />
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
                  a.kind === 'excalidraw' ? (
                    <div
                      key={`${i}-att-${idx}`}
                      className="mt-3 rounded-[10px] border border-slate-200 bg-white p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <Text variant="body3">Excalidraw diagram</Text>
                          <Text variant="caption2" color="color.text.subtle">
                            checkpoint: {a.checkpointId}
                          </Text>
                        </div>
                        <div className="flex gap-2">
                          {a.shareUrl ? (
                            <Button
                              variant="glass"
                              size="small"
                              onClick={() =>
                                window.open(
                                  a.shareUrl,
                                  '_blank',
                                  'noopener,noreferrer'
                                )
                              }
                            >
                              Open
                            </Button>
                          ) : null}
                          {a.excalidrawJson ? (
                            <Button
                              variant="primary"
                              size="small"
                              onClick={() => {
                                const json = a.excalidrawJson
                                if (!json) return
                                const blob = new Blob([json], {
                                  type: 'application/json',
                                })
                                const url = URL.createObjectURL(blob)
                                const el = document.createElement('a')
                                el.href = url
                                el.download = `diagram-${a.checkpointId}.excalidraw.json`
                                document.body.appendChild(el)
                                el.click()
                                el.remove()
                                URL.revokeObjectURL(url)
                              }}
                            >
                              Download
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ) : null
                )}
                {turn.attachments?.map((a, idx) =>
                  a.kind === 'mcp_app' ? (
                    <McpAppAttachmentCard
                      key={`${i}-app-${idx}`}
                      title={a.title}
                      resourceUri={a.resourceUri}
                      html={a.html}
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
