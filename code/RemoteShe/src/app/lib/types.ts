export interface Company {
  id: string;
  name: string;
  website?: string;
  logo_url?: string;
  industry?: string;
  country?: string;
  remote_policy?: string;
  maternity_leave_weeks?: number;
  paternity_leave_weeks?: number;
  ivf_coverage?: boolean;
  fertility_support?: boolean;
  childcare_support?: boolean;
  caregiver_leave?: boolean;
  women_leadership_percent?: number;
  carefolio_score?: number;
  verification_status?: 'verified' | 'self_reported' | 'ai_extracted';
  last_verified_date?: string;
  created_at?: string;
  // ATS integration fields
  ats_type?: string;
  ats_slug?: string;
  ats_last_synced?: string;
  ats_total_synced?: number;
  job_board_url?: string;
}

export interface Job {
  id: string;
  company_id: string;
  title: string;
  department?: string;
  location?: string;
  remote_type?: string;
  salary_range?: string;
  salary_min?: number;
  salary_max?: number;
  tech_stack?: string[];
  job_url?: string;
  source?: string;
  posted_date?: string;
  posted_at?: string;
  last_seen_at?: string;
  created_at?: string;
  is_stale?: boolean;
  description?: string | null;
  companies?: Company;
}

export interface Perk {
  id: string;
  company_id: string;
  perk_type: string;
  description?: string;
  verified?: boolean;
  source_url?: string;
  created_at?: string;
}

export interface JobFilters {
  search?: string;
  remote_type?: string;
  min_maternity_leave?: number;
  ivf_coverage?: boolean;
  fertility_support?: boolean;
  childcare_support?: boolean;
  min_carefolio_score?: number;
  min_women_leadership?: number;
  industry?: string;
  salary_range?: string;
  salary_min?: number;
  salary_max?: number;
  tech_stack?: string;
  hide_stale?: boolean;
}