import { useState } from 'react'
import { MessageCircle, MoreHorizontal, SquarePen } from 'lucide-react'

import { Avatar } from '@thedatablitz/avatar'
import { Badge } from '@thedatablitz/badge'
import { Card, CardContent, CardFooter, CardHeader } from '@thedatablitz/card'
import { Button } from '@thedatablitz/button'
import { CommentThread } from '@thedatablitz/comment'
import { Inline } from '@thedatablitz/inline'
import { Popup } from '@thedatablitz/popup'
import { Stack } from '@thedatablitz/stack'
import { Text } from '@thedatablitz/text'

import { STATUS_CONFIG } from '../../constants/projectStatus'
import { MarkdownPreview } from '@thedatablitz/markdown-editor'
import type { StatusUpdateCardProps } from './types'
import { buildMoreItems } from './utils/buildMoreItems'
import { NativeEmojiHint } from './utils/NativeEmojiHint'

export type { StatusUpdateCardData } from './types'

function statusBadgeVariant(color: string): 'success' | 'warning' | 'danger' {
  if (color === 'success') return 'success'
  if (color === 'warning') return 'warning'
  return 'danger'
}

export function StatusUpdateCard({
  data,
  comments = [],
  onNewUpdate,
  onCommentsClick,
  onSendComment,
  onMore,
  className,
}: StatusUpdateCardProps) {
  const [commentsExpanded, setCommentsExpanded] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const config = STATUS_CONFIG[data.status]
  const StatusIcon = config.Icon

  const showCommentsWhenExpanded = comments.length > 0 || onSendComment != null
  const moreItems = buildMoreItems(onMore)

  return (
    <Card className={className} style={{ overflow: 'visible' }}>
      <CardHeader divider>
        <Stack gap="100">
          <Inline justify="space-between" align="center" fullWidth>
            <Text
              variant="caption2"
              color="color.text.subtle"
              as="span"
              style={{
                fontWeight: 600,
                letterSpacing: '0.02em',
                textTransform: 'uppercase',
              }}
            >
              Latest update
            </Text>
            {onNewUpdate && (
              <Button
                variant="glass"
                size="small"
                icon={<SquarePen size={16} style={{ flexShrink: 0 }} />}
                onClick={onNewUpdate}
              >
                New update
              </Button>
            )}
          </Inline>
          <Inline gap="100" align="center" wrap>
            <Badge
              size="small"
              variant={statusBadgeVariant(config.color)}
              outlined
              icon={<StatusIcon size={14} />}
              label={config.label}
            />
            <span
              aria-hidden
              style={{
                width: 1,
                height: 12,
                alignSelf: 'center',
                flexShrink: 0,
                background: 'var(--color-border-default, #e5e7eb)',
              }}
            />
            <Avatar
              name={data.authorName}
              src={data.authorAvatarSrc}
              size="small"
            />
            <Text variant="body3" as="span">
              {data.authorName}
            </Text>
            <Text variant="caption2" color="color.text.subtle" as="span">
              {data.timestamp}
            </Text>
            {moreItems.length > 0 && (
              <Popup
                open={moreOpen}
                onOpenChange={setMoreOpen}
                placement="bottom-right"
                showCloseButton={false}
                trigger={
                  <Button
                    buttonType="icon"
                    variant="glass"
                    size="small"
                    aria-label="More options for this update"
                    icon={<MoreHorizontal size={16} />}
                  />
                }
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    padding: '4px 0',
                    minWidth: 120,
                  }}
                >
                  {moreItems.map((item) => (
                    <Button
                      key={item.id}
                      buttonType="link"
                      size="small"
                      onClick={() => {
                        item.onClick()
                        setMoreOpen(false)
                      }}
                    >
                      {item.label}
                    </Button>
                  ))}
                </div>
              </Popup>
            )}
          </Inline>
        </Stack>
      </CardHeader>

      <CardContent
        divider
        style={{
          padding: '8px 12px',
          lineHeight: 1.5,
          wordBreak: 'break-word',
        }}
      >
        <MarkdownPreview value={data.content ?? ''} />
      </CardContent>

      {commentsExpanded && showCommentsWhenExpanded && (
        <CardContent
          divider
          style={{
            minHeight: 120,
            maxHeight: 280,
            display: 'flex',
            flexDirection: 'column',
            padding: 0,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <CommentThread
              comments={comments}
              placeholder="Add a comment..."
              submitButtonText="Send"
              onSubmitComment={(payload) => {
                const text = payload.commentText.trim()
                if (text) onSendComment?.(text)
              }}
            />
          </div>
        </CardContent>
      )}

      <CardFooter divider>
        <Inline gap="100" align="center" wrap>
          <Button
            variant="glass"
            size="small"
            onClick={() => {
              setCommentsExpanded((expanded) => !expanded)
              onCommentsClick?.()
            }}
            aria-label={`${data.commentCount ?? comments.length ?? 0} comments`}
            aria-expanded={commentsExpanded}
            icon={<MessageCircle size={14} />}
          >
            {data.commentCount ?? comments.length} comments
          </Button>
          <NativeEmojiHint placement="top" />
        </Inline>
      </CardFooter>
    </Card>
  )
}
