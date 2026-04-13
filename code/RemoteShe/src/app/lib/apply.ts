/**
 * apply.ts — Canonical "Apply Now" URL resolver for RemoteShe
 *
 *   1. Real ATS job URL  → /out/:id tracker → 302 to posting         → "Apply Now"
 *   2. Admin job board   → job_board_url set in Admin → Companies     → "View Job Listing"
 *   3. Company website   → company.website (already a careers page    → "View Careers"
 *                          in seed data, e.g. careers.google.com)
 *   4. null              → nothing known — no button shown
 */

import { projectId } from "/utils/supabase/info";
import { Job } from "./types";

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-9112f926`;

export interface ApplyInfo {
  url: string;
  label: string;
  /** true = real job posting (Apply Now), false = careers page */
  isDirect: boolean;
}

export function resolveApply(job: Job): ApplyInfo | null {
  const company = job.companies;

  // Tier 1 — real ATS posting URL, tracked via /out/:id
  if (job.job_url) {
    return { url: `${API_BASE}/out/${job.id}`, label: "Apply Now", isDirect: true };
  }

  // Tier 2 — admin-verified job board (e.g. boards.greenhouse.io/stripe)
  if (company?.job_board_url) {
    return { url: company.job_board_url, label: "Apply", isDirect: false };
  }

  // careers.google.com, stripe.com/jobs, about.gitlab.com/jobs — use as-is)
  if (company?.website) {
    return { url: company.website, label: "Apply", isDirect: false };
  }

  return null;
}