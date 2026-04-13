import { useState, useEffect } from "react";
import {
  Trash2, Mail, Bell, RefreshCw, Users, Clock, Inbox,
  Send, CheckCircle2, XCircle, Eye, CalendarDays, Calendar, AlertTriangle,
} from "lucide-react";
import { alertsAPI } from "../../lib/api";
import { toast } from "sonner";

interface Subscriber {
  email: string;
  frequency?: "daily" | "weekly" | "monthly";
  filters?: Record<string, boolean>;
  preferences?: Record<string, unknown>;
  subscribed_at: string;
  updated_at?: string;
}

interface DigestLog {
  frequency: string;
  sent: number;
  failed: number;
  job_count: number;
  preview: boolean;
  sent_at: string;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 2) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const FREQ_STYLES: Record<string, { label: string; icon: React.ReactNode; bg: string; text: string; border: string }> = {
  daily: {
    label: "Daily",
    icon: <Clock className="w-3.5 h-3.5" />,
    bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200",
  },
  weekly: {
    label: "Weekly",
    icon: <CalendarDays className="w-3.5 h-3.5" />,
    bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200",
  },
  monthly: {
    label: "Monthly",
    icon: <Calendar className="w-3.5 h-3.5" />,
    bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200",
  },
};

function FreqBadge({ freq }: { freq?: string }) {
  const s = FREQ_STYLES[freq || "weekly"] ?? FREQ_STYLES.weekly;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${s.bg} ${s.text} ${s.border}`}>
      {s.icon} {s.label}
    </span>
  );
}

function SendButton({
  frequency,
  count,
  onSent,
}: {
  frequency: string;
  count: number;
  onSent: () => void;
}) {
  const [sending, setSending] = useState(false);
  const [previewEmail, setPreviewEmail] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const s = FREQ_STYLES[frequency] ?? FREQ_STYLES.weekly;

  const send = async (preview?: string) => {
    setSending(true);
    try {
      const result = await alertsAPI.sendDigest(frequency, preview);
      if (result.error) {
        toast.error(`Send failed: ${result.error}`);
      } else if (preview) {
        toast.success(`Preview sent to ${preview}`);
      } else {
        toast.success(`✓ Sent to ${result.sent} subscriber${result.sent !== 1 ? "s" : ""} (${result.job_count} jobs included)`);
        if (result.failed > 0) toast(`${result.failed} failed to send`, { icon: "⚠️" });
      }
      onSent();
    } catch (err: any) {
      toast.error(`Send failed: ${err.message}`);
    } finally {
      setSending(false);
      setShowPreview(false);
      setPreviewEmail("");
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={() => send()}
        disabled={sending || count === 0}
        className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg border transition-colors disabled:opacity-50 ${s.bg} ${s.text} ${s.border} hover:brightness-95`}
      >
        {sending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
        Send to {count} {s.label}
      </button>
      <button
        onClick={() => setShowPreview(v => !v)}
        className="flex items-center gap-1 px-2.5 py-2 text-xs font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        title="Send a preview to your own email"
      >
        <Eye className="w-3.5 h-3.5" /> Preview
      </button>
      {showPreview && (
        <div className="flex items-center gap-1.5 w-full mt-1">
          <input
            type="email"
            value={previewEmail}
            onChange={e => setPreviewEmail(e.target.value)}
            placeholder="your@email.com"
            className="flex-1 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#5B39C8]"
          />
          <button
            onClick={() => send(previewEmail)}
            disabled={sending || !previewEmail.includes("@")}
            className="px-3 py-1.5 text-xs font-bold bg-[#5B39C8] text-white rounded-lg disabled:opacity-50 hover:bg-[#4a2fb0] transition-colors"
          >
            {sending ? "…" : "Send"}
          </button>
        </div>
      )}
    </div>
  );
}

