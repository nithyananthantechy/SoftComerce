"use client";

import { useState } from "react";
import Link from "next/link";
import { confirmRequest, getRequest, submitFeedback } from "@/lib/api";
import {
  CATEGORY_LABELS,
  FEEDBACK_REASONS,
  formatINR,
  type FeedbackReason,
  type ProposalVersion,
  type RequestData,
} from "@/lib/types";

interface Props {
  request: RequestData;
  onUpdate: (req: RequestData) => void;
}

export default function ProposalView({ request, onUpdate }: Props) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackReason, setFeedbackReason] = useState<FeedbackReason>("budget_too_high");
  const [feedbackText, setFeedbackText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(request.status === "confirmed");

  const latest = request.proposal_versions[request.proposal_versions.length - 1];

  async function handleConfirm() {
    setLoading(true);
    setError("");
    try {
      const updated = await confirmRequest(request.id);
      onUpdate(updated);
      setConfirmed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Confirmation failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleFeedback(e: React.FormEvent) {
    e.preventDefault();
    if (feedbackText.length < 10) {
      setError("Please provide at least 10 characters explaining what should change.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const updated = await submitFeedback(request.id, feedbackReason, feedbackText);
      onUpdate(updated);
      setShowFeedback(false);
      setFeedbackText("");
    } catch (err) {
      // Re-fetch the latest request state — the backend may have already moved
      // to needs_human_review (causing the 400) but the frontend still shows
      // the old pending state due to a previous failed update.
      try {
        const latest = await getRequest(request.id);
        onUpdate(latest);
        setShowFeedback(false);
      } catch {
        // If re-fetch also fails, show the raw error
        setError(err instanceof Error ? err.message : "Feedback submission failed");
      }
    } finally {
      setLoading(false);
    }
  }

  if (!latest) {
    return (
      <div className="glass p-8 text-center text-slate-500">No proposal generated yet.</div>
    );
  }

  return (
    <div className="space-y-6 fade-in-up">
      {/* ── Confirmed Banner ── */}
      {confirmed && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
          <div className="flex items-start gap-3">
            <svg className="h-6 w-6 shrink-0 text-emerald-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-semibold text-emerald-400">Proposal Confirmed!</p>
              <p className="mt-1 text-sm text-emerald-500/80">
                Thank you! Our founder has been notified and will personally reach out to you shortly.
              </p>
              <div className="mt-4">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-400 transition hover:bg-emerald-500/30 hover:text-emerald-300"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Return to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Needs Human Review Banner ── */}
      {request.status === "needs_human_review" && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/20 text-3xl">
              🤝
            </div>
            <div>
              <p className="text-lg font-bold text-amber-400">Our Founder is Reviewing Your Case</p>
              <p className="mt-2 text-sm leading-relaxed text-amber-500/80">
                {request.locked_message ||
                  "You've explored all AI-generated options. Our founder will personally review your requirements and reach out to craft a custom solution just for you."}
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500/20 px-6 py-3 text-sm font-semibold text-amber-400 transition hover:bg-amber-500/30 hover:text-amber-300"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Return Home
              </Link>
              <a
                href={`mailto:nithyananthan@nskgroups.website?subject=Proposal%20Follow-Up%20%E2%80%94%20${encodeURIComponent(request.category)}&body=Hi%2C%20I%20am%20${encodeURIComponent(request.client?.name ?? "")}%20from%20${encodeURIComponent(request.client?.company ?? "")}%20and%20I%20submitted%20a%20${encodeURIComponent(request.category.replace("_"," "))}%20proposal%20request.%20I%20would%20like%20to%20discuss%20further.`}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-500/30 px-6 py-3 text-sm font-semibold text-amber-500 transition hover:bg-amber-500/10"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email Us Directly
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Proposal Card ── */}
      <div className="glass overflow-hidden">
        {/* Header */}
        <div className="border-b border-white/5 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                {CATEGORY_LABELS[request.category]} · Version {latest.version_number} of 4
              </p>
              <h2 className="mt-1.5 font-display text-2xl font-bold text-white">
                Your Proposal
              </h2>
            </div>
            {latest.budget_min != null && latest.budget_max != null && (
              <div className="text-right">
                <p className="text-xs font-medium text-slate-500">Estimated Budget</p>
                <p className="mt-1 text-2xl font-bold gradient-text">
                  {formatINR(latest.budget_min)} – {formatINR(latest.budget_max)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <ProposalDetails version={latest} />

          <div className="mt-6 rounded-xl border border-brand-500/20 bg-brand-500/5 p-4">
            <p className="text-xs leading-relaxed text-slate-500">
              <span className="font-medium text-slate-400">⚠️ Important:</span>{" "}
              This is an AI-generated estimate based on your requirements and our rate card.
              Final scope is confirmed after founder review post-confirmation.
            </p>
          </div>
        </div>
      </div>

      {/* ── Previous Versions ── */}
      {request.proposal_versions.length > 1 && (
        <details className="glass overflow-hidden">
          <summary className="flex cursor-pointer items-center gap-2 p-5 text-sm font-medium text-slate-400 hover:text-white transition-colors">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            View previous versions ({request.proposal_versions.length - 1})
          </summary>
          <div className="border-t border-white/5 p-5 space-y-5">
            {request.proposal_versions.slice(0, -1).map((v) => (
              <div key={v.id} className="rounded-xl border border-white/5 bg-white/2 p-4">
                <p className="mb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Version {v.version_number}
                  {v.client_feedback && (
                    <span className="ml-2 normal-case text-amber-500/70">
                      — {v.client_feedback}
                    </span>
                  )}
                </p>
                <ProposalDetails version={v} compact />
              </div>
            ))}
          </div>
        </details>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* ── Action Buttons (only when pending and NOT locked) ── */}
      {request.status === "pending" && !confirmed && (
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleConfirm}
            disabled={loading}
            id="confirm-proposal-btn"
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-500/25 disabled:opacity-50"
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            Confirm Proposal
          </button>
          {request.can_regenerate && (
            <button
              onClick={() => setShowFeedback(!showFeedback)}
              disabled={loading}
              id="request-changes-btn"
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-300 transition hover:border-brand-500/40 hover:text-white disabled:opacity-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Request Changes ({request.versions_remaining} left)
            </button>
          )}
        </div>
      )}


      {/* ── Feedback Form (only when status is truly pending and can regenerate) ── */}
      {showFeedback && request.status === "pending" && request.can_regenerate && (
        <form onSubmit={handleFeedback} className="glass overflow-hidden fade-in-up">
          <div className="border-b border-white/5 p-5">
            <h3 className="font-semibold text-white">Request Changes</h3>
            <p className="mt-1 text-sm text-slate-500">
              Be specific — the more detail you provide, the better the revised proposal.
            </p>
          </div>
          <div className="space-y-4 p-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Reason for change
              </label>
              <select
                value={feedbackReason}
                onChange={(e) => setFeedbackReason(e.target.value as FeedbackReason)}
                className="input-dark"
                id="feedback-reason"
              >
                {FEEDBACK_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                What specifically should change? <span className="text-brand-400">*</span>
              </label>
              <textarea
                required
                minLength={10}
                rows={3}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                className="input-dark resize-none"
                placeholder="e.g. Remove e-commerce module, reduce to 3 pages, need faster timeline..."
                id="feedback-text"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="btn-brand flex items-center gap-2"
              >
                {loading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : null}
                {loading ? "Regenerating..." : "Regenerate Proposal"}
              </button>
              <button
                type="button"
                onClick={() => setShowFeedback(false)}
                className="rounded-xl px-4 py-2 text-sm text-slate-500 transition hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ── Always-visible Return Home ── */}
      <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/2 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gradient">
            <span className="text-xs font-bold text-white">SC</span>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-brand-400">
              NITECHSPARK · Softcomerce
            </p>
            <p className="text-xs text-slate-600">AI Proposal Engine</p>
          </div>
        </div>
        <Link
          href="/"
          id="return-home-btn"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-brand-500/40 hover:text-white"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Return Home
        </Link>
      </div>
    </div>
  );
}


function ProposalDetails({
  version,
  compact,
}: {
  version: ProposalVersion;
  compact?: boolean;
}) {
  return (
    <div className={`space-y-4 ${compact ? "text-sm" : ""}`}>
      {version.timeline_estimate && (
        <div className="flex items-start gap-3">
          <span className="mt-0.5 text-lg">⏱</span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Timeline</p>
            <p className="mt-0.5 text-slate-300">{version.timeline_estimate}</p>
          </div>
        </div>
      )}

      {version.scope_breakdown && version.scope_breakdown.length > 0 && (
        <div>
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <span>📦</span> Scope Breakdown
          </p>
          <ul className="space-y-2">
            {version.scope_breakdown.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-slate-300">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {version.assumptions && (
        <div className="rounded-xl border border-white/5 bg-white/2 p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
            📌 Assumptions
          </p>
          <p className="text-sm text-slate-400">{version.assumptions}</p>
        </div>
      )}

      {version.exclusions && (
        <div className="rounded-xl border border-white/5 bg-white/2 p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
            🚫 Exclusions
          </p>
          <p className="text-sm text-slate-400">{version.exclusions}</p>
        </div>
      )}
    </div>
  );
}
