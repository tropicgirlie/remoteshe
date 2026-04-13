import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router";
import {
  Search, Globe, CheckCircle2, X, ChevronLeft, ChevronRight,
  Briefcase, Clock, MapPin, Bell, ExternalLink, Star,
  BadgeCheck, Shield, DollarSign, Baby, Heart,
} from "lucide-react";
import { fetchJobs } from "../../lib/fetchJobs";
import { JobAlertModal } from "../components/job-alert-modal";
import { CompanyLogo } from "../components/company-logo";

const ITEMS_PER_PAGE = 12;

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(dateStr?: string) {
  if (!dateStr) return "Recently";
  const d = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (d === 0) return "Today";
  if (d === 1) return "1d ago";
  if (d < 7) return `${d}d ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  return `${Math.floor(d / 30)}mo ago`;
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
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function isUUID(str: string): boolean {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidPattern.test(str);
}

function getCompanyName(companies: any, companyId: string | null | undefined): string {
  if (companies?.name) return companies.name;
  if (companyId && !isUUID(companyId)) return toTitleCase(companyId);
  return "Unknown Company";
}

// ── Score Tier ────────────────────────────────────────────────────────────────

function scoreTier(score: number): { label: string; color: string; bg: string; border: string } {
  if (score >= 90) return { label: "Gold Tier", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" };
  if (score >= 75) return { label: "Silver Tier", color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200" };
  return { label: "Verified", color: "text-gray-600", bg: "bg-gray-50", border: "border-gray-200" };
}

// ── Score Bar ─────────────────────────────────────────────────────────────────

function ScoreBar({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, score));
  const color = score >= 90 ? "bg-amber-400" : score >= 75 ? "bg-[#5B39C8]" : "bg-gray-400";
  return (
    <div className="flex items-center gap-2 mb-2.5">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] text-gray-400 tabular-nums">{score}</span>
    </div>
  );
}

// ── Benefit Pill ──────────────────────────────────────────────────────────────

function BenefitPill({ children, variant = "pink" }: { children: React.ReactNode; variant?: "pink" | "rose" | "purple" }) {
  const styles = {
    pink: "bg-pink-50 text-pink-700 border-pink-100",
    rose: "bg-rose-50 text-rose-700 border-rose-100",
    purple: "bg-purple-50 text-purple-700 border-purple-100",
  };
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${styles[variant]}`}>
      {children}
    </span>
  );
}

// ── Job Card ──────────────────────────────────────────────────────────────────

