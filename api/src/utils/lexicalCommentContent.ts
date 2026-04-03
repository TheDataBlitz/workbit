type LexChild = Record<string, unknown>

export function isLexicalEditorStateJson(value: string): boolean {
  const t = value.trim()
  if (!t.startsWith('{')) return false
  try {
    const o = JSON.parse(t) as { root?: LexChild }
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

/** Plain text approximation (block children joined with newlines). */
export function lexicalSerializedApproxPlainText(serialized: string): string {
  const doc = JSON.parse(serialized) as { root: LexChild }
  return rootPlainText(doc.root)
}

function collectBlockText(node: LexChild): string {
  if (node.type === 'text' && typeof node.text === 'string') {
    return node.text.replace(/\u00a0/g, ' ')
  }
  if (!Array.isArray(node.children)) return ''
  return node.children.map((ch) => collectBlockText(ch as LexChild)).join('')
}

function rootPlainText(root: LexChild): string {
  if (!Array.isArray(root.children)) return ''
  const segments: string[] = []
  for (const child of root.children) {
    segments.push(collectBlockText(child as LexChild))
  }
  return segments.join('\n')
}

/** True if persisted comment body is empty (plain or Lexical JSON). */
export function isSerializedCommentEmpty(content: string): boolean {
  if (!content.trim()) return true
  if (isLexicalEditorStateJson(content)) {
    return lexicalSerializedApproxPlainText(content).trim() === ''
  }
  return false
}
