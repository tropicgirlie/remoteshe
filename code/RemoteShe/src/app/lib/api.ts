import { projectId, publicAnonKey } from '/utils/supabase/info';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-9112f926`;
const SUPABASE_REST = `https://${projectId}.supabase.co/rest/v1`;

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `API error: ${response.statusText}`);
  }

  return response.json();
}

// Companies API
export const companiesAPI = {
  getAll: () => fetchAPI('/companies'),
  getById: (id: string) => fetchAPI(`/companies/${id}`),
  create: (data: any) => fetchAPI('/companies', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => fetchAPI(`/companies/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchAPI(`/companies/${id}`, {
    method: 'DELETE',
  }),
};

// Jobs API
export const jobsAPI = {
  getAll: (params?: { company_id?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.company_id) query.set('company_id', params.company_id);
    if (params?.search) query.set('search', params.search);
    return fetchAPI(`/jobs${query.toString() ? `?${query}` : ''}`);
  },
  search: (filters: any) => fetchAPI('/jobs/search', {
    method: 'POST',
    body: JSON.stringify(filters),
  }),
  getById: (id: string) => fetchAPI(`/jobs/${id}`),
  create: (data: any) => fetchAPI('/jobs', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => fetchAPI(`/jobs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchAPI(`/jobs/${id}`, {
    method: 'DELETE',
  }),
  seedJobs: () => fetchAPI('/seed-jobs', { method: 'POST', body: JSON.stringify({}) }),
  clearAll: () => fetchAPI('/jobs/clear-all', { method: 'DELETE' }),
  fixSeedUrls: () => fetchAPI('/fix-seed-urls', { method: 'POST', body: JSON.stringify({}) }),
  backfillSalaries: () => fetchAPI('/backfill-salaries', { method: 'POST', body: JSON.stringify({}) }),
  backfillTechStack: () => fetchAPI('/backfill-tech-stack', { method: 'POST', body: JSON.stringify({}) }),
  markStale: (days = 30) => fetchAPI('/jobs/mark-stale', { method: 'POST', body: JSON.stringify({ days }) }),
  scheduledSync: () => fetchAPI('/scheduled-sync', { method: 'POST', body: JSON.stringify({}) }),
};

// Alerts / Subscribers API
export const alertsAPI = {
  subscribe: (email: string, preferences?: Record<string, unknown>) =>
    fetchAPI('/subscribe', { method: 'POST', body: JSON.stringify({ email, preferences }) }),
  subscribeWithFrequency: (email: string, frequency: string, filters: Record<string, boolean>, preferences?: Record<string, unknown>) =>
    fetchAPI('/subscribe', { method: 'POST', body: JSON.stringify({ email, frequency, filters, preferences }) }),
  getSubscribers: () => fetchAPI('/subscribers'),
  deleteSubscriber: (email: string) =>
    fetchAPI(`/subscribers/${encodeURIComponent(email)}`, { method: 'DELETE' }),
  sendDigest: (frequency: string, preview_email?: string) =>
    fetchAPI('/send-digest', { method: 'POST', body: JSON.stringify({ frequency, preview_email }) }),
  getDigestHistory: () => fetchAPI('/digest-history'),
};

// Platform stats API
export const statsAPI = {
  get: () => fetchAPI('/stats'),
};

// Apify Job Scraper API
export const apifyAPI = {
  run: (payload: { company_id?: string; company_name?: string; urls: string[]; max_items?: number }) =>
    fetchAPI('/apify/run', { method: 'POST', body: JSON.stringify(payload) }),
  runAll: () =>
    fetchAPI('/apify/run-all', { method: 'POST', body: JSON.stringify({}) }),
  status: (runId: string) =>
    fetchAPI(`/apify/status/${runId}`),
  import: (runId: string) =>
    fetchAPI(`/apify/import/${runId}`, { method: 'POST', body: JSON.stringify({}) }),
  getRuns: () =>
    fetchAPI('/apify/runs'),
  deleteRun: (runId: string) =>
    fetchAPI(`/apify/runs/${runId}`, { method: 'DELETE' }),
};

// ATS Sync API — free, no API key needed for Greenhouse + Lever public boards
export const atsAPI = {
  sync: (company_id: string, ats_type: string, slug: string) =>
    fetchAPI('/ats-sync', { method: 'POST', body: JSON.stringify({ company_id, ats_type, slug }) }),
  detect: (company_id: string) =>
    fetchAPI('/detect-ats', { method: 'POST', body: JSON.stringify({ company_id }) }),
  seedConfigs: () =>
    fetchAPI('/seed-ats-configs', { method: 'POST', body: JSON.stringify({}) }),
};

// Perks API
export const perksAPI = {
  getAll: (companyId?: string) => {
    const query = companyId ? `?company_id=${companyId}` : '';
    return fetchAPI(`/perks${query}`);
  },
  create: (data: any) => fetchAPI('/perks', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => fetchAPI(`/perks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchAPI(`/perks/${id}`, {
    method: 'DELETE',
  }),
};

// Feedback API
export const feedbackAPI = {
  submit: (data: { type: string; email?: string; message: string; page_url?: string }) =>
    fetchAPI('/feedback', { method: 'POST', body: JSON.stringify(data) }),
  getAll: () => fetchAPI('/feedback'),
  delete: (id: string) => fetchAPI(`/feedback/${id}`, { method: 'DELETE' }),
};

// Company Inquiries API
export const inquiriesAPI = {
  submit: (data: { company_name?: string; contact_name?: string; email: string; message: string }) =>
    fetchAPI('/inquiries', { method: 'POST', body: JSON.stringify(data) }),
  getAll: () => fetchAPI('/inquiries'),
  delete: (id: string) => fetchAPI(`/inquiries/${id}`, { method: 'DELETE' }),
};

// Direct Supabase REST — pulls from the `jobs` SQL table (no KV store)
export async function fetchJobsFromTable(filters?: {
  search?: string;
  remote_type?: string;
  min_carefolio_score?: number;
  min_salary?: number;
  min_maternity_leave?: number;
  ivf_coverage?: boolean;
  childcare_support?: boolean;
}): Promise<any[]> {
  const REST = 'https://fhlqnurqvyecxthzqntv.supabase.co/rest/v1';
  const headers: Record<string, string> = {
    'apikey': publicAnonKey,
    'Authorization': `Bearer ${publicAnonKey}`,
  };

  // Job relevance filter — exclude non-knowledge-work jobs
  const excludeKeywords = [
    'roofer', 'roofing', 'plumber', 'plumbing', 'electrician', 'driver', 'cleaner', 'cleaning',
    'warehouse', 'forklift', 'labourer', 'laborer', 'construction', 'carpenter', 'mechanic',
    'welder', 'painter', 'landscaper', 'security guard', 'cashier', 'delivery', 'chef', 'cook',
    'kitchen', 'bartender', 'waitress', 'waiter', 'janitor', 'custodian', 'nurse aide',
    'care assistant', 'factory', 'assembly line', 'machine operator', 'retail associate',
    'store associate', 'shelf stacker'
  ];

  const isRelevantJob = (title: string): boolean => {
    if (!title) return false;
    const lowerTitle = title.toLowerCase();
    // Exclude jobs with manual labor or service keywords
    if (excludeKeywords.some(keyword => lowerTitle.includes(keyword))) {
      return false;
    }
    return true;
  };

  // Build filter params for jobs query
  const params = new URLSearchParams();
  params.set('select', '*');
  params.set('order', 'posted_date.desc.nullslast');
  
  // ⭐ HARD FILTERS: Only remote worldwide jobs
  params.set('remote_type', 'eq.remote_worldwide');
  
  if (filters?.remote_type) params.set('remote_type', 'eq.' + filters.remote_type);
  if (filters?.search) params.set('title', 'ilike.*' + filters.search + '*');
  if (filters?.min_salary) params.set('salary_min', 'gte.' + filters.min_salary);
  if (filters?.min_maternity_leave) params.set('maternity_leave_weeks', 'gte.' + filters.min_maternity_leave);
  if (filters?.ivf_coverage) params.set('ivf_coverage', 'eq.true');
  if (filters?.childcare_support) params.set('childcare_support', 'eq.true');
  // min_carefolio_score: only filter if above minimum threshold
  if (filters?.min_carefolio_score && filters.min_carefolio_score > 60) {
    params.set('carefolio_score', 'gte.' + filters.min_carefolio_score);
  }

  // Fetch jobs
  const jobsRes = await fetch(`${REST}/jobs?${params.toString()}`, { headers });
  if (!jobsRes.ok) {
    const errBody = await jobsRes.text().catch(() => '');
    console.error(`fetchJobsFromTable failed (${jobsRes.status}): ${errBody}`);
    throw new Error(`Supabase error ${jobsRes.status}: ${errBody}`);
  }
  const allJobs = await jobsRes.json();

  // Apply relevance filter
  const jobs = allJobs.filter((job: any) => isRelevantJob(job.title));

  // Extract unique company IDs
  const companyIds = [...new Set(jobs.map((j: any) => j.company_id).filter(Boolean))];
  
  if (companyIds.length === 0) {
    // No companies to fetch, return jobs as-is
    return jobs.sort((a: any, b: any) => {
      const sa = a.carefolio_score ?? 0;
      const sb = b.carefolio_score ?? 0;
      return sb - sa;
    });
  }

  // Fetch companies
  const companyParams = new URLSearchParams();
  companyParams.set('select', 'id,name,logo_url,website,industry,country,remote_policy,carefolio_score,maternity_leave_weeks,ivf_coverage,childcare_support,women_leadership_percent');
  companyParams.set('id', 'in.(' + companyIds.join(',') + ')');
  
  // ⭐ FILTER: Only companies with strong women support
  // Must have good maternity leave OR IVF coverage OR childcare support
  // AND good women leadership percentage (30%+ in leadership roles)
  companyParams.set('women_leadership_percent', 'gte.30');
  
  const companiesRes = await fetch(`${REST}/companies?${companyParams.toString()}`, { headers });
  if (!companiesRes.ok) {
    console.warn('Failed to fetch companies, proceeding without company data');
    return jobs.sort((a: any, b: any) => {
      const sa = a.carefolio_score ?? 0;
      const sb = b.carefolio_score ?? 0;
      return sb - sa;
    });
  }
  
  const companies = await companiesRes.json();
  const companyMap = new Map(companies.map((c: any) => [c.id, c]));

  // Manually join companies to jobs — ONLY include jobs from companies that passed the women-friendly filter
  const jobsWithCompanies = jobs
    .map((job: any) => ({
      ...job,
      companies: job.company_id ? companyMap.get(job.company_id) : null,
    }))
    .filter((job: any) => job.companies != null); // Only keep jobs from women-friendly companies

  // Sort by carefolio score (prefer company-level score)
  return jobsWithCompanies.sort((a: any, b: any) => {
    const sa = a.companies?.carefolio_score ?? a.carefolio_score ?? 0;
    const sb = b.companies?.carefolio_score ?? b.carefolio_score ?? 0;
    return sb - sa;
  });
}