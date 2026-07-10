"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminLogout, getAdminRequests, deleteClient } from "@/lib/api";
import Logo from "@/components/Logo";
import {
  CATEGORY_LABELS,
  formatINR,
  type Category,
  type RequestStatus,
  type RequestSummary,
} from "@/lib/types";

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

function getCategoryIcon(category: string) {
  const icons: Record<string, string> = {
    web: "🌐",
    mobile: "📱",
    custom_software: "⚙️",
  };
  return icons[category] || "💼";
}

// ── Stat Card ──────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  color,
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  icon: string;
}) {
  return (
    <div className="glass flex items-start gap-4 p-5 transition hover:border-white/10">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${color}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
          {label}
        </p>
        <p className="mt-1 font-display text-2xl font-bold text-white">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<RequestSummary[]>([]);
  const [allRequests, setAllRequests] = useState<RequestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  async function load(filtered = false) {
    setLoading(true);
    try {
      const [data, all] = await Promise.all([
        getAdminRequests({
          category: category || undefined,
          status: status || undefined,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
        }),
        filtered ? Promise.resolve(allRequests) : getAdminRequests({}),
      ]);
      setRequests(data);
      if (!filtered) setAllRequests(all);
      setError("");
    } catch (err) {
      if (err instanceof Error && err.message.includes("authenticated")) {
        router.push("/admin/login");
        return;
      }
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogout() {
    await adminLogout();
    router.push("/admin/login");
  }

  async function handleDeleteClient(clientId: number, clientName: string) {
    if (!window.confirm(`Are you sure you want to delete ${clientName} and ALL their proposals? This cannot be undone.`)) {
      return;
    }
    try {
      setLoading(true);
      await deleteClient(clientId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete client");
      setLoading(false);
    }
  }

  // ── Derived stats ──────────────────────────────────────────────────────────
  const stats = {
    total: allRequests.length,
    pending: allRequests.filter((r) => r.status === "pending").length,
    confirmed: allRequests.filter((r) => r.status === "confirmed").length,
    needs_review: allRequests.filter((r) => r.status === "needs_human_review").length,
    revenue_min: allRequests
      .filter((r) => r.status === "confirmed" && r.latest_budget_min != null)
      .reduce((acc, r) => acc + (r.latest_budget_min ?? 0), 0),
    revenue_max: allRequests
      .filter((r) => r.status === "confirmed" && r.latest_budget_max != null)
      .reduce((acc, r) => acc + (r.latest_budget_max ?? 0), 0),
  };

  return (
    <div className="min-h-screen hero-gradient">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-dark-900/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Logo className="h-9 w-9" />
            <div>
              <h1 className="text-base font-bold leading-tight text-white mt-1.5">Admin Dashboard</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-emerald-400">Live</span>
            </div>
            <Link href="/" className="text-sm font-medium text-slate-400 transition hover:text-brand-400">
              Public site
            </Link>
            <button
              onClick={handleLogout}
              className="rounded-lg bg-white/5 px-3 py-1.5 text-sm font-medium text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">

        {/* ── Stats Cards ── */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            label="Total Requests"
            value={stats.total}
            sub="All time"
            icon="📊"
            color="bg-brand-500/10"
          />
          <StatCard
            label="Pending"
            value={stats.pending}
            sub="Awaiting decision"
            icon="⏳"
            color="bg-amber-500/10"
          />
          <StatCard
            label="Confirmed"
            value={stats.confirmed}
            sub="Won projects"
            icon="✅"
            color="bg-emerald-500/10"
          />
          <StatCard
            label="Needs Review"
            value={stats.needs_review}
            sub="Action required"
            icon="⚠️"
            color="bg-red-500/10"
          />
          <StatCard
            label="Pipeline Value"
            value={stats.revenue_min > 0 ? formatINR(stats.revenue_min) : "—"}
            sub={stats.revenue_max > 0 ? `up to ${formatINR(stats.revenue_max)}` : "No confirmed yet"}
            icon="💰"
            color="bg-purple-500/10"
          />
        </div>

        {/* ── Filters ── */}
        <div className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-white/5 bg-dark-800/50 p-4 backdrop-blur-md">
          <FilterSelect
            label="Category"
            value={category}
            onChange={setCategory}
            options={[
              { value: "", label: "All Categories" },
              { value: "web", label: "🌐 Web" },
              { value: "mobile", label: "📱 Mobile" },
              { value: "custom_software", label: "⚙️ Custom Software" },
            ]}
          />
          <FilterSelect
            label="Status"
            value={status}
            onChange={setStatus}
            options={[
              { value: "", label: "All Statuses" },
              { value: "pending", label: "⏳ Pending" },
              { value: "confirmed", label: "✅ Confirmed" },
              { value: "needs_human_review", label: "⚠️ Needs Review" },
              { value: "abandoned", label: "🚫 Abandoned" },
            ]}
          />
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="input-dark py-1.5"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="input-dark py-1.5"
            />
          </div>
          <button
            onClick={() => load(true)}
            className="btn-brand py-1.5 px-5 text-sm font-medium"
          >
            Apply Filters
          </button>
          {(category || status || dateFrom || dateTo) && (
            <button
              onClick={() => {
                setCategory(""); setStatus(""); setDateFrom(""); setDateTo("");
                setTimeout(() => load(), 0);
              }}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-slate-400 transition hover:text-white"
            >
              Clear
            </button>
          )}
          <div className="ml-auto text-xs text-slate-500">
            {requests.length} result{requests.length !== 1 ? "s" : ""}
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* ── Table ── */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500/30 border-t-brand-500" />
          </div>
        ) : requests.length === 0 ? (
          <div className="glass flex flex-col items-center justify-center p-12 text-center">
            <span className="mb-3 text-4xl">📭</span>
            <p className="text-slate-400">No requests found matching your filters.</p>
          </div>
        ) : (
          <div className="glass overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/5 bg-dark-900/50">
                  <tr>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">ID</th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Client</th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Contact</th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Category</th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Budget</th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Versions</th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Date</th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {requests.map((r) => (
                    <tr key={r.id} className="group transition hover:bg-white/2">
                      {/* ID */}
                      <td className="px-5 py-4">
                        <Link
                          href={`/admin/requests/${r.id}`}
                          className="font-bold text-brand-400 transition hover:text-brand-300"
                        >
                          #{r.id}
                        </Link>
                      </td>

                      {/* Client name + company */}
                      <td className="px-5 py-4">
                        <Link href={`/admin/requests/${r.id}`} className="block hover:opacity-80">
                          <p className="font-semibold text-white">{r.client_name}</p>
                          {r.client_company && (
                            <p className="text-xs text-slate-500">{r.client_company}</p>
                          )}
                        </Link>
                      </td>

                      {/* Contact details — email + phone */}
                      <td className="px-5 py-4">
                        <a
                          href={`mailto:${r.client_email}`}
                          className="flex items-center gap-1.5 text-xs text-slate-400 transition hover:text-brand-400"
                          title={`Email ${r.client_name}`}
                        >
                          <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span className="max-w-[160px] truncate">{r.client_email}</span>
                        </a>
                        {"client_phone" in r && r.client_phone ? (
                          <a
                            href={`tel:${r.client_phone}`}
                            className="mt-1 flex items-center gap-1.5 text-xs text-slate-400 transition hover:text-emerald-400"
                            title={`Call ${r.client_name}`}
                          >
                            <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {String((r as Record<string, unknown>).client_phone)}
                          </a>
                        ) : (
                          <p className="mt-1 text-xs text-slate-600">No phone</p>
                        )}
                      </td>

                      {/* Category */}
                      <td className="px-5 py-4">
                        <span className="flex items-center gap-1.5 text-slate-300">
                          <span>{getCategoryIcon(r.category)}</span>
                          <span className="hidden xl:inline">{CATEGORY_LABELS[r.category as Category]}</span>
                          <span className="xl:hidden">{r.category.replace("_", " ")}</span>
                        </span>
                      </td>

                      {/* Budget */}
                      <td className="px-5 py-4">
                        {r.latest_budget_min != null && r.latest_budget_max != null ? (
                          <div>
                            <p className="font-semibold text-white">
                              {formatINR(r.latest_budget_min)}
                            </p>
                            <p className="text-xs text-slate-500">
                              – {formatINR(r.latest_budget_max)}
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Versions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4].map((v) => (
                              <div
                                key={v}
                                className={`h-1.5 w-5 rounded-full transition ${
                                  v <= r.version_count
                                    ? r.status === "confirmed"
                                      ? "bg-emerald-500"
                                      : r.status === "needs_human_review"
                                      ? "bg-red-500"
                                      : "bg-brand-500"
                                    : "bg-white/10"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-slate-500">{r.version_count}/4</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${getStatusBadgeClasses(
                            r.status as RequestStatus
                          )}`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {getStatusLabel(r.status as RequestStatus)}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4 text-xs text-slate-400">
                        <p>{new Date(r.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</p>
                        <p className="text-slate-600">{new Date(r.created_at).getFullYear()}</p>
                      </td>

                      {/* Quick actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 opacity-0 transition group-hover:opacity-100">
                          <Link
                            href={`/admin/requests/${r.id}`}
                            className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-300 transition hover:border-brand-500/40 hover:text-white"
                            title="View details"
                          >
                            View
                          </Link>
                          <a
                            href={`mailto:${r.client_email}?subject=Re: Your ${r.category.replace("_"," ")} proposal`}
                            className="rounded-lg border border-brand-500/20 bg-brand-500/10 px-2.5 py-1 text-xs font-medium text-brand-400 transition hover:bg-brand-500/20"
                            title="Email client"
                          >
                            Email
                          </a>
                          <button
                            onClick={() => handleDeleteClient(r.client_id, r.client_name)}
                            className="rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400 transition hover:bg-red-500/20"
                            title="Delete Client"
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate-400">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-dark py-1.5 min-w-[160px]"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
