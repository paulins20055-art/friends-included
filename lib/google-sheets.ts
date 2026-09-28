import { createSign } from "node:crypto";
import type { Expense, Sale } from "@/lib/types";

const encode = (value: string | Buffer) => Buffer.from(value).toString("base64url");

async function accessToken() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!email || !privateKey) throw new Error("Google service account is not configured.");
  const now = Math.floor(Date.now() / 1000);
  const header = encode(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = encode(JSON.stringify({
    iss: email,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }));
  const unsigned = `${header}.${claim}`;
  const signature = createSign("RSA-SHA256").update(unsigned).sign(privateKey);
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${unsigned}.${encode(signature)}` }),
  });
  const body = await response.json() as { access_token?: string; error_description?: string };
  if (!response.ok || !body.access_token) throw new Error(body.error_description || "Google authentication failed.");
  return body.access_token;
}

async function request(path: string, init: RequestInit = {}) {
  const token = await accessToken();
  const response = await fetch(`https://sheets.googleapis.com/v4/${path}`, {
    ...init,
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json", ...(init.headers ?? {}) },
  });
  if (!response.ok) throw new Error(`Google Sheets request failed: ${response.status} ${await response.text()}`);
  return response.json();
}

async function upsert(tab: "Sales" | "Expenses", ref: string, values: (string | number)[]) {
  const id = process.env.GOOGLE_SHEETS_ID;
  if (!id) throw new Error("GOOGLE_SHEETS_ID is not configured.");
  const rows = await request(`spreadsheets/${id}/values/${tab}!A:A` ) as { values?: string[][] };
  const existing = (rows.values ?? []).findIndex((row) => row[0] === ref);
  if (existing >= 0) {
    const rowNumber = existing + 1;
    await request(`spreadsheets/${id}/values/${tab}!A${rowNumber}:Z${rowNumber}?valueInputOption=USER_ENTERED`, {
      method: "PUT", body: JSON.stringify({ values: [values] }),
    });
  } else {
    await request(`spreadsheets/${id}/values/${tab}!A:Z:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`, {
      method: "POST", body: JSON.stringify({ values: [values] }),
    });
  }
}

export async function syncSale(sale: Sale) {
  await upsert("Sales", sale.ref, [
    sale.ref, sale.submitted_at, sale.salesperson_id, sale.customer, sale.project, sale.description, sale.amount,
    sale.proposed_richard_pct, sale.proposed_anastasia_pct, sale.proposed_jean_claude_pct,
    sale.approved_richard_pct ?? "", sale.approved_anastasia_pct ?? "", sale.approved_jean_claude_pct ?? "",
    sale.commission_richard, sale.commission_anastasia, sale.commission_jean_claude, sale.commission_pool, sale.status,
  ]);
}

export async function syncExpense(expense: Expense) {
  await upsert("Expenses", expense.ref, [
    expense.ref, expense.submitted_at, expense.reporter_id, expense.description, expense.category, expense.amount,
    expense.proposed_allocation, expense.final_allocation ?? "", expense.status,
  ]);
}
