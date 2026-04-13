import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Globe, Users, Baby, Heart, CheckCircle2, MapPin, DollarSign,
  Clock, ArrowRight, BadgeCheck, BarChart2, Star, Bell, Search, User,
  Code2, AlertTriangle, ExternalLink,
} from "lucide-react";
import { Link } from "react-router";
import { companiesAPI, jobsAPI, perksAPI } from "../lib/api";
import { Company, Job, Perk } from "../lib/types";
import { CompanyLogo } from "../components/company-logo";

function BenefitCard({ icon: Icon, title, value }: { icon: any; title: string; value?: string }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 hover:border-[#5B39C8]/20 transition-colors">
      <div className="w-8 h-8 rounded-lg bg-[#5B39C8]/10 flex items-center justify-center mb-3">
        <Icon className="w-4 h-4 text-[#5B39C8]" />
      </div>
      <p className="text-xs font-bold text-gray-900 mb-0.5">{title}</p>
      {value && <p className="text-xs text-gray-500">{value}</p>}
    </div>
  );
}

// CompanyLogo is now in components/company-logo.tsx with Clearbit integration

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Posted today";
  if (days === 1) return "Posted 1 day ago";
  if (days < 7) return `Posted ${days} days ago`;
  if (days < 14) return "Posted 1 week ago";
  return `Posted ${Math.floor(days / 7)} weeks ago`;
}

