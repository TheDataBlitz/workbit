/**
 * Lexical helpers for Workbit issue (and similar) bodies.
 *
 * **Images in documents:** Prefer storing `wb-image` nodes with `src` as a
 * stable **HTTPS URL** (e.g. S3 or Supabase Storage) after upload. That keeps
 * rows small, avoids JSON body limits, and allows caching/CDN. Inline `data:`
 * URIs are convenient for one-off MCP/tooling but inflate payloads and are
 * harder to migrate.
 *
 * Markdown → Lexical via `@thedatablitz/text-editor` leaves `![alt](url)` as
 * literal text; this module promotes those segments to `wb-image` nodes.
 */

export function isLexicalEditorStateJson(value: string): boolean {
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

export function promoteMarkdownImagesInLexicalJsonString(
  serialized: string
): string {
  const doc = JSON.parse(serialized) as { root?: LexNode }
  if (!doc.root || typeof doc.root !== 'object') return serialized
  transformNode(doc.root)
  return JSON.stringify(doc)
}

/** Normalizes persisted issue descriptions that are Lexical JSON. */
export function normalizeIssueDescriptionLexical(
  description: string | undefined | null
): string | undefined {
  if (description === undefined || description === null) return undefined
  if (!description.trim()) return description
  if (!isLexicalEditorStateJson(description)) return description
  try {
    return promoteMarkdownImagesInLexicalJsonString(description)
  } catch {
    return description
  }
}
