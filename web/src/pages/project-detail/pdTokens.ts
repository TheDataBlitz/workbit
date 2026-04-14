import { getToken, type ThemeName } from '@thedatablitz/tokens'

const THEME: ThemeName = 'dark'
const tk = (path: string) => getToken(path, THEME)

/** Project detail screen — dark theme tokens (aligned with `ThemeProvider`). */
export const pdT = {
  pageBg: tk('color.background.neutral.DEFAULT'),
  pageFg: tk('color.text.DEFAULT'),
  textSubtle: tk('color.text.subtle'),
  border: tk('color.border.DEFAULT'),
  surfaceRaised: tk('elevation.surface.raised.DEFAULT'),
  surfaceOverlay: tk('elevation.surface.overlay.DEFAULT'),
  brandBold: tk('color.background.brand.bold'),
  onPrimary: tk('component.button.primary.color'),
  iconSuccess: tk('color.icon.success'),
  iconWarning: tk('color.icon.warning'),
  neutralSubtle: tk('color.background.neutral.subtle'),
  tagPillBg: tk('component.tag.neutral.background'),
  space050: tk('space.050'),
  space100: tk('space.100'),
  space150: tk('space.150'),
  space200: tk('space.200'),
  space300: tk('space.300'),
  space400: tk('space.400'),
  space600: tk('space.600'),
  radiusMd: tk('radius.200'),
  motionStandard: tk('motion.duration.standard'),
  motionEasing: tk('motion.easing.standard'),
} as const
