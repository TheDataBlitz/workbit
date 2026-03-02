import { useCallback, useState } from 'react'
import {
  Button,
  Card,
  Table,
  type ColumnDef,
  Alert,
  Heading,
  Text,
  Flex,
} from '@design-system'
import { useApiKeys, type CreateKeyResponse } from '../hooks/useApiKeys'
import { formatDateTime } from '../utils/format'
import { logError } from '../utils/errorHandling'

type KeyRow = {
  revoking?: boolean
  id: string
  name: string | null
  masked_key: string
  created_at: string
}

export function ApiKeysTab() {
  const { keys, loading, error, createKey, deleteKey } = useApiKeys()
  const [createdKey, setCreatedKey] = useState<CreateKeyResponse | null>(null)
  const [creating, setCreating] = useState(false)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)

  const handleCreate = useCallback(async () => {
    setCreating(true)
    setCreatedKey(null)
    setMutationError(null)
    try {
      const created = await createKey()
      setCreatedKey(created)
    } catch (e) {
      logError(e, 'ApiKeysTab.createKey')
      setMutationError((e as Error).message)
    } finally {
      setCreating(false)
    }
  }, [createKey])

  const handleCopy = useCallback((key: string) => {
    const obj = { apiKey: key }
    navigator.clipboard.writeText(JSON.stringify(obj, null, 2))
  }, [])

  const handleRevoke = useCallback(
    async (id: string) => {
      setRevokingId(id)
      setMutationError(null)
      try {
        await deleteKey(id)
      } catch (e) {
        logError(e, 'ApiKeysTab.revokeKey')
        setMutationError((e as Error).message)
      } finally {
        setRevokingId(null)
      }
    },
    [deleteKey]
  )

  const keyRows: KeyRow[] = keys.map((k) => ({
    ...k,
    revoking: revokingId === k.id,
  }))

  const columns: ColumnDef<KeyRow>[] = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'masked_key', header: 'Key' },
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ getValue }) => formatDateTime((getValue() as string) ?? ''),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Flex gap={2} wrap>
          {createdKey?.id === row.original.id && (
            <Button size="sm" onClick={() => handleCopy(createdKey.key)}>
              Copy full key
            </Button>
          )}
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleRevoke(row.original.id)}
            disabled={row.original.revoking}
          >
            {row.original.revoking ? 'Revoking…' : 'Revoke'}
          </Button>
        </Flex>
      ),
    },
  ]

  return (
    <Card>
      <Flex direction="column" gap={4}>
        <div style={{ padding: 16 }}>
          <Heading level={3}>API keys</Heading>
          <Text muted>
            Use these keys to authenticate with Workbit APIs (e.g. as{' '}
            <code>X-API-Key</code> or{' '}
            <code>Authorization: Bearer &lt;key&gt;</code>) or as{' '}
            <code>workbit-auth</code> in the Logbit SDK.
          </Text>
          {(error || mutationError) && (
            <Alert variant="error">{error ?? mutationError}</Alert>
          )}
          {createdKey && (
            <div
              style={{
                marginTop: 16,
                marginBottom: 16,
                padding: 12,
                background: 'var(--color-surface-secondary)',
                borderRadius: 8,
              }}
            >
              <Text as="div">
                <strong>
                  New key created — copy it now; it won't be shown again.
                </strong>
              </Text>
              <pre style={{ margin: '8px 0', overflow: 'auto' }}>
                {createdKey.key}
              </pre>
              <Button size="sm" onClick={() => handleCopy(createdKey.key)}>
                Copy to clipboard
              </Button>
            </div>
          )}
          <Flex gap={2}>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? 'Creating…' : 'Generate new key'}
            </Button>
          </Flex>
          {loading ? (
            <Text>Loading keys…</Text>
          ) : (
            <Table columns={columns} data={keyRows} />
          )}
        </div>
      </Flex>
    </Card>
  )
}
