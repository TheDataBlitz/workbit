import { useState } from 'react'

import { Dropdown } from '@thedatablitz/dropdown'
import {
  TextEditor,
  lexicalJsonToMarkdown,
  lexicalJsonToPlainText,
} from '@thedatablitz/text-editor'

import type { ProjectStatus } from '../../constants/projectStatus'
import { lexicalSerializedHasNonWhitespaceText } from '../../utils/textEditorState'
import { TextAreaWrap, Divider } from './styles'
import type { StatusUpdateComposerProps } from './types'
import { buildStatusItems } from './utils/buildStatusItems'
import { Box } from '@thedatablitz/box'
import { Button } from '@thedatablitz/button'
import { Inline } from '@thedatablitz/inline'

export type { ProjectStatus } from '../../constants/projectStatus'

export function StatusUpdateComposer({
  status: controlledStatus,
  onStatusChange,
  placeholder = 'Write a project update...',
  onPost,
  onCancel,
}: StatusUpdateComposerProps) {
  const [internalStatus, setInternalStatus] =
    useState<ProjectStatus>('on-track')
  const [draftLexicalJson, setDraftLexicalJson] = useState('')
  const [editorKey, setEditorKey] = useState(0)

  const status = controlledStatus ?? internalStatus
  const setStatus = (nextStatus: ProjectStatus) => {
    if (onStatusChange) {
      onStatusChange(nextStatus)
      return
    }

    setInternalStatus(nextStatus)
  }

  const statusItems = buildStatusItems()

  const hasDraftContent =
    lexicalSerializedHasNonWhitespaceText(draftLexicalJson)

  const handlePost = () => {
    if (!hasDraftContent || !onPost) return
    let markdown: string
    try {
      markdown = lexicalJsonToMarkdown(draftLexicalJson)
    } catch {
      try {
        markdown = lexicalJsonToPlainText(draftLexicalJson)
      } catch {
        markdown = ''
      }
    }
    const trimmed = markdown.trim()
    if (!trimmed) return
    onPost(trimmed, status)
    setDraftLexicalJson('')
    setEditorKey((k) => k + 1)
  }

  return (
    <Box border padding="100">
      <Dropdown
        options={statusItems}
        value={status}
        onChange={(value: string) => setStatus(value as ProjectStatus)}
        placeholder="Select status"
        size="small"
      />
      <TextAreaWrap>
        <TextEditor
          key={editorKey}
          defaultEditorState=""
          onChange={setDraftLexicalJson}
          placeholder={placeholder}
          autoFocus={false}
        />
      </TextAreaWrap>

      <Divider aria-hidden />

      <Inline
        fullWidth
        justify="flex-end"
        align="center"
        gap="100"
        padding="100"
      >
        {onCancel && (
          <Button variant="glass" size="small" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          variant="primary"
          size="small"
          onClick={handlePost}
          disabled={!hasDraftContent}
        >
          Post update
        </Button>
      </Inline>
    </Box>
  )
}
