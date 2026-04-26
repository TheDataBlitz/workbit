/**
 * Monorepo lint-staged config.
 *
 * Keep this fast and non-destructive: run package-level lint/typecheck
 * against staged changes, without rewriting files on commit.
 */
module.exports = {
  // Frontend
  'web/**/*.{ts,tsx,js,jsx}': () => ['npm --prefix web run lint'],
  // API
  // API package doesn't ship eslint in devDependencies; use typecheck instead.
  'api/**/*.{ts,js}': () => ['npm --prefix api run build'],
}

