export type EntryType = "expense" | "income";

export type PaymentMethod = "cash" | "bank" | "card" | "online";

export type Severity = "low" | "medium" | "high";

export interface Entry {
  id: string;
  entry_type: EntryType;
  category: string;
  amount: number;
  description: string;
  entry_date: string;
  payment_method: PaymentMethod;
  source: "manual" | "ai";
  created_at: string;
  updated_at: string;
}

export interface EntryCreate {
  entry_type: EntryType;
  category: string;
  amount: number;
  description: string;
  entry_date: string;
  payment_method: PaymentMethod;
}

export interface EntryUpdate {
  entry_type?: EntryType;
  category?: string;
  amount?: number;
  description?: string;
  entry_date?: string;
  payment_method?: PaymentMethod;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export interface PLStatement {
  total_income: number;
  total_expenses: number;
  net_profit: number;
  income_by_category: CategoryBreakdown[];
  expense_by_category: CategoryBreakdown[];
  period: { start: string; end: string };
}

export interface MonthlyNet {
  month: string;
  income: number;
  expense: number;
}

export interface CategoryBreakdown {
  category: string;
  total: number;
  count: number;
}

export interface BalanceSheet {
  cash_position: number;
  total_income: number;
  total_expenses: number;
  as_of: string;
  note: string;
}

export interface SeveritySummary {
  high: number;
  medium: number;
  low: number;
}

export interface AuditFlag {
  id: string;
  entry_id: string;
  flag_reason: string;
  severity: Severity;
  category: string;
  created_at: string;
}

export interface AuditReport {
  period: string;
  total_entries_checked: number;
  flags: AuditFlag[];
  summary: SeveritySummary;
}

export interface DashboardSummary {
  total_income: number;
  total_expenses: number;
  net_cash: number;
  entry_count: number;
  recent_entries: Entry[];
  income_by_category: CategoryBreakdown[];
  expense_by_category: CategoryBreakdown[];
  monthly_net: MonthlyNet[];
}

export interface ChatMessage {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}

export interface ChatRequest {
  message: string;
}

export interface ChatResponse {
  reply: string;
  message_id: number;
}
