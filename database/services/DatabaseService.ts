type QueryOptions = {
  select?: string
  order?: string
  limit?: number
  eq?: Record<string, string>
}

type RequestOptions = {
  method: 'GET' | 'POST' | 'PATCH'
  query?: QueryOptions
  body?: unknown
}

function databaseLog(event: string, details: Record<string, unknown> = {}) {
  console.log(JSON.stringify({ scope: 'database', event, ...details }))
}

function buildQuery(options?: QueryOptions) {
  const params = new URLSearchParams()
  if (options?.select) params.set('select', options.select)
  if (options?.order) params.set('order', options.order)
  if (options?.limit !== undefined) params.set('limit', String(options.limit))

  for (const [key, value] of Object.entries(options?.eq ?? {})) {
    params.set(key, `eq.${value}`)
  }

  const query = params.toString()
  return query ? `?${query}` : ''
}

export class DatabaseService {
  private readonly url: string
  private readonly key: string
  private readonly enabled: boolean

  constructor() {
    this.url = process.env.SUPABASE_URL ?? ''
    this.key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || ''
    this.enabled = Boolean(this.url && this.key)

    databaseLog(this.enabled ? 'connected' : 'disabled', {
      reason: this.enabled ? undefined : 'Supabase environment variables are not configured.',
    })
  }

  isEnabled() {
    return this.enabled
  }

  async request<T>(table: string, options: RequestOptions): Promise<T | null> {
    if (!this.enabled) return null

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    try {
      const response = await fetch(`${this.url}/rest/v1/${table}${buildQuery(options.query)}`, {
        method: options.method,
        headers: {
          apikey: this.key,
          Authorization: `Bearer ${this.key}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: controller.signal,
      })

      if (!response.ok) {
        const message = await response.text().catch(() => '')
        databaseLog('error', { table, method: options.method, status: response.status, message })
        return null
      }

      if (response.status === 204) return null
      return (await response.json()) as T
    } catch (error) {
      databaseLog('error', {
        table,
        method: options.method,
        message: error instanceof Error ? error.message : String(error),
      })
      return null
    } finally {
      clearTimeout(timeout)
    }
  }

  async insert<T>(table: string, record: Record<string, unknown> | Record<string, unknown>[]) {
    const response = await this.request<T[]>(table, { method: 'POST', body: record })
    if (response) databaseLog('record_inserted', { table, count: Array.isArray(record) ? record.length : 1 })
    return response?.[0] as T | undefined
  }

  async update<T>(table: string, eq: Record<string, string>, patch: Record<string, unknown>) {
    const response = await this.request<T[]>(table, { method: 'PATCH', query: { eq }, body: patch })
    if (response) databaseLog('record_updated', { table, count: response.length })
    return response?.[0] as T | undefined
  }

  async select<T>(table: string, query: QueryOptions = {}) {
    return (await this.request<T[]>(table, { method: 'GET', query })) ?? []
  }
}

export const databaseService = new DatabaseService()
