// Single source of truth for fetching jobs from the Cloudflare Worker.
// Replaces the old fetchJobsFromTable (Supabase REST) and jobsAPI (Supabase Edge Function).

const WORKER_URL = import.meta.env.VITE_WORKER_URL as string

if (!WORKER_URL) {
  console.warn('VITE_WORKER_URL is not set. Copy .env.example to .env and fill in the Worker URL.')
}

export interface JobFilters {
  search?: string
  remote_type?: string
  min_maternity_leave?: number
  ivf_coverage?: boolean
  childcare_support?: boolean
  min_carefolio_score?: number
  min_salary?: number
  department?: string
}

// Keywords that indicate non-knowledge-work roles — excluded from results
const EXCLUDE_KEYWORDS = [
  'roofer', 'roofing', 'plumber', 'plumbing', 'electrician', 'driver', 'cleaner',
  'warehouse', 'forklift', 'labourer', 'laborer', 'construction', 'carpenter',
  'mechanic', 'welder', 'painter', 'landscaper', 'security guard', 'cashier',
  'delivery', 'chef', 'cook', 'kitchen', 'bartender', 'waitress', 'waiter',
  'janitor', 'custodian', 'factory', 'assembly line', 'machine operator',
  'retail associate', 'store associate', 'shelf stacker',
]

function isRelevantJob(title: string): boolean {
  if (!title) return false
  const lower = title.toLowerCase()
  return !EXCLUDE_KEYWORDS.some(kw => lower.includes(kw))
}

// ── Main fetch ────────────────────────────────────────────────────────────────

export async function fetchJobs(filters?: JobFilters): Promise<any[]> {
  const res = await fetch(`${WORKER_URL}/api/jobs`)
  if (!res.ok) throw new Error(`Worker error ${res.status}: ${await res.text()}`)
  const allJobs: any[] = await res.json()
  return applyFilters(allJobs, filters)
}

export async function fetchJobById(id: string): Promise<any | null> {
  const res = await fetch(`${WORKER_URL}/api/jobs/${id}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Worker error ${res.status}`)
  return res.json()
}

export async function subscribeToAlerts(email: string, filters?: Record<string, unknown>): Promise<void> {
  const res = await fetch(`${WORKER_URL}/api/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, filters }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' })) as { error: string }
    throw new Error(err.error)
  }
}

// ── Client-side filtering ─────────────────────────────────────────────────────
// All filtering happens in the browser — the Worker returns the full cached list.
// This is fast because the total dataset is small (~50-300 jobs).

function applyFilters(jobs: any[], filters?: JobFilters): any[] {
  if (!filters) return sortByScore(jobs.filter(j => isRelevantJob(j.title)))

  let result = jobs.filter(j => isRelevantJob(j.title))

  if (filters.search) {
    const q = filters.search.toLowerCase()
    result = result.filter(j =>
      j.title?.toLowerCase().includes(q) ||
      j.companies?.name?.toLowerCase().includes(q) ||
      j.department?.toLowerCase().includes(q),
    )
  }

  if (filters.remote_type) {
    result = result.filter(j =>
      j.remote_type === filters.remote_type ||
      j.companies?.remote_policy === filters.remote_type,
    )
  }

  if (filters.min_maternity_leave) {
    result = result.filter(j =>
      (j.companies?.maternity_leave_weeks ?? 0) >= filters.min_maternity_leave!,
    )
  }

  if (filters.ivf_coverage) {
    result = result.filter(j => j.companies?.ivf_coverage === true)
  }

  if (filters.childcare_support) {
    result = result.filter(j => j.companies?.childcare_support === true)
  }

  if (filters.min_carefolio_score && filters.min_carefolio_score > 60) {
    result = result.filter(j =>
      (j.companies?.carefolio_score ?? 0) >= filters.min_carefolio_score!,
    )
  }

  if (filters.min_salary) {
    // Only exclude if job explicitly declares a salary below threshold
    result = result.filter(j => !j.salary_min || j.salary_min >= filters.min_salary!)
  }

  if (filters.department) {
    result = result.filter(j =>
      j.department?.toLowerCase() === filters.department!.toLowerCase(),
    )
  }

  return sortByScore(result)
}

function sortByScore(jobs: any[]): any[] {
  return [...jobs].sort(
    (a, b) => (b.companies?.carefolio_score ?? 0) - (a.companies?.carefolio_score ?? 0),
  )
}
