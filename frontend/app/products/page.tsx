"use client";

import Link from "next/link";
import Logo from "@/components/Logo";

const BRANDS = [
  {
    key: "nitehire",
    name: "NiteHire",
    tagline: "AI-Powered HR & Automated Recruitment",
    description: "Automate first-round candidate interviews, objective AI scoring, and visual tracking to reduce time-to-hire by up to 60%.",
    logo: "💼",
    gradient: "from-blue-500/20 to-indigo-500/10",
    productCount: 1,
  },
  {
    key: "nitechspark",
    name: "NITECHSPARK Solutions",
    tagline: "AI CRM, Governance & Compliance Security",
    description: "Sales outreach platforms (PropoTrack), DPDP Act compliance cybersecurity assessments (NiteSentinel), and AI usage controls (NexusAI).",
    logo: "⚡",
    gradient: "from-purple-500/20 to-violet-500/10",
    productCount: 3,
  },
  {
    key: "nitechspark-enterprise",
    name: "NITECHSPARK Enterprise",
    tagline: "Enterprise Safety, Operations & ESG Platforms",
    description: "Data center energy & emission monitors (SustainHub), personal safety apps (Sentriya), and secure communication portals (Spark Connect).",
    logo: "🏢",
    gradient: "from-teal-500/20 to-emerald-500/10",
    productCount: 3,
  }
];

export default function ProductsPage() {
  return (
    <div className="min-h-screen hero-gradient">
      {/* Header */}
      <header className="border-b border-white/5 bg-dark-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <Logo className="h-8 w-8" />
            <div>
              <h1 className="text-xl logo-text text-white leading-tight mt-1">
                Soft<span className="logo-text-gradient">kart</span>
              </h1>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm font-medium text-slate-300 hover:text-brand-400 transition"
            >
              Home
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-16 text-center fade-in-up">
          <h2 className="text-4xl font-bold text-white md:text-5xl mb-4">
            Our Brand <span className="gradient-text">Ecosystems</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-slate-400">
            Explore software platforms built across the NiteHire and NITECHSPARK ecosystems. Select a brand to review individual products and request live demos.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3 fade-in-up" style={{ animationDelay: "0.1s" }}>
          {BRANDS.map((brand) => (
            <div key={brand.key} className="glass p-8 rounded-3xl relative overflow-hidden group flex flex-col h-full border border-white/5 shadow-xl transition-all duration-300 hover:border-brand-500/20">
              <div className={`absolute inset-0 bg-gradient-to-br ${brand.gradient} opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-300`} />
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-3xl mb-6 group-hover:scale-105 transition-transform">
                  {brand.logo}
                </div>
                <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-brand-400 transition-colors font-display">
                  {brand.name}
                </h3>
                <p className="text-brand-400 text-xs font-semibold uppercase tracking-wider mb-4">
                  {brand.tagline}
                </p>
                <p className="text-slate-400 leading-relaxed mb-8 flex-grow text-sm">
                  {brand.description}
                </p>
                
                <div className="mt-auto flex items-center justify-between pt-6 border-t border-white/5">
                  <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                    {brand.productCount} Product{brand.productCount > 1 ? 's' : ''}
                  </span>
                  <Link href={`/products/${brand.key}`} className="btn-brand py-2 px-5 rounded-xl text-xs font-semibold shadow-glow">
                    Explore Ecosystem
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-20 glass p-10 rounded-3xl text-center fade-in-up" style={{ animationDelay: "0.2s" }}>
          <h3 className="text-2xl font-bold text-white mb-3">Looking for custom software?</h3>
          <p className="text-slate-400 mb-6">Use Softkart to submit project specifications, and track pricing and quotes directly.</p>
          <Link href="/" className="btn-primary py-3 px-8 rounded-xl inline-block font-medium">
            Submit Custom Request
          </Link>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="mt-16 border-t border-white/5 py-8 text-center">
        <p className="text-sm text-slate-600">
          © {new Date().getFullYear()}{" "}
          <span className="text-brand-500">NITECHSPARK</span>. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
