import { AppError } from "./errors.ts";
import type { Employee, Expense, Sale } from "./types.ts";

type Records = { employees: Employee[]; sales: Sale[]; expenses: Expense[] };

/**
 * Apply record-level access before data leaves the server. Dashboard totals are
 * calculated separately from the complete ledger and contain no record detail.
 */
export function recordsForActor(data: Records, actorId: string): Records {
  const actor = data.employees.find((employee) => employee.id === actorId);
  if (!actor) throw new AppError("Employee not found.", 404);

  const sales = actor.role === "manager"
    ? data.sales
    : actor.role === "sales" ? data.sales.filter((sale) => sale.salesperson_id === actor.id) : [];
  const expenses = actor.role === "manager"
    ? data.expenses
    : actor.role === "expense" ? data.expenses.filter((expense) => expense.reporter_id === actor.id) : [];

  return {
    employees: data.employees.map((employee) => ({
      ...employee,
      telegram_user_id: null,
      telegram_chat_id: null,
    })),
    sales: sales.map((sale) => ({ ...sale, telegram_chat_id: null })),
    expenses: expenses.map((expense) => ({ ...expense, telegram_chat_id: null })),
  };
}
