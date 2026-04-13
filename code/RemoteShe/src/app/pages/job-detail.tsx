import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router";
import {
  ArrowLeft, Globe, MapPin, DollarSign, Clock, ExternalLink,
  Star, Baby, Heart, CheckCircle2, AlertTriangle, Briefcase,
  Code2, Building2, BadgeCheck, ChevronRight, Users, Shield,
  Calendar,
} from "lucide-react";
import { fetchJobById } from "../../lib/fetchJobs";
import { Job } from "../lib/types";
import { resolveApply } from "../lib/apply";
import { CompanyLogo } from "../components/company-logo";

const SCORE_TIER = (score: number) =>
  score >= 90 ? { label: "Gold Tier", cls: "bg-amber-50 text-amber-700 border-amber-200", dot: "#F59E0B" }
  : score >= 75 ? { label: "Silver Tier", cls: "bg-purple-50 text-purple-700 border-purple-200", dot: "#6B46C1" }
  : { label: "Verified", cls: "bg-gray-50 text-gray-600 border-gray-200", dot: "#6B7280" };

function daysSince(dateStr?: string): number {
  if (!dateStr) return 0;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

function timeAgo(dateStr?: string): string {
  const d = daysSince(dateStr);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d} days ago`;
  if (d < 30) return `${Math.floor(d / 7)} week${Math.floor(d / 7) > 1 ? "s" : ""} ago`;
  return `${Math.floor(d / 30)} month${Math.floor(d / 30) > 1 ? "s" : ""} ago`;
}

function formatSalary(min?: number, max?: number, range?: string): string {
  if (min && max) return `$${(min / 1000).toFixed(0)}k – $${(max / 1000).toFixed(0)}k`;
  if (range) return range;
  return "";
}

// ── SEO JSON-LD structured data ──────────────────────────────────────────────
function JobJsonLd({ job }: { job: Job }) {
  const company = job.companies;
  const salaryStr = formatSalary(job.salary_min, job.salary_max, job.salary_range);
  const structured: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: `${job.title} at ${company?.name || "a top care-first company"} — remote-friendly role with strong parental leave and care benefits.`,
    datePosted: job.posted_date || job.created_at,
    hiringOrganization: {
      "@type": "Organization",
      name: company?.name,
      sameAs: company?.website,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressCountry: company?.country || "US",
      },
    },
    jobLocationType: job.remote_type?.toLowerCase().includes("remote") ? "TELECOMMUTE" : undefined,
    employmentType: "FULL_TIME",
    url: job.job_url || window.location.href,
    directApply: !!job.job_url,
  };
  if (salaryStr) {
    structured.baseSalary = {
      "@type": "MonetaryAmount",
      currency: "USD",
      value: { "@type": "QuantitativeValue", minValue: job.salary_min, maxValue: job.salary_max, unitText: "YEAR" },
    };
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structured) }}
    />
  );
}

// ── Benefit pill ─────────────────────────────────────────────────────────────
function BenefitPill({ label, cls }: { label: string; cls: string }) {
  return (
    <span className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full border ${cls}`}>
      {label}
    </span>
  );
}

// ── Score bar ─────────────────────────────────────────────────────────────────
function ScoreBar({ score }: { score: number }) {
  const color = score >= 90 ? "#F59E0B" : score >= 75 ? "#6B46C1" : "#6B7280";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
      <span className="text-sm font-bold tabular-nums" style={{ color }}>{score}/100</span>
    </div>
  );
}

