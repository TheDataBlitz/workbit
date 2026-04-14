import { getToken, type ThemeName } from '@thedatablitz/tokens'

const THEME: ThemeName = 'dark'

/** Token helper for Intellebit Integration (matches ThemeProvider). */
export function itT(path: string): string {
  return getToken(path, THEME)
}
