import { AppError } from "./errors.ts";
import type { Dashboard, Expense, ProjectCode, Sale } from "./types.ts";

export const money = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export function validateReference(ref: string, kind: "sale" | "expense") {
  const normalized = ref.trim().toUpperCase();
  const expected = kind === "sale" ? /^S\d{2,}$/ : /^E\d{2,}$/;
  if (!expected.test(normalized)) throw new AppError(`Reference must look like ${kind === "sale" ? "S01" : "E01"}.`);
  return normalized;
}

export function validateAmount(value: number) {
  if (!Number.isFinite(value) || value <= 0) throw new AppError("Amount must be greater than zero.");
  return money(value);
}

export function validateSplit(values: [number, number, number]) {
  if (values.some((value) => !Number.isFinite(value) || value < 0 || value > 100)) {
    throw new AppError("Each commission share must be between 0% and 100%.");
  }
  if (money(values.reduce((sum, value) => sum + value, 0)) !== 100) {
    throw new AppError("Commission shares must total exactly 100%.");
  }
  return values;
}

export function calculateCommission(amount: number, split: [number, number, number]) {
  validateAmount(amount);
  validateSplit(split);
  const pool = money(amount * 0.1);
  const amounts = split.map((pct) => money((pool * pct) / 100)) as [number, number, number];
  const difference = money(pool - amounts.reduce((sum, value) => sum + value, 0));
  if (difference !== 0) {
    const largest = Math.max(...split);
    const recipient = split.findIndex((value) => value === largest);
    amounts[recipient] = money(amounts[recipient] + difference);
  }
  return { pool, amounts };
}

function projectSummary(project: ProjectCode, sales: Sale[], expenses: Expense[]) {
  const approved = sales.filter((sale) => sale.status === "approved" && sale.project === project);
  const income = money(approved.reduce((sum, sale) => sum + sale.amount, 0));
  const commission = money(approved.reduce((sum, sale) => sum + sale.commission_pool, 0));
  const allocated = money(
    expenses
      .filter((expense) => expense.status === "allocated" && expense.final_allocation === project)
      .reduce((sum, expense) => sum + expense.amount, 0),
  );
  return { income, commission, expenses: allocated, result: money(income - commission - allocated) };
}

export function calculateDashboard(sales: Sale[], expenses: Expense[]): Dashboard {
  const projectA = projectSummary("A", sales, expenses);
  const projectB = projectSummary("B", sales, expenses);
  const approved = sales.filter((sale) => sale.status === "approved");
  const income = money(approved.reduce((sum, sale) => sum + sale.amount, 0));
  const commission = money(approved.reduce((sum, sale) => sum + sale.commission_pool, 0));
  const expenseTotal = money(expenses.reduce((sum, expense) => sum + expense.amount, 0));
  const overhead = money(
    expenses.filter((expense) => expense.final_allocation === "OVERHEAD").reduce((sum, expense) => sum + expense.amount, 0),
  );
  const awaiting = money(
    expenses.filter((expense) => expense.status === "awaiting_allocation").reduce((sum, expense) => sum + expense.amount, 0),
  );
  const richard = money(approved.reduce((sum, sale) => sum + sale.commission_richard, 0));
  const anastasia = money(approved.reduce((sum, sale) => sum + sale.commission_anastasia, 0));
  const jeanClaude = money(approved.reduce((sum, sale) => sum + sale.commission_jean_claude, 0));
  return {
    projectA,
    projectB,
    company: {
      income,
      commission,
      expenses: expenseTotal,
      overhead,
      awaiting,
      result: money(income - commission - expenseTotal),
    },
    commissions: { richard, anastasia, jeanClaude, total: money(richard + anastasia + jeanClaude) },
  };
}
