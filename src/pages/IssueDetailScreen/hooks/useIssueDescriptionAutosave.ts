import { useCallback, useEffect, useRef } from 'react'
import { updateIssue } from '../../../api/client'
import { logError } from '../../../utils'
import { stringToLexicalEditorState } from '../../../utils/textEditorState'

type UseIssueDescriptionAutosaveParams = {
  issueId: string
  initialDescription?: string
  debounceMs?: number
}

export function useIssueDescriptionAutosave({
  issueId,
  initialDescription,
  debounceMs = 800,
}: UseIssueDescriptionAutosaveParams) {
  const descriptionLatestRef = useRef('')
  const descriptionLastSavedRef = useRef('')
  const descriptionDirtyRef = useRef(false)
  // `TextEditor` can fire `onChange` once on mount with an "empty" editor state.
  // Ignore autosave until we've hydrated refs from the latest `initialDescription`.
  const hydratedRef = useRef(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const issueIdRef = useRef(issueId)
  issueIdRef.current = issueId

  const saveDescription = useCallback(
    (json: string) => {
      descriptionLatestRef.current = json
      if (!hydratedRef.current) {
        // Keep latest in sync, but don't mark dirty / schedule saves yet.
        return
      }
      descriptionDirtyRef.current = true
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => {
        saveTimerRef.current = null
        if (!descriptionDirtyRef.current) return
        descriptionDirtyRef.current = false
        const normalized = stringToLexicalEditorState(
          descriptionLatestRef.current
        )
        if (normalized === descriptionLastSavedRef.current) return
        void updateIssue(issueIdRef.current, { description: normalized })
          .then(() => {
            descriptionLastSavedRef.current = normalized
          })
          .catch((e) => logError(e, 'Description update'))
      }, debounceMs)
    },
    [debounceMs]
  )

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
        saveTimerRef.current = null
      }
      if (descriptionDirtyRef.current) {
        descriptionDirtyRef.current = false
        const normalized = stringToLexicalEditorState(
          descriptionLatestRef.current
        )
        if (normalized !== descriptionLastSavedRef.current) {
          void updateIssue(issueIdRef.current, { description: normalized })
            .then(() => {
              descriptionLastSavedRef.current = normalized
            })
            .catch((e) => logError(e, 'Description update'))
        }
      }
    }
  }, [issueId])

  useEffect(() => {
    const normalized = stringToLexicalEditorState(initialDescription)
    descriptionLatestRef.current = normalized
    descriptionLastSavedRef.current = normalized
    descriptionDirtyRef.current = false
    hydratedRef.current = true
  }, [issueId, initialDescription])

  return { saveDescription }
}
