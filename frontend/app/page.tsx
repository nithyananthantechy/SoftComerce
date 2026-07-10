"use client";

import Link from "next/link";
import { CATEGORY_LABELS, type Category } from "@/lib/types";
import { useClientAuth } from "@/context/ClientAuthContext";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";

const categories: {
  key: Category;
  description: string;
  icon: string;
  gradient: string;
  features: string[];
}[] = [
  {
    key: "web",
    description: "Websites, landing pages, e-commerce, CMS, and web applications",
    icon: "🌐",
    gradient: "from-blue-500/20 to-cyan-500/10",
    features: ["Landing Pages", "E-commerce", "CMS", "Web Apps"],
  },
  {
    key: "mobile",
    description: "iOS, Android, and cross-platform mobile applications",
    icon: "📱",
    gradient: "from-violet-500/20 to-purple-500/10",
    features: ["iOS & Android", "Cross-Platform", "Backend API", "Push Notifications"],
  },
  {
    key: "custom_software",
    description: "Bespoke software, integrations, automation, and AI features",
    icon: "⚙️",
    gradient: "from-brand-500/20 to-brand-700/10",
    features: ["Custom Modules", "AI Automation", "Integrations", "Data Systems"],
  },
];

export default function HomePage() {
  const { client, logout } = useClientAuth();
  const router = useRouter();

  const handleCategoryClick = (e: React.MouseEvent, key: string) => {
    e.preventDefault();
    if (!client) {
      router.push("/login");
    } else {
      router.push(`/submit/${key}`);
    }
  };

  return (
    <div className="min-h-screen hero-gradient">
      {/* ── Header ── */}
      <header className="border-b border-white/5 bg-dark-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Logo className="h-8 w-8" />
            <div>
              <h1 className="text-xl logo-text text-white leading-tight mt-1">
                Soft<span className="logo-text-gradient">comerce</span>
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/products"
              className="text-sm font-medium text-slate-300 hover:text-brand-400 transition"
            >
              Our Products
            </Link>
            
            {client ? (
              <>
                <Link
                  href="/dashboard"
                  className="rounded-lg border border-brand-500/50 bg-brand-500/10 px-4 py-1.5 text-sm font-medium text-brand-400 transition hover:bg-brand-500/20"
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => logout()}
                  className="text-sm text-slate-400 hover:text-white transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-slate-300 hover:text-white transition"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg bg-brand-gradient px-4 py-1.5 text-sm font-medium text-white transition hover:shadow-lg hover:shadow-brand-500/25"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-20">
        {/* ── Hero ── */}
        <section className="mb-20 text-center fade-in-up">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-pulse" />
            <span className="text-xs font-medium text-brand-400">Custom Solutions · Ready-Made Products · Demos</span>
          </div>
          <h2 className="mt-6 font-display text-5xl font-bold leading-tight tracking-tight text-white md:text-6xl">
            Your Ultimate Software{" "}
            <span className="gradient-text">Solutions Hub</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-400">
            Welcome to Softcomerce by NITECHSPARK. Purchase custom Web, Mobile, and Software applications, or explore our powerful ready-made products and request a demo instantly.
          </p>
          
          {!client && (
            <div className="mt-8 p-6 rounded-2xl border border-brand-500/20 bg-brand-500/5 inline-block text-left">
              <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                <svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Create an Account to Start
              </h3>
              <p className="text-slate-400 text-sm mb-4 max-w-md">
                Register or log in to request custom software solutions, explore our ready-made products, and track your requests.
              </p>
              <div className="flex gap-3">
                <Link href="/register" className="btn-primary py-2 px-6 rounded-lg text-sm">
                  Sign Up Now
                </Link>
                <Link href="/login" className="px-6 py-2 rounded-lg text-sm border border-white/10 hover:bg-white/5 text-white transition">
                  Log In
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* ── Category Cards ── */}
        <section className="grid gap-6 md:grid-cols-3 fade-in-up" style={{ animationDelay: "0.1s" }}>
          {categories.map((cat) => (
            <a
              key={cat.key}
              href={`/submit/${cat.key}`}
              onClick={(e) => handleCategoryClick(e, cat.key)}
              id={`category-${cat.key}`}
              className="group glass glass-hover relative flex flex-col overflow-hidden p-6 cursor-pointer"
            >
              {/* Gradient overlay */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100 rounded-2xl`}
              />

              <div className="relative z-10">
                <span className="text-4xl">{cat.icon}</span>
                <h3 className="mt-4 text-lg font-semibold text-white group-hover:text-brand-300 transition-colors">
                  {CATEGORY_LABELS[cat.key]}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{cat.description}</p>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {cat.features.map((f) => (
                    <span
                      key={f}
                      className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-slate-500 group-hover:bg-brand-500/10 group-hover:text-brand-400 transition-colors"
                    >
                      {f}
                    </span>
                  ))}
                </div>

                <div className="mt-6 flex items-center gap-1.5 text-sm font-medium text-brand-400 group-hover:gap-3 transition-all">
                  {client ? "Request solution" : "Log in to request"}
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </a>
          ))}
        </section>

        {/* ── How It Works ── */}
        <section className="mt-24 fade-in-up" style={{ animationDelay: "0.2s" }}>
          <h3 className="mb-10 text-center text-2xl font-bold text-white">How It Works</h3>
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { step: "01", title: "Sign In", desc: "Create your free client account" },
              { step: "02", title: "Describe", desc: "Tell us about the software or app you need" },
              { step: "03", title: "Review", desc: "Our team reviews your requirements and provides a quote" },
              { step: "04", title: "Confirm", desc: "Confirm your request and we begin development" },
            ].map((item) => (
              <div key={item.step} className="glass p-5">
                <p className="text-2xl font-bold gradient-text">{item.step}</p>
                <h4 className="mt-2 font-semibold text-white">{item.title}</h4>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Disclaimer ── */}
        <section
          className="mt-12 rounded-2xl border border-brand-500/20 bg-brand-500/5 p-6 text-center fade-in-up"
          style={{ animationDelay: "0.3s" }}
        >
          <p className="text-sm text-slate-500">
            <span className="font-medium text-slate-400">Transparent pricing, no surprises.</span>{" "}
            All estimates are based on your requirements and our published rate card.
            Final scope is confirmed after team review.
          </p>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="mt-16 border-t border-white/5 py-8 text-center">
        <p className="text-sm text-slate-600">
          © {new Date().getFullYear()}{" "}
          <span className="text-brand-500">NITECHSPARK</span>. All rights reserved.
        </p>
        <p className="mt-1 text-xs text-slate-700">
          Softcomerce — Your Ultimate Software Solutions Hub
        </p>
      </footer>
    </div>
  );
}
