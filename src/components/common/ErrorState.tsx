import { Alert } from '@thedatablitz/alert'
import { Box } from '@thedatablitz/box'
import { Stack } from '@thedatablitz/stack'

interface Props {
  message?: string
  error?: string | null
  fullHeight?: boolean
}

export function ErrorState({ message, error, fullHeight }: Props) {
  const displayMessage = error || message || 'An error occurred'

  return (
    <div
      style={{
        textAlign: 'center',
        ...(fullHeight
          ? {
              minHeight: 200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }
          : {}),
      }}
    >
      <Box padding="400">
        <Stack gap="150" align="center">
          <Alert
            variant="error"
            placement="inline"
            description={displayMessage}
            className="max-w-md text-left"
          />
        </Stack>
      </Box>
    </div>
  )
}
