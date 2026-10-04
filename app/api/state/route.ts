import { calculateDashboard } from "@/lib/business";
import { recordsForActor } from "@/lib/access";
import { demoEmployees, demoExpenses, demoSales } from "@/lib/demo";
import { apiError } from "@/lib/http";
import { listAll } from "@/lib/repository";

export async function GET(request: Request) {
  try {
    const actorId = new URL(request.url).searchParams.get("actorId") ?? "";
    if (process.env.DEMO_PREVIEW === "true") {
      const visible = recordsForActor({ employees: demoEmployees, sales: demoSales, expenses: demoExpenses }, actorId);
      return Response.json({ ...visible, dashboard: calculateDashboard(demoSales, demoExpenses) });
    }
    const data = await listAll();
    const visible = recordsForActor(data, actorId);
    return Response.json({ ...visible, dashboard: calculateDashboard(data.sales, data.expenses) });
  } catch (error) { return apiError(error); }
}
