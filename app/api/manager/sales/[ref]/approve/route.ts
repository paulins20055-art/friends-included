import { apiError, json } from "@/lib/http";
import { approveSale } from "@/lib/service";

export async function POST(request: Request, context: { params: Promise<{ ref: string }> }) {
  try {
    const [{ ref }, body] = await Promise.all([context.params, json(request)]);
    const split: [number, number, number] = [Number(body.richardPct), Number(body.anastasiaPct), Number(body.jeanClaudePct)];
    return Response.json(await approveSale(ref, String(body.actorId ?? ""), split));
  } catch (error) { return apiError(error); }
}
