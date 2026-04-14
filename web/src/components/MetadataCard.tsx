import { Stack } from '@thedatablitz/stack'
import { Text } from '@thedatablitz/text'
import { pdT } from '../pages/project-detail/pdTokens'
import styled from 'styled-components'
import type { projectDetailMock } from '../pages/project-detail/projectDetailMock'

const Root = styled.section`
  width: 100%;
  box-sizing: border-box;
  padding: ${pdT.space400};
  border-radius: ${pdT.radiusMd};
  background: ${pdT.surfaceRaised};
  border: 1px solid color-mix(in srgb, ${pdT.border} 35%, transparent);
`
const sectionKicker = {
  fontSize: 10,
  letterSpacing: '0.2em',
  textTransform: 'uppercase' as const,
  fontWeight: 700,
  opacity: 0.65,
}
const MetaRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: ${pdT.space200};
  padding: ${pdT.space200} 0;
  border-bottom: 1px solid ${pdT.border};

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  &:first-child {
    padding-top: 0;
  }
`

export const MetadataCard = ({ d }: { d: typeof projectDetailMock }) => {
  return (
    <Root>
      <Stack gap="200" fullWidth>
        <Text
          as="span"
          variant="caption2"
          color="color.text.subtle"
          style={sectionKicker}
        >
          {d.metadata.label}
        </Text>
        <Stack gap="0" fullWidth>
          {d.metadata.rows.map((row) => (
            <MetaRow key={row.key}>
              <Text
                as="span"
                variant="body4"
                color="color.text.subtle"
                style={{ flexShrink: 0 }}
              >
                {row.key}
              </Text>
              <Text
                as="span"
                variant="body4"
                color="color.text.DEFAULT"
                style={{
                  textAlign: 'right',
                  color: row.valueAccent ? pdT.brandBold : undefined,
                }}
              >
                {row.value}
              </Text>
            </MetaRow>
          ))}
        </Stack>
      </Stack>
    </Root>
  )
}
