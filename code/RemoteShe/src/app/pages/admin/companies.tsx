import { useState, useEffect } from "react";
import {
  Pencil, Trash2, DatabaseZap, X, CheckCircle2, Plus,
} from "lucide-react";
import { companiesAPI, jobsAPI } from "../../lib/api";
import { Company } from "../../lib/types";
import { toast } from "sonner";
import { projectId, publicAnonKey } from '/utils/supabase/info';

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function CareSignalBadge({ label, color }: { label: string; color: string }) {
  const colors: Record<string, string> = {
    pink:   'bg-pink-100 text-pink-700 border-pink-200',
    purple: 'bg-purple-100 text-purple-700 border-purple-200',
    green:  'bg-green-100 text-green-700 border-green-200',
  };
  return (
    <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${colors[color] || colors.purple}`}>
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'active' || status === 'verified') {
    return (
      <span className="flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-full">
        <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
        Verified
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
      Review
    </span>
  );
}

const BLANK_FORM = {
  name: '',
  industry: 'Technology',
  maternity_leave: false,
  fertility_support: false,
  childcare_support: false,
  caregiver_leave: false,
  description: '',
  job_board_url: '',
  website: '',
};

export function AdminCompanies() {
  const [companies, setCompanies]       = useState<Company[]>([]);
  const [loading, setLoading]           = useState(true);
  const [seeding, setSeeding]           = useState(false);
  const [seedingJobs, setSeedingJobs]   = useState(false);

  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [companyForm, setCompanyForm]       = useState({ ...BLANK_FORM });
  const [savingCompany, setSavingCompany]   = useState(false);

  const [jobForm, setJobForm]   = useState({ company_id: '', title: '', salary_range: '', remote_type: 'Remote', job_url: '' });
  const [savingJob, setSavingJob] = useState(false);

  const [showJobForm, setShowJobForm] = useState(false);

  useEffect(() => { loadCompanies(); }, []);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const data = await companiesAPI.getAll();
      setCompanies(data);
    } catch (error) {
      console.error("Error loading companies:", error);
      toast.error("Failed to load companies");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (company: Company & { job_board_url?: string; website?: string }) => {
    setEditingCompany(company);
    setCompanyForm({
      name:              company.name,
      industry:          company.industry || 'Technology',
      maternity_leave:   !!company.maternity_leave_weeks,
      fertility_support: !!company.fertility_support,
      childcare_support: !!company.childcare_support,
      caregiver_leave:   !!company.caregiver_leave,
      description:       '',
      job_board_url:     (company as any).job_board_url || '',
      website:           (company as any).website || '',
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this company and all related data?")) return;
    try {
      await companiesAPI.delete(id);
      toast.success("Company deleted");
      loadCompanies();
    } catch {
      toast.error("Failed to delete company");
    }
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyForm.name) return;
    setSavingCompany(true);
    try {
      const payload = {
        name:              companyForm.name,
        industry:          companyForm.industry,
        maternity_leave_weeks: companyForm.maternity_leave ? 16 : 0,
        fertility_support: companyForm.fertility_support,
        childcare_support: companyForm.childcare_support,
        caregiver_leave:   companyForm.caregiver_leave,
        verification_status: 'self_reported',
        job_board_url:     companyForm.job_board_url.trim() || null,
        website:           companyForm.website.trim() || null,
      };
      if (editingCompany) {
        await companiesAPI.update(editingCompany.id, payload);
        toast.success("Company updated");
      } else {
        await companiesAPI.create(payload);
        toast.success("Company created");
      }
      setEditingCompany(null);
      setCompanyForm({ ...BLANK_FORM });
      loadCompanies();
    } catch {
      toast.error("Failed to save company");
    } finally {
      setSavingCompany(false);
    }
  };

  const handlePublishJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobForm.company_id || !jobForm.title) return;
    setSavingJob(true);
    try {
      await jobsAPI.create({
        company_id:  jobForm.company_id,
        title:       jobForm.title,
        salary_range: jobForm.salary_range,
        remote_type: jobForm.remote_type,
        job_url:     jobForm.job_url || null,
        source:      'manual',
        posted_date: new Date().toISOString(),
      });
      toast.success("Job published");
      setJobForm({ company_id: '', title: '', salary_range: '', remote_type: 'Remote', job_url: '' });
      setShowJobForm(false);
    } catch {
      toast.error("Failed to publish job");
    } finally {
      setSavingJob(false);
    }
  };

  const getCareSignals = (company: Company) => {
    const signals = [];
    if (company.maternity_leave_weeks) signals.push({ label: 'MATERNITY', color: 'pink' });
    if (company.remote_policy)         signals.push({ label: 'REMOTE',    color: 'purple' });
    if (company.fertility_support)     signals.push({ label: 'FERTILITY', color: 'pink' });
    if (company.childcare_support)     signals.push({ label: 'CHILDCARE', color: 'green' });
    return signals.slice(0, 2);
  };

  const handleSeed = async () => {
    if (!confirm("Seed 48 companies from the RemoteShe dataset? Existing companies with the same name will be skipped.")) return;
    setSeeding(true);
    try {
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-9112f926/seed`, {
        method: "POST",
        headers: { Authorization: `Bearer ${publicAnonKey}`, "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Seed failed");
      toast.success(`Seeded ${data.inserted} companies (${data.skipped} already existed)`);
      loadCompanies();
    } catch (err: any) {
      toast.error(`Seed failed: ${err.message}`);
    } finally {
      setSeeding(false);
    }
  };

  const handleSeedJobs = async () => {
    if (!confirm("Generate 1–3 seed jobs per company? Existing seed jobs are skipped.")) return;
    setSeedingJobs(true);
    try {
      const result = await jobsAPI.seedJobs();
      toast.success(`Seeded ${result.inserted} jobs across ${companies.length} companies`);
    } catch (err: any) {
      toast.error(`Job seed failed: ${err.message}`);
    } finally {
      setSeedingJobs(false);
    }
  };

  return (
    <div>
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {companies.length} companies · Carefolio-filtered partner organisations.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowJobForm(!showJobForm)}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Job Manually
          </button>
          <button
            onClick={handleSeedJobs}
            disabled={seedingJobs}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg disabled:opacity-60 transition-colors"
          >
            <DatabaseZap className="w-4 h-4" />
            {seedingJobs ? "Seeding Jobs…" : "Seed Jobs"}
          </button>
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg disabled:opacity-60 transition-colors"
          >
            <DatabaseZap className="w-4 h-4" />
            {seeding ? "Seeding…" : "Seed 48 Companies"}
          </button>
        </div>
      </div>

      {/* Manual add-job form */}
      {showJobForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900">Add Job Manually</h3>
            <button onClick={() => setShowJobForm(false)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handlePublishJob} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1.5">Company</label>
              <select
                value={jobForm.company_id}
                onChange={e => setJobForm({ ...jobForm, company_id: e.target.value })}
                required
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#5B39C8] bg-white"
              >
                <option value="">Select company…</option>
                {companies.map(co => <option key={co.id} value={co.id}>{co.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1.5">Job Title</label>
              <input
                type="text"
                placeholder="e.g. Senior Engineer"
                value={jobForm.title}
                onChange={e => setJobForm({ ...jobForm, title: e.target.value })}
                required
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#5B39C8]"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1.5">Job URL (paste real posting URL)</label>
              <input
                type="url"
                placeholder="https://boards.greenhouse.io/…"
                value={jobForm.job_url}
                onChange={e => setJobForm({ ...jobForm, job_url: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#5B39C8]"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1.5">Salary Range</label>
              <input
                type="text"
                placeholder="$120k – $160k"
                value={jobForm.salary_range}
                onChange={e => setJobForm({ ...jobForm, salary_range: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#5B39C8]"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1.5">Remote Type</label>
              <select
                value={jobForm.remote_type}
                onChange={e => setJobForm({ ...jobForm, remote_type: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#5B39C8] bg-white"
              >
                <option>Remote</option>
                <option>Hybrid</option>
                <option>Fully Remote</option>
                <option>Remote-first</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={savingJob}
                className="w-full px-4 py-2.5 bg-[#5B39C8] hover:bg-[#4a2fb0] text-white text-sm font-bold rounded-lg disabled:opacity-60 transition-colors"
              >
                {savingJob ? "Publishing…" : "Publish Job"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Companies Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">Company</th>
              <th className="text-left px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">Industry</th>
              <th className="text-left px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">Care Signals</th>
              <th className="text-left px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">Score</th>
              <th className="text-left px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">Status</th>
              <th className="text-right px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  {[80, 70, 90, 40, 50, 40].map((w, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: `${w}%` }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : companies.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-sm text-gray-400">
                  No companies yet — click "Seed 48 Companies" to get started.
                </td>
              </tr>
            ) : (
              companies.map((company: any) => {
                const signals   = getCareSignals(company);
                const statusVal = company.verification_status === 'verified' ? 'active' : 'review';

                return (
                  <tr key={company.id} className="hover:bg-gray-50/50 transition-colors">
                    {/* Company name */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#5B39C8]/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-bold text-[#5B39C8]">{getInitials(company.name)}</span>
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-gray-900">{company.name}</span>
                          {company.website && (
                            <div className="text-[10px] text-gray-400 truncate max-w-[200px]">
                              {company.job_board_url
                                ? <span className="text-emerald-600 font-semibold flex items-center gap-0.5"><CheckCircle2 className="w-2.5 h-2.5" /> Job board set</span>
                                : company.website.replace(/^https?:\/\//, "")}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Industry */}
                    <td className="px-5 py-4 text-sm text-gray-600">{company.industry || '—'}</td>

                    {/* Care signals */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {signals.length > 0
                          ? signals.map(s => <CareSignalBadge key={s.label} label={s.label} color={s.color} />)
                          : <span className="text-xs text-gray-400">None</span>}
                      </div>
                    </td>

                    {/* Score */}
                    <td className="px-5 py-4">
                      {company.carefolio_score != null ? (
                        <span className={`text-sm font-bold ${company.carefolio_score >= 80 ? 'text-emerald-600' : company.carefolio_score >= 60 ? 'text-[#5B39C8]' : 'text-gray-400'}`}>
                          {company.carefolio_score}
                        </span>
                      ) : <span className="text-sm text-gray-300">—</span>}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <StatusBadge status={statusVal} />
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEditClick(company)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                          title="Edit company"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(company.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
                          title="Delete company"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Company Drawer */}
      {editingCompany && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
            onClick={() => { setEditingCompany(null); setCompanyForm({ ...BLANK_FORM }); }}
          />
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white z-50 shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#5B39C8] mb-0.5">Editing</p>
                <h2 className="text-base font-bold text-gray-900">{editingCompany.name}</h2>
              </div>
              <button
                onClick={() => { setEditingCompany(null); setCompanyForm({ ...BLANK_FORM }); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <form id="edit-company-form" onSubmit={handleSaveCompany} className="space-y-5">
                {/* Name + Industry */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1.5">Company Name</label>
                    <input
                      type="text"
                      value={companyForm.name}
                      onChange={e => setCompanyForm({ ...companyForm, name: e.target.value })}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#5B39C8] focus:ring-2 focus:ring-[#5B39C8]/10 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1.5">Industry</label>
                    <select
                      value={companyForm.industry}
                      onChange={e => setCompanyForm({ ...companyForm, industry: e.target.value })}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#5B39C8] bg-white transition-colors"
                    >
                      <option>Technology</option><option>Healthcare</option><option>Financial Services</option>
                      <option>Professional Services</option><option>Consumer Goods</option><option>Retail</option>
                      <option>Food & Beverage</option><option>Energy & Industrial</option><option>Digital Media</option>
                      <option>E-commerce</option><option>Consulting</option><option>Fintech</option>
                    </select>
                  </div>
                </div>

                {/* Website */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1.5">Career Site URL</label>
                  <input
                    type="url"
                    placeholder="https://careers.company.com"
                    value={companyForm.website}
                    onChange={e => setCompanyForm({ ...companyForm, website: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#5B39C8] focus:ring-2 focus:ring-[#5B39C8]/10 transition-colors font-mono text-[13px] placeholder:font-sans"
                  />
                  <p className="text-[11px] text-gray-400 mt-1.5">
                    This is the URL Apify will scrape for jobs. Use the exact career page URL (e.g. <code className="bg-gray-100 px-1 rounded">careers.google.com</code>).
                  </p>
                </div>

                {/* Job Board URL */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1.5">Job Board URL <span className="font-normal text-gray-400 normal-case">(optional override)</span></label>
                  <input
                    type="url"
                    placeholder="https://boards.greenhouse.io/company  or  https://jobs.lever.co/company"
                    value={companyForm.job_board_url}
                    onChange={e => setCompanyForm({ ...companyForm, job_board_url: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#5B39C8] focus:ring-2 focus:ring-[#5B39C8]/10 transition-colors font-mono text-[13px] placeholder:font-sans"
                  />
                  <p className="text-[11px] text-gray-400 mt-1.5">
                    If set, "View Job Listing" buttons link here instead of the career site. Paste any Greenhouse, Lever, or direct job board URL.
                  </p>
                </div>

                {/* Care Signals */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-2">Care Signals</label>
                  <div className="border border-gray-200 rounded-lg p-3 grid grid-cols-2 gap-2">
                    {[
                      { key: 'maternity_leave',   label: 'Maternity Leave' },
                      { key: 'fertility_support',  label: 'Fertility Support' },
                      { key: 'childcare_support',  label: 'Childcare Support' },
                      { key: 'caregiver_leave',    label: 'Caregiver Leave' },
                    ].map(signal => (
                      <label key={signal.key} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={(companyForm as any)[signal.key]}
                          onChange={e => setCompanyForm({ ...companyForm, [signal.key]: e.target.checked })}
                          className="w-3.5 h-3.5 accent-[#5B39C8] rounded"
                        />
                        {signal.label}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1.5">Internal Notes</label>
                  <textarea
                    placeholder="Notes about this company…"
                    value={companyForm.description}
                    onChange={e => setCompanyForm({ ...companyForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#5B39C8] resize-none focus:ring-2 focus:ring-[#5B39C8]/10 transition-colors"
                  />
                </div>
              </form>
            </div>

            {/* Sticky footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0 flex gap-3">
              <button
                form="edit-company-form"
                type="submit"
                disabled={savingCompany}
                className="flex-1 py-2.5 bg-[#5B39C8] text-white text-sm font-bold rounded-lg hover:bg-[#4a2fb0] disabled:opacity-60 transition-colors"
              >
                {savingCompany ? 'Saving…' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => { setEditingCompany(null); setCompanyForm({ ...BLANK_FORM }); }}
                className="px-5 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}