function JobCard({ job }: { job: any }) {
  const hasCompanyData = job.companies != null;
  const companyName = getCompanyName(job.companies, job.company_id);
  const companyWebsite = job.companies?.website;
  const score = job.companies?.carefolio_score || job.carefolio_score || 0;
  const tier = scoreTier(score);
  const remoteLabel = job.remote_type || "";
  const salary = formatSalary(job.salary_min, job.salary_max);
  const maternityWeeks = job.companies?.maternity_leave_weeks || job.maternity_leave_weeks;
  const ivfCovered = job.companies?.ivf_coverage ?? job.ivf_coverage;
  const childcareSupport = job.companies?.childcare_support ?? job.childcare_support;
  const hasBenefits = hasCompanyData && (maternityWeeks || ivfCovered || childcareSupport);
  const locationDisplay = job.location || "Location not specified";

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-[#5B39C8]/25 hover:shadow-md transition-all group">
      <div className="flex items-start gap-4">
        {/* Company Logo */}
        <CompanyLogo name={companyName} website={companyWebsite} size={48} />

        <div className="flex-1 min-w-0">
          {/* Top row: company name + tier badge */}
          <div className="flex items-start justify-between gap-2 mb-0.5">
            <span className="text-xs text-gray-500 font-medium truncate">{companyName}</span>
            {hasCompanyData && score > 0 && (
              <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${tier.bg} ${tier.border} ${tier.color}`}>
                <Star className="w-2.5 h-2.5" />
                {tier.label} · {score}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-[15px] font-bold text-gray-900 leading-snug mb-1 group-hover:text-[#5B39C8] transition-colors">
            {job.title}
          </h3>

          {/* Score bar */}
          {hasCompanyData && score > 0 && <ScoreBar score={score} />}

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3">
            {remoteLabel && (
              <span className="flex items-center gap-1 text-[11px] text-gray-500">
                <MapPin className="w-3 h-3 text-gray-400" />{remoteLabel}
              </span>
            )}
            <span className="flex items-center gap-1 text-[11px] text-gray-500">
              <Globe className="w-3 h-3 text-gray-400" />{locationDisplay}
            </span>
            {salary && (
              <span className="flex items-center gap-1 text-[11px] text-gray-500 font-medium">
                <DollarSign className="w-3 h-3 text-gray-400" />{salary}
              </span>
            )}
            <span className="flex items-center gap-1 text-[11px] text-gray-400">
              <Clock className="w-3 h-3" />{timeAgo(job.posted_date)}
            </span>
          </div>

          {/* Benefit pills */}
          {hasBenefits && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {maternityWeeks && (
                <BenefitPill variant="pink">
                  <Baby className="w-2.5 h-2.5" />
                  {maternityWeeks}w maternity
                </BenefitPill>
              )}
              {ivfCovered && (
                <BenefitPill variant="rose">
                  <Heart className="w-2.5 h-2.5" />
                  IVF covered
                </BenefitPill>
              )}
              {childcareSupport && (
                <BenefitPill variant="purple">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  Childcare
                </BenefitPill>
              )}
            </div>
          )}

          {/* Description snippet */}
          {job.description && (
            <p className="text-[11px] text-gray-400 leading-relaxed mb-3 line-clamp-2">
              {job.description.replace(/<[^>]+>/g, "").slice(0, 160)}
              {job.description.replace(/<[^>]+>/g, "").length > 160 ? "…" : ""}
            </p>
          )}

          {/* Action row */}
          <div className="flex items-center justify-between">
            {job.job_url ? (
              <a
                href={job.job_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-[#5B39C8] font-medium hover:underline"
              >
                View details →
              </a>
            ) : (
              <span />
            )}
            {job.job_url ? (
              <a
                href={job.job_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-[#5B39C8] text-white hover:bg-[#4a2fb0] transition-colors"
              >
                Apply <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <span className="text-[11px] text-gray-300 italic">No link available</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Active tag chip ───────────────────────────────────────────────────────────

function ActiveTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-[#5B39C8]/8 text-[#5B39C8] rounded-full border border-[#5B39C8]/20 font-medium">
      <span>{label}</span>
      <button onClick={onRemove} className="hover:opacity-70 transition-opacity">
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

// ── Constants ─────────────────────────────────────────────────────────────────

const REMOTE_TYPE_CHIPS = [
  { label: "All", value: undefined },
  { label: "Remote", value: "remote_worldwide" },
  { label: "Hybrid", value: "hybrid" },
  { label: "On-site", value: "onsite" },
];

const REMOTE_OPTIONS = [
  { label: "Any", value: undefined },
  { label: "Fully Remote", value: "Fully Remote" },
  { label: "Remote-first", value: "Remote-first" },
  { label: "Hybrid", value: "Hybrid" },
];

const MATERNITY_OPTIONS = [
  { label: "Any", value: undefined },
  { label: "16+ wks", value: 16 },
  { label: "20+ wks", value: 20 },
  { label: "26+ wks", value: 26 },
];

const SCORE_CHIPS = [60, 75, 85, 90];

const DEPT_OPTIONS = [
  "Engineering", "Product", "Design", "Data", "Marketing",
  "Sales", "People", "Finance", "Customer Success", "Operations", "Legal",
];

// ── Filter Button ─────────────────────────────────────────────────────────────

function FilterBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={[
        "flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors text-left w-full",
        active
          ? "bg-[#5B39C8] text-white font-semibold"
          : "text-gray-600 hover:bg-gray-50",
      ].join(" ")}
    >
      <span>{children}</span>
      {active && <CheckCircle2 className="w-3.5 h-3.5 opacity-80 flex-shrink-0" />}
    </button>
  );
}

// ── Section Header ────────────────────────────────────────────────────────────

function SidebarSection({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-2.5">
      {icon}
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function JobSearch() {
  const [searchParams] = useSearchParams();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [remoteType, setRemoteType] = useState<string | undefined>();
  const [minMaternity, setMinMaternity] = useState<number | undefined>();
  const [ivfOnly, setIvfOnly] = useState(false);
  const [childcareOnly, setChildcareOnly] = useState(false);
  const [minScore, setMinScore] = useState<number>(60);
  const [minSalary, setMinSalary] = useState<number | undefined>();
  const [department, setDepartment] = useState<string | undefined>();
  const [alertModalOpen, setAlertModalOpen] = useState(false);

  const runSearch = useCallback(async (opts: {
    s?: string;
    rt?: string;
    mat?: number;
    ivf?: boolean;
    childcare?: boolean;
    score?: number;
    salary?: number;
    dept?: string;
  } = {}) => {
    setLoading(true);
    setPage(1);
    try {
      const data = await fetchJobs({
        search: opts.s || undefined,
        remote_type: opts.rt,
        min_maternity_leave: opts.mat,
        ivf_coverage: opts.ivf || undefined,
        childcare_support: opts.childcare || undefined,
        min_carefolio_score: opts.score,
        min_salary: opts.salary,
        department: opts.dept,
      });
      setJobs(data);
    } catch (err) {
      console.error("Job search error:", err);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load — pick up ?search= from URL
  useEffect(() => {
    const initSearch = searchParams.get("search") || undefined;
    runSearch({ s: initSearch });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-search when any filter changes
  useEffect(() => {
    runSearch({
      s: search || undefined,
      rt: remoteType,
      mat: minMaternity,
      ivf: ivfOnly,
      childcare: childcareOnly,
      score: minScore,
      salary: minSalary,
      dept: department,
    });
  }, [remoteType, minMaternity, ivfOnly, childcareOnly, minScore, minSalary, department]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch({
      s: search || undefined,
      rt: remoteType,
      mat: minMaternity,
      ivf: ivfOnly,
      childcare: childcareOnly,
      score: minScore,
      salary: minSalary,
      dept: department,
    });
  };

  const clearAll = () => {
    setSearch("");
    setRemoteType(undefined);
    setMinMaternity(undefined);
    setIvfOnly(false);
    setChildcareOnly(false);
    setMinScore(60);
    setMinSalary(undefined);
    setDepartment(undefined);
    runSearch({});
  };

  const activeFilterCount = [
    !!remoteType,
    !!minMaternity,
    ivfOnly,
    childcareOnly,
    minScore > 60,
    !!minSalary,
    !!department,
  ].filter(Boolean).length;

  const totalPages = Math.ceil(jobs.length / ITEMS_PER_PAGE);
  const paginatedJobs = jobs.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Build active tag list for display
  const activeTags: { label: string; clear: () => void }[] = [];
  if (remoteType) activeTags.push({ label: remoteType, clear: () => setRemoteType(undefined) });
  if (minMaternity) activeTags.push({ label: `${minMaternity}+ wk maternity`, clear: () => setMinMaternity(undefined) });
  if (ivfOnly) activeTags.push({ label: "IVF / Fertility", clear: () => setIvfOnly(false) });
  if (childcareOnly) activeTags.push({ label: "Childcare support", clear: () => setChildcareOnly(false) });
  if (minScore > 60) activeTags.push({ label: `Score ${minScore}+`, clear: () => setMinScore(60) });
  if (minSalary) activeTags.push({ label: `$${Math.round(minSalary / 1000)}k+ salary`, clear: () => setMinSalary(undefined) });
  if (department) activeTags.push({ label: department, clear: () => setDepartment(undefined) });

  return (
    <div className="min-h-screen bg-[#F7F7FB]">

      {/* ── Top search bar ──────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-5">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-3">
            <div className="flex items-center bg-white border border-gray-200 rounded-xl shadow-sm flex-1 overflow-hidden">
              <div className="flex items-center px-4 flex-1 gap-2">
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Job title, company, or keyword…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="py-3 text-sm text-gray-700 w-full outline-none placeholder-gray-400 bg-transparent"
                />
              </div>
              <button
                type="submit"
                className="m-[5px] px-5 py-[9px] bg-[#5B39C8] text-white text-sm font-semibold rounded-lg hover:bg-[#4a2fb0] transition-colors"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 items-start">

          {/* ── Filter sidebar ──────────────────────────────────────────────── */}
          <aside className="bg-white border border-gray-200 rounded-2xl p-5 sticky top-20">

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-900">Filters</h2>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearAll}
                  className="text-xs text-[#5B39C8] font-semibold hover:underline flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Clear ({activeFilterCount})
                </button>
              )}
            </div>

            {/* Carefolio Quality Gate banner */}
            <div className="bg-[#5B39C8] rounded-xl p-3 mb-5">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-purple-200 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-bold text-white leading-tight">Carefolio Quality Gate</p>
                  <p className="text-[10px] text-purple-200 mt-0.5 leading-relaxed">
                    All jobs are at companies scoring ≥60 on maternity, IVF, childcare &amp; remote flexibility.
                  </p>
                </div>
              </div>
            </div>

            {/* Flexibility / Remote */}
            <div className="mb-5">
              <SidebarSection icon={<Globe className="w-3.5 h-3.5 text-blue-500" />} label="Flexibility" />
              <div className="flex flex-col gap-1">
                {REMOTE_OPTIONS.map(opt => (
                  <FilterBtn
                    key={opt.label}
                    active={remoteType === opt.value}
                    onClick={() => setRemoteType(opt.value)}
                  >
                    {opt.label}
                  </FilterBtn>
                ))}
              </div>
            </div>

            {/* Department */}
            <div className="mb-5">
              <SidebarSection icon={<Briefcase className="w-3.5 h-3.5 text-orange-500" />} label="Department" />
              <div className="flex flex-col gap-1">
                <FilterBtn active={department === undefined} onClick={() => setDepartment(undefined)}>
                  All departments
                </FilterBtn>
                {DEPT_OPTIONS.map(d => (
                  <FilterBtn key={d} active={department === d} onClick={() => setDepartment(d)}>
                    {d}
                  </FilterBtn>
                ))}
              </div>
            </div>

            {/* Maternity Leave */}
            <div className="mb-5">
              <SidebarSection icon={<Baby className="w-3.5 h-3.5 text-pink-500" />} label="Maternity Leave" />
              <div className="flex flex-col gap-1">
                {MATERNITY_OPTIONS.map(opt => (
                  <FilterBtn
                    key={opt.label}
                    active={minMaternity === opt.value}
                    onClick={() => setMinMaternity(opt.value)}
                  >
                    {opt.label}
                  </FilterBtn>
                ))}
              </div>
            </div>

            {/* IVF / Fertility */}
            <div className="mb-5">
              <SidebarSection icon={<Heart className="w-3.5 h-3.5 text-rose-500" />} label="Fertility Benefits" />
              <button
                onClick={() => setIvfOnly(!ivfOnly)}
                className={[
                  "flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-colors",
                  ivfOnly ? "bg-[#5B39C8] text-white font-semibold" : "text-gray-600 hover:bg-gray-50",
                ].join(" ")}
              >
                <span className="flex items-center gap-2">
                  <Heart className="w-3.5 h-3.5 opacity-70" />
                  IVF / Fertility covered
                </span>
                {ivfOnly && <CheckCircle2 className="w-3.5 h-3.5 opacity-80" />}
              </button>
            </div>

            {/* Childcare */}
            <div className="mb-5">
              <SidebarSection icon={<CheckCircle2 className="w-3.5 h-3.5 text-purple-500" />} label="Childcare" />
              <button
                onClick={() => setChildcareOnly(!childcareOnly)}
                className={[
                  "flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-colors",
                  childcareOnly ? "bg-[#5B39C8] text-white font-semibold" : "text-gray-600 hover:bg-gray-50",
                ].join(" ")}
              >
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 opacity-70" />
                  Childcare support
                </span>
                {childcareOnly && <CheckCircle2 className="w-3.5 h-3.5 opacity-80" />}
              </button>
            </div>

            {/* Min Carefolio Score */}
            <div className="mb-5">
              <SidebarSection icon={<BadgeCheck className="w-3.5 h-3.5 text-[#5B39C8]" />} label="Min Care Score" />
              <div className="flex flex-wrap gap-1.5">
                {SCORE_CHIPS.map(s => (
                  <button
                    key={s}
                    onClick={() => setMinScore(s === minScore && s === 60 ? 60 : s)}
                    className={[
                      "px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors",
                      minScore === s
                        ? "bg-[#5B39C8] text-white border-[#5B39C8]"
                        : "border-gray-200 text-gray-600 hover:border-[#5B39C8]/40 hover:text-[#5B39C8] bg-white",
                    ].join(" ")}
                  >
                    {s}+
                  </button>
                ))}
              </div>
            </div>

            {/* Min Salary */}
            <div className="mb-2">
              <SidebarSection icon={<DollarSign className="w-3.5 h-3.5 text-green-500" />} label="Min Salary" />
              <div className="px-1">
                <input
                  type="range"
                  min={0}
                  max={200000}
                  step={10000}
                  value={minSalary ?? 0}
                  onChange={e => setMinSalary(Number(e.target.value) || undefined)}
                  className="w-full accent-[#5B39C8]"
                />
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-gray-400">$0</span>
                  <span className="text-[10px] font-semibold text-[#5B39C8]">
                    {minSalary ? `$${Math.round(minSalary / 1000)}k+` : "Any"}
                  </span>
                  <span className="text-[10px] text-gray-400">$200k</span>
                </div>
              </div>
            </div>
          </aside>

          {/* ── Results ─────────────────────────────────────────────────────── */}
          <div>
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Remote Jobs{" "}
                  <span className="text-[#5B39C8]">for Parents &amp; Caregivers</span>
                </h1>
                <p className="text-xs text-gray-400 mt-0.5">
                  {loading ? "Searching…" : (
                    <>
                      <strong className="text-gray-600">{jobs.length}</strong>{" "}
                      role{jobs.length !== 1 ? "s" : ""} at care-verified companies · min score{" "}
                      <strong className="text-gray-600">{minScore}</strong>
                    </>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="hidden sm:flex items-center gap-1 text-[10px] font-semibold text-[#5B39C8] bg-purple-50 border border-purple-100 px-2.5 py-1 rounded-full">
                  <BadgeCheck className="w-3 h-3" />
                  Sorted by Care Score
                </span>
                <button
                  onClick={() => setAlertModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-[#F59E0B] hover:bg-[#d97706] text-white rounded-lg transition-colors"
                >
                  <Bell className="w-3.5 h-3.5" /> Get Alerts
                </button>
              </div>
            </div>

            {/* Remote type filter chips */}
            <div className="flex flex-wrap gap-2 mb-4">
              {REMOTE_TYPE_CHIPS.map(chip => (
                <button
                  key={chip.label}
                  onClick={() => setRemoteType(chip.value)}
                  className={[
                    "px-4 py-2 rounded-full text-xs font-semibold border transition-colors",
                    remoteType === chip.value
                      ? "bg-[#5B39C8] text-white border-[#5B39C8]"
                      : "border-gray-200 text-gray-600 hover:border-[#5B39C8]/40 hover:text-[#5B39C8] bg-white",
                  ].join(" ")}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Active filter chips */}
            {activeTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {activeTags.map(tag => (
                  <ActiveTag key={tag.label} label={tag.label} onRemove={tag.clear} />
                ))}
              </div>
            )}

            {/* Job list */}
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 h-48 animate-pulse" />
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-16 text-center">
                <Briefcase className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-700 font-semibold mb-1">More jobs coming soon — check back Sunday.</p>
                <p className="text-gray-400 text-sm">
                  New roles from care-verified companies are synced weekly.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {paginatedJobs.map(job => <JobCard key={job.id} job={job} />)}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(n => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={[
                      "w-8 h-8 flex items-center justify-center text-sm rounded-lg border transition-colors",
                      page === n ? "bg-[#5B39C8] text-white border-[#5B39C8]" : "border-gray-200 text-gray-600 hover:bg-gray-50",
                    ].join(" ")}
                  >
                    {n}
                  </button>
                ))}
                {totalPages > 7 && <span className="text-gray-300 text-sm">…</span>}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <JobAlertModal
        open={alertModalOpen}
        onClose={() => setAlertModalOpen(false)}
      />
    </div>
  );
}