import {
  forwardRef,
  type ChangeEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { Loader2, Send, Square } from 'lucide-react'

import { Avatar } from '@thedatablitz/avatar'
import { Box } from '@thedatablitz/box'
import { Button } from '@thedatablitz/button'
import { Card, CardContent, CardFooter, CardHeader } from '@thedatablitz/card'
import { Inline } from '@thedatablitz/inline'
import { Stack } from '@thedatablitz/stack'
import { Text } from '@thedatablitz/text'
import { TextBox } from '@thedatablitz/textbox'

/** Human-readable duration for response timers (e.g. `0.5 s`, `120 ms`). */
export function formatResponseDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '—'
  if (ms < 1000) return `${Math.round(ms)} ms`
  const s = ms / 1000
  return s < 10 ? `${s.toFixed(1)} s` : `${Math.round(s)} s`
}

export type ChatRootProps = {
  children: ReactNode
  className?: string
}

function ChatRoot({ children, className = '' }: ChatRootProps) {
  return (
    <Card
      fullWidth
      variant="default"
      size="small"
      className={`flex h-full min-h-0 min-w-0 flex-col overflow-hidden shadow-lg ${className}`}
    >
      {children}
    </Card>
  )
}

export type ChatHeaderProps = {
  /** Text heading when `avatarName` is not set. */
  title?: string
  /** When set, shows this avatar instead of the text title (e.g. assistant). */
  avatarName?: string
  subtitle?: string
  trailing?: ReactNode
}

function ChatHeader({
  title,
  avatarName,
  subtitle,
  trailing,
}: ChatHeaderProps) {
  const ariaLabel = avatarName ?? title ?? 'Chat'

  return (
    <CardHeader className="shrink-0" aria-label={ariaLabel}>
      <Inline
        justify="space-between"
        align="flex-start"
        fullWidth
        wrap={false}
        gap="200"
      >
        <Stack gap="050" fullWidth className="min-w-0 flex-1">
          {avatarName ? (
            <Inline gap="200" align="flex-start" wrap={false} fullWidth>
              <Avatar
                name={avatarName}
                size="small"
                className="shrink-0"
                aria-hidden
              />
              <Stack gap="050" className="min-w-0 flex-1">
                {title ? (
                  <Text variant="heading6" as="h2" className="sr-only">
                    {title}
                  </Text>
                ) : null}
                {subtitle ? (
                  <Text
                    variant="caption2"
                    color="color.text.subtle"
                    className="truncate"
                    title={subtitle}
                  >
                    {subtitle}
                  </Text>
                ) : null}
              </Stack>
            </Inline>
          ) : (
            <>
              <Text variant="heading6" as="h2">
                {title}
              </Text>
              {subtitle ? (
                <Text
                  variant="caption2"
                  color="color.text.subtle"
                  className="truncate"
                  title={subtitle}
                >
                  {subtitle}
                </Text>
              ) : null}
            </>
          )}
        </Stack>
        {trailing ? <Box className="shrink-0">{trailing}</Box> : null}
      </Inline>
    </CardHeader>
  )
}

export type ChatBodyProps = {
  children: ReactNode
  className?: string
}

const ChatBody = forwardRef<HTMLDivElement, ChatBodyProps>(function ChatBody(
  { children, className = '' },
  ref
) {
  return (
    <CardContent
      className={`flex min-h-0 flex-1 flex-col overflow-hidden !p-0 ${className}`}
    >
      <div ref={ref} className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        <Stack gap="400" fullWidth>
          {children}
        </Stack>
      </div>
    </CardContent>
  )
})

ChatBody.displayName = 'Chat.Body'

export type ChatResponseProps = {
  children: ReactNode
  /** Shown on the in-card avatar (default assistant name). */
  avatarName?: string
  /** Elapsed time for this reply; rendered inside the card. */
  durationMs?: number
  /** Default true; false for welcome text so the header avatar is not duplicated. */
  showAvatar?: boolean
}

