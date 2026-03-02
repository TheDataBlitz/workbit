/**
 * Run with: npm run seed (from api folder: cd api && npm run seed)
 *
 * - File store: writes one data.json.
 * - Supabase: writes to separate tables in dependency order (roles → members → teams
 *   → projects → views → invitations → project_properties → status_updates →
 *   status_update_comments → milestones → activity → issues → notifications).
 *   Run api/scripts/create-separate-tables.sql in Supabase first if tables are missing.
 */
import '../loadEnv.js'
import { init as initLogbit, logbit } from '@thedatablitz/logbit-sdk'
import { LOGBIT_PROJECT_ID } from '../utils/log.js'
import { seedDummy } from '../utils/seed.js'

initLogbit({
  service: 'workbit-api',
  env: process.env.NODE_ENV ?? 'development',
  release: process.env.APP_VERSION ?? '0.0.1',
})

async function main() {
  await seedDummy()
  logbit.info('Dummy data seeded successfully.', {
    projectId: LOGBIT_PROJECT_ID,
    title: 'Dummy data seeded successfully',
  })
  process.exit(0)
}

main().catch((err) => {
  const msg = err?.message ?? String(err)
  if (
    msg.includes('Could not find the table') ||
    (msg.includes('does not exist') && msg.includes('relation'))
  ) {
    logbit.error('Seed failed: Supabase tables are missing', {
      projectId: LOGBIT_PROJECT_ID,
      title: 'Seed failed: Supabase tables are missing',
      hint: 'Run api/scripts/create-separate-tables.sql in Supabase Dashboard → SQL Editor, then run: cd api && npm run seed',
    })
  } else {
    logbit.error('Seed failed', {
      projectId: LOGBIT_PROJECT_ID,
      title: 'Seed failed',
      error: msg,
      stack: err instanceof Error ? err.stack : undefined,
    })
  }
  process.exit(1)
})
