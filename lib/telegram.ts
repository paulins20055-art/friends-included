export async function sendTelegram(chatId: number, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not configured.");
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  if (!response.ok) throw new Error(`Telegram delivery failed: ${response.status} ${await response.text()}`);
}

export function parseTelegramCommand(text: string) {
  const trimmed = text.trim();
  const separator = trimmed.search(/\s/);
  if (separator === -1) return { command: trimmed, raw: "" };
  return {
    command: trimmed.slice(0, separator),
    raw: trimmed.slice(separator).trim(),
  };
}

export function telegramHelp() {
  return [
    "Friends Included transaction bot",
    "",
    "Sales command:",
    "/sale S01|Customer|A|Description|1000|50|30|20",
    "",
    "Expense command:",
    "/expense E01|Description|Materials|120|A",
    "",
    "Allowed categories: Materials, Travel, Other",
    "Allowed allocations: A, B, OVERHEAD",
  ].join("\n");
}
