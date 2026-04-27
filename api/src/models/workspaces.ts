import { generateId } from './store.js'
import type { Workspace } from './types.js'
import * as dbWorkspaces from '../db/workspaces.js'

export async function getWorkspacesByMemberId(
  memberId: string
): Promise<Workspace[]> {
  return dbWorkspaces.getWorkspacesByMemberId(memberId)
}

export async function createWorkspace(input: {
  name: string
  slug: string
  region?: string
  memberId: string
}): Promise<Workspace> {
  const existing = await dbWorkspaces.getWorkspaceBySlug(input.slug)
  if (existing) {
    const error = new Error('Workspace URL is already reserved')
    ;(error as Error & { code?: string }).code = 'WORKSPACE_SLUG_TAKEN'
    throw error
  }

  const workspace: Workspace = {
    id: generateId(),
    name: input.name,
    slug: input.slug,
    region: input.region ?? 'us',
    memberIds: [input.memberId],
  }

  await dbWorkspaces.insertWorkspace(workspace)
  return workspace
}

export async function updateWorkspace(input: {
  workspaceId: string
  name?: string
  slug?: string
  region?: string
}): Promise<Workspace | null> {
  const existing = await dbWorkspaces.getWorkspaceById(input.workspaceId)
  if (!existing) return null

  const nextSlug = input.slug?.trim()
  if (nextSlug && nextSlug.toLowerCase() !== existing.slug.toLowerCase()) {
    const reserved = await dbWorkspaces.getWorkspaceBySlug(nextSlug)
    if (reserved && reserved.id !== existing.id) {
      const error = new Error('Workspace URL is already reserved')
      ;(error as Error & { code?: string }).code = 'WORKSPACE_SLUG_TAKEN'
      throw error
    }
  }

  return dbWorkspaces.updateWorkspace(input.workspaceId, {
    ...(input.name !== undefined && { name: input.name }),
    ...(input.slug !== undefined && { slug: input.slug }),
    ...(input.region !== undefined && { region: input.region }),
  })
}
