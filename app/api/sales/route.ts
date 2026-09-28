import { apiError, json } from "@/lib/http";
import { submitSale } from "@/lib/service";

export async function POST(request: Request) {
  try {
    const body = await json(request);
    return Response.json(await submitSale(body, String(body.actorId ?? "")), { status: 201 });
  } catch (error) { return apiError(error); }
}
