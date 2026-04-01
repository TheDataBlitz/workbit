import { convertToLexicalJson } from '@thedatablitz/text-editor'

/**
 * True when serialized Lexical JSON (from {@link @thedatablitz/text-editor#TextEditor}
 * `onChange`) contains any non-whitespace text. Use this instead of
 * `lexicalJsonToPlainText` for enable/disable logic: the package helper uses a reduced
 * node set and can throw or return "" for valid full-editor JSON.
 */
export function lexicalSerializedHasNonWhitespaceText(
  serialized: string
): boolean {
  if (!serialized.trim()) return false
  try {
    const parsed = JSON.parse(serialized) as { root?: unknown }
    return walkLexicalJsonForText(parsed?.root)
  } catch {
    return false
  }
}

function walkLexicalJsonForText(node: unknown): boolean {
  if (node == null || typeof node !== 'object') return false
  const n = node as Record<string, unknown>
  if (typeof n.text === 'string' && n.text.trim() !== '') return true
  const children = n.children
  if (Array.isArray(children)) {
    return children.some((c) => walkLexicalJsonForText(c))
  }
  return false
}

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

/**
 * Normalizes persisted editor strings for {@link @thedatablitz/text-editor#TextEditor}:
 * - Lexical serialized JSON (object with non-empty `root.children`) is returned as-is
 * - Otherwise treated as Markdown and converted to Lexical JSON
 *
 * Returns `''` when there is no content — TextEditor then omits `editorState` and uses a
 * valid default tree. Passing Lexical JSON with an empty `root` causes
 * `setEditorState: the editor state is empty`.
 */
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
    // not JSON — treat as markdown
  }

  try {
    const converted = convertToLexicalJson(s, 'markdown')
    return lexicalJsonHasBlockContent(converted) ? converted : ''
  } catch {
    return ''
  }
}
