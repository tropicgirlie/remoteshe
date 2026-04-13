import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Search, Globe, Baby, Heart, CheckCircle2, Users,
  MapPin, BadgeCheck, SlidersHorizontal, X, BarChart2
} from "lucide-react";
import { companiesAPI } from "../lib/api";
import { Company } from "../lib/types";
import { CompanyLogo } from "../components/company-logo";

const INDUSTRIES = ["All", "Technology", "Healthcare", "Finance", "SaaS / Fintech", "Education", "Marketing", "Design"];
const REMOTE_POLICIES = ["All", "Global", "US Only", "Hybrid", "Remote"];

function ScoreBadge({ score }: { score?: number }) {
  if (score === undefined || score === null) return null;
  const isGold = score >= 90;
  const isGreen = score >= 75;
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${isGold ? 'bg-amber-100 text-amber-700' : isGreen ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
      <BadgeCheck className="w-3 h-3" />
      {score}/100
    </div>
  );
}

function CompanyCard({ company, onClick }: { company: Company; onClick: () => void }) {
  const tierLabel = (company.carefolio_score || 0) >= 90 ? 'GOLD TIER' : (company.carefolio_score || 0) >= 75 ? 'RISING STAR' : 'LISTED';
  const tierColor = (company.carefolio_score || 0) >= 90
    ? 'bg-amber-100 text-amber-700 border-amber-200'
    : (company.carefolio_score || 0) >= 75
    ? 'bg-purple-100 text-purple-700 border-purple-200'
    : 'bg-gray-100 text-gray-500 border-gray-200';

  const benefits = [
    company.maternity_leave_weeks && { label: `${company.maternity_leave_weeks}w Maternity`, icon: Baby, color: 'text-pink-600 bg-pink-50 border-pink-200' },
    company.paternity_leave_weeks && { label: `${company.paternity_leave_weeks}w Paternity`, icon: Users, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    company.fertility_support && { label: 'Fertility/IVF', icon: Heart, color: 'text-pink-600 bg-pink-50 border-pink-200' },
    company.childcare_support && { label: 'Childcare', icon: Baby, color: 'text-purple-600 bg-purple-50 border-purple-200' },
    company.caregiver_leave && { label: 'Caregiver Leave', icon: CheckCircle2, color: 'text-green-600 bg-green-50 border-green-200' },
  ].filter(Boolean) as Array<{ label: string; icon: any; color: string }>;

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-2xl p-5 cursor-pointer hover:shadow-md hover:border-[#5B39C8]/30 transition-all group"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <CompanyLogo name={company.name} website={company.website} size={56} />
          <div>
            <div className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full border mb-1 ${tierColor}`}>
              {tierLabel}
            </div>
            <h3 className="font-bold text-gray-900 text-base leading-tight group-hover:text-[#5B39C8] transition-colors">
              {company.name}
            </h3>
            {company.industry && (
              <p className="text-xs text-gray-500">{company.industry}</p>
            )}
          </div>
        </div>
        {company.carefolio_score !== undefined && (
          <div className="text-right flex-shrink-0">
            <div className="text-2xl font-black text-gray-900">{company.carefolio_score}</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider">Care Score</div>
          </div>
        )}
      </div>

      {/* Location */}
      {(company.country || company.remote_policy) && (
        <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span>{[company.remote_policy, company.country].filter(Boolean).join(' · ')}</span>
        </div>
      )}

      {/* Benefits tags */}
      {benefits.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {benefits.slice(0, 3).map((b) => {
            const Icon = b.icon;
            return (
              <span key={b.label} className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${b.color}`}>
                <Icon className="w-2.5 h-2.5" />
                {b.label}
              </span>
            );
          })}
          {benefits.length > 3 && (
            <span className="text-[10px] text-gray-400 px-2 py-0.5">+{benefits.length - 3} more</span>
          )}
        </div>
      )}

      {/* Verification */}
      {company.verification_status === 'verified' && (
        <div className="flex items-center gap-1 text-xs text-green-600 mb-3">
          <CheckCircle2 className="w-3 h-3" />
          <span className="font-semibold">Verified</span>
        </div>
      )}

      {/* CTA */}
      <button
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        className="mt-1 w-full py-2 bg-[#5B39C8] text-white text-sm font-semibold rounded-lg hover:bg-[#4a2fb0] transition-colors"
      >
        View Carefolio
      </button>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-14 h-14 rounded-xl bg-gray-200" />
        <div className="flex-1">
          <div className="h-3 bg-gray-200 rounded w-16 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-32 mb-1" />
          <div className="h-3 bg-gray-200 rounded w-24" />
        </div>
      </div>
      <div className="h-3 bg-gray-200 rounded w-40 mb-3" />
      <div className="flex gap-2 mb-4">
        <div className="h-5 bg-gray-200 rounded-full w-20" />
        <div className="h-5 bg-gray-200 rounded-full w-16" />
      </div>
      <div className="h-9 bg-gray-200 rounded-lg w-full" />
    </div>
  );
}

