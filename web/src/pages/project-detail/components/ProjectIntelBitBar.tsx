import styled, { css, keyframes } from 'styled-components'
import { Button } from '@thedatablitz/button'
import { Inline } from '@thedatablitz/inline'
import { Stack } from '@thedatablitz/stack'
import { Text } from '@thedatablitz/text'
import { ChevronDown, ChevronUp, Sparkles, X } from 'lucide-react'
import { pdT } from '../pdTokens'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MarkdownPreview } from '@thedatablitz/markdown-editor'
import { useProjectIntelBitAi } from '../hooks'

type ChatTurn =
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string }

type QueuedPrompt = { id: string; content: string }

const barGradientShift = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`

const Bar = styled.div<{ $loading: boolean }>`
  position: relative;
  width: min(720px, calc(100vw - 2rem));
  box-sizing: border-box;
  padding: ${pdT.space300} ${pdT.space400};
  background: ${pdT.surfaceOverlay};
  border: 1px solid ${pdT.border};
  box-shadow:
    0 12px 40px rgba(0, 0, 0, 0.45),
    0 -10px 28px rgba(0, 0, 0, 0.22);
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    left: -1px;
    right: -1px;
    top: -14px;
    height: 14px;
    pointer-events: none;
    background: linear-gradient(
      to top,
      color-mix(in srgb, ${pdT.surfaceOverlay} 70%, transparent),
      transparent
    );
  }

  /* Animated gradient sheen overlay. */
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: ${(p) => (p.$loading ? 0.55 : 0)};
    background: linear-gradient(
      120deg,
      transparent 0%,
      color-mix(in srgb, ${pdT.brandBold} 28%, transparent) 18%,
      color-mix(in srgb, ${pdT.brandBold} 10%, transparent) 42%,
      transparent 65%,
      color-mix(in srgb, ${pdT.brandBold} 18%, transparent) 86%,
      transparent 100%
    );
    background-size: 220% 220%;
    animation: ${(p) =>
      p.$loading
        ? css`
            ${barGradientShift} 7.5s ease-in-out infinite
          `
        : 'none'};
    mix-blend-mode: screen;
  }

  @media (prefers-reduced-motion: reduce) {
    &::after {
      animation: none;
      opacity: ${(p) => (p.$loading ? 0.32 : 0)};
    }
  }
`

const Dock = styled.div`
  position: fixed;
  z-index: 50;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: ${pdT.space300};
  align-items: stretch;
  width: min(1120px, calc(100% - 2rem));
  pointer-events: none;
`

const DockItem = styled.div`
  pointer-events: auto;
  display: flex;
  align-items: stretch;
  min-height: 0;
`

const ThinkingPanel = styled.div`
  width: 820px;
  max-width: calc(100vw - 2rem);
  box-sizing: border-box;
  padding: ${pdT.space300} ${pdT.space400};
  background: ${pdT.surfaceOverlay};
  border: 1px solid ${pdT.border};
  box-shadow:
    0 12px 40px rgba(0, 0, 0, 0.45),
    0 -10px 28px rgba(0, 0, 0, 0.22);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
`

const ThinkingBody = styled.pre`
  margin: ${pdT.space200} 0 0 0;
max-height: 16rem;
  overflow: auto;
  padding-right: ${pdT.space100};
  white-space: pre-wrap;
  word-break: break-word;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
  color: color-mix(in srgb, ${pdT.pageFg} 85%, transparent);
`

const ResponsesHost = styled.div`
  position: fixed;
  z-index: 49;
  bottom: calc(1.5rem + 14.5rem);
  left: 50%;
  transform: translateX(-50%);
  width: min(720px, calc(100% - 2rem));
  display: flex;
  flex-direction: column;
  gap: ${pdT.space200};
  /* Don't block the rest of the UI behind this floating stack. */
  pointer-events: none;
  max-height: min(52vh, 520px);
  overflow-y: auto;
  padding: ${pdT.space200} 0;
  padding-bottom: calc(${pdT.space200} + 6.5rem);

  /* Subtle fade so the stack feels like it blends away. */
  mask-image: linear-gradient(
    to top,
    transparent 0px,
    rgba(0, 0, 0, 1) 44px,
    rgba(0, 0, 0, 1) calc(100% - 24px),
    transparent 100%
  );
