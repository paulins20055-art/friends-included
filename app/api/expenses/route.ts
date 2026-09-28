import { apiError, json } from "@/lib/http";
import { submitExpense } from "@/lib/service";

export async function POST(request: Request) {
  try {
    const body = await json(request);
    return Response.json(await submitExpense(body, String(body.actorId ?? "")), { status: 201 });
  } catch (error) { return apiError(error); }
}
