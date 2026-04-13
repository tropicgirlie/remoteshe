import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Search, Globe, Baby, Heart, ArrowRight, CheckCircle2,
  MapPin, Clock, ExternalLink,
  Users, Bell, Star, DollarSign, Home, Leaf, ShieldCheck,
} from "lucide-react";
import { fetchJobs } from "../../lib/fetchJobs";
import { JobAlertModal } from "../components/job-alert-modal";
import { CompanyLogo } from "../components/company-logo";

// ── Quick filters ──────────────────────────────────────────────────────────────
const QUICK_FILTERS = [
  { label: "Fully Remote", icon: Globe },
  { label: "20+ wk Maternity", icon: Baby },
  { label: "IVF / Fertility", icon: Heart },
  { label: "Childcare Support", icon: Home },
  { label: "Caregiver Leave", icon: Leaf },
  { label: "Women-led 40%+", icon: Users },
  { label: "Paternity Leave", icon: Baby },
];

// ── What we look for ───────────────────────────────────────────────────────────
const CARE_LEGEND = [
  { icon: <Baby className="w-3.5 h-3.5 text-pink-500" />, label: "20+ weeks maternity leave", cls: "bg-pink-50" },
  { icon: <Baby className="w-3.5 h-3.5 text-sky-500" />, label: "Paternity / shared parental leave", cls: "bg-sky-50" },
  { icon: <Heart className="w-3.5 h-3.5 text-rose-500" />, label: "IVF & fertility coverage", cls: "bg-rose-50" },
  { icon: <ShieldCheck className="w-3.5 h-3.5 text-fuchsia-500" />, label: "Broader fertility support", cls: "bg-fuchsia-50" },
  { icon: <Home className="w-3.5 h-3.5 text-purple-500" />, label: "Childcare support or subsidy", cls: "bg-purple-50" },
  { icon: <Leaf className="w-3.5 h-3.5 text-teal-500" />, label: "Caregiver leave (family care)", cls: "bg-teal-50" },
  { icon: <Globe className="w-3.5 h-3.5 text-blue-500" />, label: "Remote-first flexibility", cls: "bg-blue-50" },
  { icon: <Users className="w-3.5 h-3.5 text-green-500" />, label: "Women in leadership 30%+", cls: "bg-green-50" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(dateStr?: string) {
  if (!dateStr) return "Recently";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function formatSalary(min?: number | null, max?: number | null): string | null {
  if (!min && !max) return null;
  const fmt = (n: number) => `$${Math.round(n / 1000)}k`;
  if (min && max) return `${fmt(min)}–${fmt(max)}`;
  if (min) return `${fmt(min)}+`;
  if (max) return `Up to ${fmt(max)}`;
  return null;
}

function toTitleCase(str: string): string {
  return str.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

function getCompanyName(companies: any, companyId: string | null | undefined): string {
  if (companies?.name) return companies.name;
  if (companyId && !isUUID(companyId)) return toTitleCase(companyId);
  return "Unknown Company";
}

function scoreTier(score: number): { label: string; color: string; bg: string; border: string } {
  if (score >= 90) return { label: "Gold Tier", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" };
  if (score >= 75) return { label: "Silver Tier", color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200" };
  return { label: "Verified", color: "text-gray-600", bg: "bg-gray-50", border: "border-gray-200" };
}

type PillVariant = "pink" | "rose" | "purple" | "sky" | "fuchsia" | "teal" | "green";

function BenefitPill({ children, variant = "pink" }: { children: React.ReactNode; variant?: PillVariant }) {
  const styles: Record<PillVariant, string> = {
    pink:    "bg-pink-50 text-pink-700 border-pink-100",
    rose:    "bg-rose-50 text-rose-700 border-rose-100",
    purple:  "bg-purple-50 text-purple-700 border-purple-100",
    sky:     "bg-sky-50 text-sky-700 border-sky-100",
    fuchsia: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100",
    teal:    "bg-teal-50 text-teal-700 border-teal-100",
    green:   "bg-green-50 text-green-700 border-green-100",
  };
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${styles[variant]}`}>
      {children}
    </span>
  );
}

function ScoreBar({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, score));
  const color = score >= 90 ? "bg-amber-400" : score >= 75 ? "bg-[#5B39C8]" : "bg-gray-400";
  return (
    <div className="flex items-center gap-2 mb-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-gray-400 tabular-nums">{score}</span>
    </div>
  );
}

// ── Job Card ──────────────────────────────────────────────────────────────────
function JobCard({ job }: { job: any }) {
  const co = job.companies;
  const hasCompanyData = co != null;
  const companyName = getCompanyName(co, job.company_id);
  const score = co?.carefolio_score || job.carefolio_score || 0;
  const tier = scoreTier(score);
  const salary = formatSalary(job.salary_min, job.salary_max);

  // All perks
  const maternityWeeks   = co?.maternity_leave_weeks;
  const paternityWeeks   = co?.paternity_leave_weeks;
  const ivfCovered       = co?.ivf_coverage;
  const fertilitySupport = co?.fertility_support && !ivfCovered; // avoid double-show
  const childcare        = co?.childcare_support;
  const caregiverLeave   = co?.caregiver_leave;
  const womenLead        = co?.women_leadership_percent;

  const hasBenefits = hasCompanyData && (
    maternityWeeks || paternityWeeks || ivfCovered || fertilitySupport ||
    childcare || caregiverLeave || (womenLead && womenLead >= 40)
  );

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 cursor-default hover:shadow-md hover:border-[#5B39C8]/25 transition-all group">
      <div className="flex items-start gap-4">
        <CompanyLogo name={companyName} website={co?.website} size={48} />
        <div className="flex-1 min-w-0">
          {/* Top row */}
          <div className="flex items-start justify-between gap-2 mb-0.5">
            <span className="text-xs text-gray-500 font-medium truncate">{companyName}</span>
            {hasCompanyData && score > 0 && (
              <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${tier.bg} ${tier.border} ${tier.color}`}>
                <Star className="w-2.5 h-2.5" />
                {tier.label} · {score}
              </span>
            )}
          </div>

          <h3 className="text-[15px] font-bold text-gray-900 leading-snug mb-1 group-hover:text-[#5B39C8] transition-colors">
            {job.title}
          </h3>

          {hasCompanyData && score > 0 && <ScoreBar score={score} />}

          <div className="flex flex-wrap items-center gap-3 mb-2">
            <span className="flex items-center gap-1 text-[12px] text-gray-500">
              <MapPin className="w-3 h-3 text-gray-400" />{job.remote_type || "Remote"}
            </span>
            {salary && (
              <span className="flex items-center gap-1 text-[12px] text-gray-500 font-medium">
                <DollarSign className="w-3 h-3 text-gray-400" />{salary}
              </span>
            )}
            <span className="flex items-center gap-1 text-[12px] text-gray-400">
              <Clock className="w-3 h-3" />{timeAgo(job.posted_date)}
            </span>
          </div>

          {hasBenefits && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {maternityWeeks && (
                <BenefitPill variant="pink">
                  <Baby className="w-2.5 h-2.5" />{maternityWeeks}w maternity
                </BenefitPill>
              )}
              {paternityWeeks && (
                <BenefitPill variant="sky">
                  <Baby className="w-2.5 h-2.5" />{paternityWeeks}w paternity
                </BenefitPill>
              )}
              {ivfCovered && (
                <BenefitPill variant="rose">
                  <Heart className="w-2.5 h-2.5" />IVF covered
                </BenefitPill>
              )}
              {fertilitySupport && (
                <BenefitPill variant="fuchsia">
                  <ShieldCheck className="w-2.5 h-2.5" />Fertility support
                </BenefitPill>
              )}
              {childcare && (
                <BenefitPill variant="purple">
                  <Home className="w-2.5 h-2.5" />Childcare
                </BenefitPill>
              )}
              {caregiverLeave && (
                <BenefitPill variant="teal">
                  <Leaf className="w-2.5 h-2.5" />Caregiver leave
                </BenefitPill>
              )}
              {womenLead && womenLead >= 40 && (
                <BenefitPill variant="green">
                  <Users className="w-2.5 h-2.5" />{womenLead}% women leaders
                </BenefitPill>
              )}
            </div>
          )}
        </div>

        {job.job_url && (
          <div className="flex-shrink-0 hidden sm:flex flex-col items-end gap-2 ml-2">
            <a
              href={job.job_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-[#5B39C8] text-white hover:bg-[#4a2fb0] transition-colors"
            >
              Apply <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function Home() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertModalEmail, setAlertModalEmail] = useState("");
  const [bannerEmail, setBannerEmail] = useState("");

  useEffect(() => {
    fetchJobs()
      .then((data: any[]) => setJobs(data.slice(0, 12)))
      .catch((err: unknown) => console.error("Failed to load jobs:", err))
      .finally(() => setLoadingJobs(false));
  }, []);

  // Derive stats + companies from loaded jobs
  const uniqueCompanies = jobs.reduce((acc: any[], job) => {
    if (job.companies && !acc.find((c: any) => c.id === job.companies.id)) {
      acc.push(job.companies);
    }
    return acc;
  }, []).sort((a: any, b: any) => (b.carefolio_score ?? 0) - (a.carefolio_score ?? 0));

  const topScore = jobs.reduce((max, j) => Math.max(max, j.companies?.carefolio_score ?? 0), 0);
  const bestMaternity = jobs.reduce((max, j) => Math.max(max, j.companies?.maternity_leave_weeks ?? 0), 0);

  const heroStats = [
    { value: uniqueCompanies.length ? `${uniqueCompanies.length}` : "—", label: "Care-Verified Companies" },
    { value: topScore ? `${topScore}` : "—", label: "Top Carefolio Score" },
    { value: bestMaternity ? `${bestMaternity} wks` : "—", label: "Best Maternity Leave" },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/jobs?search=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <div className="bg-[#F7F7FB] min-h-screen">

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-12 pb-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-10 items-end">
            <div className="max-w-[580px]">
              <p className="text-[11px] font-bold tracking-[0.18em] text-[#5B39C8] uppercase mb-4">
                Career &amp; Care Alignment
              </p>
              <h1 className="text-[2.6rem] font-bold text-gray-900 leading-[1.15] mb-3">
                Find remote jobs at companies{" "}
                <span className="italic text-[#5B39C8]">designed for real life.</span>
              </h1>
              <p className="text-[15px] text-gray-500 leading-relaxed mb-7">
                Every role is at a company scored for maternity leave, fertility benefits, childcare support, caregiver leave, and flexible work — so you can grow your career without sacrificing care.
              </p>
              <form onSubmit={handleSearch}>
                <div className="flex items-center bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="flex items-center px-4 flex-1 gap-3">
                    <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="Job title, company, or keyword…"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="py-[13px] text-sm text-gray-700 w-full outline-none placeholder-gray-400 bg-transparent"
                    />
                  </div>
                  <button
                    type="submit"
                    className="m-[5px] px-6 py-[10px] bg-[#5B39C8] text-white text-sm font-semibold rounded-lg hover:bg-[#4a2fb0] transition-colors flex-shrink-0"
                  >
                    Search
                  </button>
                </div>
              </form>
            </div>

            {/* Live stats */}
            <div className="hidden lg:flex flex-col gap-3 pb-1">
              {heroStats.map(s => (
                <div key={s.label} className="bg-[#F7F7FB] border border-gray-100 rounded-xl px-5 py-3 text-right">
                  <div className="text-[22px] font-black text-[#5B39C8] leading-none">{s.value}</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick filter bar */}
        <div className="border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-2.5">
            <div className="flex items-center gap-2.5 overflow-x-auto pb-0.5 scrollbar-hide">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap flex-shrink-0">
                Filter by:
              </span>
              {QUICK_FILTERS.map(f => {
                const Icon = f.icon;
                const active = activeFilter === f.label;
                return (
                  <button
                    key={f.label}
                    onClick={() => {
                      setActiveFilter(active ? null : f.label);
                      navigate("/jobs");
                    }}
                    className={[
                      "flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-full border whitespace-nowrap flex-shrink-0 font-medium transition-colors",
                      active
                        ? "bg-[#5B39C8] text-white border-[#5B39C8]"
                        : "border-gray-200 text-gray-600 hover:border-[#5B39C8]/50 hover:text-[#5B39C8] bg-white",
                    ].join(" ")}
                  >
                    <Icon className="w-3 h-3" />
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN LAYOUT: Jobs + Sidebar ─────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <div className="flex gap-6 items-start">

          {/* ── JOB FEED ──────────────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[18px] font-bold text-gray-900">Latest Jobs</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {loadingJobs ? "Loading…" : `${jobs.length} open roles from care-verified employers`}
                </p>
              </div>
              <button
                onClick={() => navigate("/jobs")}
                className="flex items-center gap-1 text-sm text-[#5B39C8] font-semibold hover:underline flex-shrink-0"
              >
                View all <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {loadingJobs ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 h-[110px] animate-pulse" />
                ))
              ) : jobs.length === 0 ? (
                <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-12 text-center">
                  <CheckCircle2 className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500 font-semibold mb-1">More jobs coming soon — check back Sunday.</p>
                  <p className="text-gray-400 text-sm">New roles from care-verified companies are synced weekly.</p>
                </div>
              ) : (
                jobs.map(job => <JobCard key={job.id} job={job} />)
              )}
            </div>

            {jobs.length > 0 && (
              <button
                onClick={() => navigate("/jobs")}
                className="mt-4 w-full py-3 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:border-[#5B39C8]/30 hover:text-[#5B39C8] transition-colors"
              >
                Browse all jobs →
              </button>
            )}
          </div>

          {/* ── SIDEBAR ──────────────────────────────────────────────────────── */}
          <aside className="hidden lg:flex flex-col gap-5 w-[280px] flex-shrink-0">

            {/* Top Companies */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[14px] font-bold text-gray-900">Top Companies</h3>
                <button onClick={() => navigate("/companies")} className="text-xs text-[#5B39C8] font-semibold hover:underline">
                  See all →
                </button>
              </div>
              <div className="space-y-2.5">
                {loadingJobs ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-12 rounded-xl bg-gray-100 animate-pulse" />
                  ))
                ) : (
                  uniqueCompanies.slice(0, 6).map((company: any) => {
                    const score = company.carefolio_score;
                    const isGold = (score || 0) >= 90;
                    return (
                      <div key={company.id} className="flex items-center gap-3 rounded-xl px-2 py-1.5">
                        <CompanyLogo name={company.name} website={company.website} size={32} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate leading-tight">{company.name}</p>
                          <p className={`text-[10px] font-bold ${isGold ? "text-amber-600" : "text-purple-500"}`}>
                            {score} · {isGold ? "Gold Tier" : "Rising Star"}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Care Benefits Legend */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="text-[14px] font-bold text-gray-900 mb-3">What We Look For</h3>
              <ul className="space-y-2.5">
                {CARE_LEGEND.map(item => (
                  <li key={item.label} className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-full ${item.cls} flex items-center justify-center flex-shrink-0`}>
                      {item.icon}
                    </div>
                    <span className="text-xs text-gray-600">{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Sidebar alert subscribe */}
            <div className="bg-[#3D2496] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-1.5">
                <Bell className="w-4 h-4 text-orange-400" />
                <h3 className="text-[14px] font-bold text-white">Get Job Alerts</h3>
              </div>
              <p className="text-purple-300 text-[12px] mb-4 leading-relaxed">
                Daily, weekly or monthly digest of new roles at care-first companies.
              </p>
              <button
                onClick={() => setAlertModalOpen(true)}
                className="w-full py-2.5 bg-[#F59E0B] hover:bg-[#d97706] text-white font-bold text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Bell className="w-4 h-4" /> Subscribe to Alerts
              </button>
            </div>
          </aside>
        </div>
      </div>

      {/* ── COMPANIES STRIP ─────────────────────────────────────────────────── */}
      {uniqueCompanies.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-12">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[18px] font-bold text-gray-900">Care-First Employers</h2>
              <p className="text-xs text-gray-400 mt-0.5">Ranked by Carefolio Score — our independent care infrastructure rating</p>
            </div>
            <button
              onClick={() => navigate("/companies")}
              className="flex items-center gap-1 text-sm text-[#5B39C8] font-semibold hover:underline flex-shrink-0"
            >
              Browse all <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {uniqueCompanies.map((company: any) => {
              const score = company.carefolio_score;
              const isGold = (score || 0) >= 90;
              return (
                <div
                  key={company.id}
                  className="flex items-center gap-2.5 px-4 py-3 bg-white border border-gray-200 rounded-xl hover:border-[#5B39C8]/30 hover:shadow-sm transition-all text-left flex-shrink-0 w-[200px]"
                >
                  <CompanyLogo name={company.name} website={company.website} size={36} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate leading-tight">{company.name}</p>
                    <p className={`text-[10px] font-bold mt-0.5 ${isGold ? "text-amber-600" : "text-purple-500"}`}>
                      {score ?? "—"} Care Score
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── NEWSLETTER BANNER ───────────────────────────────────────────────── */}
      <section className="bg-[#3D2496] py-16">
        <div className="max-w-[560px] mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-orange-300 text-xs font-bold px-3 py-1.5 rounded-full mb-5">
            <Bell className="w-3.5 h-3.5" />
            Job Alerts — Daily · Weekly · Monthly
          </div>
          <h2 className="text-[26px] font-bold text-white mb-2 leading-snug">
            Never miss a care-first role.
          </h2>
          <p className="text-purple-300 text-[14px] mb-7 leading-relaxed">
            Get alerts for new remote roles at companies that score 60+ on our Carefolio Index — maternity leave, IVF, childcare, caregiver leave, and more.
          </p>
          <form
            onSubmit={e => { e.preventDefault(); setAlertModalEmail(bannerEmail); setAlertModalOpen(true); }}
            className="flex gap-2"
          >
            <input
              type="email"
              placeholder="Your work email"
              value={bannerEmail}
              onChange={e => setBannerEmail(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#F59E0B]"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-[#F59E0B] hover:bg-[#d97706] text-white font-bold text-sm rounded-xl transition-colors whitespace-nowrap"
            >
              Set Alerts →
            </button>
          </form>
        </div>
      </section>

      <JobAlertModal
        open={alertModalOpen}
        onClose={() => { setAlertModalOpen(false); setAlertModalEmail(""); }}
        defaultEmail={alertModalEmail}
      />
    </div>
  );
}
