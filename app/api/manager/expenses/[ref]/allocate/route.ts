import { apiError, json } from "@/lib/http";
import { allocateExpense } from "@/lib/service";
import type { ExpenseAllocation } from "@/lib/types";

export async function POST(request: Request, context: { params: Promise<{ ref: string }> }) {
  try {
    const [{ ref }, body] = await Promise.all([context.params, json(request)]);
    return Response.json(await allocateExpense(ref, String(body.actorId ?? ""), String(body.allocation) as ExpenseAllocation));
  } catch (error) { return apiError(error); }
}
