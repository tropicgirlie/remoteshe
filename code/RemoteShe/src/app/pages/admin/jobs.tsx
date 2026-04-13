import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, X, Sparkles, RefreshCw, Wrench, DollarSign, Code2, AlertTriangle } from "lucide-react";
import { jobsAPI, companiesAPI } from "../../lib/api";
import { Job, Company } from "../../lib/types";
import { toast } from "sonner";

export function AdminJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [formData, setFormData] = useState({
    company_id: '',
    title: '',
    department: '',
    location: '',
    remote_type: 'Remote',
    salary_range: '',
    job_url: '',
    source: '',
    posted_date: new Date().toISOString().split('T')[0],
  });
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [backfillingSalaries, setBackfillingSalaries] = useState(false);
  const [backfillingTech, setBackfillingTech] = useState(false);
  const [markingStale, setMarkingStale] = useState(false);
  const [scheduling, setScheduling] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [jobsData, companiesData] = await Promise.all([
        jobsAPI.getAll(),
        companiesAPI.getAll(),
      ]);
      setJobs(jobsData);
      setCompanies(companiesData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const openForm = (job?: Job) => {
    if (job) {
      setEditingJob(job);
      setFormData({
        company_id: job.company_id,
        title: job.title,
        department: job.department || '',
        location: job.location || '',
        remote_type: job.remote_type || 'Remote',
        salary_range: job.salary_range || '',
        job_url: job.job_url || '',
        source: job.source || '',
        posted_date: job.posted_date ? new Date(job.posted_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      });
    } else {
      setEditingJob(null);
      setFormData({
        company_id: '',
        title: '',
        department: '',
        location: '',
        remote_type: 'Remote',
        salary_range: '',
        job_url: '',
        source: '',
        posted_date: new Date().toISOString().split('T')[0],
      });
    }
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingJob(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this job listing?")) return;
    try {
      await jobsAPI.delete(id);
      toast.success("Job deleted");
      loadData();
    } catch {
      toast.error("Failed to delete job");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...formData, posted_date: new Date(formData.posted_date).toISOString() };
      if (editingJob) {
        await jobsAPI.update(editingJob.id, payload);
        toast.success("Job updated");
      } else {
        await jobsAPI.create(payload);
        toast.success("Job created");
      }
      closeForm();
      loadData();
    } catch {
      toast.error("Failed to save job");
    } finally {
      setSaving(false);
    }
  };

  const handleSeedJobs = async () => {
    if (!confirm(`Seed sample jobs across all ${companies.length} companies? Existing job/company combos will be skipped.`)) return;
    setSeeding(true);
    try {
      const result = await jobsAPI.seedJobs();
      toast.success(`✓ Seeded ${result.inserted} job listings`);
      loadData();
    } catch (err: any) {
      toast.error(`Seed failed: ${err.message}`);
    } finally {
      setSeeding(false);
    }
  };

  const handleClearJobs = async () => {
    if (!confirm("Delete ALL job listings? This cannot be undone.")) return;
    setClearing(true);
    try {
      const result = await jobsAPI.clearAll();
      toast.success(`Cleared ${result.deleted} jobs`);
      loadData();
    } catch (err: any) {
      toast.error(`Clear failed: ${err.message}`);
    } finally {
      setClearing(false);
    }
  };

  const handleFixSeedUrls = async () => {
    const badUrlCount = jobs.filter((j: any) => j.source === "seed" && j.job_url).length;
    if (!confirm(`Clean up ${badUrlCount} seeded job(s) that have a company homepage incorrectly set as their Apply URL? This clears the bogus URLs so the correct fallback logic is used. Continue?`)) return;
    setFixing(true);
    try {
      const result = await jobsAPI.fixSeedUrls();
      toast.success(`Cleaned ${result.fixed} seeded job${result.fixed !== 1 ? 's' : ''} — Apply buttons now use the correct fallback hierarchy.`);
      loadData();
    } catch (err: any) {
      toast.error(`Clean-up failed: ${err.message}`);
    } finally {
      setFixing(false);
    }
  };

  const handleBackfillSalaries = async () => {
    setBackfillingSalaries(true);
    try {
      const result = await jobsAPI.backfillSalaries();
      toast.success(`Backfilled salary data for ${result.fixed} jobs (${result.eligible} were eligible)`);
      loadData();
    } catch (err: any) {
      toast.error(`Salary backfill failed: ${err.message}`);
    } finally {
      setBackfillingSalaries(false);
    }
  };

  const handleBackfillTechStack = async () => {
    setBackfillingTech(true);
    try {
      const result = await jobsAPI.backfillTechStack();
      toast.success(`Added tech stacks to ${result.fixed} jobs`);
      loadData();
    } catch (err: any) {
      toast.error(`Tech stack backfill failed: ${err.message}`);
    } finally {
      setBackfillingTech(false);
    }
  };

  const handleMarkStale = async () => {
    setMarkingStale(true);
    try {
      const result = await jobsAPI.markStale(30);
      toast.success(`Marked ${result.marked} jobs as stale, cleared ${result.cleared} (30-day threshold)`);
      loadData();
    } catch (err: any) {
      toast.error(`Stale marking failed: ${err.message}`);
    } finally {
      setMarkingStale(false);
    }
  };

  const handleScheduledSync = async () => {
    if (!confirm("Run scheduled ATS sync for all configured companies? This may take a moment.")) return;
    setScheduling(true);
    try {
      const result = await jobsAPI.scheduledSync();
      toast.success(`Sync complete: ${result.synced_total} new jobs from ${result.companies_attempted} companies (${result.error_count} errors)`);
      loadData();
    } catch (err: any) {
      toast.error(`Scheduled sync failed: ${err.message}`);
    } finally {
      setScheduling(false);
    }
  };

  const getCompanyName = (companyId: string) => companies.find(c => c.id === companyId)?.name || 'Unknown';

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Jobs Management</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage all job listings across partner companies.</p>
      </div>

      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        {/* Seed / Clear bulk actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleSeedJobs}
            disabled={seeding || companies.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            {seeding ? "Seeding…" : `Seed Jobs (${companies.length} co.)`}
          </button>
          <button
            onClick={handleScheduledSync}
            disabled={scheduling}
            className="flex items-center gap-2 px-4 py-2 bg-[#5B39C8] text-white text-sm font-semibold rounded-lg hover:bg-[#4a2fb0] disabled:opacity-50 transition-colors"
            title="Sync all companies with ATS configured — fetches latest jobs from Greenhouse/Lever"
          >
            <RefreshCw className="w-4 h-4" />
            {scheduling ? "Syncing…" : "Run Scheduled Sync"}
          </button>
          <button
            onClick={handleBackfillSalaries}
            disabled={backfillingSalaries}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold rounded-lg hover:bg-emerald-100 disabled:opacity-50 transition-colors"
            title="Parse salary_range strings and set salary_min / salary_max integer fields"
          >
            <DollarSign className="w-4 h-4" />
            {backfillingSalaries ? "Backfilling…" : "Backfill Salaries"}
          </button>
          <button
            onClick={handleBackfillTechStack}
            disabled={backfillingTech}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm font-semibold rounded-lg hover:bg-indigo-100 disabled:opacity-50 transition-colors"
            title="Assign tech stack arrays to jobs based on their department"
          >
            <Code2 className="w-4 h-4" />
            {backfillingTech ? "Backfilling…" : "Backfill Tech Stacks"}
          </button>
          <button
            onClick={handleMarkStale}
            disabled={markingStale}
            className="flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 text-orange-700 text-sm font-semibold rounded-lg hover:bg-orange-100 disabled:opacity-50 transition-colors"
            title="Mark jobs older than 30 days as stale — they'll show a warning badge in the UI"
          >
            <AlertTriangle className="w-4 h-4" />
            {markingStale ? "Marking…" : "Mark Stale (30d)"}
          </button>
          <button
            onClick={handleFixSeedUrls}
            disabled={fixing}
            className="flex items-center gap-2 px-4 py-2 bg-violet-50 border border-violet-200 text-violet-700 text-sm font-semibold rounded-lg hover:bg-violet-100 disabled:opacity-50 transition-colors"
            title="Clear bogus homepage URLs from seeded jobs — Apply buttons will use correct ATS links or job board fallbacks"
          >
            <Wrench className="w-4 h-4" />
            {fixing ? "Cleaning…" : "Clean Seed URLs"}
          </button>
          {jobs.length > 0 && (
            <button
              onClick={handleClearJobs}
              disabled={clearing}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              {clearing ? "Clearing…" : `Clear All (${jobs.length})`}
            </button>
          )}
        </div>
        <button
          onClick={() => openForm()}
          disabled={companies.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-[#5B39C8] text-white text-sm font-semibold rounded-lg hover:bg-[#4a2fb0] disabled:opacity-50 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Job
        </button>
      </div>

      {companies.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 text-sm text-amber-800">
          Add at least one company before creating job listings.
        </div>
      )}

      {/* Job form (inline) */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-gray-900">{editingJob ? 'Edit Job' : 'Add New Job'}</h2>
            <button onClick={closeForm} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1.5">Company *</label>
              <select
                required
                value={formData.company_id}
                onChange={e => setFormData({ ...formData, company_id: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#5B39C8] bg-white"
              >
                <option value="">Select a company</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1.5">Job Title *</label>
              <input
                required
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#5B39C8]"
                placeholder="e.g. Senior Backend Engineer"
              />
            </div>
            {[
              { key: 'department', label: 'Department', placeholder: 'e.g. Engineering' },
              { key: 'location', label: 'Location', placeholder: 'e.g. Remote - US' },
              { key: 'salary_range', label: 'Salary Range', placeholder: '$100k - $150k' },
            ].map(field => (
              <div key={field.key}>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1.5">{field.label}</label>
                <input
                  type="text"
                  value={(formData as any)[field.key]}
                  onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#5B39C8]"
                  placeholder={field.placeholder}
                />
              </div>
            ))}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1.5">Remote Type</label>
              <select
                value={formData.remote_type}
                onChange={e => setFormData({ ...formData, remote_type: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#5B39C8] bg-white"
              >
                <option>Remote</option>
                <option>Global</option>
                <option>US Only</option>
                <option>Europe Only</option>
                <option>Hybrid</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1.5">Job URL</label>
              <input
                type="url"
                value={formData.job_url}
                onChange={e => setFormData({ ...formData, job_url: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#5B39C8]"
                placeholder="https://careers.company.com/job/123"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1.5">Posted Date</label>
              <input
                type="date"
                value={formData.posted_date}
                onChange={e => setFormData({ ...formData, posted_date: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#5B39C8]"
              />
            </div>
            <div className="col-span-2 flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-2.5 bg-[#5B39C8] text-white text-sm font-bold rounded-lg hover:bg-[#4a2fb0] disabled:opacity-60 transition-colors"
              >
                {saving ? 'Saving...' : (editingJob ? 'Update Job' : 'Create Job')}
              </button>
              <button type="button" onClick={closeForm} className="px-6 py-2.5 border border-gray-300 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {['Job Title', 'Company', 'Source', 'Remote Type', 'Salary', 'Posted', 'Actions'].map(h => (
                <th key={h} className={`px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 ${h === 'Actions' ? 'text-right' : 'text-left'}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={7} className="px-5 py-8 text-center text-sm text-gray-400">Loading...</td></tr>
            ) : jobs.length === 0 ? (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-gray-400">No jobs yet.</td></tr>
            ) : (
              jobs.map(job => (
                <tr key={job.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="text-sm font-semibold text-gray-900">{job.title}</div>
                    {job.department && <div className="text-xs text-gray-400">{job.department}</div>}
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">{job.companies?.name || getCompanyName(job.company_id)}</td>
                  <td className="px-5 py-4">
                    {(job as any).source === 'seed' ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">Seeded</span>
                    ) : (job as any).source === 'greenhouse' ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full">🌿 Greenhouse</span>
                    ) : (job as any).source === 'lever' ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full">🔵 Lever</span>
                    ) : (job as any).source === 'ats_sync' ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-violet-50 text-violet-700 border border-violet-200 rounded-full">ATS Sync</span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full">Manual</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full border border-purple-200">
                      {job.remote_type || 'Remote'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">{job.salary_range || '—'}</td>
                  <td className="px-5 py-4 text-sm text-gray-500">
                    {job.posted_date ? new Date(job.posted_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openForm(job)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(job.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}