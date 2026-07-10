"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAdminRequest, markNeedsReview, pdfExportUrl } from "@/lib/api";
import {
  CATEGORY_LABELS,
  formatINR,
  type Category,
  type ProposalVersion,
  type RequestData,
  type RequestStatus,
} from "@/lib/types";

// Helper for dark theme status badges
function getStatusBadgeClasses(status: RequestStatus) {
  const map: Record<RequestStatus, string> = {
    pending: "bg-amber-500/10 text-amber-400 border border-amber-500/30",
    confirmed: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30",
    needs_human_review: "bg-red-500/10 text-red-400 border border-red-500/30",
    abandoned: "bg-slate-500/10 text-slate-400 border border-slate-500/30",
  };
  return map[status] || "bg-slate-500/10 text-slate-400 border border-slate-500/30";
}

function getStatusLabel(status: RequestStatus) {
  const map: Record<RequestStatus, string> = {
    pending: "Pending",
    confirmed: "Confirmed",
    needs_human_review: "Needs Review",
    abandoned: "Abandoned",
  };
  return map[status] || status;
}

export default function AdminRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [id, setId] = useState<number | null>(null);
  const [request, setRequest] = useState<RequestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    params.then((p) => setId(Number(p.id)));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    getAdminRequest(id)
      .then(setRequest)
      .catch((err) => {
        if (err.message.includes("authenticated")) {
          router.push("/admin/login");
        } else {
          setError(err.message);
        }
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  async function handleMarkReview() {
    if (!id) return;
    setActionLoading(true);
    try {
      await markNeedsReview(id);
      const updated = await getAdminRequest(id);
      setRequest(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center hero-gradient">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500/30 border-t-brand-500" />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 hero-gradient">
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {error || "Not found"}
        </p>
        <Link href="/admin" className="text-sm font-medium text-brand-400 hover:underline">
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen hero-gradient">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-dark-900/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <Link href="/admin" className="mb-2 flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-brand-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-white">
                Request #{request.id}
              </h1>
              <p className="mt-1 text-sm font-medium text-slate-400">
                {request.client.name} ·{" "}
                <span className="text-slate-300">{CATEGORY_LABELS[request.category as Category]}</span>
              </p>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${getStatusBadgeClasses(
                request.status as RequestStatus
              )}`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {getStatusLabel(request.status as RequestStatus)}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-6 py-8 fade-in-up">
        {/* ── Client Details & Actions ── */}
        <div className="grid gap-6 md:grid-cols-3">
          <section className="glass col-span-2 p-6">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
              <span className="text-lg">👤</span> Client Details
            </h2>
            <dl className="grid gap-4 text-sm md:grid-cols-2">
              <Detail label="Name" value={request.client.name} />
              <Detail label="Email" value={request.client.email} />
              <Detail label="Phone" value={request.client.phone || "—"} />
              <Detail label="Company" value={request.client.company || "—"} />
              <Detail label="Submitted" value={new Date(request.created_at).toLocaleString()} />
            </dl>
          </section>

          <section className="glass p-6 flex flex-col">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
              Actions
            </h2>
            <div className="flex flex-col gap-3 flex-1 justify-center">
              {request.status === "confirmed" && (
                <a
                  href={pdfExportUrl(request.id)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-500 hover:shadow-glow"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export PDF
                </a>
              )}
              {request.status === "pending" && (
                <button
                  onClick={handleMarkReview}
                  disabled={actionLoading}
                  className="flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Mark as Needs Review
                </button>
              )}
              {request.status !== "confirmed" && request.status !== "pending" && (
                <p className="text-center text-sm text-slate-500">No actions available.</p>
              )}
            </div>
          </section>
        </div>

        {/* ── Requirements ── */}
        <section className="glass p-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
            <span className="text-lg">📋</span> Requirements
          </h2>
          <div className="rounded-xl border border-white/5 bg-dark-900/50 p-4">
            <p className="text-sm leading-relaxed text-slate-300">{request.requirements_raw}</p>
          </div>
          {request.requirements_structured && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Structured Data
              </p>
              <pre className="overflow-x-auto rounded-xl border border-white/5 bg-dark-900/50 p-4 text-xs leading-relaxed text-slate-400 scrollbar-thin">
                {JSON.stringify(request.requirements_structured, null, 2)}
              </pre>
            </div>
          )}
        </section>

        {/* ── Proposal Versions ── */}
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
            <span className="text-lg">📄</span> Proposal Versions ({request.proposal_versions.length}/4)
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {request.proposal_versions.map((v) => (
              <VersionCard key={v.id} version={v} />
            ))}
            {request.proposal_versions.length === 0 && (
              <div className="glass col-span-2 p-8 text-center">
                <p className="text-sm text-slate-500">No proposals generated yet.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className="mt-1 font-medium text-white">{value}</dd>
    </div>
  );
}

function VersionCard({ version }: { version: ProposalVersion }) {
  return (
    <div className="glass relative overflow-hidden p-6 transition hover:border-brand-500/30 hover:bg-white/5">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <span className="inline-flex rounded-full bg-brand-500/20 px-2.5 py-0.5 text-xs font-semibold text-brand-400">
            v{version.version_number}
          </span>
          {version.timeline_estimate && (
            <p className="mt-2 text-sm font-medium text-slate-300">
              <span className="mr-1.5">⏱</span> {version.timeline_estimate}
            </p>
          )}
        </div>
        {version.budget_min != null && version.budget_max != null && (
          <div className="text-right">
            <p className="text-xs font-medium text-slate-500">Budget Range</p>
            <p className="mt-1 font-display text-lg font-bold text-white">
              {formatINR(version.budget_min)} – {formatINR(version.budget_max)}
            </p>
          </div>
        )}
      </div>

      {version.client_feedback && (
        <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-500">
            Client Feedback
          </p>
          <p className="mt-1 text-sm text-amber-100/80">{version.client_feedback}</p>
        </div>
      )}

      {version.scope_breakdown && version.scope_breakdown.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Scope
          </p>
          <ul className="space-y-1.5">
            {version.scope_breakdown.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand-500" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 grid gap-4 rounded-xl border border-white/5 bg-dark-900/50 p-4 text-xs md:grid-cols-2">
        {version.assumptions && (
          <div>
            <p className="mb-1 font-semibold text-slate-500">Assumptions</p>
            <p className="text-slate-400">{version.assumptions}</p>
          </div>
        )}
        {version.exclusions && (
          <div>
            <p className="mb-1 font-semibold text-slate-500">Exclusions</p>
            <p className="text-slate-400">{version.exclusions}</p>
          </div>
        )}
      </div>
    </div>
  );
}
