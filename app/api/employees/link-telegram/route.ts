import { AppError } from "@/lib/errors";
import { apiError, json } from "@/lib/http";
import { employeeById, linkTelegram } from "@/lib/repository";

export async function POST(request: Request) {
  try {
    const body = await json(request);
    const actor = await employeeById(String(body.actorId ?? ""));
    if (actor.role !== "manager") throw new AppError("Only the manager can link Telegram accounts.", 403);
    const userId = Number(body.telegramUserId); const chatId = Number(body.telegramChatId);
    if (!Number.isSafeInteger(userId) || !Number.isSafeInteger(chatId)) throw new AppError("Telegram user ID and chat ID must be integers.");
    return Response.json(await linkTelegram(String(body.employeeId ?? ""), userId, chatId));
  } catch (error) { return apiError(error); }
}
