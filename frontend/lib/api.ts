import type {
  Category,
  FeedbackReason,
  RequestData,
  RequestSummary,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Request failed");
  }

  return res.json();
}

export interface StructuredRequirements {
  project_description: string;
  budget_expectation?: string;
  timeline_expectation?: string;
  must_have_features: string[];
  must_have_features_text?: string;
  web?: {
    number_of_pages?: number;
    ecommerce_needed?: boolean;
    cms_needed?: boolean;
    hosting_needed?: boolean;
    domain_ssl_needed?: boolean;
  };
  mobile?: {
    platforms: string[];
    backend_needed?: boolean;
    push_notifications?: boolean;
    payment_integration?: boolean;
  };
  custom_software?: {
    integrations: string[];
    automation_ai_features?: boolean;
    expected_user_count?: string;
    data_storage_needs?: string;
  };
}

export async function createRequest(payload: {
  category: Category;
  requirements_raw: string;
  requirements_structured: StructuredRequirements;
}): Promise<RequestData> {
  return api("/api/requests", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ── Client Auth ──

export async function clientRegister(payload: any): Promise<any> {
  return api("/api/auth/client/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function clientLogin(email: string, password: string): Promise<any> {
  return api("/api/auth/client/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function clientLogout(): Promise<void> {
  await api("/api/auth/client/logout", { method: "POST" });
}

export async function getClientMe(): Promise<any> {
  return api("/api/auth/client/me");
}

export async function getClientRequests(): Promise<RequestData[]> {
  return api("/api/requests");
}

export async function getRequest(id: number): Promise<RequestData> {
  return api(`/api/requests/${id}`);
}

export async function submitFeedback(
  id: number,
  feedback_reason: FeedbackReason,
  feedback_text: string
): Promise<RequestData> {
  return api(`/api/requests/${id}/feedback`, {
    method: "POST",
    body: JSON.stringify({ feedback_reason, feedback_text }),
  });
}

export async function confirmRequest(id: number): Promise<RequestData> {
  return api(`/api/requests/${id}/confirm`, {
    method: "POST",
    body: JSON.stringify({ confirmed: true }),
  });
}

export async function adminLogin(username: string, password: string): Promise<void> {
  await api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function adminLogout(): Promise<void> {
  await api("/api/auth/logout", { method: "POST" });
}

export async function getAdminRequests(params?: {
  category?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
}): Promise<RequestSummary[]> {
  const qs = new URLSearchParams();
  if (params?.category) qs.set("category", params.category);
  if (params?.status) qs.set("status", params.status);
  if (params?.date_from) qs.set("date_from", params.date_from);
  if (params?.date_to) qs.set("date_to", params.date_to);
  const query = qs.toString();
  return api(`/api/admin/requests${query ? `?${query}` : ""}`);
}

export async function getAdminRequest(id: number): Promise<RequestData> {
  return api(`/api/admin/requests/${id}`);
}

export async function deleteClient(id: number): Promise<void> {
  await api(`/api/admin/clients/${id}`, { method: "DELETE" });
}

export async function markNeedsReview(id: number): Promise<void> {
  await api(`/api/admin/requests/${id}/mark-needs-review`, { method: "POST" });
}

export function pdfExportUrl(id: number): string {
  return `${API_BASE}/api/admin/requests/${id}/export-pdf`;
}

export async function requestDemo(payload: {
  name: string;
  email: string;
  contact: string;
  product_name: string;
  meeting_time: string;
}): Promise<any> {
  return api("/api/demo-request", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
