import { calculateDashboard } from "@/lib/business";
import { recordsForActor } from "@/lib/access";
import { demoEmployees, demoExpenses, demoSales } from "@/lib/demo";
import { apiError } from "@/lib/http";
import { listAll } from "@/lib/repository";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const actorId = new URL(request.url).searchParams.get("actorId") ?? "";
    if (process.env.DEMO_PREVIEW === "true") {
      const visible = recordsForActor({ employees: demoEmployees, sales: demoSales, expenses: demoExpenses }, actorId);
      return Response.json({ ...visible, dashboard: calculateDashboard(demoSales, demoExpenses) }, { headers: { "Cache-Control": "no-store" } });
    }
    const data = await listAll();
    const visible = recordsForActor(data, actorId);
    return Response.json({ ...visible, dashboard: calculateDashboard(data.sales, data.expenses) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}
