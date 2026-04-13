import React, { useState, useEffect } from "react";
import {
  RefreshCw, CheckCircle2, XCircle, AlertTriangle, ExternalLink,
  Info, ChevronDown, ChevronUp, Search, Clock, DatabaseZap, Trash2,
} from "lucide-react";
import { companiesAPI, atsAPI } from "../../lib/api";
import { toast } from "sonner";
import { projectId, publicAnonKey } from "/utils/supabase/info";

// ── Known confirmed slugs for the 48 seeded companies ─────────────────────────
// Only companies with VERIFIED public Greenhouse or Lever boards.
// Workday / SAP / iCIMS / SmartRecruiters companies are excluded — they have
// no public API and will always return 4xx.
const KNOWN_SLUGS: Record<string, { ats_type: "greenhouse" | "lever"; slug: string }> = {
  "Airbnb":     { ats_type: "greenhouse", slug: "airbnb" },
  "HubSpot":    { ats_type: "greenhouse", slug: "hubspot" },
  "Etsy":       { ats_type: "greenhouse", slug: "etsy" },
  "Stripe":     { ats_type: "greenhouse", slug: "stripe" },
  "Twilio":     { ats_type: "greenhouse", slug: "twilio" },
  "GitLab":     { ats_type: "greenhouse", slug: "gitlab" },
  "Datadog":    { ats_type: "greenhouse", slug: "datadoghq" },
  "Elastic":    { ats_type: "greenhouse", slug: "elastic" },
  "Figma":      { ats_type: "greenhouse", slug: "figma" },
  "Asana":      { ats_type: "greenhouse", slug: "asana" },
  "Duolingo":   { ats_type: "greenhouse", slug: "duolingo" },
  "Wise":       { ats_type: "greenhouse", slug: "wise" },
  "Canva":      { ats_type: "greenhouse", slug: "canva" },
  "Spotify":    { ats_type: "greenhouse", slug: "spotify" },
  "Atlassian":  { ats_type: "greenhouse", slug: "atlassian" },
  "Shopify":    { ats_type: "greenhouse", slug: "shopify" },
  "Lululemon":  { ats_type: "greenhouse", slug: "lululemon" },
  "Patagonia":  { ats_type: "greenhouse", slug: "patagonia" },
  "Notion":     { ats_type: "lever",      slug: "notion" },
};

type AtsType = "greenhouse" | "lever";

interface SyncResult {
  synced: number;
  skipped: number;
  total: number;
  remote_total?: number;
  error?: string;
  at: string;
}

interface CompanyRow {
  id: string;
  name: string;
  ats_type?: AtsType;
  ats_slug?: string;
  ats_last_synced?: string;
  ats_total_synced?: number;
  carefolio_score?: number;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hrs   = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 2)  return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24)  return `${hrs}h ago`;
  return `${days}d ago`;
}

const ATS_COLORS: Record<string, string> = {
  greenhouse: "bg-green-50 text-green-700 border-green-200",
  lever:      "bg-blue-50 text-blue-700 border-blue-200",
};

