import type {
  Entry, EntryCreate, EntryUpdate,
  AuthResponse, User,
  PLStatement, BalanceSheet, AuditReport, DashboardSummary,
  ChatRequest, ChatResponse, ChatMessage,
} from "@/types";

const API_BASE = "http://localhost:8000/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

// Auth
export const auth = {
  signup: (data: { name: string; email: string; password: string }) =>
    request<AuthResponse>("/auth/signup", { method: "POST", body: JSON.stringify(data) }),
  login: (data: { email: string; password: string }) =>
    request<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  me: () => request<User>("/auth/me"),
};

interface EntryListResponse {
  items: Entry[];
  total: number;
  page: number;
  page_size: number;
}

// Entries
export const entries = {
  list: (params?: { type?: string; category?: string; start?: string; end?: string }) => {
    const q = new URLSearchParams();
    if (params?.type) q.set("entry_type", params.type);
    if (params?.category) q.set("category", params.category);
    if (params?.start) q.set("start_date", params.start);
    if (params?.end) q.set("end_date", params.end);
    const qs = q.toString();
    return request<EntryListResponse>(`/entries${qs ? "?" + qs : ""}`).then((r) => r.items);
  },
  get: (id: string) => request<Entry>(`/entries/${id}`),
  create: (data: EntryCreate) =>
    request<Entry>("/entries", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: EntryUpdate) =>
    request<Entry>(`/entries/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<void>(`/entries/${id}`, { method: "DELETE" }),
};

// Reports
export const reports = {
  pl: (start?: string, end?: string) => {
    const q = new URLSearchParams();
    if (start) q.set("start_date", start);
    if (end) q.set("end_date", end);
    const qs = q.toString();
    return request<PLStatement>(`/reports/pl${qs ? "?" + qs : ""}`);
  },
  balanceSheet: () => request<BalanceSheet>("/reports/balance-sheet"),
  audit: (month?: string) => {
    const q = month ? `?month=${month}` : "";
    return request<AuditReport>(`/reports/audit${q}`, { method: "POST" });
  },
  dashboard: () => request<DashboardSummary>("/reports/dashboard"),
};

// Chat
export const chat = {
  send: (data: ChatRequest) =>
    request<ChatResponse>("/chat", { method: "POST", body: JSON.stringify(data) }),
  history: () => request<ChatMessage[]>("/chat/history"),
};

// Categories
export const categories = async () => {
  const res = await request<{ categories: string[] }>("/categories");
  return res.categories;
};
