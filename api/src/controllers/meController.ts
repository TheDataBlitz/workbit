import type { Request, Response } from 'express'
import * as meModel from '../models/me.js'
import * as issuesModel from '../models/issues.js'
import { getTeamById } from '../db/teams.js'
import { getProjectById } from '../db/projects.js'
import { getMemberByUid } from '../db/members.js'
import { getTeams as dbGetTeams } from '../db/teams.js'
import { getUserId } from '../middleware/auth.js'
import { logApiError } from '../utils/log.js'

const DEFAULT_USER_ID = 'current-user'

export async function getMember(req: Request, res: Response) {
  try {
    const userId = getUserId(req, '')
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }
    const member = await getMemberByUid(userId)
    if (!member) {
      res.status(404).json({ error: 'Member not found' })
      return
    }
    const teams = await dbGetTeams()
    const teamsById = new Map(teams.map((t) => [t.id, t]))
    const teamNames = member.teamIds
      .map((tid) => teamsById.get(tid)?.name)
      .filter(Boolean) as string[]
    res.json({
      id: member.id,
      name: member.name,
      username: member.username,
      avatarSrc: member.avatarSrc,
      status: member.status,
      joined: member.joined,
      provisioned: member.provisioned,
      uid: member.uid ?? member.userAuthId ?? null,
      teams: teamNames.length ? teamNames.join(', ') : '—',
    })
  } catch (e) {
    logApiError(e, 'me.getMember')
    res.status(500).json({ error: (e as Error).message })
  }
}

export async function getTeams(_req: Request, res: Response) {
  try {
    const teams = await meModel.getNavTeams()
    res.json(teams.map((t) => ({ id: t.id, name: t.name })))
  } catch (e) {
    logApiError(e, 'me.getTeams')
    res.status(500).json({ error: (e as Error).message })
  }
}

export async function getMyIssues(req: Request, res: Response) {
  try {
    const userId = getUserId(
      req,
      (req.headers['x-user-id'] as string) ?? DEFAULT_USER_ID
    )
    const issues = await issuesModel.getMyIssues(userId)
    const list = await Promise.all(
      issues.map(async (i) => {
        const [team, project] = await Promise.all([
          getTeamById(i.teamId),
          i.projectId ? getProjectById(i.projectId) : null,
        ])
        return {
          id: i.id,
          title: i.title,
          assignee: i.assigneeName
            ? { id: i.assigneeId ?? '', name: i.assigneeName }
            : null,
          date: i.date,
          status: i.status,
          team: team ? { id: i.teamId, name: team.name } : null,
          project: project ? { id: i.projectId!, name: project.name } : null,
        }
      })
    )
    res.json(list)
  } catch (e) {
    logApiError(e, 'me.getMyIssues')
    res.status(500).json({ error: (e as Error).message })
  }
}

export async function getNotifications(req: Request, res: Response) {
  try {
    const userId = getUserId(
      req,
      (req.headers['x-user-id'] as string) ?? DEFAULT_USER_ID
    )
    const first = req.query.first ? Number(req.query.first) : 50
    const notifications = await meModel.getNotifications(userId, first)
    const list = notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      read: n.read,
      createdAt: n.createdAt,
      actor: { id: n.actorId, name: n.actorName },
      targetUrl: n.targetUrl,
    }))
    res.json(list)
  } catch (e) {
    logApiError(e, 'me.getNotifications')
    res.status(500).json({ error: (e as Error).message })
  }
}
