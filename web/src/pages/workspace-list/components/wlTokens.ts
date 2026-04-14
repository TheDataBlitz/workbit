import { getToken, type ThemeName } from '@thedatablitz/tokens'

/** Matches `ThemeProvider` in `main.tsx` — all `getToken` lookups use this theme. */
export const WL_THEME: ThemeName = 'dark'

export const wlTk = (path: string) => getToken(path, WL_THEME)

export const wlT = {
  pageBg: wlTk('color.background.neutral.DEFAULT'),
  pageFg: wlTk('color.text.DEFAULT'),
  textSubtle: wlTk('color.text.subtle'),
  selectionBg: wlTk('component.button.primary.background'),
  selectionFg: wlTk('component.button.primary.color'),
  border: wlTk('color.border.DEFAULT'),
  surfaceCard: wlTk('color.background.neutral.subtle'),
  surfaceSunken: wlTk('elevation.surface.sunken'),
  tagPillBg: wlTk('component.tag.neutral.background'),
  tagPillFg: wlTk('component.tag.neutral.color'),
  brandBold: wlTk('color.background.brand.bold'),
  brandSubtle: wlTk('color.background.brand.subtle'),
  /** Matches Stitch `secondary-container` accent (sync bar, etc.). */
  secondaryStrong: wlTk('component.button.secondary.background'),
  gradientA: wlTk('component.tag.primary.accent'),
  gradientB: wlTk('component.button.secondary.color'),
  gradientC: wlTk('color.background.brand.bold'),
  iconSubtle: wlTk('color.icon.subtle'),
  blurLg: wlTk('effects.backdrop.blur.lg'),
  space050: wlTk('space.050'),
  space100: wlTk('space.100'),
  space150: wlTk('space.150'),
  space200: wlTk('space.200'),
  space400: wlTk('space.400'),
  space600: wlTk('space.600'),
  radiusSm: wlTk('radius.050'),
  radiusMd: wlTk('radius.200'),
  radiusFull: wlTk('radius.full'),
  motionStandard: wlTk('motion.duration.standard'),
  motionEasing: wlTk('motion.easing.standard'),
} as const
