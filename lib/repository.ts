import { AppError } from "@/lib/errors";
import { getSupabase } from "@/lib/supabase";
import type { Employee, Expense, Sale } from "@/lib/types";

function fail(error: { message: string } | null) {
  if (!error) return;
  if (error.message.toLowerCase().includes("duplicate")) throw new AppError("This reference already exists.", 409);
  throw new AppError(error.message, 500);
}

export async function listAll() {
  const db = getSupabase();
  const [employees, sales, expenses] = await Promise.all([
    db.from("employees").select("*").order("display_name"),
    db.from("sales").select("*").order("submitted_at", { ascending: false }),
    db.from("expenses").select("*").order("submitted_at", { ascending: false }),
  ]);
  fail(employees.error); fail(sales.error); fail(expenses.error);
  return {
    employees: (employees.data ?? []) as Employee[],
    sales: (sales.data ?? []).map(numericSale) as Sale[],
    expenses: (expenses.data ?? []).map(numericExpense) as Expense[],
  };
}

const numericSale = (row: Record<string, unknown>) => ({
  ...row,
  amount: Number(row.amount), commission_pool: Number(row.commission_pool),
  commission_richard: Number(row.commission_richard), commission_anastasia: Number(row.commission_anastasia),
  commission_jean_claude: Number(row.commission_jean_claude),
  proposed_richard_pct: Number(row.proposed_richard_pct), proposed_anastasia_pct: Number(row.proposed_anastasia_pct),
  proposed_jean_claude_pct: Number(row.proposed_jean_claude_pct),
  approved_richard_pct: row.approved_richard_pct == null ? null : Number(row.approved_richard_pct),
  approved_anastasia_pct: row.approved_anastasia_pct == null ? null : Number(row.approved_anastasia_pct),
  approved_jean_claude_pct: row.approved_jean_claude_pct == null ? null : Number(row.approved_jean_claude_pct),
});

const numericExpense = (row: Record<string, unknown>) => ({ ...row, amount: Number(row.amount) });

export async function employeeById(id: string) {
  const { data, error } = await getSupabase().from("employees").select("*").eq("id", id).maybeSingle();
  fail(error); if (!data) throw new AppError("Employee not found.", 404); return data as Employee;
}

export async function employeeByTelegramUser(userId: number) {
  const { data, error } = await getSupabase().from("employees").select("*").eq("telegram_user_id", userId).maybeSingle();
  fail(error); return data as Employee | null;
}

export async function insertSale(row: Omit<Sale, "submitted_at" | "approved_at">) {
  const { data, error } = await getSupabase().from("sales").insert(row).select("*").single();
  fail(error); return numericSale(data) as Sale;
}

export async function insertExpense(row: Omit<Expense, "submitted_at" | "approved_at">) {
  const { data, error } = await getSupabase().from("expenses").insert(row).select("*").single();
  fail(error); return numericExpense(data) as Expense;
}

export async function saleByRef(ref: string) {
  const { data, error } = await getSupabase().from("sales").select("*").eq("ref", ref).maybeSingle();
  fail(error); if (!data) throw new AppError("Sale not found.", 404); return numericSale(data) as Sale;
}

export async function expenseByRef(ref: string) {
  const { data, error } = await getSupabase().from("expenses").select("*").eq("ref", ref).maybeSingle();
  fail(error); if (!data) throw new AppError("Expense not found.", 404); return numericExpense(data) as Expense;
}

export async function updateSale(ref: string, patch: Partial<Sale>) {
  const { data, error } = await getSupabase().from("sales").update(patch).eq("ref", ref).select("*").single();
  fail(error); return numericSale(data) as Sale;
}

export async function updateExpense(ref: string, patch: Partial<Expense>) {
  const { data, error } = await getSupabase().from("expenses").update(patch).eq("ref", ref).select("*").single();
  fail(error); return numericExpense(data) as Expense;
}

export async function linkTelegram(employeeId: string, telegramUserId: number, telegramChatId: number) {
  const { data, error } = await getSupabase().from("employees")
    .update({ telegram_user_id: telegramUserId, telegram_chat_id: telegramChatId }).eq("id", employeeId).select("*").single();
  fail(error); return data as Employee;
}
