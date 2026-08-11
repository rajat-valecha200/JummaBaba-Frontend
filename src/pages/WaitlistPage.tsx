import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, ShieldCheck, Zap, Users, ArrowRight, Check, HelpCircle, Loader2 } from "lucide-react";

const brandName = "JummaBaba";

const faqQuestions = [
  {
    question: "What is JummaBaba?",
    answer:
      "JummaBaba is an upcoming B2B platform designed to help manufacturers, distributors, wholesalers, and service businesses in India streamline operations, discover partners, and grow faster with secure, modern tools.",
  },
  {
    question: "What does JummaBaba do?",
    answer:
      "JummaBaba provides business-focused workflows, secure data handling, and partner-discovery features built specifically for B2B teams that outgrow spreadsheets and legacy software.",
  },
  {
    question: "Who is JummaBaba for?",
    answer:
      "JummaBaba is built for manufacturers, distributors, logistics providers, retail chains, SaaS companies, agencies, exporters, and any B2B business looking for reliable digital infrastructure.",
  },
  {
    question: "When will JummaBaba launch?",
    answer:
      "JummaBaba is launching soon. Join the waitlist to be the first to know the official launch date and receive early-access perks.",
  },
  {
    question: "How do I join the JummaBaba waitlist?",
    answer:
      "Enter your business email in the waitlist form on this page and click 'Join waitlist'. Early members receive priority access, founding-member pricing, and a direct line to the product team.",
  },
  {
    question: "Is JummaBaba secure?",
    answer:
      "Yes. Security is built into JummaBaba from day one with enterprise-grade data protection, encrypted workflows, and privacy-first design principles.",
  },
  {
    question: "Where is JummaBaba based?",
    answer:
      "JummaBaba is made with care in India, serving Indian B2B businesses and global partners looking to connect with the Indian market.",
  },
];

const features = [
  {
    icon: Zap,
    title: "Built for speed",
    desc: "Fast workflows designed for teams that move quickly and can't wait on legacy tools.",
  },
  {
    icon: ShieldCheck,
    title: "Secure by design",
    desc: "Enterprise-grade security baked in from day one — your data stays yours.",
  },
  {
    icon: Users,
    title: "Made for B2B",
    desc: "Tailored for manufacturers, distributors, and businesses of every size.",
  },
];

const perks = [
  "Priority early access",
  "Founding-member pricing",
  "Direct line to our team",
  "Shape the product roadmap",
];