export function AdminSubscribers() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [history, setHistory] = useState<DigestLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [freqFilter, setFreqFilter] = useState<"all" | "daily" | "weekly" | "monthly">("all");

  const load = async () => {
    setLoading(true);
    try {
      const [subs, hist] = await Promise.all([
        alertsAPI.getSubscribers(),
        alertsAPI.getDigestHistory().catch(() => []),
      ]);
      setSubscribers(subs);
      setHistory(hist);
    } catch (err: any) {
      toast.error(`Failed to load subscribers: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (email: string) => {
    if (!confirm(`Remove ${email} from job alerts?`)) return;
    setDeleting(email);
    try {
      await alertsAPI.deleteSubscriber(email);
      toast.success("Subscriber removed");
      setSubscribers(prev => prev.filter(s => s.email !== email));
    } catch (err: any) {
      toast.error(`Failed to remove: ${err.message}`);
    } finally {
      setDeleting(null);
    }
  };

  const thisWeek = subscribers.filter(s => {
    const diff = Date.now() - new Date(s.subscribed_at).getTime();
    return diff < 7 * 86400000;
  }).length;

  const byFreq = {
    daily: subscribers.filter(s => s.frequency === "daily").length,
    weekly: subscribers.filter(s => !s.frequency || s.frequency === "weekly").length,
    monthly: subscribers.filter(s => s.frequency === "monthly").length,
  };

  const filtered = freqFilter === "all"
    ? subscribers
    : subscribers.filter(s => (s.frequency || "weekly") === freqFilter);

  const hasResendKey = history.length > 0 || true; // We show the UI regardless, errors are surfaced on send

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Alert Subscribers</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage who gets job digests and trigger sends manually.</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { icon: <Users className="w-5 h-5 text-[#5B39C8]" />, value: loading ? "—" : subscribers.length, label: "Total subscribers", bg: "bg-purple-50" },
          { icon: <Clock className="w-5 h-5 text-amber-600" />, value: loading ? "—" : byFreq.daily, label: "Daily", bg: "bg-amber-50" },
          { icon: <CalendarDays className="w-5 h-5 text-purple-600" />, value: loading ? "—" : byFreq.weekly, label: "Weekly", bg: "bg-purple-50" },
          { icon: <Calendar className="w-5 h-5 text-emerald-600" />, value: loading ? "—" : byFreq.monthly, label: "Monthly", bg: "bg-emerald-50" },
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center flex-shrink-0`}>
              {stat.icon}
            </div>
            <div>
              <div className="text-2xl font-black text-gray-900 leading-none">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Send Digest Controls */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <RefreshCw className="w-4 h-4 text-[#5B39C8]" />
          <h2 className="text-sm font-bold text-gray-900">Send Digest Now</h2>
          <span className="text-xs text-gray-400 ml-1">— trigger an email to subscribers by frequency</span>
        </div>

        {/* Resend setup notice */}
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-4 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-amber-800 space-y-1">
            <p className="font-semibold">Email setup required to send real emails:</p>
            <ol className="list-decimal list-inside space-y-0.5 text-amber-700">
              <li>Sign up free at <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">resend.com</a> (100 emails/day free)</li>
              <li>Create an API key in your Resend dashboard</li>
              <li>Add it as <code className="bg-amber-100 px-1 rounded font-mono text-[11px]">RESEND_API_KEY</code> in Supabase → Project Settings → Edge Functions → Secrets</li>
              <li>Verify your sender domain or use <code className="bg-amber-100 px-1 rounded font-mono text-[11px]">onboarding@resend.dev</code> for testing</li>
            </ol>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(["daily", "weekly", "monthly"] as const).map(freq => {
            const s = FREQ_STYLES[freq];
            const count = byFreq[freq];
            return (
              <div key={freq} className={`border rounded-xl p-4 ${s.border} ${s.bg}`}>
                <div className={`flex items-center gap-2 mb-1 ${s.text}`}>
                  {s.icon}
                  <span className="text-sm font-bold">{s.label} Digest</span>
                </div>
                <p className={`text-[11px] mb-3 ${s.text} opacity-70`}>
                  {count} subscriber{count !== 1 ? "s" : ""}
                </p>
                <SendButton frequency={freq} count={count} onSent={load} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Send History */}
      {history.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
          <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            Recent Sends
          </h2>
          <div className="space-y-2">
            {history.slice(0, 8).map((log, i) => (
              <div key={i} className="flex items-center justify-between text-xs py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  {log.failed === 0
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    : <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                  }
                  <FreqBadge freq={log.frequency} />
                  <span className="text-gray-500">
                    {log.preview ? "Preview" : `${log.sent} sent`}
                    {log.failed > 0 && <span className="text-red-500 ml-1">· {log.failed} failed</span>}
                    <span className="text-gray-400 ml-1">· {log.job_count} jobs</span>
                  </span>
                </div>
                <span className="text-gray-400">{timeAgo(log.sent_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Frequency filter tabs */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {(["all", "daily", "weekly", "monthly"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFreqFilter(f)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors capitalize ${
              freqFilter === f
                ? "bg-[#5B39C8] text-white border-[#5B39C8]"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
            }`}
          >
            {f === "all" ? `All (${subscribers.length})` : `${FREQ_STYLES[f].label} (${byFreq[f]})`}
          </button>
        ))}
      </div>

      {/* Subscriber Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {["Email", "Frequency", "Filters", "Subscribed", "Actions"].map(h => (
                <th
                  key={h}
                  className={`px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 ${h === "Actions" ? "text-right" : "text-left"}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={5} className="px-5 py-4">
                    <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-16 text-center">
                  <Inbox className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500 font-semibold text-sm mb-1">
                    {freqFilter === "all" ? "No subscribers yet" : `No ${freqFilter} subscribers`}
                  </p>
                  <p className="text-gray-400 text-xs">
                    Visitors can sign up via the "Get Job Alerts" form on the home or jobs pages.
                  </p>
                </td>
              </tr>
            ) : (
              filtered.map(sub => {
                const activeFilters = Object.entries(sub.filters || {})
                  .filter(([, v]) => v)
                  .map(([k]) => k.replace(/_/g, " "));
                return (
                  <tr key={sub.email} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#5B39C8]/10 flex items-center justify-center flex-shrink-0">
                          <Mail className="w-3.5 h-3.5 text-[#5B39C8]" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">{sub.email}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <FreqBadge freq={sub.frequency} />
                    </td>
                    <td className="px-5 py-4">
                      {activeFilters.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {activeFilters.map(f => (
                            <span key={f} className="text-[10px] font-medium px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full capitalize">{f}</span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">None</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        {timeAgo(sub.subscribed_at)}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => handleDelete(sub.email)}
                        disabled={deleting === sub.email}
                        className="w-8 h-8 flex items-center justify-center ml-auto rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                      >
                        {deleting === sub.email
                          ? <RefreshCw className="w-4 h-4 animate-spin" />
                          : <Trash2 className="w-4 h-4" />
                        }
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}