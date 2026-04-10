import { convertToLexicalJson } from '@thedatablitz/text-editor'

/**
 * Issue descriptions are stored as Lexical JSON for TextEditor.
 * Accepts Lexical JSON, Markdown, or plain text; always persists Lexical + wb-image promotion.
 */

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

function isLexicalEditorStateJson(value: string): boolean {
  const t = value.trim()
  if (!t.startsWith('{')) return false
  try {
    const o = JSON.parse(t) as { root?: { type?: unknown } }
    return (
      typeof o === 'object' &&
      o !== null &&
      typeof o.root === 'object' &&
      o.root !== null &&
      o.root.type === 'root'
    )
  } catch {
    return false
  }
}

function plainTextToLexicalEditorState(raw: string): string {
  const text = raw.split(/\r?\n/).join('\n')
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

/** If already Lexical with blocks, return as-is; otherwise Markdown → Lexical or plain fallback. */
export function stringToLexicalIssueDescription(raw: string): string {
  const s = raw.trim()
  if (!s) return ''

  try {
    const parsed = JSON.parse(s) as { root?: { children?: unknown } }
    if (parsed && typeof parsed === 'object' && parsed.root != null) {
      if (lexicalJsonHasBlockContent(s)) return s
      // Valid Lexical shell but no blocks — normalize to empty paragraph document
      if (isLexicalEditorStateJson(s)) return plainTextToLexicalEditorState('')
    }
  } catch {
    // not JSON — treat as markdown
  }

  try {
    const converted = convertToLexicalJson(s, 'markdown')
    if (lexicalJsonHasBlockContent(converted)) return converted
  } catch {
    // fallback below
  }

  return plainTextToLexicalEditorState(s)
}

const MARKDOWN_IMAGE = /!\[([^\]]*)\]\((data:[^)]+|https?:\/\/[^)\s]+)\)/g

type LexNode = Record<string, unknown>

function makeTextNode(text: string): LexNode {
  return {
    type: 'text',
    detail: 0,
    format: 0,
    mode: 'normal',
    style: '',
    text,
    version: 1,
  }
}

function splitTextWithMarkdownImages(text: string): LexNode[] | null {
  const re = new RegExp(MARKDOWN_IMAGE.source, 'g')
  if (!re.test(text)) return null
  re.lastIndex = 0
  const segments: LexNode[] = []
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      const before = text.slice(last, m.index)
      if (before) segments.push(makeTextNode(before))
    }
    segments.push({
      type: 'wb-image',
      src: m[2],
      alt: m[1] ?? '',
      version: 1,
    })
    last = m.index + m[0].length
  }
  if (last < text.length) {
    const rest = text.slice(last)
    if (rest) segments.push(makeTextNode(rest))
  }
  return segments.length > 0 ? segments : null
}

function transformNode(node: LexNode): void {
  const kids = node.children
  if (!Array.isArray(kids)) return
  const next: unknown[] = []
  for (const child of kids) {
    if (!child || typeof child !== 'object') {
      next.push(child)
      continue
    }
    const c = child as LexNode
    if (c.type === 'text' && typeof c.text === 'string') {
      const pieces = splitTextWithMarkdownImages(c.text)
      if (pieces) {
        next.push(...pieces)
        continue
      }
    }
    transformNode(c)
    next.push(child)
  }
  node.children = next
}

function promoteMarkdownImagesInLexicalJsonString(serialized: string): string {
  const doc = JSON.parse(serialized) as { root?: LexNode }
  if (!doc.root || typeof doc.root !== 'object') return serialized
  transformNode(doc.root)
  return JSON.stringify(doc)
}

/**
 * Coerce description to Lexical (if needed) and promote `![alt](url)` in text nodes to `wb-image`.
 */
export function coerceAndNormalizeIssueDescription(
  description: string | undefined | null
): string | undefined {
  if (description === undefined || description === null) return undefined
  if (!description.trim()) return description

  const lexical = stringToLexicalIssueDescription(description)
  if (!lexical.trim()) {
    return description
  }

  if (!isLexicalEditorStateJson(lexical)) {
    return lexical
  }

  try {
    return promoteMarkdownImagesInLexicalJsonString(lexical)
  } catch {
    return lexical
  }
}
