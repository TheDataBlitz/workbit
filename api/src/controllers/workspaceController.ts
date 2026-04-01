import type { Request, Response } from 'express'
import * as workspaceModel from '../models/workspace.js'
import { logApiError } from '../utils/log.js'
import {
  findSupabaseUserByEmail,
  createSupabaseUserForMember,
} from '../utils/supabaseUsers.js'

function toErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (
    typeof err === 'object' &&
    err !== null &&
    'message' in err &&
    typeof (err as { message: unknown }).message === 'string'
  )
    return (err as { message: string }).message
  if (typeof err === 'string') return err
  return JSON.stringify(err)
}

function sendError(res: Response, err: unknown, status = 500) {
  res.status(status).json({ error: toErrorMessage(err) })
}

export async function getProjects(_req: Request, res: Response) {
  try {
    const list = await workspaceModel.getProjectsForApi()
    res.json(list)
  } catch (e) {
    logApiError(e, 'workspace.getProjects')
    sendError(res, e)
  }
}

export async function getTeams(req: Request, res: Response) {
  try {
    const workspaceId = req.query.workspaceId as string | undefined
    if (!workspaceId || typeof workspaceId !== 'string') {
      sendError(res, new Error('workspaceId is required'), 400)
      return
    }
    const memberId = req.query.memberId as string | undefined
    const list = await workspaceModel.getTeamsForApi(workspaceId, memberId)
    res.json(list)
  } catch (e) {
    logApiError(e, 'workspace.getTeams', { workspaceId: req.query.workspaceId })
    sendError(res, e)
  }
}

export async function createTeam(req: Request, res: Response) {
  try {
    const { workspaceId, name } = req.body as {
      workspaceId?: string
      name?: string
    }
    if (!workspaceId || typeof workspaceId !== 'string') {
      sendError(res, new Error('workspaceId is required'), 400)
      return
    }
    if (!name || typeof name !== 'string') {
      sendError(res, new Error('name is required'), 400)
      return
    }
    const team = await workspaceModel.createTeam({ workspaceId, name })
    res.status(201).json({
      id: team.id,
      name: team.name,
      memberCount: 0,
      project: null,
    })
  } catch (e) {
    logApiError(e, 'workspace.createTeam')
    sendError(res, e)
  }
}

export async function getMembers(_req: Request, res: Response) {
  try {
    const list = await workspaceModel.getMembersForApi()
    res.json(list)
  } catch (e) {
    logApiError(e, 'workspace.getMembers')
    sendError(res, e)
  }
}

export async function inviteMember(req: Request, res: Response) {
  try {
    const { email } = req.body as { email?: string }
    if (!email || typeof email !== 'string') {
      sendError(res, 'email is required', 400)
      return
    }
    const invitation = await workspaceModel.inviteMember(email)
    res.status(201).json(invitation)
  } catch (e) {
    logApiError(e, 'workspace.inviteMember')
    sendError(res, e)
  }
}

export async function createMember(req: Request, res: Response) {
  try {
    const { name, username, status, teamIds, email } = req.body as {
      name?: string
      username?: string
      status?: string
      teamIds?: string[]
      email?: string
    }

    if (!name || typeof name !== 'string') {
      sendError(res, 'name is required', 400)
      return
    }

    if (!username || typeof username !== 'string') {
      sendError(res, 'username is required', 400)
      return
    }

    if (!email || typeof email !== 'string') {
      sendError(res, 'email is required', 400)
      return
    }

    const memberStatus =
      typeof status === 'string' && status ? status : 'Member'

    let authUserId: string | null = null
    try {
      const existing = await findSupabaseUserByEmail(email)
      const user = existing ?? (await createSupabaseUserForMember(email))
      authUserId = user?.id ?? null
    } catch {
      authUserId = null
    }

    const member = await workspaceModel.createMember({
      name,
      username,
      status: memberStatus,
      email,
      teamIds: Array.isArray(teamIds) ? teamIds : [],
      uid: authUserId,
      userAuthId: authUserId,
      provisioned: Boolean(authUserId),
    })

    res.status(201).json(member)
  } catch (e) {
    logApiError(e, 'workspace.createMember')
    sendError(res, e)
  }
}

export async function provisionMember(req: Request, res: Response) {
  try {
    const { memberId } = req.params as { memberId: string }
    const { email } = req.body as { email?: string }

    if (!memberId) {
      sendError(res, 'memberId is required', 400)
      return
    }

    if (!email || typeof email !== 'string') {
      sendError(res, 'email is required', 400)
      return
    }

    const existing = await findSupabaseUserByEmail(email)
    const user = existing ?? (await createSupabaseUserForMember(email))

    if (!user || !user.id) {
      sendError(res, 'Failed to resolve Supabase user', 500)
      return
    }

    const member = await workspaceModel.provisionMember(memberId, user.id)

    res.status(200).json(member)
  } catch (e) {
    logApiError(e, 'workspace.provisionMember')
    sendError(res, e)
  }
}

export async function createProject(req: Request, res: Response) {
  try {
    const { name, description, teamId, status } = req.body as {
      name?: string
      description?: string
      teamId?: string
      status?: string
    }

    if (!name || typeof name !== 'string') {
      sendError(res, 'name is required', 400)
      return
    }

    if (!teamId || typeof teamId !== 'string') {
      sendError(res, 'teamId is required', 400)
      return
    }

    const { project, team } = await workspaceModel.createProject({
      name,
      description,
      teamId,
      status,
    })

    res.status(201).json({
      id: project.id,
      name: project.name,
      description: project.description,
      team: { id: team.id, name: team.name },
      status: project.status,
    })
  } catch (e) {
    logApiError(e, 'workspace.createProject')
    sendError(res, e)
  }
}
