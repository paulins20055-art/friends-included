import { AppError, messageOf } from "@/lib/errors";

export function apiError(error: unknown) {
  const status = error instanceof AppError ? error.status : 500;
  return Response.json({ error: messageOf(error) }, { status });
}

export async function json(request: Request) {
  try { return await request.json() as Record<string, unknown>; }
  catch { throw new AppError("Request body must be valid JSON."); }
}
