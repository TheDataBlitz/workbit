import {
  isLexicalEditorStateJson,
  promoteMarkdownImagesInLexicalJsonString,
} from '@thedatablitz/workbit-sdk'
import { convertToLexicalJson } from '@thedatablitz/text-editor'

function lexicalJsonHasBlockContent(serialized: string): boolean {
  try {
    const parsed = JSON.parse(serialized) as {
      root?: { children?: unknown }
    }
    const children = parsed?.root?.children
    return Array.isArray(children) && children.length > 0
  } catch {
    return false
  }
}

function plainTextToLexicalEditorState(raw: string): string {
  const lines = raw.split(/\r?\n/)
  const text = lines.join('\n')
  return JSON.stringify({
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      children: [
        {
          type: 'paragraph',
          format: '',
          indent: 0,
          version: 1,
          direction: 'ltr',
          textFormat: 0,
          textStyle: '',
          children: [
            {
              type: 'text',
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text,
              version: 1,
            },
          ],
        },
      ],
    },
  })
}

/** Markdown, plain text, or Lexical JSON → Lexical JSON string. */
export function stringToLexicalEditorState(
  raw: string | null | undefined
): string {
  const s = raw ?? ''
  if (!s.trim()) {
    return ''
  }

  try {
    const parsed = JSON.parse(s) as { root?: { children?: unknown } }
    if (parsed && typeof parsed === 'object' && parsed.root != null) {
      return lexicalJsonHasBlockContent(s) ? s : ''
    }
  } catch {
    // not JSON; treat as markdown
  }

  try {
    const converted = convertToLexicalJson(s, 'markdown')
    if (lexicalJsonHasBlockContent(converted)) return converted
  } catch {
    // fallback to plain text lexical JSON
  }

  return plainTextToLexicalEditorState(s)
}

/**
 * On serialized Lexical JSON, promote `![alt](url)` in text nodes to `wb-image` nodes.
 * Non-Lexical input is returned unchanged.
 */
export function finalizeLexicalMarkdownImages(serialized: string): string {
  if (!serialized.trim()) return serialized
  if (!isLexicalEditorStateJson(serialized)) return serialized
  try {
    return promoteMarkdownImagesInLexicalJsonString(serialized)
  } catch {
    return serialized
  }
}

/** Markdown/JSON → Lexical, then promote markdown image syntax to wb-image. */
export function mcpContentToStoredLexical(raw: string): string {
  return finalizeLexicalMarkdownImages(stringToLexicalEditorState(raw))
}

/** If value is an object with string `content`, run finalize on Lexical bodies only. */
export function finalizeDocumentContentField<T>(doc: T): T {
  if (!doc || typeof doc !== 'object') return doc
  const o = doc as Record<string, unknown>
  const c = o.content
  if (typeof c !== 'string' || !c.trim()) return doc
  const next = { ...o, content: finalizeLexicalMarkdownImages(c) }
  return next as T
}
