import { Stack } from '@thedatablitz/stack'
import { Text } from '@thedatablitz/text'
import styled from 'styled-components'

const Wrap = styled.div`
  padding: 2rem 2rem 4rem;
  max-width: 42rem;
`

type SettingsPlaceholderProps = {
  title: string
  description?: string
}

export function SettingsPlaceholder({
  title,
  description = 'This section is not wired yet.',
}: SettingsPlaceholderProps) {
  return (
    <Wrap>
      <Stack gap="200" fullWidth>
        <Text
          as="h1"
          variant="heading3"
          color="color.text.DEFAULT"
          style={{
            margin: 0,
            fontWeight: 800,
            letterSpacing: '-0.02em',
          }}
        >
          {title}
        </Text>
        <Text
          as="p"
          variant="body2"
          color="color.text.subtle"
          style={{ margin: 0, lineHeight: 1.55 }}
        >
          {description}
        </Text>
      </Stack>
    </Wrap>
  )
}
