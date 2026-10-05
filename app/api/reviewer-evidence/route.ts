import { AppError } from "@/lib/errors";
import { apiError } from "@/lib/http";
import { saleByRef, telegramEvidenceByRef } from "@/lib/repository";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const ref = (new URL(request.url).searchParams.get("ref") ?? "").trim().toUpperCase();
    if (!/^S\d{2,}$/.test(ref)) throw new AppError("A valid sale reference is required.");
    const [sale, deliveries] = await Promise.all([saleByRef(ref), telegramEvidenceByRef(ref)]);
    const outcomes = deliveries.reduce<Record<string, number>>((counts, item) => {
      const outcome = String(item.outcome ?? "incomplete");
      counts[outcome] = (counts[outcome] ?? 0) + 1;
      return counts;
    }, {});
    return Response.json({
      test: { ref, description: sale.description, submittedAt: sale.submitted_at, approvedAt: sale.approved_at },
      transaction: { status: sale.status, sheetSync: sale.sheet_sync_status, managerDecisionNotification: sale.notification_status },
      telegram: {
        receiptReplies: outcomes.receipt ?? 0,
        duplicateCommandReplies: outcomes.duplicate ?? 0,
        unexpectedErrors: outcomes.error ?? 0,
        processedUpdates: deliveries.length,
        noRepeatedReplies: (outcomes.receipt ?? 0) === 1 && (outcomes.duplicate ?? 0) === 1 && (outcomes.error ?? 0) === 0,
        events: deliveries,
      },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}
