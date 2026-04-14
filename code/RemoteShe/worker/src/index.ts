import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { ATS_COMPANIES } from './companies'
import type { Company } from './companies'

// ── Types ──────────────────────────────────────────────────────────────────────

type Bindings = {
  REMOTESHE: KVNamespace
}

export interface Job {
  id: string
  company_id: string
  title: string
  department: string | null
  location: string | null
  remote_type: string
  job_url: string
  posted_date: string
  description: string | null
  source: string
  companies: Company
}

// ── App ────────────────────────────────────────────────────────────────────────

const app = new Hono<{ Bindings: Bindings }>()

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

// ── GET /api/jobs ─────────────────────────────────────────────────────────────
// Returns cached jobs from KV. On first call (cache miss) it syncs live.

app.get('/api/jobs', async (c) => {
  let jobs = await c.env.REMOTESHE.get<Job[]>('cached_jobs', 'json')
  if (!jobs) {
    jobs = await syncAllJobs()
    await c.env.REMOTESHE.put('cached_jobs', JSON.stringify(jobs), {
      expirationTtl: 60 * 60 * 24 * 7, // 7 days
    })
  }
  return c.json(jobs)
})

// ── GET /api/jobs/:id ─────────────────────────────────────────────────────────

app.get('/api/jobs/:id', async (c) => {
  const jobs = (await c.env.REMOTESHE.get<Job[]>('cached_jobs', 'json')) ?? []
  const job = jobs.find(j => j.id === c.req.param('id'))
  if (!job) return c.json({ error: 'Not found' }, 404)
  return c.json(job)
})

// ── POST /api/subscribe ───────────────────────────────────────────────────────

app.post('/api/subscribe', async (c) => {
  const body = await c.req.json<{ email?: string; filters?: Record<string, unknown> }>()
  const { email, filters } = body
  if (!email || !email.includes('@')) {
    return c.json({ error: 'Valid email required' }, 400)
  }
  await c.env.REMOTESHE.put(
    `subscriber:${email}`,
    JSON.stringify({ email, filters: filters ?? {}, created_at: new Date().toISOString() }),
  )
  return c.json({ success: true })
})

// ── POST /api/admin/sync ──────────────────────────────────────────────────────
// Manual trigger — call this once after deploy to populate the cache.

app.post('/api/admin/sync', async (c) => {
  const jobs = await syncAllJobs()
  await c.env.REMOTESHE.put('cached_jobs', JSON.stringify(jobs))
  return c.json({ synced: jobs.length, synced_at: new Date().toISOString() })
})

// ── GET /api/health ───────────────────────────────────────────────────────────

app.get('/api/health', async (c) => {
  const cached = await c.env.REMOTESHE.get('cached_jobs')
  const jobs = cached ? JSON.parse(cached) as Job[] : []
  return c.json({ status: 'ok', cached_jobs: jobs.length })
})

// ── Exports ───────────────────────────────────────────────────────────────────
// Cloudflare Workers requires a default export with fetch + optional scheduled.

export default {
  fetch: app.fetch,

  // Cron trigger — runs every Monday at 8am UTC (configured in wrangler.toml)
  async scheduled(_event: ScheduledEvent, env: Bindings): Promise<void> {
    const jobs = await syncAllJobs()
    await env.REMOTESHE.put('cached_jobs', JSON.stringify(jobs))
    console.log(`[cron] synced ${jobs.length} jobs at ${new Date().toISOString()}`)
  },
}

// ── ATS sync ──────────────────────────────────────────────────────────────────

async function syncAllJobs(): Promise<Job[]> {
  const allJobs: Job[] = []

  for (const { company, ats_type, ats_slug } of ATS_COMPANIES) {
    try {
      let rawJobs: unknown[] = []

      if (ats_type === 'greenhouse') {
        const res = await fetch(
          `https://boards-api.greenhouse.io/v1/boards/${ats_slug}/jobs?content=true`,
        )
        if (!res.ok) {
          console.warn(`[sync] Greenhouse ${ats_slug} → ${res.status}`)
          continue
        }
        const data = await res.json() as { jobs?: unknown[] }
        rawJobs = data.jobs ?? []
      } else if (ats_type === 'lever') {
        const res = await fetch(
          `https://api.lever.co/v0/postings/${ats_slug}?mode=json`,
        )
        if (!res.ok) {
          console.warn(`[sync] Lever ${ats_slug} → ${res.status}`)
          continue
        }
        const data = await res.json()
        rawJobs = Array.isArray(data) ? data : []
      }

      for (const raw of rawJobs) {
        const r = raw as Record<string, unknown>

        // ── Location / remote filter ─────────────────────────────────────────
        const loc = (ats_type === 'greenhouse'
          ? ((r.location as Record<string, unknown>)?.name ?? '')
          : ((r as Record<string, Record<string, unknown>>).categories?.location ?? '')) as string
        const locL = loc.toLowerCase()
        const onSiteKeywords = ['on-site', 'onsite', 'in office', 'in-office', 'on site']
        if (onSiteKeywords.some(s => locL.includes(s))) continue
        const remoteKeywords = ['remote', 'worldwide', 'global', 'anywhere']
        if (locL !== '' && !remoteKeywords.some(s => locL.includes(s))) continue

        // ── Field extraction ─────────────────────────────────────────────────
        let id: string
        let title: string
        let department: string | null
        let jobUrl: string
        let postedDate: string
        let description: string | null

        if (ats_type === 'greenhouse') {
          id = `gh-${r.id}`
          title = (r.title as string) || 'Untitled'
          const depts = r.departments as Array<{ name: string }> | undefined
          department = depts?.[0]?.name ?? null
          jobUrl = (r.absolute_url as string) || ''
          postedDate = (r.updated_at as string) || new Date().toISOString()
          description = (r.content as string) || null
        } else {
          const cats = r.categories as Record<string, string> | undefined
          id = `lv-${r.id}`
          title = (r.text as string) || 'Untitled'
          department = cats?.team ?? null
          jobUrl = (r.applyUrl as string) || (r.hostedUrl as string) || ''
          postedDate = r.createdAt
            ? new Date(r.createdAt as number).toISOString()
            : new Date().toISOString()
          description = (r.description as string) || (r.additional as string) || null
        }

        if (!jobUrl) continue

        allJobs.push({
          id,
          company_id: company.id,
          title,
          department,
          location: loc || null,
          remote_type: 'Remote',
          job_url: jobUrl,
          posted_date: postedDate,
          description,
          source: 'ats_sync',
          companies: company,
        })
      }
    } catch (err) {
      console.error(`[sync] failed for ${company.name}:`, err)
    }
  }

  console.log(`[sync] total jobs: ${allJobs.length}`)
  return allJobs
}