`

const ResponseCard = styled.div<{ $role: 'user' | 'assistant' }>`
  pointer-events: auto;
  padding: ${pdT.space300} ${pdT.space400};
  background: ${(p) =>
    p.$role === 'assistant'
      ? `linear-gradient(135deg,
          color-mix(in srgb, ${pdT.brandBold} 16%, ${pdT.surfaceRaised}) 0%,
          ${pdT.surfaceRaised} 48%,
          color-mix(in srgb, ${pdT.brandBold} 10%, ${pdT.surfaceRaised}) 100%)`
      : pdT.surfaceOverlay};
  border: 1px solid color-mix(in srgb, ${pdT.border} 35%, transparent);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.35);
`

const ResponseBody = styled.div<{ $expanded: boolean }>`
  margin-top: ${pdT.space200};
  max-height: ${(p) => (p.$expanded ? '60vh' : '180px')};
  overflow: auto;
  padding-right: ${pdT.space100};
`

const AssistantMarkdown = styled.div`
  /* Ensure the assistant card gradient flows behind the markdown preview. */
  .db-markdown-editor-preview {
    background: transparent !important;
  }
  .db-markdown-editor-preview [data-md-chunk] {
    background: transparent !important;
  }
`

const IconTile = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  background: ${pdT.brandBold};
  color: ${pdT.onPrimary};
  flex-shrink: 0;
`

const InputRow = styled.div`
  margin-top: ${pdT.space300};
  padding-top: ${pdT.space300};
  border-top: 1px solid color-mix(in srgb, ${pdT.border} 35%, transparent);
`

const PromptInput = styled.textarea`
  width: 100%;
  box-sizing: border-box;
  resize: none;
  border: 1px solid color-mix(in srgb, ${pdT.border} 55%, transparent);
  background: ${pdT.surfaceRaised};
  color: ${pdT.pageFg};
  padding: ${pdT.space300};
  min-height: 2.75rem;
  line-height: 1.4;
  outline: none;

  &:focus {
    border-color: color-mix(in srgb, ${pdT.brandBold} 55%, ${pdT.border});
    box-shadow: 0 0 0 2px color-mix(in srgb, ${pdT.brandBold} 22%, transparent);
  }
`

const QueueItem = styled.div`
  padding: ${pdT.space200} ${pdT.space300};
  border: 1px solid color-mix(in srgb, ${pdT.border} 35%, transparent);
  background: ${pdT.surfaceRaised};
`

