export type Category = "web" | "mobile" | "custom_software";
export type RequestStatus = "pending" | "confirmed" | "needs_human_review" | "abandoned";
export type FeedbackReason =
  | "budget_too_high"
  | "need_more_features"
  | "wrong_timeline"
  | "scope_incorrect"
  | "other";

export interface ProposalVersion {
  id: number;
  version_number: number;
  scope_breakdown: string[] | null;
  budget_min: number | null;
  budget_max: number | null;
  timeline_estimate: string | null;
  assumptions: string | null;
  exclusions: string | null;
  client_feedback: string | null;
  created_at: string;
}

export interface Client {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
}

export interface RequestData {
  id: number;
  category: Category;
  requirements_raw: string;
  requirements_structured: Record<string, unknown> | null;
  status: RequestStatus;
  created_at: string;
  client: Client;
  proposal_versions: ProposalVersion[];
  versions_remaining: number;
  can_regenerate: boolean;
  locked_message: string | null;
}

export interface RequestSummary {
  id: number;
  category: Category;
  status: RequestStatus;
  created_at: string;
  client_id: number;
  client_name: string;
  client_email: string;
  client_company: string | null;
  latest_budget_min: number | null;
  latest_budget_max: number | null;
  version_count: number;
}

export const CATEGORY_LABELS: Record<Category, string> = {
  web: "Web Development",
  mobile: "Mobile App Development",
  custom_software: "Custom Software Development",
};

export const FEEDBACK_REASONS: { value: FeedbackReason; label: string }[] = [
  { value: "budget_too_high", label: "Budget too high" },
  { value: "need_more_features", label: "Need more features" },
  { value: "wrong_timeline", label: "Timeline doesn't work" },
  { value: "scope_incorrect", label: "Scope is incorrect" },
  { value: "other", label: "Other" },
];

export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function statusBadge(status: RequestStatus): string {
  const map: Record<RequestStatus, string> = {
    pending: "bg-amber-100 text-amber-800",
    confirmed: "bg-green-100 text-green-800",
    needs_human_review: "bg-red-100 text-red-800",
    abandoned: "bg-slate-100 text-slate-600",
  };
  return map[status] || "bg-slate-100 text-slate-600";
}

export function statusLabel(status: RequestStatus): string {
  const map: Record<RequestStatus, string> = {
    pending: "Pending",
    confirmed: "Confirmed",
    needs_human_review: "Needs Review",
    abandoned: "Abandoned",
  };
  return map[status] || status;
}
