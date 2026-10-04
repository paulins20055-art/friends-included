import { AppError } from "@/lib/errors";
import { apiError, json } from "@/lib/http";
import { employeeById, unlinkTelegramIfMatches } from "@/lib/repository";

export async function POST(request: Request) {
  try {
    const body = await json(request);
    const actor = await employeeById(String(body.actorId ?? ""));
    if (actor.role !== "manager") throw new AppError("Only the manager can remove Telegram links.", 403);
    const userId = Number(body.telegramUserId);
    const chatId = Number(body.telegramChatId);
    if (!Number.isSafeInteger(userId) || !Number.isSafeInteger(chatId)) throw new AppError("Telegram user ID and chat ID must be integers.");
    return Response.json(await unlinkTelegramIfMatches(String(body.employeeId ?? ""), userId, chatId));
  } catch (error) { return apiError(error); }
}
