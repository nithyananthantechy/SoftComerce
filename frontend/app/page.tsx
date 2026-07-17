"use client";

import { useState } from "react";
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

const MOCK_MARKETPLACE_PREVIEW = [
  { id: "mkt-1", name: "FlowAnalytics Pro", vendor: "DataFlow Systems", price: "$49/mo" },
  { id: "mkt-2", name: "DesignUI Toolkit", vendor: "CreativeApps Inc", price: "$199 one-time" },
  { id: "mkt-3", name: "AuthGuard Enterprise", vendor: "SecureNet Ltd", price: "$99/mo" }
];

export default function HomePage() {
  const { client, logout } = useClientAuth();
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = async () => {
    await logout();
    setShowDropdown(false);
    router.push("/login");
  };

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
                Soft<span className="logo-text-gradient">kart</span>
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/products" className="text-sm font-medium text-slate-300 hover:text-brand-400 transition">
              Our Products
            </Link>
            <Link href="/marketplace" className="text-sm font-medium text-slate-300 hover:text-orange-400 transition">
              Marketplace
            </Link>
            
            {client ? (
              <div className="flex items-center gap-3">
                <div className="relative">
                  <button 
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 hover:bg-white/10 transition group text-left"
                  >
                    <div className="w-6 h-6 rounded-full bg-brand-gradient flex items-center justify-center text-[10px] font-bold text-white shadow shadow-brand-500/30">
                      {client.name ? client.name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold text-slate-200 group-hover:text-brand-400 leading-tight transition">{client.name}</span>
                      <span className="text-[9px] font-mono text-slate-400 leading-none mt-0.5">
                        {client.is_admin ? "Admin" : client.is_seller ? "Seller" : "Client"}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 group-hover:text-white transition ml-1">▼</span>
                  </button>

                  {showDropdown && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
                      <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-white/10 bg-dark-900/95 backdrop-blur-md p-2 shadow-2xl z-50">
                        <Link 
                          href={client.is_admin ? "/admin" : "/profile"} 
                          onClick={() => setShowDropdown(false)}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition text-sm font-medium"
                        >
                          {client.is_admin ? "💼 Admin Panel" : "⚙️ Profile Settings"}
                        </Link>
                        <div className="h-px bg-white/5 my-1" />
                        <button 
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition text-sm text-left font-medium"
                        >
                          🚪 Log Out
                        </button>
                      </div>
                    </>
                  )}
                </div>
                <Link href={client.is_admin ? "/admin" : "/dashboard"} className="rounded-full border border-brand-500/50 bg-brand-500/10 px-4 py-1.5 text-xs font-semibold text-brand-400 transition hover:bg-brand-500/20 active:scale-[0.98]">
                  Dashboard
                </Link>
              </div>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-white transition">
                  Log In
                </Link>
                <Link href="/register" className="rounded-full bg-brand-gradient px-4 py-1.5 text-sm font-medium text-white transition hover:shadow-lg hover:shadow-brand-500/25 active:scale-[0.98]">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-20">
        {/* ── Hero ── */}
        <section className="mb-24 text-center fade-in-up">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-pulse" />
            <span className="text-xs font-medium text-brand-400">Custom Solutions · Marketplace · Exclusive Products</span>
          </div>
          <h2 className="mt-6 font-display text-5xl font-bold leading-tight tracking-tight text-white md:text-6xl">
            Your Ultimate Software{" "}
            <span className="gradient-text">Solutions Hub</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-400">
            Welcome to Softkart. Purchase bespoke Web, Mobile, and Software applications, explore our exclusive ready-made products, or browse the third-party marketplace.
          </p>
          
          {!client && (
            <div className="mt-8 p-6 rounded-2xl border border-brand-500/20 bg-brand-500/5 inline-block text-left relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-brand-500/10 to-transparent pointer-events-none" />
              <div className="relative z-10">
                <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Create an Account to Start
                </h3>
                <p className="text-slate-400 text-sm mb-4 max-w-md">
                  Register or log in to request custom software solutions, purchase from the marketplace, or list your own digital products.
                </p>
                <div className="flex gap-3">
                  <Link href="/register" className="btn-brand py-2 px-6 rounded-xl text-sm font-semibold">
                    Sign Up Now
                  </Link>
                  <Link href="/login" className="px-6 py-2 rounded-xl text-sm border border-white/10 hover:bg-white/5 text-white transition font-semibold">
                    Log In
                  </Link>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ── Custom Development (Exclusive) ── */}
        <section className="mb-24 fade-in-up" style={{ animationDelay: "0.1s" }}>
          <div className="mb-10 text-center">
             <h3 className="text-3xl font-bold text-white mb-2">Custom Development Services</h3>
             <p className="text-slate-400 max-w-xl mx-auto">
               Get a personalized proposal. Custom solutions are exclusively built and delivered by 
               <span className="font-semibold text-white"> NITECHSPARK</span>.
             </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-3">
            {categories.map((cat) => (
              <a
                key={cat.key}
                href={`/submit/${cat.key}`}
                onClick={(e) => handleCategoryClick(e, cat.key)}
                id={`category-${cat.key}`}
                className="group glass glass-hover relative flex flex-col overflow-hidden p-6 cursor-pointer"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100 rounded-2xl`} />
                <div className="relative z-10">
                  <span className="text-4xl">{cat.icon}</span>
                  <h3 className="mt-4 text-lg font-semibold text-white group-hover:text-brand-300 transition-colors">
                    {CATEGORY_LABELS[cat.key]}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{cat.description}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {cat.features.map((f) => (
                      <span key={f} className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-slate-500 group-hover:bg-brand-500/10 group-hover:text-brand-400 transition-colors">
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
          </div>
        </section>

        {/* ── Third-Party Marketplace Preview ── */}
        <section className="mb-24 fade-in-up" style={{ animationDelay: "0.2s" }}>
          <div className="glass p-10 rounded-3xl relative overflow-hidden border border-orange-500/20">
             <div className="absolute top-0 right-0 p-8 opacity-5 text-9xl">🛍️</div>
             <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 mb-10">
               <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 mb-4">
                    <span className="text-xs font-medium text-orange-400">New Feature</span>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-2">Third-Party Marketplace</h3>
                  <p className="text-slate-400 max-w-lg">
                    Discover digital products, templates, and tools built by our partner companies and independent developers.
                  </p>
               </div>
               <Link href="/marketplace" className="shrink-0 bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-3 rounded-xl text-white font-medium transition">
                  Browse All Products →
               </Link>
             </div>

             <div className="relative z-10 grid gap-4 md:grid-cols-3">
               {MOCK_MARKETPLACE_PREVIEW.map((prod) => (
                  <div key={prod.id} className="bg-dark-900/50 border border-white/5 rounded-2xl p-5 hover:border-orange-500/30 transition">
                     <h4 className="text-white font-bold mb-1">{prod.name}</h4>
                     <p className="text-xs text-slate-500 mb-3">By {prod.vendor}</p>
                     <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5">
                        <span className="text-sm font-semibold text-orange-400">{prod.price}</span>
                     </div>
                  </div>
               ))}
             </div>
          </div>
        </section>

        {/* ── How It Works ── */}
        <section className="mb-24 fade-in-up" style={{ animationDelay: "0.3s" }}>
          <h3 className="mb-10 text-center text-2xl font-bold text-white">How Custom Development Works</h3>
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

      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-10 text-center bg-dark-900/50">
        <p className="text-sm text-slate-500 mb-2">
          © {new Date().getFullYear()} <span className="text-brand-500 font-semibold">NITECHSPARK</span>.
        </p>
        <p className="text-xs text-slate-600 max-w-md mx-auto">
          Softkart — Your Ultimate Software Solutions Hub & Digital Marketplace. Custom development proposals are exclusively handled by our internal team.
        </p>
      </footer>
    </div>
  );
}
