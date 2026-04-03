import { Banner } from '@thedatablitz/banner'

/** Empty-state welcome for the InteleBit chat panel. */
export function InteleBitWelcomeBanner() {
  return (
    <Banner
      size="small"
      variant="ai"
      title="Welcome—I'm InteleBit."
      message="Glad you're here. Ask me anything about this project—questions, brainstorms, or a quick gut-check."
    />
  )
}
