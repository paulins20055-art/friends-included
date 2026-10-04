import assert from "node:assert/strict";
import test from "node:test";
import { recordsForActor } from "./access.ts";
import { demoEmployees, demoExpenses, demoSales } from "./demo.ts";

test("manager receives every ledger record without Telegram identifiers", () => {
  const result = recordsForActor({ employees: demoEmployees, sales: demoSales, expenses: demoExpenses }, "svetlana");
  assert.equal(result.sales.length, demoSales.length);
  assert.equal(result.expenses.length, demoExpenses.length);
  assert.ok(result.employees.every((employee) => employee.telegram_user_id === null && employee.telegram_chat_id === null));
});

test("sales employee receives only their own sales and no expenses", () => {
  const result = recordsForActor({ employees: demoEmployees, sales: demoSales, expenses: demoExpenses }, "richard");
  assert.ok(result.sales.length > 0);
  assert.ok(result.sales.every((sale) => sale.salesperson_id === "richard"));
  assert.deepEqual(result.expenses, []);
});

test("expense employee receives only their own expenses and no sales", () => {
  const result = recordsForActor({ employees: demoEmployees, sales: demoSales, expenses: demoExpenses }, "kevin");
  assert.deepEqual(result.sales, []);
  assert.ok(result.expenses.every((expense) => expense.reporter_id === "kevin"));
});
