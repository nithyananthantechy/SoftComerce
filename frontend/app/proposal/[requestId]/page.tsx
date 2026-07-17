"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProposalView from "@/components/ProposalView";
import { getRequest } from "@/lib/api";
import Logo from "@/components/Logo";
import { useClientAuth } from "@/context/ClientAuthContext";
import { useRouter } from "next/navigation";
import { CATEGORY_LABELS, type RequestData } from "@/lib/types";

export default function ProposalPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const [requestId, setRequestId] = useState<number | null>(null);
  const [request, setRequest] = useState<RequestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { client, isLoading: isAuthLoading } = useClientAuth();
  const router = useRouter();

  useEffect(() => {
    params.then((p) => setRequestId(Number(p.requestId)));
  }, [params]);

  useEffect(() => {
    if (!isAuthLoading && !client) {
      router.push("/login");
    }
  }, [client, isAuthLoading, router]);

  useEffect(() => {
    if (!requestId || isAuthLoading || !client) return;
    getRequest(requestId)
      .then(setRequest)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [requestId, isAuthLoading, client]);

  if (isAuthLoading || loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 hero-gradient">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-500/30 border-t-brand-500" />
        <p className="text-sm text-slate-500">Loading your proposal...</p>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 hero-gradient">
        <p className="text-red-400">{error || "Proposal not found or unauthorized"}</p>
        <Link href="/" className="text-sm text-brand-400 hover:underline">
          ← Go home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen hero-gradient">
      {/* Header */}
      <header className="border-b border-white/5 bg-dark-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Logo className="h-8 w-8" />
            <div>
              <p className="text-[12px] font-bold logo-text text-white leading-none mt-1">
                Soft<span className="logo-text-gradient">kart</span>
              </p>
              <p className="text-sm font-semibold text-white leading-tight">
                {CATEGORY_LABELS[request.category]}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-600">Proposal for</p>
            <p className="text-sm font-semibold text-white">{request.client.name}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <ProposalView request={request} onUpdate={setRequest} />

        <footer className="mt-12 border-t border-white/5 pt-6 text-center">
          <p className="text-xs text-slate-700">
            © {new Date().getFullYear()}{" "}
            <span className="text-brand-500">NITECHSPARK</span> · Softkart AI Proposal Engine
          </p>
        </footer>
      </main>
    </div>
  );
}