function makeId(): string {
  // Browsers generally have crypto.randomUUID; keep a fallback for older envs/tests.
  try {
    return typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}_${Math.random().toString(16).slice(2)}`
  } catch {
    return `${Date.now()}_${Math.random().toString(16).slice(2)}`
  }
}

export type ProjectIntelBitBarProps = {
  title: string
  subtitle: string
  ctaLabel: string
  onCta?: () => void
  projectId?: string
  projectName?: string
  /** Workspace context for `/ai` when no project is selected. */
  workspaceId?: string
  workspaceName?: string
  /**
   * If true, allow opening the composer even when `projectId`/`workspaceId` is not yet
   * available (e.g. while workspace list is still loading).
   */
  allowOpenWithoutContext?: boolean
}

function buildContextualPrompt(input:
  | { kind: 'project'; projectId: string; projectName?: string; userPrompt: string }
  | { kind: 'workspace'; workspaceId: string; workspaceName?: string; userPrompt: string }
) {
  if (input.kind === 'project') {
    const { projectId, projectName, userPrompt } = input
    return projectName?.trim()
      ? `[Project: ${projectName} (id: ${projectId})]\n\n${userPrompt}`
      : `[Project id: ${projectId}]\n\n${userPrompt}`
  }
  const { workspaceId, workspaceName, userPrompt } = input
  return workspaceName?.trim()
    ? `[Workspace: ${workspaceName} (id: ${workspaceId})]\n\n${userPrompt}`
    : `[Workspace id: ${workspaceId}]\n\n${userPrompt}`
}

export function ProjectIntelBitBar({
  title,
  subtitle,
  ctaLabel,
  onCta,
  projectId,
  projectName,
  workspaceId,
  workspaceName,
  allowOpenWithoutContext = false,
}: ProjectIntelBitBarProps) {
  const [composerOpen, setComposerOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [turns, setTurns] = useState<ChatTurn[]>([])
  const [thinking, setThinking] = useState('')
  const [queue, setQueue] = useState<QueuedPrompt[]>([])
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set())
  const requestStartedAtRef = useRef<number | null>(null)
  const responsesHostRef = useRef<HTMLDivElement | null>(null)
  const scrollAnchorRef = useRef<HTMLDivElement | null>(null)
  const askMutation = useProjectIntelBitAi()

  const canAsk = Boolean(
    (projectId && projectId.trim()) || (workspaceId && workspaceId.trim())
  )
  const canOpen = allowOpenWithoutContext ? true : canAsk
  const canSend = allowOpenWithoutContext ? true : canAsk
  const sendPending = Boolean(composerOpen && askMutation.isPending)
  const hasSession = turns.length > 0

  const responseCards = useMemo(
    () => turns.map((t, i) => ({ t, i })).slice(-8),
    [turns]
  )

  const hasQueued = queue.length > 0

  // Auto-scroll to newest message when turns change.
  useEffect(() => {
    if (!composerOpen || collapsed) return
    if (responseCards.length === 0) return

    // Ensure DOM is painted before scrolling.
    const raf = window.requestAnimationFrame(() => {
      const host = responsesHostRef.current
      const anchor = scrollAnchorRef.current
      if (!host || !anchor) return

      anchor.scrollIntoView({ behavior: 'smooth', block: 'end' })
    })
    return () => window.cancelAnimationFrame(raf)
  }, [collapsed, composerOpen, responseCards.length])

  const handleCancel = useCallback(() => {
    setComposerOpen(false)
    setCollapsed(false)
    setPrompt('')
    setTurns([])
    setThinking('')
    setQueue([])
    setExpanded(new Set())
    askMutation.reset()
  }, [askMutation])

  const enqueuePrompt = useCallback((content: string) => {
    const trimmed = content.trim()
    if (!trimmed) return
    setQueue((q) => [...q, { id: makeId(), content: trimmed }])
  }, [])

  const handleSend = useCallback(() => {
    const pid = projectId?.trim() ?? ''
    const wid = workspaceId?.trim() ?? ''
    const trimmed = prompt.trim()
    if ((!pid && !wid && !allowOpenWithoutContext) || !trimmed) return

    // Always enqueue so the user can keep typing while a request is in-flight.
    enqueuePrompt(trimmed)
    setPrompt('')
  }, [allowOpenWithoutContext, enqueuePrompt, projectId, prompt, workspaceId])

  // Process queue sequentially: only send next prompt after the previous one completes.
  useEffect(() => {
    if (!composerOpen || collapsed) return
    if (askMutation.isPending) return
    if (queue.length === 0) return

    const pid = projectId?.trim() ?? ''
    const wid = workspaceId?.trim() ?? ''
    if (!pid && !wid && !allowOpenWithoutContext) return

    const next = queue[0]
    if (!next?.content?.trim()) {
      // Avoid setState inside an effect body; schedule it.
      queueMicrotask(() => setQueue((q) => q.slice(1)))
      return
    }

    const isFirstUserMessage = turns.length === 0
    const userContent =
      isFirstUserMessage && pid
        ? buildContextualPrompt({
            kind: 'project',
            projectId: pid,
            projectName,
            userPrompt: next.content,
          })
        : isFirstUserMessage && wid
          ? buildContextualPrompt({
              kind: 'workspace',
              workspaceId: wid,
              workspaceName,
              userPrompt: next.content,
            })
          : next.content

    const messages = [
      ...turns.map((t) => ({ role: t.role, content: t.content })),
      { role: 'user' as const, content: userContent },
    ]

    // Optimistically render the queued user message and remove from queue.
    queueMicrotask(() => {
      setTurns((t) => [...t, { role: 'user', content: next.content }])
      setQueue((q) => q.slice(1))
      requestStartedAtRef.current = Date.now()
      setThinking('')
    })

    askMutation.mutate(
      {
        messages,
        projectId: pid || undefined,
        workspaceId: wid || undefined,
        onThinkingDelta: (delta) => {
          setThinking((prev) => prev + delta)
        },
      },
      {
        onSuccess: (data) => {
          requestStartedAtRef.current = null
          setTurns((t) => [...t, { role: 'assistant', content: data.reply }])
        },
        onError: () => {
          requestStartedAtRef.current = null
        },
      }
    )
  }, [
    allowOpenWithoutContext,
    askMutation,
    collapsed,
    composerOpen,
    projectId,
    projectName,
    queue,
    turns,
    workspaceId,
    workspaceName,
  ])

  return (
    <>
      {composerOpen && !collapsed && responseCards.length > 0 ? (
        <ResponsesHost aria-label="Intellebit responses" ref={responsesHostRef}>
          {responseCards.map(({ t, i }) => {
            const isAssistant = t.role === 'assistant'
            const isExpanded = expanded.has(i)
            const canExpand = isAssistant && t.content.trim().length > 420
            return (
              <ResponseCard
                key={i}
                $role={t.role}
                role="article"
                aria-label={isAssistant ? 'AI response' : 'Your message'}
              >
                <Inline justify="space-between" align="center" gap="200" wrap>
                  <Text
                    as="div"
                    variant="caption2"
                    color="color.text.subtle"
                    style={{ fontSize: 11, letterSpacing: '0.08em' }}
                  >
                    {isAssistant ? 'INTELLEBIT' : 'YOU'}
                  </Text>
                  {canExpand ? (
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => {
                        setExpanded((prev) => {
                          const next = new Set(prev)
                          if (next.has(i)) next.delete(i)
                          else next.add(i)
                          return next
                        })
                      }}
                    >
                      {isExpanded ? 'Collapse' : 'Expand'}
                    </Button>
                  ) : null}
                </Inline>
                <ResponseBody $expanded={isExpanded}>
                  {isAssistant ? (
                    <AssistantMarkdown>
                      <MarkdownPreview value={t.content} />
                    </AssistantMarkdown>
                  ) : (
                    <Text
                      as="p"
                      variant="body4"
                      color="color.text.DEFAULT"
                      style={{
                        margin: 0,
                        lineHeight: 1.6,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {t.content}
                    </Text>
                  )}
                </ResponseBody>
              </ResponseCard>
            )
          })}
          <div ref={scrollAnchorRef} />
        </ResponsesHost>
      ) : null}

      <Dock aria-label="Intellebit dock">
        <DockItem>
          <Bar
            role="region"
            aria-label="Intellebit assistant"
            $loading={sendPending}
          >
            <Stack gap="300" fullWidth>
          <Inline
            justify="space-between"
            align="center"
            gap="300"
            wrap
            fullWidth
          >
            <Inline align="center" gap="300" wrap={false}>
              <IconTile aria-hidden>
                <Sparkles size={22} strokeWidth={2} />
              </IconTile>
              <Stack gap="050" align="flex-start">
                <Text
                  as="span"
                  variant="caption2"
                  color="color.text.DEFAULT"
                  style={{
                    fontSize: 11,
                    letterSpacing: '0.12em',
                    fontWeight: 800,
                  }}
                >
                  {title}
                </Text>
                <Text
                  as="span"
                  variant="caption2"
                  color="color.text.subtle"
                  style={{ fontSize: 12, opacity: 0.85 }}
                >
                  {subtitle}
                </Text>
              </Stack>
            </Inline>

            {composerOpen ? (
              <Inline gap="150" align="center" wrap={false}>
                <Button
                  variant="outline"
                  size="medium"
                  icon={
                    collapsed ? (
                      <ChevronUp size={18} />
                    ) : (
                      <ChevronDown size={18} />
                    )
                  }
                  onClick={() => setCollapsed((v) => !v)}
                  style={{ flexShrink: 0 }}
                  aria-label={collapsed ? 'Expand chat' : 'Collapse chat'}
                >
                  {collapsed ? 'Expand' : 'Minimise'}
                </Button>
                <Button
                  variant="secondary"
                  size="medium"
                  icon={<X size={18} />}
                  onClick={handleCancel}
                  style={{ flexShrink: 0 }}
                >
                  Cancel
                </Button>
                {!collapsed ? (
                  <Button
                    variant="primary"
                    size="medium"
                    onClick={handleSend}
                    // Queueing should work while a request is in-flight.
                    disabled={!canSend || !prompt.trim()}
                    style={{ flexShrink: 0 }}
                  >
                    Send
                  </Button>
                ) : null}
              </Inline>
            ) : (
              <Inline gap="150" align="center" wrap={false}>
                {hasSession ? (
                  <Button
                    variant="secondary"
                    size="medium"
                    onClick={handleCancel}
                    style={{ flexShrink: 0 }}
                    aria-label="Cancel chat"
                  >
                    <X size={18} />
                  </Button>
                ) : null}
                <Button
                  variant="primary"
                  size="medium"
                  onClick={() => {
                    onCta?.()
                    setComposerOpen(true)
                    setCollapsed(false)
                  }}
                  disabled={!canOpen}
                  style={{ flexShrink: 0 }}
                >
                  {hasSession ? 'Expand' : ctaLabel}
                </Button>
              </Inline>
            )}
          </Inline>

          {composerOpen && !collapsed ? (
            <InputRow>
              <Stack gap="200" fullWidth>
                {hasQueued ? (
                  <Stack gap="100" fullWidth>
                    <Text
                      as="div"
                      variant="caption2"
                      color="color.text.subtle"
                      style={{ fontSize: 10, letterSpacing: '0.14em' }}
                    >
                      QUEUED ({queue.length})
                    </Text>
                    {queue.map((q) => (
                      <QueueItem key={q.id} role="article" aria-label="Queued message">
                        <Inline
                          justify="space-between"
                          align="flex-start"
                          gap="200"
                          wrap
                          fullWidth
                        >
                          <Text
                            as="div"
                            variant="body4"
                            color="color.text.DEFAULT"
                            style={{ margin: 0, whiteSpace: 'pre-wrap', flex: '1 1 18rem' }}
                          >
                            {q.content}
                          </Text>
                          <Inline gap="100" align="center" wrap={false}>
                            <Button
                              variant="secondary"
                              size="small"
                              onClick={() => {
                                // Edit: move back into the composer.
                                setQueue((prev) => prev.filter((x) => x.id !== q.id))
                                setPrompt(q.content)
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="secondary"
                              size="small"
                              onClick={() => {
                                setQueue((prev) => prev.filter((x) => x.id !== q.id))
                              }}
                            >
                              Delete
                            </Button>
                          </Inline>
                        </Inline>
                      </QueueItem>
                    ))}
                  </Stack>
                ) : null}
                <PromptInput
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={
                    projectId?.trim() || projectName?.trim()
                      ? 'Ask a question about this project…'
                      : workspaceId?.trim() || workspaceName?.trim()
                        ? 'Ask a question about this workspace…'
                        : 'Ask a question to create your first workspace…'
                  }
                  // Keep input enabled while requests run so users can queue more prompts.
                  disabled={!canSend}
                />
                {askMutation.error ? (
                  <Text as="div" variant="caption2" color="color.text.ai">
                    {askMutation.error instanceof Error
                      ? askMutation.error.message
                      : String(askMutation.error)}
                  </Text>
                ) : null}
              </Stack>
            </InputRow>
          ) : null}
            </Stack>
          </Bar>
        </DockItem>

        {composerOpen && !collapsed ? (
          <DockItem>
            <ThinkingPanel role="region" aria-label="Thinking">
              <Inline justify="space-between" align="center" gap="200" fullWidth>
                <Text
                  as="div"
                  variant="caption2"
                  color="color.text.subtle"
                  style={{ fontSize: 11, letterSpacing: '0.08em' }}
                >
                  THINKING
                </Text>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => setThinking('')}
                  disabled={!thinking.trim()}
                >
                  Clear
                </Button>
              </Inline>
              <ThinkingBody aria-label="Thinking stream">
                {thinking.trim() ? thinking : '…'}
              </ThinkingBody>
            </ThinkingPanel>
          </DockItem>
        ) : null}
      </Dock>
    </>
  )
}
