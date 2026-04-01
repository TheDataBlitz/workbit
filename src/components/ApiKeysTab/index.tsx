import { useCallback, useMemo, useState } from 'react'
import { Check, Copy, Plus, Shield, ShieldAlert, Trash2 } from 'lucide-react'

import { Badge, type BadgeVariant } from '@thedatablitz/badge'
import { Alert } from '@thedatablitz/alert'
import { Banner } from '@thedatablitz/banner'
import { Button } from '@thedatablitz/button'
import { Inline } from '@thedatablitz/inline'
import { Modal } from '@thedatablitz/modal'
import { Stack } from '@thedatablitz/stack'
import { Table, type ColumnDef } from '@thedatablitz/table'
import { Text } from '@thedatablitz/text'
import { TextInput } from '@thedatablitz/text-input'
import { Box } from '@thedatablitz/box'
import { useApiKeys, type CreateKeyResponse } from '../../hooks/useApiKeys'
import { logError } from '../../utils/errorHandling'
import { formatDateTime, formatRelativeTime } from '../../utils/format'
import { MonospaceKey } from './styles'
import type { KeyRow } from './types'
import {
  badgeColorForEnvironment,
  copyLabel,
  maskForPreview,
} from './utils/helpers'

export function ApiKeysTab() {
  const { keys, error, createKey, deleteKey } = useApiKeys()
  const [nameInput, setNameInput] = useState('')
  const [createdKey, setCreatedKey] = useState<CreateKeyResponse | null>(null)
  const [creating, setCreating] = useState(false)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [revokeCandidate, setRevokeCandidate] = useState<KeyRow | null>(null)
  const [revealCreatedKey, setRevealCreatedKey] = useState(false)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)

  const clearCopiedState = useCallback(() => {
    window.setTimeout(() => {
      setCopiedToken(null)
    }, 1400)
  }, [])

  const handleCreate = useCallback(async () => {
    if (creating) return
    setCreating(true)
    setCreatedKey(null)
    setMutationError(null)
    setSuccessMessage(null)
    try {
      const created = await createKey(nameInput.trim() || undefined)
      setCreatedKey(created)
      setRevealCreatedKey(false)
      setNameInput('')
      setSuccessMessage(
        'New API key created. Copy it now because it will not be shown again.'
      )
    } catch (e) {
      logError(e, 'ApiKeysTab.createKey')
      setMutationError((e as Error).message)
    } finally {
      setCreating(false)
    }
  }, [createKey, creating, nameInput])

  const handleCopy = useCallback(
    async (text: string, token: string, label: string) => {
      setMutationError(null)
      setSuccessMessage(null)
      try {
        await navigator.clipboard.writeText(text)
        setCopiedToken(token)
        setSuccessMessage(`${label} copied to clipboard.`)
        clearCopiedState()
      } catch (e) {
        logError(e, 'ApiKeysTab.copyKey')
        setMutationError('Could not copy to clipboard. Please copy manually.')
      }
    },
    [clearCopiedState]
  )

  const handleOpenRevoke = useCallback((row: KeyRow) => {
    setRevokeCandidate(row)
    setMutationError(null)
    setSuccessMessage(null)
  }, [])

  const handleCloseRevoke = useCallback(() => {
    if (revokingId != null) return
    setRevokeCandidate(null)
  }, [revokingId])

  const handleConfirmRevoke = useCallback(async () => {
    if (!revokeCandidate || revokingId != null) return
    setRevokingId(revokeCandidate.id)
    setMutationError(null)
    setSuccessMessage(null)
    try {
      await deleteKey(revokeCandidate.id)
      setSuccessMessage('API key revoked successfully.')
      setRevokeCandidate(null)
    } catch (e) {
      logError(e, 'ApiKeysTab.revokeKey')
      setMutationError((e as Error).message)
    } finally {
      setRevokingId(null)
    }
  }, [deleteKey, revokeCandidate, revokingId])

  const columns = useMemo<ColumnDef<KeyRow, unknown>[]>(
    () => [
      {
        id: 'name',
        // Table cell renderer bails out when getValue() is null; datablitz Table
        // does not fall through to `cell` unless accessor yields a value.
        accessorFn: (row) => row.name?.trim() || 'Untitled key',
        header: 'Key name',
        cell: ({ row }) => (
          <Text variant="body2">
            {row.original.name?.trim() || 'Untitled key'}
          </Text>
        ),
      },
      {
        id: 'preview',
        accessorKey: 'masked_key',
        header: 'Key preview',
        cell: ({ row }) => (
          <MonospaceKey>{row.original.masked_key}</MonospaceKey>
        ),
      },
      {
        id: 'created',
        accessorKey: 'created_at',
        header: 'Created / Last used',
        cell: ({ row }) => {
          const lastUsed = row.original.last_used_at
            ? `${formatRelativeTime(row.original.last_used_at)} (${formatDateTime(row.original.last_used_at)})`
            : 'Never used'
          return (
            <Stack gap="025">
              <Text variant="body3">
                {formatDateTime(row.original.created_at)}
              </Text>
              <Text variant="body3" color="color.text.subtle">
                Last used: {lastUsed}
              </Text>
            </Stack>
          )
        },
      },
      {
        id: 'tags',
        accessorFn: (row) =>
          [
            row.environment ?? 'Live',
            ...(row.permissions?.length ? row.permissions : ['Full access']),
          ].join(' '),
        header: 'Environment / Permissions',
        cell: ({ row }) => {
          const permissions =
            row.original.permissions && row.original.permissions.length > 0
              ? row.original.permissions
              : ['Full access']
          const environment = row.original.environment ?? 'Live'
          return (
            <Inline gap="050" wrap>
              <Badge
                variant={badgeColorForEnvironment(environment) as BadgeVariant}
                size="small"
              >
                {environment}
              </Badge>
              {permissions.map((permission) => (
                <Badge
                  key={`${row.original.id}-${permission}`}
                  variant="default"
                  size="small"
                >
                  {permission}
                </Badge>
              ))}
            </Inline>
          )
        },
      },
      {
        id: 'actions',
        accessorKey: 'id',
        header: 'Actions',
        cell: ({ row }) => (
          <Inline gap="050" wrap>
            <Button
              size="small"
              variant="glass"
              onClick={() =>
                handleCopy(
                  row.original.masked_key,
                  `masked:${row.original.id}`,
                  'Masked key preview'
                )
              }
              aria-label={`Copy masked key for ${row.original.name ?? row.original.id}`}
            >
              {copiedToken === `masked:${row.original.id}` ? (
                <Check size={14} />
              ) : (
                <Copy size={14} />
              )}
              {copyLabel(
                copiedToken,
                `masked:${row.original.id}`,
                'Copy preview'
              )}
            </Button>
            <Button
              size="small"
              variant="danger"
              onClick={() => handleOpenRevoke(row.original)}
              disabled={row.original.revoking}
              aria-label={`Revoke key ${row.original.name ?? row.original.id}`}
            >
              <Trash2 size={14} />
              {row.original.revoking ? 'Revoking...' : 'Revoke key'}
            </Button>
          </Inline>
        ),
      },
    ],
    [copiedToken, handleCopy, handleOpenRevoke]
  )

  return (
    <>
      <Stack gap="100">
        <Banner
          variant="warning"
          message={
            <>
              <Inline align="center" gap="050">
                <ShieldAlert size={16} />
                <Text variant="heading7" color="color.text.inverse">
                  For security, full keys are shown only once at creation. Copy
                  and store the key in your secure secret manager immediately.
                </Text>
              </Inline>
              <Text variant="body3" color="color.text.inverse">
                If a key is exposed, revoke it right away and create a new one.
              </Text>
            </>
          }
        />

        <Stack gap="100">
          <Inline gap="100">
            <TextInput
              value={nameInput}
              placeholder="Optional name, e.g. CI deploy key"
              onChange={(e) => setNameInput(e.target.value)}
              aria-label="API key name"
              startIcon={<Shield size={15} />}
            />
            <Button
              onClick={handleCreate}
              disabled={creating}
              icon={<Plus size={15} />}
              aria-label="Create API key"
            >
              {creating ? 'Creating key...' : 'Create API key'}
            </Button>
          </Inline>
        </Stack>

        {(error || mutationError) && (
          <Alert
            variant="error"
            placement="inline"
            description={error ?? mutationError ?? ''}
            className="w-full"
          />
        )}

        {createdKey && (
          <Box border>
            <Stack padding="100" gap="100">
              <Banner variant="success" message={successMessage} />
              <Stack gap="050">
                <Text variant="body3" as="div">
                  <strong>New key ready.</strong> Copy it now. You will not be
                  able to see it again.
                </Text>
                <MonospaceKey>
                  {revealCreatedKey
                    ? createdKey.key
                    : maskForPreview(createdKey.key)}
                </MonospaceKey>
              </Stack>
              <Inline gap="050">
                <Button
                  size="small"
                  onClick={() =>
                    handleCopy(
                      createdKey.key,
                      `full:${createdKey.id}`,
                      'API key'
                    )
                  }
                >
                  {copiedToken === `full:${createdKey.id}` ? (
                    <Check size={14} />
                  ) : (
                    <Copy size={14} />
                  )}
                  {copyLabel(copiedToken, `full:${createdKey.id}`, 'Copy key')}
                </Button>
                <Button
                  size="small"
                  variant="glass"
                  onClick={() => setRevealCreatedKey((v) => !v)}
                >
                  {revealCreatedKey ? 'Hide key' : 'Show key'}
                </Button>
                <Button
                  size="small"
                  variant="glass"
                  onClick={() => setCreatedKey(null)}
                >
                  Dismiss
                </Button>
              </Inline>
            </Stack>
          </Box>
        )}

        <Stack gap="100">
          <Inline align="center" gap="100">
            <Text variant="heading5">Active keys</Text>
            <Badge variant="default" size="small">
              {keys.length} {keys.length === 1 ? 'key' : 'keys'}
            </Badge>
          </Inline>

          <Table<KeyRow> data={keys} columns={columns} />
        </Stack>
      </Stack>

      <Modal
        open={revokeCandidate != null}
        onClose={handleCloseRevoke}
        title="Revoke API key"
        size="medium"
        footer={
          <Inline justify="flex-end" gap="100" fullWidth>
            <Button
              variant="glass"
              onClick={handleCloseRevoke}
              disabled={revokingId != null}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => void handleConfirmRevoke()}
              disabled={revokingId != null}
            >
              {revokingId ? 'Revoking...' : 'Revoke key'}
            </Button>
          </Inline>
        }
      >
        <Text variant="body3">
          This action cannot be undone. Any integration using this key will lose
          access immediately.
        </Text>
        <div style={{ marginTop: 10 }}>
          <Text variant="body3" color="color.text.subtle" as="div">
            Key name
          </Text>
          <Text variant="body3" as="div">
            {revokeCandidate?.name?.trim() || 'Untitled key'}
          </Text>
          <Text variant="body3" color="color.text.subtle" as="div">
            Key preview
          </Text>
          <MonospaceKey style={{ marginTop: 4, marginBottom: 0 }}>
            {revokeCandidate?.masked_key ?? ''}
          </MonospaceKey>
        </div>
      </Modal>
    </>
  )
}