export function Companies() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filtered, setFiltered] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [industry, setIndustry] = useState("All");
  const [remotePolicy, setRemotePolicy] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<{
    fertility?: boolean;
    childcare?: boolean;
    caregiver?: boolean;
    minMaternity?: number;
    minScore?: number;
  }>({});

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [companies, search, industry, remotePolicy, activeFilters]);

  const loadCompanies = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await companiesAPI.getAll();
      setCompanies(data);
    } catch (err) {
      console.error("Error loading companies:", err);
      setError("Failed to load companies. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...companies];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.industry?.toLowerCase().includes(q) ||
        c.country?.toLowerCase().includes(q)
      );
    }

    if (industry !== "All") {
      result = result.filter(c => c.industry === industry);
    }

    if (remotePolicy !== "All") {
      result = result.filter(c => c.remote_policy?.includes(remotePolicy));
    }

    if (activeFilters.fertility) {
      result = result.filter(c => c.fertility_support || c.ivf_coverage);
    }

    if (activeFilters.childcare) {
      result = result.filter(c => c.childcare_support);
    }

    if (activeFilters.caregiver) {
      result = result.filter(c => c.caregiver_leave);
    }

    if (activeFilters.minMaternity) {
      result = result.filter(c => (c.maternity_leave_weeks || 0) >= (activeFilters.minMaternity || 0));
    }

    if (activeFilters.minScore) {
      result = result.filter(c => (c.carefolio_score || 0) >= (activeFilters.minScore || 0));
    }

    setFiltered(result);
  };

  const clearAllFilters = () => {
    setSearch("");
    setIndustry("All");
    setRemotePolicy("All");
    setActiveFilters({});
  };

  const hasActiveFilters = search || industry !== "All" || remotePolicy !== "All" || Object.keys(activeFilters).length > 0;

  const toggleBoolFilter = (key: keyof typeof activeFilters) => {
    setActiveFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-[#F8F8FC]">
      {/* Page hero */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="max-w-2xl">
            <div className="inline-block text-[11px] font-bold tracking-widest text-[#5B39C8] uppercase mb-4 border border-[#5B39C8]/30 px-3 py-1 rounded-full bg-[#5B39C8]/5">
              Carefolio Index
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Browse Care-First Companies
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              Every company ranked and verified by our Carefolio scoring system — so you can find employers that truly support working parents and caregivers.
            </p>
          </div>

          {/* Search bar */}
          <div className="mt-6 flex gap-3 max-w-2xl">
            <div className="flex-1 flex items-center bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="flex items-center px-4 flex-1">
                <Search className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search companies, industries..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="py-3 text-sm text-gray-700 w-full outline-none placeholder-gray-400 bg-transparent"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="p-1 text-gray-400 hover:text-gray-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-medium transition-colors ${showFilters ? 'bg-[#5B39C8] text-white border-[#5B39C8]' : 'bg-white border-gray-200 text-gray-700 hover:border-[#5B39C8] hover:text-[#5B39C8]'}`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-orange-400" />
              )}
            </button>
          </div>

          {/* Filter pills */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-xl max-w-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-2">Industry</label>
                  <div className="flex flex-wrap gap-1.5">
                    {INDUSTRIES.map(ind => (
                      <button
                        key={ind}
                        onClick={() => setIndustry(ind)}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${industry === ind ? 'bg-[#5B39C8] text-white border-[#5B39C8]' : 'bg-white border-gray-200 text-gray-600 hover:border-[#5B39C8]'}`}
                      >
                        {ind}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-2">Remote Policy</label>
                  <div className="flex flex-wrap gap-1.5">
                    {REMOTE_POLICIES.map(rp => (
                      <button
                        key={rp}
                        onClick={() => setRemotePolicy(rp)}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${remotePolicy === rp ? 'bg-[#5B39C8] text-white border-[#5B39C8]' : 'bg-white border-gray-200 text-gray-600 hover:border-[#5B39C8]'}`}
                      >
                        {rp}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-2">Benefits</label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { key: 'fertility', label: 'Fertility/IVF' },
                      { key: 'childcare', label: 'Childcare' },
                      { key: 'caregiver', label: 'Caregiver Leave' },
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => toggleBoolFilter(key as any)}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${(activeFilters as any)[key] ? 'bg-[#5B39C8] text-white border-[#5B39C8]' : 'bg-white border-gray-200 text-gray-600 hover:border-[#5B39C8]'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-2">Min Care Score</label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { val: undefined, label: 'Any' },
                      { val: 70, label: '70+' },
                      { val: 80, label: '80+' },
                      { val: 90, label: '90+ (Gold)' },
                    ].map(({ val, label }) => (
                      <button
                        key={label}
                        onClick={() => setActiveFilters(prev => ({ ...prev, minScore: val }))}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${activeFilters.minScore === val ? 'bg-[#5B39C8] text-white border-[#5B39C8]' : 'bg-white border-gray-200 text-gray-600 hover:border-[#5B39C8]'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="mt-3 text-xs text-gray-500 hover:text-[#5B39C8] flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Clear all filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <p className="text-sm font-semibold text-gray-900">
              {loading ? (
                <span className="text-gray-400">Loading companies...</span>
              ) : (
                <>
                  <span className="text-[#5B39C8]">{filtered.length}</span> compan{filtered.length === 1 ? 'y' : 'ies'} found
                  {hasActiveFilters && <span className="text-gray-400 font-normal"> · filtered from {companies.length}</span>}
                </>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Sorted by Care Score</span>
            <BarChart2 className="w-4 h-4 text-[#5B39C8]" />
          </div>
        </div>

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap mb-4">
            {search && (
              <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-[#5B39C8]/10 text-[#5B39C8] rounded-full">
                <span>"{search}"</span>
                <button onClick={() => setSearch("")}><X className="w-3 h-3" /></button>
              </div>
            )}
            {industry !== "All" && (
              <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-[#5B39C8]/10 text-[#5B39C8] rounded-full">
                <span>{industry}</span>
                <button onClick={() => setIndustry("All")}><X className="w-3 h-3" /></button>
              </div>
            )}
            {remotePolicy !== "All" && (
              <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-[#5B39C8]/10 text-[#5B39C8] rounded-full">
                <span>{remotePolicy}</span>
                <button onClick={() => setRemotePolicy("All")}><X className="w-3 h-3" /></button>
              </div>
            )}
            {activeFilters.fertility && (
              <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-[#5B39C8]/10 text-[#5B39C8] rounded-full">
                <span>Fertility/IVF</span>
                <button onClick={() => toggleBoolFilter('fertility')}><X className="w-3 h-3" /></button>
              </div>
            )}
            {activeFilters.childcare && (
              <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-[#5B39C8]/10 text-[#5B39C8] rounded-full">
                <span>Childcare</span>
                <button onClick={() => toggleBoolFilter('childcare')}><X className="w-3 h-3" /></button>
              </div>
            )}
            {activeFilters.caregiver && (
              <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-[#5B39C8]/10 text-[#5B39C8] rounded-full">
                <span>Caregiver Leave</span>
                <button onClick={() => toggleBoolFilter('caregiver')}><X className="w-3 h-3" /></button>
              </div>
            )}
            {activeFilters.minScore && (
              <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-[#5B39C8]/10 text-[#5B39C8] rounded-full">
                <span>Score {activeFilters.minScore}+</span>
                <button onClick={() => setActiveFilters(prev => ({ ...prev, minScore: undefined }))}><X className="w-3 h-3" /></button>
              </div>
            )}
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center mb-6">
            <p className="text-red-600 text-sm mb-3">{error}</p>
            <button
              onClick={loadCompanies}
              className="px-5 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
            <div className="w-16 h-16 bg-[#5B39C8]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Globe className="w-8 h-8 text-[#5B39C8]" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-2">
              {companies.length === 0 ? "No companies yet" : "No companies match your filters"}
            </h3>
            <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
              {companies.length === 0
                ? "Companies added via the admin dashboard will appear here."
                : "Try adjusting your search or removing some filters."}
            </p>
            {hasActiveFilters ? (
              <button
                onClick={clearAllFilters}
                className="px-6 py-2.5 bg-[#5B39C8] text-white text-sm font-semibold rounded-lg hover:bg-[#4a2fb0] transition-colors"
              >
                Clear All Filters
              </button>
            ) : (
              <button
                onClick={() => navigate('/admin')}
                className="px-6 py-2.5 bg-[#5B39C8] text-white text-sm font-semibold rounded-lg hover:bg-[#4a2fb0] transition-colors"
              >
                Go to Admin
              </button>
            )}
          </div>
        )}

        {/* Companies grid */}
        {!loading && !error && filtered.length > 0 && (
          <>
            {/* Gold tier section */}
            {filtered.some(c => (c.carefolio_score || 0) >= 90) && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center">
                    <span className="text-[9px] font-black text-white">★</span>
                  </div>
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Gold Tier — Score 90+</h2>
                  <div className="flex-1 h-px bg-amber-200" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filtered.filter(c => (c.carefolio_score || 0) >= 90).map(company => (
                    <CompanyCard
                      key={company.id}
                      company={company}
                      onClick={() => navigate(`/company/${company.id}`)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* All other companies */}
            {filtered.some(c => (c.carefolio_score || 0) < 90) && (
              <div>
                {filtered.some(c => (c.carefolio_score || 0) >= 90) && (
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-5 h-5 bg-[#5B39C8] rounded-full flex items-center justify-center">
                      <span className="text-[9px] font-black text-white">↑</span>
                    </div>
                    <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">All Companies</h2>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filtered.filter(c => (c.carefolio_score || 0) < 90).map(company => (
                    <CompanyCard
                      key={company.id}
                      company={company}
                      onClick={() => navigate(`/company/${company.id}`)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}