"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useClientAuth } from "@/context/ClientAuthContext";
import { getClientRequests, becomeSeller, verifyRegister } from "@/lib/api";
import { CATEGORY_LABELS, type RequestData } from "@/lib/types";
import Logo from "@/components/Logo";

export default function DashboardPage() {
  const { client, logout, isLoading: isAuthLoading } = useClientAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [becomingSeller, setBecomingSeller] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = async () => {
    await logout();
    setShowDropdown(false);
    router.push("/login");
  };

  useEffect(() => {
    if (!isAuthLoading && !client) {
      router.push("/login");
    }
  }, [client, isAuthLoading, router]);

  useEffect(() => {
    if (isAuthLoading || !client) return;

    getClientRequests()
      .then(setRequests)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [client, isAuthLoading]);

  if (isAuthLoading || loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 hero-gradient">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-500/30 border-t-brand-500" />
      </div>
    );
  }

  const handleBecomeSeller = async () => {
    setBecomingSeller(true);
    try {
      await becomeSeller();
      // Reload page to get new token and client data
      window.location.href = "/vendor/dashboard";
    } catch (err) {
      console.error(err);
      setBecomingSeller(false);
    }
  };

  return (
    <div className="min-h-screen hero-gradient">
      <header className="border-b border-white/5 bg-dark-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <Logo className="h-8 w-8" />
            <h1 className="text-xl logo-text text-white leading-tight mt-1">
              Soft<span className="logo-text-gradient">kart</span>
            </h1>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-3">
              <div className="relative">
                <button 
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 hover:bg-white/10 transition group text-left"
                >
                  <div className="w-6 h-6 rounded-full bg-brand-gradient flex items-center justify-center text-[10px] font-bold text-white shadow shadow-brand-500/30">
                    {client?.name ? client.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-200 group-hover:text-brand-400 leading-tight transition">{client?.name}</span>
                    <span className="text-[9px] font-mono text-slate-400 leading-none mt-0.5">
                      {client?.is_admin ? "Admin" : client?.is_seller ? "Seller" : "Client"}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 group-hover:text-white transition ml-1">▼</span>
                </button>

                {showDropdown && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
                    <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-white/10 bg-dark-900/95 backdrop-blur-md p-2 shadow-2xl z-50">
                      <Link 
                        href={client?.is_admin ? "/admin" : "/profile"} 
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition text-sm font-medium"
                      >
                        {client?.is_admin ? "💼 Admin Panel" : "⚙️ Profile Settings"}
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
              <Link href="/" className="rounded-full border border-white/10 px-4 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition active:scale-[0.98]">
                Return Home
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Your Requests</h2>
            <p className="text-slate-400">View and manage your requested software solutions.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white transition whitespace-nowrap text-sm font-medium">
              Return Home
            </Link>
            {client?.is_seller ? (
              <Link href="/vendor/dashboard" className="px-5 py-2.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/30 hover:bg-orange-500/20 transition whitespace-nowrap text-sm font-medium">
                Go to Seller Dashboard
              </Link>
            ) : (
              <button 
                onClick={handleBecomeSeller} 
                disabled={becomingSeller}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium hover:opacity-90 transition whitespace-nowrap text-sm font-medium"
              >
                {becomingSeller ? "Activating..." : "Become a Seller"}
              </button>
            )}
          </div>
        </div>

        {error && <div className="text-red-400 mb-6 bg-red-500/10 p-4 rounded-xl border border-red-500/20">{error}</div>}

        {requests.length === 0 ? (
          <div className="glass p-12 text-center rounded-3xl border border-white/10 relative overflow-hidden max-w-2xl mx-auto my-10 shadow-2xl">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-brand-500/10 blur-[80px] rounded-full pointer-events-none" />
            <div className="w-16 h-16 bg-brand-500/10 border border-brand-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl shadow-inner animate-pulse">
              📄
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No Requests Found</h3>
            <p className="text-slate-400 mb-8 max-w-md mx-auto text-sm leading-relaxed">
              You haven't created any software project requests yet. Start by generating a detailed AI proposal for your next project.
            </p>
            <div className="flex justify-center">
              <Link href="/" className="btn-brand px-6 py-3 rounded-xl font-medium text-sm flex items-center gap-2 shadow-lg shadow-brand-500/20 hover:scale-[1.02] transition-transform">
                Create New Proposal
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {requests.map((req) => {
              const categoryIcons: Record<string, string> = {
                web: "🌐",
                mobile: "📱",
                custom_software: "⚙️",
              };
              const icon = categoryIcons[req.category] || "📄";

              return (
                <Link
                  key={req.id}
                  href={`/proposal/${req.id}`}
                  className="glass p-6 rounded-2xl flex items-center justify-between hover:border-brand-500/30 transition-all hover:bg-white/2 hover:scale-[1.01] group border border-white/5 relative overflow-hidden"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center text-xl border border-white/10 shadow-inner group-hover:scale-105 transition-transform">
                      {icon}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-3 mb-1.5">
                        <span className="text-white font-bold text-base leading-none">{CATEGORY_LABELS[req.category]}</span>
                        <span
                          className={`text-[9px] uppercase tracking-widest font-extrabold px-2.5 py-0.5 rounded-full border ${
                            req.status === "confirmed"
                              ? "bg-green-500/10 text-green-400 border-green-500/20"
                              : req.status === "needs_human_review"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          }`}
                        >
                          {req.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 line-clamp-1 max-w-xl">
                        {req.requirements_raw}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1.5 min-w-[120px]">
                    <span className="text-xs font-mono text-slate-500">
                      {new Date(req.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <div className="text-xs font-semibold text-brand-400 group-hover:text-brand-300 transition-colors flex items-center gap-1">
                      View Proposal 
                      <svg className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