export function WaitlistPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || /^\S+@\S+\.\S+$/.test(email) === false) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      await api.waitlist.submit(email);
      toast({
        title: "You're on the list!",
        description: "We'll email you as soon as we launch.",
      });
      setEmail("");
    } catch (err: any) {
      toast({
        title: "Submission Failed",
        description: err.message || "Failed to join waitlist. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-slate-50 text-slate-900 font-sans">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] bg-[size:40px_40px]" />
      
      {/* Background Blobs */}
      <div aria-hidden="true" className="pointer-events-none absolute -top-40 -left-40 h-[28rem] w-[28rem] rounded-full bg-blue-500/10 blur-[100px]" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full bg-orange-500/10 blur-[100px]" />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-8 sm:py-6">
        <Link to="/" className="flex items-center text-xl font-black tracking-tight sm:text-2xl md:text-3xl">
          <span className="text-slate-900">Jumma</span>
          <span className="text-blue-600">Baba</span>
          <span className="text-orange-500">.com</span>
        </Link>
        <a href="#waitlist" className="rounded-full border border-slate-200 bg-white/70 px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm backdrop-blur transition hover:border-orange-500/40 hover:text-orange-600">
          Join waitlist <ArrowRight className="inline h-4 w-4 ml-1" />
        </a>
      </header>

      <main id="main" className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-4 pt-12 pb-16 text-center sm:px-8 sm:pt-16 sm:pb-20">
        <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/25 bg-orange-50/50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-orange-600 shadow-sm backdrop-blur">
          <span aria-hidden="true" className="inline-block h-2 w-2 rounded-full bg-orange-500 animate-ping" />
          <span>Built for B2B — Launching Soon</span>
          <Sparkles className="h-4 w-4 text-orange-500" />
        </div>

        <h1 className="mt-8 text-balance text-4xl font-black leading-[1.1] text-slate-900 sm:text-6xl md:text-7xl">
          JummaBaba — a <span className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">B2B platform</span>
          <br />
          for Indian businesses is on the way.
        </h1>

        <p className="mt-6 max-w-2xl text-pretty text-lg text-slate-500 leading-relaxed">
          A new B2B platform is getting ready to launch. Join the waitlist and be the first business
          to experience it — with founding-partner perks.
        </p>

        {/* Waitlist form */}
        <form id="waitlist" onSubmit={onSubmit} className="mt-10 flex w-full max-w-md flex-col gap-3 sm:flex-row">
          <input
            type="email"
            required
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-14 flex-1 rounded-2xl border border-slate-200 bg-white px-5 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent font-medium"
          />
          <button
            type="submit"
            disabled={submitting}
            className="h-14 rounded-2xl bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white font-bold px-8 shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Joining…
              </>
            ) : (
              <>
                Join waitlist
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-600" /> Enterprise-grade
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-orange-500" /> Secure by design
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-600" /> Built in India
          </span>
        </div>
      </main>

      {/* Feature cards */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 pb-20 sm:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <article key={f.title} className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm transition hover:shadow-md hover:-translate-y-0.5 duration-200">
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-600">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">{f.title}</h3>
                <p className="mt-3 text-slate-500 leading-relaxed text-sm">{f.desc}</p>
              </article>
            );
          })}
        </div>
      </section>

      {/* Perks CTA */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 pb-20 sm:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-8 shadow-sm sm:p-12">
          <div className="relative grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl font-black sm:text-4xl">
                Founding members get <span className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">more</span>.
              </h2>
              <p className="mt-4 text-slate-500 leading-relaxed text-lg">
                Sign up now and unlock perks reserved for the businesses who believed early.
              </p>
              <a href="#waitlist" className="mt-6 inline-flex h-12 items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white font-bold px-6 shadow-lg shadow-orange-500/15">
                Reserve your spot <ArrowRight className="h-5 w-5" />
              </a>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {perks.map((p) => (
                <li key={p} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 px-5 py-4">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white">
                    <Check className="h-3 w-3" />
                  </span>
                  <span className="text-sm font-semibold text-slate-700">{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative z-10 mx-auto max-w-4xl px-4 pb-20 sm:px-8">
        <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm sm:p-12">
          <div className="mb-10 text-center">
            <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-600">
              <HelpCircle className="h-6 w-6" />
            </div>
            <h2 className="text-3xl font-black text-slate-900">Frequently asked questions</h2>
            <p className="mt-3 text-slate-500">Quick answers about JummaBaba, what we do, and how to get early access.</p>
          </div>

          <div className="grid gap-4">
            {faqQuestions.map((item, i) => (
              <details key={item.question} className="group rounded-2xl border border-slate-100 bg-slate-50/30 px-6 py-5 open:bg-white transition-all duration-200" open={i === 0}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-left font-bold text-slate-800 focus:outline-none">
                  <span>{item.question}</span>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition group-open:rotate-180 group-open:bg-orange-500 group-open:text-white">
                    <ArrowRight className="h-4.5 w-4.5 rotate-90" />
                  </span>
                </summary>
                <p className="mt-4 text-sm leading-relaxed text-slate-500 font-medium">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-slate-100 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-center text-sm text-slate-400 sm:flex-row sm:px-8 sm:text-left font-semibold">
          <p>© {new Date().getFullYear()} JummaBaba.com — All rights reserved.</p>
          <p className="text-xs">Made with care in India.</p>
        </div>
      </footer>
    </div>
  );
}
