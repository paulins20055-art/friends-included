import { calculateDashboard } from "@/lib/business";
import { demoEmployees, demoExpenses, demoSales } from "@/lib/demo";
import { apiError } from "@/lib/http";
import { listAll } from "@/lib/repository";

export async function GET() {
  try {
    if (process.env.DEMO_PREVIEW === "true") return Response.json({ employees: demoEmployees, sales: demoSales, expenses: demoExpenses, dashboard: calculateDashboard(demoSales, demoExpenses) });
    const data = await listAll();
    return Response.json({ ...data, dashboard: calculateDashboard(data.sales, data.expenses) });
  } catch (error) { return apiError(error); }
}
