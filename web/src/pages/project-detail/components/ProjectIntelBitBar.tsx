import styled from 'styled-components'
import { Button } from '@thedatablitz/button'
import { Inline } from '@thedatablitz/inline'
import { Stack } from '@thedatablitz/stack'
import { Text } from '@thedatablitz/text'
import { Sparkles } from 'lucide-react'
import { pdT } from '../pdTokens'
import { useCallback, useMemo, useRef, useState } from 'react'
import { MarkdownPreview } from '@thedatablitz/markdown-editor'
import { useProjectIntelBitAi } from '../hooks'

type ChatTurn =
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string }

const Bar = styled.div`
  position: fixed;
  z-index: 50;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  width: min(720px, calc(100% - 2rem));
  box-sizing: border-box;
  padding: ${pdT.space300} ${pdT.space400};
  background: ${pdT.surfaceOverlay};
  border: 1px solid ${pdT.border};
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
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
  pointer-events: auto;
  max-height: min(52vh, 520px);
  overflow-y: auto;
  padding: ${pdT.space200} 0;
`

const ResponseCard = styled.div`
  padding: ${pdT.space300} ${pdT.space400};
  background: ${pdT.surfaceRaised};
  border: 1px solid color-mix(in srgb, ${pdT.border} 35%, transparent);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.35);
`

const ResponseBody = styled.div<{ $expanded: boolean }>`
  margin-top: ${pdT.space200};
  max-height: ${(p) => (p.$expanded ? '60vh' : '180px')};
  overflow: auto;
  padding-right: ${pdT.space100};
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
  border-radius: ${pdT.radiusMd};
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

export type ProjectIntelBitBarProps = {
  title: string
  subtitle: string
  ctaLabel: string
  onCta?: () => void
  projectId?: string
  projectName?: string
}

function buildContextualPrompt(input: {
  projectId: string
  projectName?: string
  userPrompt: string
}) {
  const { projectId, projectName, userPrompt } = input
  return projectName?.trim()
    ? `[Project: ${projectName} (id: ${projectId})]\n\n${userPrompt}`
    : `[Project id: ${projectId}]\n\n${userPrompt}`
}

export function ProjectIntelBitBar({
  title,
  subtitle,
  ctaLabel,
  onCta,
  projectId,
  projectName,
}: ProjectIntelBitBarProps) {
  const [composerOpen, setComposerOpen] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [turns, setTurns] = useState<ChatTurn[]>([])
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set())
  const requestStartedAtRef = useRef<number | null>(null)
  const askMutation = useProjectIntelBitAi()

  const canAsk = Boolean(projectId && projectId.trim())
  const sendPending = Boolean(composerOpen && askMutation.isPending)

  const responseCards = useMemo(
    () =>
      turns
        .map((t, i) => ({ t, i }))
        .filter(({ t }) => t.role === 'assistant')
        .slice(-8),
    [turns]
  )

  const handleCancel = useCallback(() => {
    setComposerOpen(false)
    setPrompt('')
    setTurns([])
    setExpanded(new Set())
    askMutation.reset()
  }, [askMutation])

  const handleSend = useCallback(() => {
    const pid = projectId?.trim() ?? ''
    const trimmed = prompt.trim()
    if (!pid || !trimmed || askMutation.isPending) return

    const isFirstUserMessage = turns.length === 0
    const userContent = isFirstUserMessage
      ? buildContextualPrompt({
          projectId: pid,
          projectName,
          userPrompt: trimmed,
        })
      : trimmed

    const messages = [
      ...turns.map((t) => ({ role: t.role, content: t.content })),
      { role: 'user' as const, content: userContent },
    ]

    setTurns((t) => [...t, { role: 'user', content: trimmed }])
    setPrompt('')
    requestStartedAtRef.current = Date.now()

    askMutation.mutate(
      { messages, projectId: pid },
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
  }, [askMutation, projectId, projectName, prompt, turns])

  return (
    <>
      {responseCards.length > 0 ? (
        <ResponsesHost aria-label="Intellebit responses">
          {responseCards.map(({ t, i }) => {
            const isExpanded = expanded.has(i)
            const canExpand = t.content.trim().length > 420
            return (
              <ResponseCard key={i} role="article" aria-label="AI response">
                <Inline justify="space-between" align="center" gap="200" wrap>
                  <Text
                    as="div"
                    variant="caption2"
                    color="color.text.subtle"
                    style={{ fontSize: 11, letterSpacing: '0.08em' }}
                  >
                    INTELLEBIT
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
                  <MarkdownPreview value={t.content} />
                </ResponseBody>
              </ResponseCard>
            )
          })}
        </ResponsesHost>
      ) : null}

      <Bar role="region" aria-label="Intellebit assistant">
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
                  variant="secondary"
                  size="medium"
                  onClick={handleCancel}
                  style={{ flexShrink: 0 }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="medium"
                  onClick={handleSend}
                  disabled={!canAsk || sendPending || !prompt.trim()}
                  style={{ flexShrink: 0 }}
                >
                  Send
                </Button>
              </Inline>
            ) : (
              <Button
                variant="primary"
                size="medium"
                onClick={() => {
                  onCta?.()
                  setComposerOpen(true)
                }}
                disabled={!canAsk}
                style={{ flexShrink: 0 }}
              >
                {ctaLabel}
              </Button>
            )}
          </Inline>

          {composerOpen ? (
            <InputRow>
              <Stack gap="200" fullWidth>
                <PromptInput
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={
                    canAsk
                      ? 'Ask a question about this project…'
                      : 'Select a project first…'
                  }
                  disabled={!canAsk || sendPending}
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
    </>
  )
}
