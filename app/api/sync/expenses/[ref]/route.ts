import { apiError, json } from "@/lib/http";
import { retryExpenseSync } from "@/lib/service";

export async function POST(request: Request, context: { params: Promise<{ ref: string }> }) {
  try { const [{ ref }, body] = await Promise.all([context.params, json(request)]); return Response.json(await retryExpenseSync(ref, String(body.actorId ?? ""))); }
  catch (error) { return apiError(error); }
}
