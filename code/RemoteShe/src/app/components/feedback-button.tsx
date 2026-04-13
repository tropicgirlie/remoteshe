import { useState } from "react";
import { MessageSquare, X, Flag, Lightbulb, ChevronDown, Send, CheckCircle2 } from "lucide-react";
import { feedbackAPI } from "../lib/api";
import { toast } from "sonner";

type FeedbackType = "error" | "feedback";

const TYPES: { value: FeedbackType; label: string; icon: typeof Flag; color: string }[] = [
  { value: "error", label: "Report an error", icon: Flag, color: "text-red-500" },
  { value: "feedback", label: "Send feedback", icon: Lightbulb, color: "text-amber-500" },
];

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("feedback");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const reset = () => {
    setType("feedback");
    setEmail("");
    setMessage("");
    setDone(false);
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(reset, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitting(true);
    try {
      await feedbackAPI.submit({
        type,
        email: email.trim() || undefined,
        message: message.trim(),
        page_url: window.location.href,
      });
      setDone(true);
    } catch (err: any) {
      toast.error(`Failed to send: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const selected = TYPES.find(t => t.value === type)!;
  const SelectedIcon = selected.icon;

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={() => { setOpen(true); reset(); }}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-[#5B39C8] text-white text-[13px] font-semibold rounded-full shadow-lg hover:bg-[#4a2fb0] transition-all hover:shadow-xl active:scale-95"
        aria-label="Feedback"
      >
        <MessageSquare className="w-4 h-4" />
        <span className="hidden sm:inline">Feedback</span>
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[2px]"
          onClick={handleClose}
        />
      )}

      {/* Modal panel */}
      {open && (
        <div className="fixed bottom-20 right-6 z-50 w-[340px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#5B39C8]/10 flex items-center justify-center">
                <MessageSquare className="w-3.5 h-3.5 text-[#5B39C8]" />
              </div>
              <span className="text-sm font-bold text-gray-900">Share with us</span>
            </div>
            <button
              onClick={handleClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {done ? (
            /* Success state */
            <div className="px-5 py-10 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </div>
              <p className="text-sm font-bold text-gray-900 mb-1">Got it, thank you!</p>
              <p className="text-xs text-gray-500 mb-5">
                {type === "error"
                  ? "We'll look into this and fix it."
                  : "Your feedback helps us improve RemoteShe."}
              </p>
              <button
                onClick={handleClose}
                className="text-xs font-semibold text-[#5B39C8] hover:underline"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
              {/* Type selector */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  I want to…
                </label>
                <div className="flex gap-2">
                  {TYPES.map(t => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setType(t.value)}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-colors ${
                          type === t.value
                            ? "border-[#5B39C8] bg-[#5B39C8]/5 text-[#5B39C8]"
                            : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 ${type === t.value ? "text-[#5B39C8]" : t.color}`} />
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  {type === "error" ? "What went wrong?" : "What's on your mind?"}
                </label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder={
                    type === "error"
                      ? "Describe what you expected vs what happened…"
                      : "Any thoughts, suggestions, or ideas…"
                  }
                  rows={4}
                  required
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#5B39C8]/30 focus:border-[#5B39C8] placeholder:text-gray-300 text-gray-900"
                />
              </div>

              {/* Email (optional) */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Your email <span className="normal-case font-normal">(optional — for follow-up)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5B39C8]/30 focus:border-[#5B39C8] placeholder:text-gray-300 text-gray-900"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !message.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#5B39C8] text-white text-sm font-semibold rounded-xl hover:bg-[#4a2fb0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                {submitting ? "Sending…" : "Send"}
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
}
