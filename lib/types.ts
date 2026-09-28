export type Role = "manager" | "sales" | "expense";
export type ProjectCode = "A" | "B";
export type ExpenseAllocation = ProjectCode | "OVERHEAD";
export type SyncStatus = "pending" | "synced" | "failed";
export type NotificationStatus = "not_required" | "pending" | "sent" | "failed";

export type Employee = {
  id: string;
  display_name: string;
  role: Role;
  telegram_user_id: number | null;
  telegram_chat_id: number | null;
};

export type Sale = {
  ref: string;
  submitted_at: string;
  salesperson_id: string;
  telegram_chat_id: number | null;
  customer: string;
  project: ProjectCode;
  description: string;
  amount: number;
  proposed_richard_pct: number;
  proposed_anastasia_pct: number;
  proposed_jean_claude_pct: number;
  approved_richard_pct: number | null;
  approved_anastasia_pct: number | null;
  approved_jean_claude_pct: number | null;
  commission_pool: number;
  commission_richard: number;
  commission_anastasia: number;
  commission_jean_claude: number;
  status: "pending" | "approved";
  sheet_sync_status: SyncStatus;
  sheet_sync_error: string | null;
  notification_status: NotificationStatus;
  notification_error: string | null;
  approved_at: string | null;
};

export type Expense = {
  ref: string;
  submitted_at: string;
  reporter_id: string;
  telegram_chat_id: number | null;
  description: string;
  category: "Materials" | "Travel" | "Other";
  amount: number;
  proposed_allocation: ExpenseAllocation;
  final_allocation: ExpenseAllocation | null;
  status: "awaiting_allocation" | "allocated";
  sheet_sync_status: SyncStatus;
  sheet_sync_error: string | null;
  notification_status: NotificationStatus;
  notification_error: string | null;
  approved_at: string | null;
};

export type Dashboard = {
  projectA: { income: number; commission: number; expenses: number; result: number };
  projectB: { income: number; commission: number; expenses: number; result: number };
  company: { income: number; commission: number; expenses: number; overhead: number; awaiting: number; result: number };
  commissions: { richard: number; anastasia: number; jeanClaude: number; total: number };
};

export type AppState = {
  employees: Employee[];
  sales: Sale[];
  expenses: Expense[];
  dashboard: Dashboard;
};
