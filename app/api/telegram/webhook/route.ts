import { AppError } from "@/lib/errors";
import { apiError } from "@/lib/http";
import { employeeByTelegramUser } from "@/lib/repository";
import { submitExpense, submitSale } from "@/lib/service";
import { sendTelegram, telegramHelp } from "@/lib/telegram";

type TelegramUpdate = { message?: { text?: string; chat: { id: number }; from?: { id: number } } };

export async function POST(request: Request) {
  let update: TelegramUpdate | null = null;
  try {
    const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (!expected || request.headers.get("x-telegram-bot-api-secret-token") !== expected) throw new AppError("Invalid webhook secret.", 401);
    update = await request.json() as TelegramUpdate;
    const message = update.message;
    if (!message?.text || !message.from) return Response.json({ ok: true });
    const employee = await employeeByTelegramUser(message.from.id);
    if (!employee) {
      await sendTelegram(message.chat.id, `Your Telegram user ID is ${message.from.id}. Ask the manager to link it before submitting transactions.`);
      return Response.json({ ok: true });
    }
    const [command, raw = ""] = message.text.trim().split(/\s+/, 2);
    if (command === "/start" || command === "/help") await sendTelegram(message.chat.id, telegramHelp());
    else if (command === "/sale") {
      const [ref, customer, project, description, amount, richardPct, anastasiaPct, jeanClaudePct] = raw.split("|");
      await submitSale({ ref, customer, project, description, amount, richardPct, anastasiaPct, jeanClaudePct }, employee.id, message.chat.id);
    } else if (command === "/expense") {
      const [ref, description, category, amount, allocation] = raw.split("|");
      await submitExpense({ ref, description, category, amount, allocation }, employee.id, message.chat.id);
    } else await sendTelegram(message.chat.id, telegramHelp());
    return Response.json({ ok: true });
  } catch (error) {
    try {
      if (update?.message?.chat.id) await sendTelegram(update.message.chat.id, error instanceof Error ? error.message : "Submission failed.");
    } catch { /* Telegram will retry non-2xx failures. */ }
    return apiError(error);
  }
}
