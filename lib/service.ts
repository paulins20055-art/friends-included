import { calculateCommission, validateAmount, validateReference, validateSplit } from "@/lib/business";
import { AppError, messageOf } from "@/lib/errors";
import { syncExpense, syncSale } from "@/lib/google-sheets";
import * as repo from "@/lib/repository";
import { sendTelegram } from "@/lib/telegram";
import type { Expense, ExpenseAllocation, ProjectCode, Sale } from "@/lib/types";

const required = (value: unknown, label: string) => {
  const text = String(value ?? "").trim();
  if (!text) throw new AppError(`${label} is required.`);
  return text;
};

const oneOf = <T extends string>(value: unknown, values: readonly T[], label: string): T => {
  const text = required(value, label) as T;
  if (!values.includes(text)) throw new AppError(`${label} is not valid.`);
  return text;
};

async function syncCreatedSale(sale: Sale) {
  try { await syncSale(sale); return await repo.updateSale(sale.ref, { sheet_sync_status: "synced", sheet_sync_error: null }); }
  catch (error) { return repo.updateSale(sale.ref, { sheet_sync_status: "failed", sheet_sync_error: messageOf(error) }); }
}

async function syncCreatedExpense(expense: Expense) {
  try { await syncExpense(expense); return await repo.updateExpense(expense.ref, { sheet_sync_status: "synced", sheet_sync_error: null }); }
  catch (error) { return repo.updateExpense(expense.ref, { sheet_sync_status: "failed", sheet_sync_error: messageOf(error) }); }
}

export async function submitSale(input: Record<string, unknown>, actorId: string, telegramChatId: number | null = null) {
  const actor = await repo.employeeById(actorId);
  if (actor.role !== "sales") throw new AppError("Only a salesperson can submit a sale.", 403);
  const split = validateSplit([Number(input.richardPct), Number(input.anastasiaPct), Number(input.jeanClaudePct)]);
  const sale = await repo.insertSale({
    ref: validateReference(required(input.ref, "Reference"), "sale"), salesperson_id: actor.id,
    telegram_chat_id: telegramChatId ?? actor.telegram_chat_id,
    customer: required(input.customer, "Customer"), project: oneOf(input.project, ["A", "B"] as const, "Project") as ProjectCode,
    description: required(input.description, "Description"), amount: validateAmount(Number(input.amount)),
    proposed_richard_pct: split[0], proposed_anastasia_pct: split[1], proposed_jean_claude_pct: split[2],
    approved_richard_pct: null, approved_anastasia_pct: null, approved_jean_claude_pct: null,
    commission_pool: 0, commission_richard: 0, commission_anastasia: 0, commission_jean_claude: 0,
    status: "pending", sheet_sync_status: "pending", sheet_sync_error: null,
    notification_status: telegramChatId ?? actor.telegram_chat_id ? "pending" : "not_required", notification_error: null,
  });
  let synced = await syncCreatedSale(sale);
  if (synced.telegram_chat_id) {
    try { await sendTelegram(synced.telegram_chat_id, `Sale ${synced.ref} recorded — €${synced.amount.toFixed(2)}, project ${synced.project}, Pending approval.`); synced = await repo.updateSale(synced.ref, { notification_status: "sent", notification_error: null }); }
    catch (error) { synced = await repo.updateSale(synced.ref, { notification_status: "failed", notification_error: messageOf(error) }); }
  }
  return synced;
}

export async function submitExpense(input: Record<string, unknown>, actorId: string, telegramChatId: number | null = null) {
  const actor = await repo.employeeById(actorId);
  if (actor.role !== "expense") throw new AppError("Only the expense reporter can submit an expense.", 403);
  const proposed = oneOf(input.allocation, ["A", "B", "OVERHEAD"] as const, "Allocation") as ExpenseAllocation;
  const overhead = proposed === "OVERHEAD";
  const expense = await repo.insertExpense({
    ref: validateReference(required(input.ref, "Reference"), "expense"), reporter_id: actor.id,
    telegram_chat_id: telegramChatId ?? actor.telegram_chat_id, description: required(input.description, "Description"),
    category: oneOf(input.category, ["Materials", "Travel", "Other"] as const, "Category") as Expense["category"], amount: validateAmount(Number(input.amount)),
    proposed_allocation: proposed, final_allocation: overhead ? "OVERHEAD" : null,
    status: overhead ? "allocated" : "awaiting_allocation", sheet_sync_status: "pending", sheet_sync_error: null,
    notification_status: telegramChatId ?? actor.telegram_chat_id ? "pending" : "not_required", notification_error: null,
  });
  let synced = await syncCreatedExpense(expense);
  if (synced.telegram_chat_id) {
    try { await sendTelegram(synced.telegram_chat_id, `Expense ${synced.ref} recorded — €${synced.amount.toFixed(2)}, proposed ${synced.proposed_allocation}, ${synced.status}.`); synced = await repo.updateExpense(synced.ref, { notification_status: "sent", notification_error: null }); }
    catch (error) { synced = await repo.updateExpense(synced.ref, { notification_status: "failed", notification_error: messageOf(error) }); }
  }
  return synced;
}

