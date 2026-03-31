import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from 'react'

import { Accordion } from '@thedatablitz/accordion'
import { Dropdown } from '@thedatablitz/dropdown'
import { Inline } from '@thedatablitz/inline'
import { Modal } from '@thedatablitz/modal'
import { Stack } from '@thedatablitz/stack'
import { Text } from '@thedatablitz/text'
import { Badge } from '@thedatablitz/badge'
import { TextInput as Input } from '@thedatablitz/text-input'
import { TextBox } from '@thedatablitz/textbox'
import { Box } from '@thedatablitz/box'
import { Alert } from '@thedatablitz/alert'

import {
  createProjectDecision,
  fetchProjectDecisions,
  updateProjectDecision,
} from '../../api/client'
import type {
  ApiDecision,
  ApiDecisionStatus,
  ApiDecisionType,
} from '../../api/client'
import { logError } from '../../utils/errorHandling'
import { formatDateTime } from '../../utils/format'
import type { DecisionForm, DecisionTabProps } from './types'
import { csvToArray, EMPTY_FORM, toCsv } from './utils/helpers'
import { Plus } from 'lucide-react'
import { Button } from '@thedatablitz/button'

export function DecisionTab({ projectId, issues, isActive }: DecisionTabProps) {
  const [items, setItems] = useState<ApiDecision[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<'all' | ApiDecisionType>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | ApiDecisionStatus>(
    'all'
  )
  const [mode, setMode] = useState<'mixed' | 'sequential'>('mixed')
  const [order, setOrder] = useState<'asc' | 'desc'>('desc')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<DecisionForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const typeOptions = [
    { value: 'all', label: 'All' },
    { value: 'major', label: 'Major' },
    { value: 'minor', label: 'Minor' },
  ] as const

  const statusOptions = [
    { value: 'all', label: 'All' },
    { value: 'proposed', label: 'Proposed' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'superseded', label: 'Superseded' },
  ] as const

  const modeOptions = [
    { value: 'mixed', label: 'Mixed (decision date + created at)' },
    { value: 'sequential', label: 'Sequential (created at)' },
  ] as const

  const orderOptions = [
    { value: 'desc', label: 'Newest first' },
    { value: 'asc', label: 'Oldest first' },
  ] as const

  const decisionTypeOptions = [
    { value: 'major', label: 'Major' },
    { value: 'minor', label: 'Minor' },
  ] as const

  const decisionStatusOptions = [
    { value: 'proposed', label: 'Proposed' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'superseded', label: 'Superseded' },
  ] as const

  const badgeVariantForType = (type: ApiDecisionType) =>
    type === 'major' ? 'warning' : 'info'

  const badgeVariantForStatus = (status: ApiDecisionStatus) => {
    if (status === 'approved') return 'success'
    if (status === 'rejected') return 'danger'
    if (status === 'superseded') return 'default'
    return 'info'
  }

  const issueMap = useMemo(() => {
    return new Map(issues.map((issue) => [issue.id, issue.title]))
  }, [issues])

  const load = useCallback(async () => {
    if (!projectId) {
      setItems([])
      return
    }

    setLoading(true)
    setError(null)
    try {
      const result = await fetchProjectDecisions(projectId, {
        type: typeFilter === 'all' ? undefined : typeFilter,
        status: statusFilter === 'all' ? undefined : statusFilter,
        mode,
        order,
        page: 1,
        pageSize: 100,
      })
      setItems(result.items)
    } catch (e) {
      logError(e, 'DecisionTab.load')
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [mode, order, projectId, statusFilter, typeFilter])

  useEffect(() => {
    if (!isActive) return
    void load()
  }, [isActive, load])

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setIsModalOpen(true)
  }

  const openEdit = (decision: ApiDecision) => {
    setEditingId(decision.id)
    setForm({
      title: decision.title,
      type: decision.type,
      status: decision.status,
      rationale: decision.rationale,
      impact: decision.impact ?? '',
      decisionDate: decision.decisionDate ?? '',
      tagsCsv: toCsv(decision.tags),
      linkedIssueIdsCsv: toCsv(decision.linkedIssueIds),
    })
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!projectId) return
    if (!form.title.trim() || !form.rationale.trim()) return

    setSaving(true)
    const payload = {
      title: form.title,
      type: form.type,
      status: form.status,
      rationale: form.rationale,
      impact: form.impact,
      decisionDate: form.decisionDate || undefined,
      tags: csvToArray(form.tagsCsv),
      linkedIssueIds: csvToArray(form.linkedIssueIdsCsv),
    }

    try {
      if (editingId) {
        await updateProjectDecision(projectId, editingId, payload)
      } else {
        await createProjectDecision(projectId, payload)
      }
      setIsModalOpen(false)
      setEditingId(null)
      setForm(EMPTY_FORM)
      await load()
    } catch (e) {
      logError(e, 'DecisionTab.save')
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Box border padding="400">
      <Stack gap="300">
        <Inline align="center" justify="space-between" gap="100" fullWidth>
          <Text variant="body3" color="color.text.subtle">
            Decisions log for roadmap changes and rationale
          </Text>
          <Button
            icon={<Plus size={12} />}
            variant="danger"
            onClick={openCreate}
            disabled={!projectId}
          >
            Add decision
          </Button>
        </Inline>

        <Inline gap="100" wrap fullWidth>
          <Stack gap="050">
            <Text variant="caption2" color="color.text.subtle">
              Type
            </Text>
            <Dropdown
              size="small"
              value={typeFilter}
              options={[...typeOptions]}
              onChange={(value) =>
                setTypeFilter(value as 'all' | ApiDecisionType)
              }
            />
          </Stack>

          <Stack gap="050">
            <Text variant="caption2" color="color.text.subtle">
              Status
            </Text>
            <Dropdown
              size="small"
              value={statusFilter}
              options={[...statusOptions]}
              onChange={(value) =>
                setStatusFilter(value as 'all' | ApiDecisionStatus)
              }
            />
          </Stack>

          <Stack gap="050">
            <Text variant="caption2" color="color.text.subtle">
              View mode
            </Text>
            <Dropdown
              size="small"
              value={mode}
              options={[...modeOptions]}
              onChange={(value) => setMode(value as 'mixed' | 'sequential')}
            />
          </Stack>

          <Stack gap="050">
            <Text variant="caption2" color="color.text.subtle">
              Sort
            </Text>
            <Dropdown
              size="small"
              value={order}
              options={[...orderOptions]}
              onChange={(value) => setOrder(value as 'asc' | 'desc')}
            />
          </Stack>
        </Inline>

        {loading ? (
          <Text variant="body3" color="color.text.subtle">
            Loading decisions...
          </Text>
        ) : error ? (
          <Alert
            variant="error"
            placement="inline"
            description={error}
            className="w-full"
          />
        ) : items.length === 0 ? (
          <Box>
            <Text variant="body3" color="color.text.subtle">
              No decisions logged yet
            </Text>
          </Box>
        ) : (
          <Accordion
            size="medium"
            items={items.map((decision) => ({
              id: decision.id,
              title: (
                <Stack gap="050" fullWidth>
                  <div style={{ minWidth: 0 }}>
                    <Text
                      variant="body3"
                      style={{
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {decision.title}
                    </Text>
                    <Text variant="caption2" color="color.text.subtle">
                      By {decision.createdBy.name} •{' '}
                      {formatDateTime(decision.createdAt)}
                    </Text>
                  </div>
                  <Button
                    size="small"
                    variant="glass"
                    onClick={(e) => {
                      e.stopPropagation()
                      openEdit(decision)
                    }}
                  >
                    Edit
                  </Button>
                </Stack>
              ),
              content: (
                <Stack gap="100">
                  <Inline gap="100" wrap>
                    <Badge
                      size="small"
                      variant={badgeVariantForType(decision.type)}
                      label={decision.type}
                    />
                    <Badge
                      size="small"
                      variant={badgeVariantForStatus(decision.status)}
                      label={decision.status}
                    />
                    <Badge
                      size="small"
                      variant="default"
                      label={`Decision date: ${decision.decisionDate ?? 'Not set'}`}
                      outlined
                    />
                  </Inline>

                  <Text variant="body3" style={{ whiteSpace: 'pre-wrap' }}>
                    {decision.rationale}
                  </Text>
                  {decision.impact ? (
                    <Text variant="body3" color="color.text.subtle">
                      Impact: {decision.impact}
                    </Text>
                  ) : null}

                  {decision.tags.length > 0 ? (
                    <Inline gap="050" wrap>
                      {decision.tags.map((tag) => (
                        <Badge
                          key={`${decision.id}:tag:${tag}`}
                          size="small"
                          variant="default"
                          label={`#${tag}`}
                        />
                      ))}
                    </Inline>
                  ) : null}

                  {decision.linkedIssueIds.length > 0 && (
                    <Stack gap="050">
                      {decision.linkedIssueIds.length > 0 ? (
                        <Text variant="caption2" color="color.text.subtle">
                          Issues:{' '}
                          {decision.linkedIssueIds
                            .map((id) => issueMap.get(id) ?? id)
                            .join(', ')}
                        </Text>
                      ) : null}
                    </Stack>
                  )}
                </Stack>
              ),
            }))}
          />
        )}
      </Stack>
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit decision' : 'Add decision'}
        size="large"
        footer={
          <Inline justify="flex-end" gap="100" fullWidth>
            <Button variant="glass" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Save changes' : 'Create'}
            </Button>
          </Inline>
        }
      >
        <Stack gap="300">
          <Input
            value={form.title}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, title: e.target.value }))
            }
            placeholder="Decision title"
          />
          <Inline gap="100" wrap fullWidth>
            <Stack gap="050">
              <Text variant="caption2" color="color.text.subtle">
                Type
              </Text>
              <Dropdown
                size="small"
                value={form.type}
                options={[...decisionTypeOptions]}
                onChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    type: value as ApiDecisionType,
                  }))
                }
              />
            </Stack>
            <Stack gap="050">
              <Text variant="caption2" color="color.text.subtle">
                Status
              </Text>
              <Dropdown
                size="small"
                value={form.status}
                options={[...decisionStatusOptions]}
                onChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    status: value as ApiDecisionStatus,
                  }))
                }
              />
            </Stack>
            <Stack gap="050">
              <Text variant="caption2" color="color.text.subtle">
                Decision date
              </Text>
              <Input
                value={form.decisionDate}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, decisionDate: e.target.value }))
                }
                placeholder="YYYY-MM-DD"
              />
            </Stack>
          </Inline>

          <Input
            value={form.impact}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, impact: e.target.value }))
            }
            placeholder="Impact summary (optional)"
          />

          <TextBox
            value={form.rationale}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
              setForm((prev) => ({ ...prev, rationale: e.target.value }))
            }
            label="Rationale"
            size="medium"
            fullWidth
          />
          <Input
            value={form.tagsCsv}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, tagsCsv: e.target.value }))
            }
            placeholder="Tags (comma separated)"
          />
          <Input
            value={form.linkedIssueIdsCsv}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                linkedIssueIdsCsv: e.target.value,
              }))
            }
            placeholder="Linked issue IDs (comma separated)"
          />
        </Stack>
      </Modal>
    </Box>
  )
}