export function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadJob(id);
    }
  }, [id]);

  const loadJob = async (jobId: string) => {
    setLoading(true);
    try {
      const data = await fetchJobById(jobId);
      setJob(data);
      // Set page title for SEO
      document.title = `${data.title} at ${data.companies?.name || "Company"} | RemoteShe`;
    } catch (err: any) {
      setError(err.message || "Job not found");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F7FB]">
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
          <div className="bg-white rounded-2xl p-8 animate-pulse h-48" />
          <div className="bg-white rounded-2xl p-8 animate-pulse h-64" />
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-[#F7F7FB] flex items-center justify-center">
        <div className="text-center">
          <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-800 mb-2">Job not found</h1>
          <p className="text-gray-500 mb-6">{error || "This listing may have been removed."}</p>
          <button
            onClick={() => navigate("/jobs")}
            className="px-5 py-2.5 bg-[#5B39C8] text-white font-semibold rounded-lg hover:bg-[#4a2fb0] transition-colors"
          >
            Browse all jobs
          </button>
        </div>
      </div>
    );
  }

  const company = job.companies;
  const apply = resolveApply(job);
  const score = company?.carefolio_score ?? 0;
  const tier = SCORE_TIER(score);
  const age = daysSince(job.posted_date);
  const isNew = age <= 3;
  const isStale = job.is_stale || age > 30;
  const salaryStr = formatSalary(job.salary_min, job.salary_max, job.salary_range);

  const benefits: { label: string; cls: string }[] = [];
  if (company?.maternity_leave_weeks) benefits.push({ label: `${company.maternity_leave_weeks}w maternity leave`, cls: "bg-pink-50 text-pink-700 border-pink-100" });
  if (company?.ivf_coverage) benefits.push({ label: "IVF covered", cls: "bg-rose-50 text-rose-700 border-rose-100" });
  else if (company?.fertility_support) benefits.push({ label: "Fertility support", cls: "bg-rose-50 text-rose-700 border-rose-100" });
  if (company?.childcare_support) benefits.push({ label: "Childcare support", cls: "bg-purple-50 text-purple-700 border-purple-100" });
  if (company?.caregiver_leave) benefits.push({ label: "Caregiver leave", cls: "bg-blue-50 text-blue-700 border-blue-100" });
  if (company?.paternity_leave_weeks) benefits.push({ label: `${company.paternity_leave_weeks}w paternity leave`, cls: "bg-indigo-50 text-indigo-700 border-indigo-100" });

  return (
    <div className="min-h-screen bg-[#F7F7FB]">
      {job && <JobJsonLd job={job} />}

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-1.5 text-xs text-gray-400">
            <Link to="/" className="hover:text-[#5B39C8] transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link to="/jobs" className="hover:text-[#5B39C8] transition-colors">Jobs</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-700 font-medium truncate max-w-[200px]">{job.title}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#5B39C8] mb-5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">

          {/* ── Main column ── */}
          <div className="space-y-4">

            {/* Hero card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              {/* Status badges */}
              <div className="flex items-center gap-2 mb-4">
                {isNew && (
                  <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    New
                  </span>
                )}
                {isStale && (
                  <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200">
                    <AlertTriangle className="w-2.5 h-2.5" /> May be expired
                  </span>
                )}
                <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${tier.cls}`}>
                  <Star className="w-2.5 h-2.5" /> {tier.label}
                </span>
              </div>

              {/* Company + title */}
              <div className="flex items-start gap-4 mb-5">
                <CompanyLogo name={company?.name || "C"} website={company?.website} size={56} />
                <div className="flex-1 min-w-0">
                  {company && (
                    <Link
                      to={`/company/${company.id}`}
                      className="text-sm text-gray-500 font-medium hover:text-[#5B39C8] transition-colors"
                    >
                      {company.name}
                    </Link>
                  )}
                  <h1 className="text-2xl font-bold text-gray-900 leading-snug mt-0.5">{job.title}</h1>
                </div>
              </div>

              {/* Meta grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                {job.remote_type && (
                  <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
                    <Globe className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Remote</p>
                      <p className="text-xs font-semibold text-gray-700">{job.remote_type}</p>
                    </div>
                  </div>
                )}
                {job.department && (
                  <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
                    <Briefcase className="w-4 h-4 text-purple-500 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Team</p>
                      <p className="text-xs font-semibold text-gray-700">{job.department}</p>
                    </div>
                  </div>
                )}
                {salaryStr && (
                  <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
                    <DollarSign className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Salary</p>
                      <p className="text-xs font-semibold text-gray-700">{salaryStr}</p>
                    </div>
                  </div>
                )}
                {job.posted_date && (
                  <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
                    <Calendar className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Posted</p>
                      <p className="text-xs font-semibold text-gray-700">{timeAgo(job.posted_date)}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Stale warning */}
              {isStale && (
                <div className="flex items-start gap-2.5 bg-orange-50 border border-orange-100 rounded-xl p-3.5 mb-4">
                  <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-orange-700">
                    <strong>This listing is {age} days old</strong> — it may no longer be active. 
                    We recommend applying directly via the company's careers page to confirm availability.
                  </p>
                </div>
              )}

              {/* CTA */}
              <div className="flex flex-col sm:flex-row gap-3">
                {apply && (
                  <a
                    href={apply.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 font-bold rounded-xl transition-colors text-sm ${
                      apply.isDirect
                        ? "bg-[#5B39C8] text-white hover:bg-[#4a2fb0]"
                        : "border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50"
                    }`}
                  >
                    {apply.label} <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                {company && (
                  <Link
                    to={`/company/${company.id}`}
                    className="flex items-center justify-center gap-2 px-5 py-3 border border-[#5B39C8]/30 text-[#5B39C8] font-semibold rounded-xl hover:bg-[#5B39C8]/5 transition-colors text-sm"
                  >
                    <Building2 className="w-4 h-4" /> Company Profile
                  </Link>
                )}
              </div>
            </div>

            {/* Tech stack */}
            {job.tech_stack && job.tech_stack.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Code2 className="w-4 h-4 text-[#5B39C8]" />
                  <h2 className="text-sm font-bold text-gray-900">Tech Stack</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {job.tech_stack.map(tech => (
                    <span
                      key={tech}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#5B39C8]/8 text-[#5B39C8] border border-[#5B39C8]/15"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Job description */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h2 className="text-sm font-bold text-gray-900 mb-3">About this Role</h2>
              {job.description ? (
                <div
                  className="prose prose-sm max-w-none text-gray-600"
                  dangerouslySetInnerHTML={{ __html: job.description }}
                />
              ) : (
                <div className="prose prose-sm max-w-none text-gray-600 space-y-3">
                  <p>
                    {company?.name} is seeking a <strong>{job.title}</strong> to join their {job.department || "team"}.
                    This is a <strong>{job.remote_type || "remote"}</strong> role at a company with an exceptional care infrastructure for working parents and caregivers.
                  </p>
                  <p>
                    {company?.name} scores <strong>{score}/100</strong> on the Carefolio Index — rating companies across maternity leave, IVF & fertility coverage, childcare support, remote flexibility, and women in leadership.
                  </p>
                  {salaryStr && (
                    <p>
                      <strong>Compensation:</strong> {salaryStr} (USD, annual)
                      {job.salary_range?.includes("OTE") ? " OTE" : ""}.
                    </p>
                  )}
                  <p className="text-gray-400 text-xs italic">
                    Full job description available on the company's careers page.{" "}
                    {apply && (
                      <a href={apply.url} target="_blank" rel="noopener noreferrer" className="text-[#5B39C8] underline">
                        View complete listing →
                      </a>
                    )}
                  </p>
                </div>
              )}
            </div>

          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-4">

            {/* Carefolio score card */}
            {company && (
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4 text-[#5B39C8]" />
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">Carefolio Score</h3>
                </div>
                <ScoreBar score={score} />
                <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
                  Scored across maternity leave, fertility coverage, childcare support & remote flexibility.
                </p>
              </div>
            )}

            {/* Care benefits */}
            {benefits.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-3">Care Benefits</h3>
                <div className="flex flex-wrap gap-2">
                  {benefits.map(b => (
                    <BenefitPill key={b.label} label={b.label} cls={b.cls} />
                  ))}
                </div>
              </div>
            )}

            {/* Company quick facts */}
            {company && (
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-4">Company Info</h3>
                <div className="space-y-3">
                  {company.industry && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Industry</span>
                      <span className="text-xs font-semibold text-gray-700">{company.industry}</span>
                    </div>
                  )}
                  {company.country && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">HQ</span>
                      <span className="text-xs font-semibold text-gray-700">{company.country}</span>
                    </div>
                  )}
                  {company.remote_policy && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Work Policy</span>
                      <span className="text-xs font-semibold text-gray-700">{company.remote_policy}</span>
                    </div>
                  )}
                  {company.women_leadership_percent != null && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Women in leadership</span>
                      <span className="text-xs font-semibold text-gray-700">{company.women_leadership_percent}%</span>
                    </div>
                  )}
                  {company.verification_status && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Status</span>
                      <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                        <BadgeCheck className="w-3 h-3" /> {company.verification_status}
                      </span>
                    </div>
                  )}
                </div>
                <Link
                  to={`/company/${company.id}`}
                  className="mt-4 flex items-center justify-center gap-1.5 w-full px-4 py-2 border border-[#5B39C8]/25 text-[#5B39C8] text-xs font-semibold rounded-xl hover:bg-[#5B39C8]/5 transition-colors"
                >
                  <Users className="w-3.5 h-3.5" /> Full Company Profile
                </Link>
              </div>
            )}

            {/* Apply CTA sticky */}
            {apply && (
              <div className="bg-gradient-to-br from-[#5B39C8] to-[#4a2fb0] rounded-2xl p-5 text-center">
                <p className="text-white/80 text-xs mb-1">Ready to apply?</p>
                <p className="text-white font-bold text-sm mb-4">Join a care-first company</p>
                <a
                  href={apply.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-[#F59E0B] text-white font-bold text-sm rounded-xl hover:bg-[#d97706] transition-colors"
                >
                  {apply.label} <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}