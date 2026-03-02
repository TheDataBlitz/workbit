export interface WorkbitInitConfig {
  apiKey: string
  baseUrl?: string
}

export interface CreateIssueParams {
  title: string
  projectId: string
  body?: string
}

export interface CreatedIssue {
  id: string
  title: string
  description?: string
  date: string
  status: string
  teamId: string
  projectId?: string
  assignee?: { id: string; name: string } | null
  team?: { id: string; name: string } | null
  project?: { id: string; name: string } | null
}

let config: { apiKey: string; baseUrl: string } | null = null

const DEFAULT_BASE_URL = 'http://localhost:3001'

export const workbit = {
  init(cfg: WorkbitInitConfig): void {
    config = {
      apiKey: cfg.apiKey,
      baseUrl: cfg.baseUrl ?? DEFAULT_BASE_URL,
    }
  },

  async issue(params: CreateIssueParams): Promise<CreatedIssue> {
    if (!config) {
      throw new Error(
        'Workbit SDK not initialized. Call workbit.init({ apiKey, baseUrl? }) first.'
      )
    }
    const url = `${config.baseUrl.replace(/\/$/, '')}/api/v1/issues`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
      },
      body: JSON.stringify({
        project_id: params.projectId,
        title: params.title,
        description: params.body,
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      const msg = (data as { error?: string }).error ?? res.statusText
      throw new Error(msg)
    }
    return data as CreatedIssue
  },
}
