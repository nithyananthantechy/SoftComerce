"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useClientAuth } from "@/context/ClientAuthContext";
import { getClientRequests } from "@/lib/api";
import { CATEGORY_LABELS, type RequestSummary } from "@/lib/types";
import Logo from "@/components/Logo";

export default function DashboardPage() {
  const { client, isLoading: isAuthLoading } = useClientAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<RequestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <div className="min-h-screen hero-gradient">
      <header className="border-b border-white/5 bg-dark-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <Logo className="h-8 w-8" />
            <h1 className="text-xl logo-text text-white leading-tight mt-1">
              Soft<span className="logo-text-gradient">comerce</span>
            </h1>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-400">Welcome, {client?.name}</span>
            <Link href="/" className="text-brand-400 hover:underline">New Request</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white">Your Requests</h2>
          <p className="text-slate-400">View and manage your requested software solutions.</p>
        </div>

        {error && <div className="text-red-400 mb-6">{error}</div>}

        {requests.length === 0 ? (
          <div className="glass p-10 text-center rounded-2xl">
            <p className="text-slate-400 mb-4">You haven't generated any proposals yet.</p>
            <Link href="/" className="btn-primary py-2 px-6 rounded-lg inline-block text-sm">
              Create New Proposal
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {requests.map((req) => (
              <Link
                key={req.id}
                href={`/proposal/${req.id}`}
                className="glass p-5 rounded-2xl flex items-center justify-between hover:border-brand-500/50 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-white font-medium">{CATEGORY_LABELS[req.category]}</span>
                    <span
                      className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                        req.status === "confirmed"
                          ? "bg-green-500/20 text-green-400"
                          : req.status === "needs_human_review"
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-blue-500/20 text-blue-400"
                      }`}
                    >
                      {req.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="text-sm text-slate-400 line-clamp-1">
                    {req.requirements_raw}
                  </div>
                </div>
                <div className="text-right text-xs text-slate-500 min-w-[120px]">
                  {new Date(req.created_at).toLocaleDateString()}
                  <div className="text-brand-400 mt-1">View Details →</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