export function CompanyProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [perks, setPerks] = useState<Perk[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadCompanyData(id);
  }, [id]);

  const loadCompanyData = async (companyId: string) => {
    setLoading(true);
    try {
      const [companyData, jobsData, perksData] = await Promise.all([
        companiesAPI.getById(companyId),
        jobsAPI.getAll({ company_id: companyId }),
        perksAPI.getAll(companyId),
      ]);
      setCompany(companyData);
      setJobs(jobsData);
      setPerks(perksData);
    } catch (error) {
      console.error("Error loading company data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F8FC] py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl p-8 animate-pulse h-36" />
          ))}
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-[#F8F8FC] py-8">
        <div className="max-w-4xl mx-auto px-4 text-center py-16">
          <p className="text-gray-500 mb-4">Company not found.</p>
          <button onClick={() => navigate('/jobs')} className="px-6 py-2.5 bg-[#5B39C8] text-white rounded-lg">
            Browse Jobs
          </button>
        </div>
      </div>
    );
  }

  const verificationLabel = company.verification_status === 'verified'
    ? 'Verified'
    : company.verification_status === 'self_reported'
    ? 'Self-Reported'
    : 'AI Extracted';

  return (
    <div className="min-h-screen bg-[#F8F8FC]">
      {/* Page header nav (company profile specific) */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <button onClick={() => navigate('/jobs')} className="hover:text-[#5B39C8] transition-colors">
                Browse Companies
              </button>
              <button onClick={() => navigate('/jobs')} className="hover:text-[#5B39C8] transition-colors">
                Job Board
              </button>
              <button onClick={() => navigate('/about')} className="hover:text-[#5B39C8] transition-colors">
                Resources
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                <Search className="w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search companies..."
                  className="text-xs bg-transparent outline-none text-gray-600 w-28"
                />
              </div>
              <Bell className="w-5 h-5 text-gray-500 cursor-pointer" />
              <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="w-4 h-4 text-gray-500" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
        {/* Company Header */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex items-start gap-4 mb-4">
            <CompanyLogo name={company.name} website={company.website} size={64} />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-gray-900">{company.name}</h1>
                {company.verification_status === 'verified' && (
                  <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified
                  </div>
                )}
              </div>
              {company.industry && (
                <p className="text-sm text-gray-500 mb-2">Empowering the future of professionals in remote work.</p>
              )}
              <div className="flex items-center gap-4 flex-wrap text-xs text-gray-500">
                {company.website && (
                  <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-[#5B39C8]">
                    <Globe className="w-3 h-3" />
                    {company.website.replace(/https?:\/\//, '')}
                  </a>
                )}
                {company.industry && (
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {company.industry}
                  </span>
                )}
                {company.country && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {company.country}
                    {company.remote_policy ? ` (${company.remote_policy})` : ''}
                  </span>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button className="px-5 py-2 bg-[#5B39C8] text-white text-sm font-semibold rounded-lg hover:bg-[#4a2fb0] transition-colors">
                Follow
              </button>
              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Visit Website
                </a>
              )}
            </div>
          </div>

          {/* Tags row */}
          <div className="flex items-center gap-2 flex-wrap">
            {company.remote_policy && (
              <span className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-full border border-gray-200 flex items-center gap-1">
                <Globe className="w-3 h-3" />
                {company.remote_policy} Policy
              </span>
            )}
            {company.last_verified_date && (
              <span className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-full border border-gray-200 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Last verified: {new Date(company.last_verified_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </span>
            )}
          </div>
        </div>

        {/* Care Infrastructure & Equity */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Care Infrastructure &amp; Equity</h2>
            <button className="text-xs text-[#5B39C8] hover:underline">
              Methodology: Carefolio Standard 2.0
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-4">
            {/* Score card */}
            <div className="bg-[#F8F8FC] border border-gray-100 rounded-xl p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Carefolio Score</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-5xl font-black text-gray-900">{company.carefolio_score ?? '--'}</span>
                <span className="text-base text-gray-400 font-medium">/100</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-green-600 font-semibold mb-3">
                <BarChart2 className="w-3 h-3" />
                +5% from last year
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                This score measures institutional support for life-work integration and career equity.
              </p>
            </div>

            {/* Benefit cards grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <BenefitCard
                icon={Baby}
                title="Maternity Leave"
                value={company.maternity_leave_weeks ? `${company.maternity_leave_weeks} weeks fully paid` : 'Not specified'}
              />
              <BenefitCard
                icon={Users}
                title="Paternity Leave"
                value={company.paternity_leave_weeks ? `${company.paternity_leave_weeks} weeks fully paid` : 'Not specified'}
              />
              <BenefitCard
                icon={Heart}
                title="IVF Support"
                value={company.ivf_coverage ? 'Up to $25k coverage' : (company.fertility_support ? 'Fertility support' : 'Not covered')}
              />
              <BenefitCard
                icon={CheckCircle2}
                title="Flexible Return"
                value={company.caregiver_leave ? 'Part-time ramp up' : 'Standard return'}
              />
              <BenefitCard
                icon={Clock}
                title="Caregiver Leave"
                value={company.caregiver_leave ? '4 weeks per year' : 'Not offered'}
              />
              <BenefitCard
                icon={BarChart2}
                title="Women Leadership"
                value={company.women_leadership_percent ? `${company.women_leadership_percent}% (VP+ Level)` : 'Not reported'}
              />
            </div>
          </div>
        </div>

        {/* Additional Perks */}
        {perks.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Additional Perks</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {perks.map(perk => (
                <div key={perk.id} className="flex items-start gap-3 p-3 bg-[#5B39C8]/5 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 text-[#5B39C8] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{perk.perk_type}</p>
                    {perk.description && <p className="text-xs text-gray-500">{perk.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Open Opportunities */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-gray-900">Open Opportunities</h2>
            <button
              onClick={() => navigate('/jobs')}
              className="flex items-center gap-1.5 text-sm text-[#5B39C8] border border-[#5B39C8]/30 px-4 py-1.5 rounded-lg hover:bg-[#5B39C8]/5 transition-colors"
            >
              View All Jobs <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mb-5">Showing {jobs.length} remote role{jobs.length !== 1 ? 's' : ''}</p>

          {jobs.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">No open positions at this time.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {jobs.map(job => {
                const age = Math.floor((Date.now() - new Date(job.posted_date || 0).getTime()) / 86400000);
                const isNew = age <= 3;
                const isStale = (job as any).is_stale || age > 30;
                const salaryStr = (job as any).salary_min && (job as any).salary_max
                  ? `$${((job as any).salary_min / 1000).toFixed(0)}k–$${((job as any).salary_max / 1000).toFixed(0)}k`
                  : job.salary_range;
                return (
                  <div key={job.id} className="py-4 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {isNew && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-0.5">
                            NEW
                          </span>
                        )}
                        {isStale && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200 flex items-center gap-0.5">
                            <AlertTriangle className="w-2 h-2" /> May expire
                          </span>
                        )}
                        <Link to={`/jobs/${job.id}`} className="text-sm font-bold text-gray-900 hover:text-[#5B39C8] transition-colors">
                          {job.title}
                        </Link>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap mb-1.5">
                        {job.remote_type && (
                          <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-full">
                            {job.remote_type}
                          </span>
                        )}
                        {salaryStr && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            {salaryStr}
                          </span>
                        )}
                        {job.posted_date && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {timeAgo(job.posted_date)}
                          </span>
                        )}
                      </div>
                      {(job as any).tech_stack && (job as any).tech_stack.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap">
                          <Code2 className="w-3 h-3 text-gray-300" />
                          {((job as any).tech_stack as string[]).slice(0, 4).map((t: string) => (
                            <span key={t} className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#5B39C8]/6 text-[#5B39C8] border border-[#5B39C8]/15">{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link
                        to={`/jobs/${job.id}`}
                        className="px-3 py-1.5 border border-[#5B39C8]/30 text-[#5B39C8] text-xs font-semibold rounded-lg hover:bg-[#5B39C8]/5 transition-colors"
                      >
                        Details
                      </Link>
                      {job.job_url ? (
                        <a
                          href={job.job_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-1.5 bg-[#5B39C8] text-white text-xs font-bold rounded-lg hover:bg-[#4a2fb0] transition-colors flex items-center gap-1"
                        >
                          Apply <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <a
                          href={company.website || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-1.5 border border-gray-300 text-xs font-semibold text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Careers
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}