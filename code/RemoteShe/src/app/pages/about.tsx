import { CheckCircle2, TrendingUp, Scale, Users, Database, Shield, Building2, Send } from "lucide-react";
import { useNavigate } from "react-router";
import { inquiriesAPI } from "../lib/api";
import { toast } from "sonner";

const HERO_IMAGE = "https://images.unsplash.com/photo-1771149977098-e9ebb0ea7136?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHdvcmtpbmclMjBsYXB0b3AlMjBvZmZpY2UlMjBwcm9mZXNzaW9uYWx8ZW58MXx8fHwxNzczNTMyNzgxfDA&ixlib=rb-4.1.0&q=80&w=1080";

export function About() {
  const navigate = useNavigate();

  // Company inquiry form state
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [form, setForm] = useState({ company_name: '', contact_name: '', email: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email.trim() || !form.message.trim()) return;
    setSubmitting(true);
    try {
      await inquiriesAPI.submit(form);
      setDone(true);
    } catch (err: any) {
      toast.error(`Failed to send: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const closeInquiry = () => {
    setInquiryOpen(false);
    setTimeout(() => { setDone(false); setForm({ company_name: '', contact_name: '', email: '', message: '' }); }, 300);
  };

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#5B39C8] mb-5">
              The Science of Care
            </div>
            <h1 className="text-[2.4rem] font-bold text-gray-900 leading-tight mb-6">
              Care Signals: The Future of{" "}
              <span className="block">Remote</span>
              <em className="text-[#5B39C8] not-italic italic">Infrastructure</em>
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed mb-8">
              Beyond basic benefits, care infrastructure is the backbone of sustainable remote productivity and employee retention. We decode the hidden signals of workplace support.
            </p>
            <button
              onClick={() => navigate('/jobs')}
              className="px-6 py-2.5 bg-[#5B39C8] text-white text-sm font-semibold rounded-lg hover:bg-[#4a2fb0] transition-colors"
            >
              Get Started
            </button>
          </div>

          {/* Right - photo with overlay */}
          <div className="relative">
            <div className="rounded-2xl overflow-hidden shadow-xl aspect-[4/3]">
              <img
                src={HERO_IMAGE}
                alt="Professional woman working"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Insight badge */}
            <div className="absolute bottom-6 left-6 right-6 bg-white rounded-xl p-4 shadow-lg border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 rounded bg-[#5B39C8]/10 flex items-center justify-center">
                  <TrendingUp className="w-3 h-3 text-[#5B39C8]" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#5B39C8]">Real-Time Insight</span>
              </div>
              <p className="text-xs text-gray-600 italic leading-relaxed">
                "Care-conscious companies retain talent 3x longer than traditional remote setups."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Care Infrastructure Matters */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900">Why Care Infrastructure Matters</h2>
            <div className="w-10 h-0.5 bg-[#5B39C8] mx-auto mt-3" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="w-10 h-10 rounded-xl bg-[#5B39C8]/10 flex items-center justify-center mb-4">
                <TrendingUp className="w-5 h-5 text-[#5B39C8]" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Productivity Gain</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Companies with integrated care support see 30% lower turnover rates among remote caregivers and parents.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="w-10 h-10 rounded-xl bg-[#5B39C8]/10 flex items-center justify-center mb-4">
                <Scale className="w-5 h-5 text-[#5B39C8]" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Equity Driven</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Leveling the playing field for all remote talent by addressing the disproportionate burden of home management.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How Carefolio Evaluates */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: numbered steps */}
            <div className="space-y-3">
              {[
                { num: '01', title: 'Find the company', desc: 'We identify remote-friendly companies and locate their public benefits pages and careers site.' },
                { num: '02', title: 'Read the policies', desc: 'Maternity leave weeks, fertility coverage, childcare support, and remote flexibility are read directly from official sources.' },
                { num: '03', title: 'Score and publish', desc: 'A Carefolio Score is assigned manually based on the four signals. No estimation — only what\'s publicly stated.' },
              ].map(step => (
                <div key={step.num} className="flex items-start gap-4 bg-white border border-gray-200 rounded-xl p-5">
                  <span className="text-2xl font-black text-[#5B39C8]/30">{step.num}</span>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm mb-0.5">{step.title}</h4>
                    <p className="text-xs text-gray-500">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Right: description */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                How{" "}
                <span className="text-[#5B39C8]">Carefolio</span>
                {" "}scores companies
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed mb-6">
                Carefolio scores are built on four concrete signals: maternity leave length, IVF and fertility coverage, childcare support, and remote flexibility. Each signal is sourced from publicly available policy documentation — not surveys, not estimates.
              </p>
              <div className="space-y-3">
                {[
                  'Sourced from official company benefits pages',
                  'Jobs pulled live from Greenhouse and Lever ATS boards',
                  'All profiles reviewed by a human before publishing',
                ].map(item => (
                  <div key={item} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#5B39C8] mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How RemoteShe Collects Data */}
      <section className="bg-[#3D2A9B] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Left */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">How RemoteShe surfaces data</h2>
              <p className="text-purple-200 text-sm leading-relaxed mb-6">
                We focus on what's verifiable. Company care policies are researched from public sources — official career pages, benefits documentation, and ATS job listings — and cross-referenced manually. We don't claim what we can't confirm.
              </p>
            </div>

            {/* Right: 3 honest cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: Database, title: 'Public sources', desc: 'Career pages, benefits documentation, and official policy statements from each company.' },
                { icon: Shield, title: 'ATS integration', desc: 'Live job listings pulled directly from Greenhouse and Lever boards — no manual guesswork.' },
                { icon: Users, title: 'Human curation', desc: 'Each company profile is reviewed and scored by a human before being published.' },
              ].map(card => {
                const Icon = card.icon;
                return (
                  <div key={card.title} className="bg-white/10 border border-white/10 rounded-xl p-4 hover:bg-white/15 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center mb-3">
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <h4 className="text-sm font-bold text-white mb-1">{card.title}</h4>
                    <p className="text-xs text-purple-200 leading-relaxed">{card.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Ecosystem Section ── */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#5B39C8] mb-3">Context</div>
            <h2 className="text-2xl font-bold text-gray-900">Part of a broader ecosystem</h2>
            <div className="w-10 h-0.5 bg-[#5B39C8] mt-3" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
            {/* RemoteShe */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-[#5B39C8] rounded flex items-center justify-center flex-shrink-0">
                  <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                    <rect x="1" y="1" width="5" height="5" rx="1" fill="white" />
                    <rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity="0.6" />
                    <rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity="0.6" />
                    <rect x="8" y="8" width="5" height="5" rx="1" fill="white" />
                  </svg>
                </div>
                <span className="text-sm font-bold text-gray-900">RemoteShe</span>
                <span className="text-[9px] font-semibold uppercase tracking-wider text-[#5B39C8] bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">Product</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                Surfaces companies and jobs where caregiving policies exist, helping people find workplaces designed for real life.
              </p>
            </div>

            {/* Carefolio */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-amber-500 rounded flex items-center justify-center flex-shrink-0">
                  <span className="text-[8px] font-black text-white">CF</span>
                </div>
                <a href="https://carefolio.io" target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-gray-900 hover:text-[#5B39C8] transition-colors">Carefolio</a>
                <span className="text-[9px] font-semibold uppercase tracking-wider text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">Data layer</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                Measures how organisations support caregiving and human life through workplace policies — maternity leave, fertility benefits, childcare support, and flexible work.
              </p>
            </div>

            {/* MomOps */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-emerald-600 rounded flex items-center justify-center flex-shrink-0">
                  <span className="text-[8px] font-black text-white">MO</span>
                </div>
                <a href="https://momops.org" target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-gray-900 hover:text-[#5B39C8] transition-colors">MomOps</a>
                <span className="text-[9px] font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">Framework</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                A framework that treats care as organisational infrastructure — not as a perk, but as a structural condition for sustainable work.
              </p>
            </div>
          </div>

          {/* Long-form text */}
          <div className="bg-white border border-gray-200 rounded-2xl p-8">
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              RemoteShe is part of the <a href="https://carefolio.io" target="_blank" rel="noopener noreferrer" className="text-[#5B39C8] hover:underline font-medium">Carefolio ecosystem</a> and the <a href="https://momops.org" target="_blank" rel="noopener noreferrer" className="text-[#5B39C8] hover:underline font-medium">MomOps framework</a>.
            </p>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              Carefolio measures how organisations support caregiving and human life through workplace policies such as maternity leave, fertility benefits, childcare support, and flexible work. MomOps is a framework that treats care as organisational infrastructure.
            </p>
            <p className="text-sm text-gray-600 leading-relaxed mb-6">
              RemoteShe surfaces companies and jobs where these policies exist, helping people find workplaces designed for real life.
            </p>
            <p className="text-xs text-gray-400">
              Created by <a href="https://luana.systems" target="_blank" rel="noopener noreferrer" className="hover:text-gray-600 transition-colors">Luana.systems</a>.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Ready to find a company that <em className="text-[#5B39C8]">cares?</em>
          </h2>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button
              onClick={() => navigate('/jobs')}
              className="px-8 py-3 bg-[#5B39C8] text-white text-sm font-bold rounded-full hover:bg-[#4a2fb0] transition-colors"
            >
              Explore Directory
            </button>
            <button
              onClick={() => navigate('/company/sample')}
              className="px-8 py-3 border border-gray-300 text-gray-700 text-sm font-bold rounded-full hover:bg-gray-50 transition-colors"
            >
              See Sample Score
            </button>
          </div>
        </div>
      </section>

      {/* ── For Companies ── */}
      <section className="py-16 border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white border border-gray-200 rounded-2xl p-8 lg:p-12 flex flex-col lg:flex-row items-start lg:items-center gap-8">
            <div className="w-12 h-12 rounded-2xl bg-[#5B39C8]/10 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-6 h-6 text-[#5B39C8]" />
            </div>
            <div className="flex-1">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#5B39C8] mb-2">For Companies</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Want to be listed?</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                If your company has strong caregiving policies and you'd like us to add your jobs to RemoteShe, get in touch. We review every request manually before publishing.
              </p>
            </div>
            <button
              onClick={() => setInquiryOpen(true)}
              className="flex-shrink-0 flex items-center gap-2 px-6 py-3 bg-[#5B39C8] text-white text-sm font-semibold rounded-xl hover:bg-[#4a2fb0] transition-colors"
            >
              <Send className="w-4 h-4" />
              Get in touch
            </button>
          </div>
        </div>
      </section>

      {/* ── Company Inquiry Modal ── */}
      {inquiryOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px]" onClick={closeInquiry} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-md pointer-events-auto">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#5B39C8]/10 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-[#5B39C8]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Company inquiry</p>
                    <p className="text-[11px] text-gray-400">We'll review and get back to you</p>
                  </div>
                </div>
                <button onClick={closeInquiry} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors text-lg leading-none">✕</button>
              </div>

              {done ? (
                <div className="px-6 py-12 flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                  </div>
                  <p className="text-sm font-bold text-gray-900 mb-1">Message received</p>
                  <p className="text-xs text-gray-500 mb-6 max-w-xs">We'll review your company and get back to you at the email you provided.</p>
                  <button onClick={closeInquiry} className="text-xs font-semibold text-[#5B39C8] hover:underline">Close</button>
                </div>
              ) : (
                <form onSubmit={handleInquiry} className="px-6 py-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Company name</label>
                      <input
                        type="text"
                        value={form.company_name}
                        onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
                        placeholder="Acme Inc."
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5B39C8]/30 focus:border-[#5B39C8] placeholder:text-gray-300 text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Your name</label>
                      <input
                        type="text"
                        value={form.contact_name}
                        onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))}
                        placeholder="Jane Smith"
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5B39C8]/30 focus:border-[#5B39C8] placeholder:text-gray-300 text-gray-900"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Email <span className="text-red-400">*</span></label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="you@company.com"
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5B39C8]/30 focus:border-[#5B39C8] placeholder:text-gray-300 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Message <span className="text-red-400">*</span></label>
                    <textarea
                      required
                      value={form.message}
                      onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                      placeholder="Tell us about your company's care policies and which jobs you'd like listed…"
                      rows={4}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#5B39C8]/30 focus:border-[#5B39C8] placeholder:text-gray-300 text-gray-900"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting || !form.email.trim() || !form.message.trim()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#5B39C8] text-white text-sm font-semibold rounded-xl hover:bg-[#4a2fb0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                    {submitting ? 'Sending…' : 'Send inquiry'}
                  </button>
                  <p className="text-[11px] text-gray-400 text-center">We review every request manually. No automated listings.</p>
                </form>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}