function ChatResponse({
  children,
  avatarName = 'InteleBit',
  durationMs,
  showAvatar = true,
}: ChatResponseProps) {
  return (
    <Stack gap="100" fullWidth className="items-start">
      <Card
        variant="brand"
        size="small"
        fullWidth
        className="max-w-[min(100%,22rem)]"
      >
        {showAvatar ? (
          <Stack gap="200" fullWidth>
            <Inline gap="200" align="flex-start" wrap={false} fullWidth>
              <Avatar name={avatarName} size="small" className="shrink-0" />
              <Text
                variant="body3"
                className="min-w-0 flex-1 whitespace-pre-wrap"
              >
                {children}
              </Text>
            </Inline>
            {durationMs !== undefined ? (
              <Text variant="caption2" color="color.text.subtle">
                {formatResponseDuration(durationMs)}
              </Text>
            ) : null}
          </Stack>
        ) : (
          <Text variant="body3" className="whitespace-pre-wrap">
            {children}
          </Text>
        )}
      </Card>
    </Stack>
  )
}

export type ChatRequestProps = {
  children: ReactNode
  /** Used for the in-card avatar initials / label. */
  avatarName?: string
}

function ChatRequest({ children, avatarName = 'Me' }: ChatRequestProps) {
  return (
    <Stack gap="100" fullWidth className="items-end">
      <Card
        variant="brand"
        size="small"
        fullWidth
        className="max-w-[min(100%,22rem)]"
      >
        <Inline gap="200" align="flex-start" wrap={false} fullWidth>
          <Avatar name={avatarName} size="small" className="shrink-0" />
          <Text variant="body3" className="min-w-0 flex-1 whitespace-pre-wrap">
            {children}
          </Text>
        </Inline>
      </Card>
    </Stack>
  )
}

export type ChatLoadingProps = {
  onStop?: () => void
}

function ChatLoading({ onStop }: ChatLoadingProps) {
  return (
    <Stack gap="200" fullWidth className="items-start">
      <Box border padding="300" className="inline-flex">
        <Text
          variant="body2"
          color="color.text.subtle"
          className="min-w-[2.5rem] animate-pulse tracking-[0.35em]"
          aria-hidden
        >
          ···
        </Text>
      </Box>
      {onStop ? (
        <Button
          variant="warning"
          icon={<Square size={14} fill="currentColor" />}
          onClick={onStop}
        >
          Stop generate
        </Button>
      ) : null}
    </Stack>
  )
}

export type ChatInputProps = {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  placeholder?: string
  disabled?: boolean
  sendPending?: boolean
  leadingAccessory?: ReactNode
}

function ChatInput({
  value,
  onChange,
  onSubmit,
  placeholder = 'Type here…',
  disabled = false,
  sendPending = false,
  leadingAccessory,
}: ChatInputProps) {
  const submit = () => {
    if (!value.trim() || disabled || sendPending) return
    onSubmit()
  }

  return (
    <CardFooter className="shrink-0 !px-3 !py-3">
      <Stack gap="200" fullWidth>
        {leadingAccessory ? (
          <Inline justify="flex-start" fullWidth>
            {leadingAccessory}
          </Inline>
        ) : null}
        <Stack gap="200" fullWidth className="min-w-0">
          <TextBox
            value={value}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
              onChange(e.target.value)
            }
            placeholder={placeholder}
            size="medium"
            fullWidth
            showCharacterCount={false}
            disabled={disabled || sendPending}
            className="[&_textarea]:min-h-[44px] [&_textarea]:w-full [&_textarea]:max-w-none [&_textarea]:py-2.5"
            onKeyDown={(e: KeyboardEvent<HTMLTextAreaElement>) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                submit()
              }
            }}
          />

          <Button
            variant="ai"
            disabled={!value.trim() || disabled || sendPending}
            icon={
              sendPending ? (
                <Loader2 size={18} strokeWidth={2} className="animate-spin" />
              ) : (
                <Send size={18} strokeWidth={2} />
              )
            }
            aria-label={sendPending ? 'Sending' : 'Send'}
            onClick={submit}
          >
            {sendPending ? 'Sending…' : 'Send'}
          </Button>
        </Stack>
      </Stack>
    </CardFooter>
  )
}

export const Chat = Object.assign(ChatRoot, {
  Header: ChatHeader,
  Body: ChatBody,
  Response: ChatResponse,
  Request: ChatRequest,
  Loading: ChatLoading,
  Input: ChatInput,
})
