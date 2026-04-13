import { useState, useEffect } from "react";
import { Trash2, RefreshCw, Inbox, MessageSquare, Building2, Flag, Lightbulb, Clock, Mail, ExternalLink } from "lucide-react";
import { feedbackAPI, inquiriesAPI } from "../../lib/api";
import { toast } from "sonner";

type Tab = "inquiries" | "feedback";

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

interface FeedbackItem {
  id: string;
  type: "error" | "feedback";
  email?: string;
  message: string;
  page_url?: string;
  submitted_at: string;
}

interface InquiryItem {
  id: string;
  company_name?: string;
  contact_name?: string;
  email: string;
  message: string;
  submitted_at: string;
  status: string;
}

export function AdminInbox() {
  const [tab, setTab] = useState<Tab>("inquiries");
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [inquiries, setInquiries] = useState<InquiryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [fb, inq] = await Promise.all([feedbackAPI.getAll(), inquiriesAPI.getAll()]);
      setFeedback(fb);
      setInquiries(inq);
    } catch (err: any) {
      toast.error(`Failed to load inbox: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const deleteFeedback = async (id: string) => {
    if (!confirm("Delete this feedback?")) return;
    setDeleting(id);
    try {
      await feedbackAPI.delete(id);
      setFeedback(prev => prev.filter(f => f.id !== id));
      toast.success("Deleted");
    } catch (err: any) {
      toast.error(`Failed: ${err.message}`);
    } finally {
      setDeleting(null);
    }
  };

  const deleteInquiry = async (id: string) => {
    if (!confirm("Delete this inquiry?")) return;
    setDeleting(id);
    try {
      await inquiriesAPI.delete(id);
      setInquiries(prev => prev.filter(i => i.id !== id));
      toast.success("Deleted");
    } catch (err: any) {
      toast.error(`Failed: ${err.message}`);
    } finally {
      setDeleting(null);
    }
  };

  const newInquiries = inquiries.filter(i => i.status === "new").length;
  const errorCount = feedback.filter(f => f.type === "error").length;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inbox</h1>
          <p className="text-sm text-gray-500 mt-0.5">Company inquiries and user feedback from the public site.</p>
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

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { icon: <Building2 className="w-5 h-5 text-[#5B39C8]" />, value: loading ? "—" : inquiries.length, label: "Company inquiries", bg: "bg-purple-50" },
          { icon: <Flag className="w-5 h-5 text-red-500" />, value: loading ? "—" : errorCount, label: "Error reports", bg: "bg-red-50" },
          { icon: <Lightbulb className="w-5 h-5 text-amber-500" />, value: loading ? "—" : feedback.filter(f => f.type === "feedback").length, label: "Feedback messages", bg: "bg-amber-50" },
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center flex-shrink-0`}>
              {stat.icon}
            </div>
            <div>
              <div className="text-2xl font-black text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-500">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-5">
        {([
          { key: "inquiries" as Tab, label: "Company inquiries", count: newInquiries, icon: Building2 },
          { key: "feedback" as Tab, label: "Feedback & errors", count: feedback.length, icon: MessageSquare },
        ]).map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                tab === t.key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
              {t.count > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  tab === t.key ? "bg-[#5B39C8] text-white" : "bg-gray-200 text-gray-600"
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Company Inquiries ── */}
      {tab === "inquiries" && (
        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-1/3 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </div>
            ))
          ) : inquiries.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center">
              <Inbox className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-semibold text-sm mb-1">No company inquiries yet</p>
              <p className="text-gray-400 text-xs">When companies submit through the About page, they'll appear here.</p>
            </div>
          ) : (
            inquiries.map(item => (
              <div key={item.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div
                  className="px-5 py-4 flex items-start justify-between cursor-pointer hover:bg-gray-50/50 transition-colors"
                  onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-[#5B39C8]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Building2 className="w-4 h-4 text-[#5B39C8]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-sm font-bold text-gray-900">
                          {item.company_name || "Unknown company"}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
                          New
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        {item.contact_name && <span>{item.contact_name}</span>}
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {item.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {timeAgo(item.submitted_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); deleteInquiry(item.id); }}
                    disabled={deleting === item.id}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50 flex-shrink-0 ml-3"
                  >
                    {deleting === item.id
                      ? <RefreshCw className="w-4 h-4 animate-spin" />
                      : <Trash2 className="w-4 h-4" />
                    }
                  </button>
                </div>
                {/* Expanded message */}
                {expanded === item.id && (
                  <div className="px-5 pb-5 border-t border-gray-100 pt-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Message</p>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-xl p-4 border border-gray-100">
                      {item.message}
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <a
                        href={`mailto:${item.email}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#5B39C8] bg-purple-50 border border-purple-100 rounded-lg hover:bg-purple-100 transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        Reply via email
                      </a>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Feedback & Errors ── */}
      {tab === "feedback" && (
        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-1/3 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </div>
            ))
          ) : feedback.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center">
              <MessageSquare className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-semibold text-sm mb-1">No feedback yet</p>
              <p className="text-gray-400 text-xs">Reports and feedback submitted via the floating button will appear here.</p>
            </div>
          ) : (
            feedback.map(item => (
              <div key={item.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div
                  className="px-5 py-4 flex items-start justify-between cursor-pointer hover:bg-gray-50/50 transition-colors"
                  onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      item.type === "error" ? "bg-red-50" : "bg-amber-50"
                    }`}>
                      {item.type === "error"
                        ? <Flag className="w-4 h-4 text-red-500" />
                        : <Lightbulb className="w-4 h-4 text-amber-500" />
                      }
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          item.type === "error"
                            ? "bg-red-50 text-red-600 border-red-100"
                            : "bg-amber-50 text-amber-700 border-amber-100"
                        }`}>
                          {item.type === "error" ? "Error report" : "Feedback"}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          {timeAgo(item.submitted_at)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 truncate max-w-md">{item.message}</p>
                      {item.email && (
                        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {item.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); deleteFeedback(item.id); }}
                    disabled={deleting === item.id}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50 flex-shrink-0 ml-3"
                  >
                    {deleting === item.id
                      ? <RefreshCw className="w-4 h-4 animate-spin" />
                      : <Trash2 className="w-4 h-4" />
                    }
                  </button>
                </div>
                {expanded === item.id && (
                  <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Message</p>
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-xl p-4 border border-gray-100">
                        {item.message}
                      </p>
                    </div>
                    {item.page_url && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Reported on</p>
                        <a
                          href={item.page_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs text-[#5B39C8] hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {item.page_url}
                        </a>
                      </div>
                    )}
                    {item.email && (
                      <a
                        href={`mailto:${item.email}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#5B39C8] bg-purple-50 border border-purple-100 rounded-lg hover:bg-purple-100 transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        Reply via email
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