export function AdminAtsSync() {
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [showGuide, setShowGuide] = useState(false);
  const [expanded, setExpanded]   = useState<string | null>(null);
  const [seedingConfigs, setSeedingConfigs] = useState(false);

  // Per-company editable config
  const [configs, setConfigs] = useState<Record<string, { ats_type: AtsType; slug: string }>>({});
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncAll, setSyncAll] = useState(false);
  const [results, setResults] = useState<Record<string, SyncResult>>({});
  const [purging, setPurging] = useState(false);

  // ── Load ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    companiesAPI.getAll()
      .then((data: CompanyRow[]) => {
        setCompanies(data);
        const init: Record<string, { ats_type: AtsType; slug: string }> = {};
        for (const co of data) {
          const known = KNOWN_SLUGS[co.name];
          init[co.id] = {
            ats_type: (co.ats_type as AtsType) || known?.ats_type || "greenhouse",
            slug:     co.ats_slug || known?.slug || "",
          };
        }
        setConfigs(init);
      })
      .catch((err: any) => toast.error(`Failed to load companies: ${err.message}`))
      .finally(() => setLoading(false));
  }, []);

  // ── Seed known configs ───────────────────────────────────────────────────────
  const handleSeedConfigs = async () => {
    setSeedingConfigs(true);
    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9112f926/seed-ats-configs`,
        { method: "POST", headers: { Authorization: `Bearer ${publicAnonKey}`, "Content-Type": "application/json" }, body: "{}" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.success(`ATS configured for ${data.updated} companies (${data.skipped} skipped — no known slug)`);
      // Refresh page data
      const fresh = await companiesAPI.getAll();
      setCompanies(fresh);
      const newConfigs = { ...configs };
      for (const co of fresh) {
        const known = KNOWN_SLUGS[co.name];
        newConfigs[co.id] = {
          ats_type: (co.ats_type as AtsType) || known?.ats_type || "greenhouse",
          slug:     co.ats_slug || known?.slug || "",
        };
      }
      setConfigs(newConfigs);
    } catch (err: any) {
      toast.error(`Seed configs failed: ${err.message}`);
    } finally {
      setSeedingConfigs(false);
    }
  };

  // ── Sync single company ──────────────────────────────────────────────────────
  const handleSync = async (companyId: string, companyName: string) => {
    const cfg = configs[companyId];
    if (!cfg?.slug.trim()) {
      toast.error("Enter an ATS slug first — or click \"Seed Known Configs\" to auto-fill.");
      return;
    }
    setSyncing(companyId);
    try {
      const result = await atsAPI.sync(companyId, cfg.ats_type, cfg.slug.trim());
      const r: SyncResult = { ...result, at: new Date().toISOString() };
      setResults(prev => ({ ...prev, [companyId]: r }));
      setCompanies(prev => prev.map(co =>
        co.id === companyId
          ? { ...co, ats_type: cfg.ats_type, ats_slug: cfg.slug.trim(), ats_last_synced: r.at, ats_total_synced: (co.ats_total_synced || 0) + r.synced }
          : co
      ));
      if (r.synced > 0) {
        toast.success(`✓ ${r.synced} new job${r.synced !== 1 ? "s" : ""} from ${cfg.ats_type === "greenhouse" ? "Greenhouse" : "Lever"} · ${companyName}`);
      } else {
        toast(`${companyName}: 0 new jobs — ${r.skipped} already imported (${r.remote_total ?? r.total} found on board)`, { icon: "ℹ️" });
      }
    } catch (err: any) {
      const r: SyncResult = { synced: 0, skipped: 0, total: 0, error: err.message, at: new Date().toISOString() };
      setResults(prev => ({ ...prev, [companyId]: r }));
      toast.error(`${companyName}: ${err.message}`);
    } finally {
      setSyncing(null);
    }
  };

  // ── Sync all configured ──────────────────────────────────────────────────────
  const handleSyncAll = async () => {
    const eligible = companies.filter(co => configs[co.id]?.slug.trim());
    if (!eligible.length) {
      toast("No companies have slugs configured. Click \"Seed Known Configs\" first.", { icon: "ℹ️" });
      return;
    }
    if (!confirm(`Sync jobs from ${eligible.length} configured companies? This may take ~30 seconds.`)) return;

    setSyncAll(true);
    let totalSynced = 0;
    let totalFailed = 0;

    for (const co of eligible) {
      const cfg = configs[co.id];
      try {
        const result = await atsAPI.sync(co.id, cfg.ats_type, cfg.slug.trim());
        const r: SyncResult = { ...result, at: new Date().toISOString() };
        totalSynced += r.synced;
        setResults(prev => ({ ...prev, [co.id]: r }));
      } catch (err: any) {
        totalFailed++;
        setResults(prev => ({ ...prev, [co.id]: { synced: 0, skipped: 0, total: 0, error: err.message, at: new Date().toISOString() } }));
      }
    }

    setSyncAll(false);
    if (totalFailed === 0) {
      toast.success(`✓ Sync complete — ${totalSynced} new jobs from ${eligible.length} companies`);
    } else {
      toast(`${totalSynced} jobs synced · ${totalFailed} failed (check ✗ rows below)`, { icon: "⚠️" });
    }
  };

  // ── Purge all ATS jobs ───────────────────────────────────────────────────────
  const handlePurge = async () => {
    if (!confirm(`⚠️ DANGER: This will DELETE all ATS-synced jobs and reset company sync history.\n\nAre you sure? This action cannot be undone.`)) return;

    setPurging(true);
    try {
      console.log("Starting purge...");
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9112f926/purge-ats-jobs`,
        { 
          method: "POST", 
          headers: { Authorization: `Bearer ${publicAnonKey}`, "Content-Type": "application/json" }, 
          body: JSON.stringify({ reset_company_metadata: true })
        }
      );
      
      console.log("Purge response status:", res.status);
      const data = await res.json();
      console.log("Purge response data:", data);
      
      if (!res.ok) throw new Error(data.error || "Failed");
      
      toast.success(data.message);
      
      // Refresh company data
      console.log("Refreshing company data...");
      const fresh = await companiesAPI.getAll();
      setCompanies(fresh);
      setResults({});
      console.log("Purge complete");
    } catch (err: any) {
      console.error("Purge error:", err);
      toast.error(`Purge failed: ${err.message}`);
    } finally {
      setPurging(false);
    }
  };

  const filtered = companies.filter(co => co.name.toLowerCase().includes(search.toLowerCase()));
  const configuredCount = companies.filter(co => configs[co.id]?.slug).length;
  const syncedCount     = companies.filter(co => co.ats_last_synced).length;
  const knownCount      = Object.keys(KNOWN_SLUGS).length;

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ATS Job Sync</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Pull live jobs directly from Greenhouse &amp; Lever — 100% free, no API key needed.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-[#5B39C8] border border-[#5B39C8]/20 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <Info className="w-4 h-4" />
            How it works
          </button>
          <button
            onClick={handleSeedConfigs}
            disabled={seedingConfigs}
            className="flex items-center gap-2 px-3 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <DatabaseZap className="w-4 h-4" />
            {seedingConfigs ? "Configuring…" : `Seed Known Configs (${knownCount})`}
          </button>
          <button
            onClick={handleSyncAll}
            disabled={syncAll || configuredCount === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#5B39C8] hover:bg-[#4a2fb0] disabled:opacity-50 text-white text-sm font-bold rounded-lg transition-colors"
          >
            {syncAll
              ? <><RefreshCw className="w-4 h-4 animate-spin" /> Syncing All…</>
              : <><RefreshCw className="w-4 h-4" /> Sync All ({configuredCount})</>
            }
          </button>
          <button
            onClick={handlePurge}
            disabled={purging}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition-colors"
          >
            {purging
              ? <><Trash2 className="w-4 h-4 animate-spin" /> Purging…</>
              : <><Trash2 className="w-4 h-4" /> Purge All</>
            }
          </button>
        </div>
      </div>

      {/* Guide */}
      {showGuide && (
        <div className="bg-[#F7F7FB] border border-gray-200 rounded-2xl p-5 mb-6 text-sm">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Info className="w-4 h-4 text-[#5B39C8]" />
            How ATS sync works — and it's completely free
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
            <div>
              <p className="font-semibold text-green-700 mb-1.5">🌿 Greenhouse</p>
              <p className="text-gray-600 mb-2 text-xs">Public API, no key required. The slug is the path in their job board URL.</p>
              <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono space-y-1">
                <div><span className="text-gray-400">boards.greenhouse.io/</span><span className="text-green-700 font-bold">airbnb</span></div>
                <div><span className="text-gray-400">boards.greenhouse.io/</span><span className="text-green-700 font-bold">stripe</span></div>
                <div><span className="text-gray-400">boards.greenhouse.io/</span><span className="text-green-700 font-bold">spotify</span></div>
              </div>
            </div>
            <div>
              <p className="font-semibold text-blue-700 mb-1.5">🔵 Lever</p>
              <p className="text-gray-600 mb-2 text-xs">Also public and free. Same pattern — slug is the last path segment.</p>
              <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono space-y-1">
                <div><span className="text-gray-400">jobs.lever.co/</span><span className="text-blue-700 font-bold">notion</span></div>
                <div><span className="text-gray-400">jobs.lever.co/</span><span className="text-blue-700 font-bold">shopify</span></div>
                <div><span className="text-gray-400">jobs.lever.co/</span><span className="text-blue-700 font-bold">canva</span></div>
              </div>
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-800">
            <strong>⚠️ Workday, SAP, iCIMS, SmartRecruiters</strong> — these ATS platforms have private APIs and cannot be synced for free. Companies using them (Deloitte, P&G, etc.) are best handled via manual job entry.
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { value: loading ? "—" : companies.length, label: "Total companies",   color: "text-[#5B39C8]", bg: "bg-purple-50",  icon: <DatabaseZap className="w-4 h-4 text-[#5B39C8]" /> },
          { value: loading ? "—" : configuredCount,  label: "ATS configured",    color: "text-green-700", bg: "bg-green-50",   icon: <CheckCircle2 className="w-4 h-4 text-green-600" /> },
          { value: loading ? "—" : syncedCount,      label: "Ever synced",       color: "text-blue-700",  bg: "bg-blue-50",    icon: <RefreshCw className="w-4 h-4 text-blue-600" /> },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>{s.icon}</div>
            <div>
              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 mb-4">
        <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <input
          type="text"
          placeholder="Filter companies…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="text-sm text-gray-700 placeholder-gray-400 outline-none flex-1 bg-transparent"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {["Company", "ATS Platform", "Slug", "Last Sync", "Action"].map(h => (
                <th key={h} className={`px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 ${h === "Action" ? "text-right" : "text-left"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: `${55 + j * 8}%` }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-sm text-gray-400">
                  No companies match your search.
                </td>
              </tr>
            ) : (
              filtered.map(co => {
                const cfg       = configs[co.id] || { ats_type: "greenhouse" as AtsType, slug: "" };
                const result    = results[co.id];
                const isSyncing = syncing === co.id;
                const hasSlug   = !!cfg.slug.trim();
                const isKnown   = !!KNOWN_SLUGS[co.name];
                const isExpanded = expanded === co.id;

                return (
                  <React.Fragment key={co.id}>
                    <tr className={`transition-colors ${isExpanded ? "bg-purple-50/30" : "hover:bg-gray-50/50"}`}>
                      {/* Company */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">{co.name}</span>
                          {isKnown && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-full">Pre-filled</span>
                          )}
                        </div>
                        {co.carefolio_score != null && (
                          <div className="text-[10px] text-gray-400 mt-0.5">Score {co.carefolio_score}</div>
                        )}
                      </td>

                      {/* ATS selector */}
                      <td className="px-5 py-4">
                        <select
                          value={cfg.ats_type}
                          onChange={e => setConfigs(prev => ({ ...prev, [co.id]: { ...cfg, ats_type: e.target.value as AtsType } }))}
                          className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border outline-none cursor-pointer ${ATS_COLORS[cfg.ats_type]}`}
                        >
                          <option value="greenhouse">🌿 Greenhouse</option>
                          <option value="lever">🔵 Lever</option>
                        </select>
                      </td>

                      {/* Slug input */}
                      <td className="px-5 py-4">
                        <input
                          type="text"
                          value={cfg.slug}
                          onChange={e => setConfigs(prev => ({ ...prev, [co.id]: { ...cfg, slug: e.target.value } }))}
                          placeholder="e.g. airbnb"
                          className={`w-full max-w-[160px] px-3 py-1.5 text-sm border rounded-lg outline-none transition-colors font-mono ${
                            hasSlug
                              ? "border-gray-300 focus:border-[#5B39C8]"
                              : "border-dashed border-gray-300 focus:border-[#5B39C8]"
                          }`}
                        />
                      </td>

                      {/* Last sync */}
                      <td className="px-5 py-4">
                        {result ? (
                          result.error ? (
                            <div className="flex items-center gap-1.5">
                              <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                              <span className="text-xs text-red-600 font-medium">Error</span>
                              <button onClick={() => setExpanded(isExpanded ? null : co.id)} className="text-gray-400 hover:text-gray-600">
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="text-xs text-emerald-700 font-semibold">+{result.synced} jobs</span>
                              <span className="text-xs text-gray-400">· {timeAgo(result.at)}</span>
                            </div>
                          )
                        ) : co.ats_last_synced ? (
                          <div className="flex items-center gap-1.5 text-gray-500">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-xs">{timeAgo(co.ats_last_synced)}</span>
                          </div>
                        ) : hasSlug ? (
                          <span className="text-xs text-gray-400 italic">Ready</span>
                        ) : (
                          <span className="text-xs text-gray-300 italic">No slug</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {hasSlug && (
                            <a
                              href={cfg.ats_type === "greenhouse"
                                ? `https://boards.greenhouse.io/${cfg.slug}`
                                : `https://jobs.lever.co/${cfg.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                              title="Preview job board"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            onClick={() => handleSync(co.id, co.name)}
                            disabled={isSyncing || syncAll || !hasSlug}
                            title={!hasSlug ? "Enter a slug first" : `Sync from ${cfg.ats_type}`}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#5B39C8] hover:bg-[#4a2fb0] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition-colors"
                          >
                            {isSyncing
                              ? <><RefreshCw className="w-3 h-3 animate-spin" /> Syncing…</>
                              : <><RefreshCw className="w-3 h-3" /> Sync</>
                            }
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Error expand row */}
                    {isExpanded && result?.error && (
                      <tr key={`${co.id}-err`} className="bg-red-50">
                        <td colSpan={5} className="px-5 py-3">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-semibold text-red-700 mb-0.5">Sync error</p>
                              <p className="text-xs text-red-600">{result.error}</p>
                              <p className="text-xs text-red-400 mt-1">This usually means the slug is wrong, the board is private, or the company uses a different ATS (Workday etc.).</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 text-center mt-4">
        Re-syncing is safe — duplicate jobs are detected by URL and skipped automatically. · Greenhouse &amp; Lever APIs are free with no rate limits for public boards.
      </p>
    </div>
  );
}