export async function approveSale(ref: string, actorId: string, split: [number, number, number]) {
  const actor = await repo.employeeById(actorId);
  if (actor.role !== "manager") throw new AppError("Only the manager can approve sales.", 403);
  const sale = await repo.saleByRef(ref);
  if (sale.status === "approved") throw new AppError("This sale is already approved.", 409);
  validateSplit(split);
  const commission = calculateCommission(sale.amount, split);
  let updated = await repo.updateSale(ref, {
    approved_richard_pct: split[0], approved_anastasia_pct: split[1], approved_jean_claude_pct: split[2],
    commission_pool: commission.pool, commission_richard: commission.amounts[0],
    commission_anastasia: commission.amounts[1], commission_jean_claude: commission.amounts[2],
    status: "approved", approved_at: new Date().toISOString(), sheet_sync_status: "pending",
    notification_status: sale.telegram_chat_id ? "pending" : "not_required",
  });
  updated = await syncCreatedSale(updated);
  if (updated.telegram_chat_id) {
    const changed = split.some((value, index) => value !== [sale.proposed_richard_pct, sale.proposed_anastasia_pct, sale.proposed_jean_claude_pct][index]);
    const text = `Sale ${updated.ref} approved${changed ? " — commission split changed" : ""}. Sale €${updated.amount.toFixed(2)}; total commission €${commission.pool.toFixed(2)}. Richard: ${split[0]}% (€${commission.amounts[0].toFixed(2)}). Anastasia: ${split[1]}% (€${commission.amounts[1].toFixed(2)}). Jean-Claude: ${split[2]}% (€${commission.amounts[2].toFixed(2)}).`;
    try { await sendTelegram(updated.telegram_chat_id, text); updated = await repo.updateSale(ref, { notification_status: "sent", notification_error: null }); }
    catch (error) { updated = await repo.updateSale(ref, { notification_status: "failed", notification_error: messageOf(error) }); }
  }
  return updated;
}

export async function allocateExpense(ref: string, actorId: string, allocation: ExpenseAllocation) {
  const actor = await repo.employeeById(actorId);
  if (actor.role !== "manager") throw new AppError("Only the manager can allocate expenses.", 403);
  const expense = await repo.expenseByRef(ref);
  if (expense.status === "allocated") throw new AppError("This expense is already allocated.", 409);
  let updated = await repo.updateExpense(ref, {
    final_allocation: allocation, status: "allocated", approved_at: new Date().toISOString(), sheet_sync_status: "pending",
    notification_status: expense.telegram_chat_id ? "pending" : "not_required",
  });
  updated = await syncCreatedExpense(updated);
  if (updated.telegram_chat_id) {
    const changed = allocation !== expense.proposed_allocation;
    const text = `Expense ${updated.ref}${changed ? " — allocation changed" : ""}. €${updated.amount.toFixed(2)}: ${updated.description}. Proposed: ${expense.proposed_allocation}. Approved: ${allocation}.`;
    try { await sendTelegram(updated.telegram_chat_id, text); updated = await repo.updateExpense(ref, { notification_status: "sent", notification_error: null }); }
    catch (error) { updated = await repo.updateExpense(ref, { notification_status: "failed", notification_error: messageOf(error) }); }
  }
  return updated;
}

export async function retrySaleSync(ref: string, actorId: string) {
  const actor = await repo.employeeById(actorId);
  if (actor.role !== "manager") throw new AppError("Only the manager can retry synchronization.", 403);
  return syncCreatedSale(await repo.saleByRef(ref));
}

export async function retryExpenseSync(ref: string, actorId: string) {
  const actor = await repo.employeeById(actorId);
  if (actor.role !== "manager") throw new AppError("Only the manager can retry synchronization.", 403);
  return syncCreatedExpense(await repo.expenseByRef(ref));
}
