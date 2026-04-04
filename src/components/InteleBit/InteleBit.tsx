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
import { postAiPrompt, type AiChatTurn } from '../../api/aiClient'
import { logError } from '../../utils/errorHandling'
import {
  emitInteleBitClose,
  emitInteleBitOpen,
  type InteleBitOpenDetail,
} from './inteleBitBus'
import { useInteleBitBus } from './useInteleBitBus'
import { InteleBitWelcomeBanner } from './InteleBitWelcomeBanner'
import { MarkdownPreview } from '@thedatablitz/markdown-editor'

type UserTurn = { role: 'user'; content: string }
type AssistantTurn = { role: 'assistant'; content: string; durationMs: number }
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
    mutationFn: (messages: AiChatTurn[]) => postAiPrompt({ messages }),
    onSuccess: (data) => {
      const start = requestStartedAtRef.current
      requestStartedAtRef.current = null
      const durationMs = start != null ? Math.max(0, Date.now() - start) : 0
      setTurns((t) => [
        ...t,
        { role: 'assistant', content: data.reply, durationMs },
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
    askMutation.mutate(messages)
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
    })
  },
  thanks() {
    emitInteleBitClose()
  },
}) as InteleBitType
