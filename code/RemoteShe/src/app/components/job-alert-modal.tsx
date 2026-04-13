import { useState } from "react";
import { X, Bell, CheckCheck, Loader2, Clock, CalendarDays, Calendar, Baby, Globe, Heart, Sparkles } from "lucide-react";
import { subscribeToAlerts } from "../../lib/fetchJobs";

type Frequency = "daily" | "weekly" | "monthly";

interface Props {
  open: boolean;
  onClose: () => void;
  defaultEmail?: string;
}

const FREQUENCIES: { id: Frequency; label: string; sublabel: string; icon: React.ReactNode; color: string; border: string; selectedBg: string }[] = [
  {
    id: "daily",
    label: "Daily",
    sublabel: "Fresh roles every morning",
    icon: <Clock className="w-4 h-4" />,
    color: "text-amber-700",
    border: "border-amber-300",
    selectedBg: "bg-amber-50",
  },
  {
    id: "weekly",
    label: "Weekly",
    sublabel: "Top picks every Monday",
    icon: <CalendarDays className="w-4 h-4" />,
    color: "text-[#5B39C8]",
    border: "border-[#5B39C8]",
    selectedBg: "bg-purple-50",
  },
  {
    id: "monthly",
    label: "Monthly",
    sublabel: "Best of the month digest",
    icon: <Calendar className="w-4 h-4" />,
    color: "text-emerald-700",
    border: "border-emerald-400",
    selectedBg: "bg-emerald-50",
  },
];

const CARE_FILTERS: { key: string; label: string; icon: React.ReactNode; color: string }[] = [
  { key: "remote_only", label: "Fully Remote only", icon: <Globe className="w-3.5 h-3.5" />, color: "text-blue-600" },
  { key: "maternity_leave", label: "20+ wk maternity", icon: <Baby className="w-3.5 h-3.5" />, color: "text-pink-600" },
  { key: "fertility_support", label: "Fertility / IVF support", icon: <Heart className="w-3.5 h-3.5" />, color: "text-rose-600" },
  { key: "childcare_support", label: "Childcare benefits", icon: <Sparkles className="w-3.5 h-3.5" />, color: "text-purple-600" },
];

export function JobAlertModal({ open, onClose, defaultEmail = "" }: Props) {
  const [step, setStep] = useState<"form" | "success">("form");
  const [email, setEmail] = useState(defaultEmail);
  const [frequency, setFrequency] = useState<Frequency>("weekly");
  const [filters, setFilters] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resultMsg, setResultMsg] = useState("");

  if (!open) return null;

  const toggleFilter = (key: string) =>
    setFilters(prev => ({ ...prev, [key]: !prev[key] }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await subscribeToAlerts(email.trim(), {
        frequency,
        filters,
        source: "job_alert_modal",
        subscribed_at_url: window.location.href,
      });
      const freqLabel = FREQUENCIES.find(f => f.id === frequency)?.label ?? frequency;
      setResultMsg(`You're in! We'll send ${freqLabel.toLowerCase()} job alerts to ${email.trim()}.`);
      setStep("success");
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    // Reset after animation
    setTimeout(() => {
      setStep("form");
      setEmail(defaultEmail);
      setFrequency("weekly");
      setFilters({});
      setError("");
    }, 300);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={handleClose}
      >
        {/* Modal */}
        <div
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Purple gradient header */}
          <div className="bg-gradient-to-br from-[#6B46C1] to-[#5B39C8] px-6 pt-6 pb-8 relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/5" />
            <div className="absolute top-4 -right-2 w-16 h-16 rounded-full bg-white/5" />
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg leading-tight">Get Job Alerts</h2>
                <p className="text-purple-200 text-xs">Care-first remote roles, delivered to you</p>
              </div>
            </div>
          </div>

          {/* Negative margin pull-up card effect */}
          <div className="-mt-4 mx-4 bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 mb-1 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#F59E0B] flex-shrink-0" />
            <p className="text-xs text-gray-600">Only companies scoring <span className="font-semibold text-[#5B39C8]">≥ 60</span> on the Carefolio Index — maternity leave, IVF, childcare & remote flex.</p>
          </div>

          {step === "success" ? (
            <div className="px-6 py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <CheckCheck className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-gray-900 font-bold text-lg mb-2">You're subscribed! 🎉</h3>
              <p className="text-gray-500 text-sm mb-6">{resultMsg}</p>
              <button
                onClick={handleClose}
                className="px-6 py-2.5 bg-[#5B39C8] text-white text-sm font-bold rounded-lg hover:bg-[#4a2fb0] transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="px-6 pt-4 pb-6 space-y-5">
              {/* Email */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1.5">
                  Your Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(""); }}
                  placeholder="you@example.com"
                  className={`w-full px-3.5 py-2.5 text-sm border rounded-lg outline-none focus:ring-2 transition-colors ${
                    error ? "border-red-300 focus:ring-red-100" : "border-gray-200 focus:border-[#5B39C8] focus:ring-[#5B39C8]/10"
                  }`}
                />
                {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
              </div>

              {/* Frequency picker */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-2">
                  How often?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {FREQUENCIES.map(f => {
                    const selected = frequency === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFrequency(f.id)}
                        className={`relative flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border-2 transition-all text-center ${
                          selected
                            ? `${f.border} ${f.selectedBg} ${f.color}`
                            : "border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300"
                        }`}
                      >
                        {selected && (
                          <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-current rounded-full flex items-center justify-center">
                            <span className="w-1.5 h-1.5 bg-white rounded-full" />
                          </span>
                        )}
                        <span className={selected ? "opacity-100" : "opacity-50"}>{f.icon}</span>
                        <span className="font-bold text-xs">{f.label}</span>
                        <span className={`text-[10px] leading-tight ${selected ? "opacity-80" : "opacity-50"}`}>{f.sublabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Care filters */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-2">
                  Filter by care signals <span className="font-normal normal-case text-gray-400">(optional)</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CARE_FILTERS.map(f => {
                    const active = !!filters[f.key];
                    return (
                      <button
                        key={f.key}
                        type="button"
                        onClick={() => toggleFilter(f.key)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                          active
                            ? "border-[#5B39C8] bg-purple-50 text-[#5B39C8]"
                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        <span className={active ? f.color : "text-gray-400"}>{f.icon}</span>
                        <span className="leading-tight text-left">{f.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#F59E0B] hover:bg-[#d97706] disabled:opacity-60 text-white font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Subscribing…</>
                ) : (
                  <><Bell className="w-4 h-4" /> Subscribe to {FREQUENCIES.find(f => f.id === frequency)?.label} Alerts</>
                )}
              </button>

              <p className="text-[10px] text-gray-400 text-center">
                No spam. Unsubscribe anytime. We only send jobs from care-verified companies.
              </p>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
