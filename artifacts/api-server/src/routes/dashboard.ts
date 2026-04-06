import { Router, type IRouter } from "express";
import { eq, count, and, lt } from "drizzle-orm";
import { db, clientsTable, tasksTable, vatRecordsTable, corporateTaxTable } from "@workspace/db";
import {
  GetDashboardSummaryResponse,
  GetUpcomingDeadlinesQueryParams,
  GetUpcomingDeadlinesResponse,
  GetDashboardAlertsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const today = new Date().toISOString().split("T")[0];

  const [totalClientsResult] = await db.select({ count: count() }).from(clientsTable);
  const [pendingTasksResult] = await db.select({ count: count() }).from(tasksTable).where(eq(tasksTable.status, "Pending"));
  const [overdueTasksResult] = await db.select({ count: count() }).from(tasksTable).where(eq(tasksTable.status, "Overdue"));
  const [completedTasksResult] = await db.select({ count: count() }).from(tasksTable).where(eq(tasksTable.status, "Completed"));

  const thisMonthEnd = new Date();
  thisMonthEnd.setMonth(thisMonthEnd.getMonth() + 1);
  thisMonthEnd.setDate(0);
  const monthEnd = thisMonthEnd.toISOString().split("T")[0];

  const [vatDueResult] = await db.select({ count: count() }).from(vatRecordsTable)
    .where(and(eq(vatRecordsTable.status, "Pending")));
  const [ctDueResult] = await db.select({ count: count() }).from(corporateTaxTable)
    .where(and(eq(corporateTaxTable.status, "Pending")));

  const summary = {
    totalClients: Number(totalClientsResult?.count ?? 0),
    pendingTasks: Number(pendingTasksResult?.count ?? 0),
    overdueTasks: Number(overdueTasksResult?.count ?? 0),
    completedTasks: Number(completedTasksResult?.count ?? 0),
    vatDueThisMonth: Number(vatDueResult?.count ?? 0),
    corporateTaxDueThisMonth: Number(ctDueResult?.count ?? 0),
  };

  res.json(GetDashboardSummaryResponse.parse(summary));
});

router.get("/dashboard/upcoming-deadlines", async (req, res): Promise<void> => {
  const parsed = GetUpcomingDeadlinesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const limit = parsed.data.limit ?? 10;
  const clients = await db.select({ id: clientsTable.id, name: clientsTable.name }).from(clientsTable);
  const clientMap: Record<number, string> = {};
  for (const c of clients) clientMap[c.id] = c.name;

  const tasks = await db.select().from(tasksTable).orderBy(tasksTable.dueDate).limit(limit);
  const vatRecords = await db.select().from(vatRecordsTable).orderBy(vatRecordsTable.dueDate).limit(limit);
  const ctRecords = await db.select().from(corporateTaxTable).orderBy(corporateTaxTable.deadline).limit(limit);

  const deadlines = [
    ...tasks.map((t, i) => ({
      id: i + 1,
      clientName: clientMap[t.clientId] ?? "Unknown",
      clientId: t.clientId,
      type: "Task" as const,
      dueDate: t.dueDate,
      status: t.status as "Pending" | "InProgress" | "Completed" | "Overdue",
      assignedTo: t.assignedTo,
    })),
    ...vatRecords.map((v, i) => ({
      id: tasks.length + i + 1,
      clientName: clientMap[v.clientId] ?? "Unknown",
      clientId: v.clientId,
      type: "VAT" as const,
      dueDate: v.dueDate,
      status: (v.status === "Filed" ? "Completed" : v.status) as "Pending" | "InProgress" | "Completed" | "Overdue",
      assignedTo: v.assignedTo,
    })),
    ...ctRecords.map((c, i) => ({
      id: tasks.length + vatRecords.length + i + 1,
      clientName: clientMap[c.clientId] ?? "Unknown",
      clientId: c.clientId,
      type: "CorporateTax" as const,
      dueDate: c.deadline,
      status: (c.status === "Filed" ? "Completed" : c.status) as "Pending" | "InProgress" | "Completed" | "Overdue",
      assignedTo: c.assignedTo,
    })),
  ]
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, limit);

  res.json(GetUpcomingDeadlinesResponse.parse(deadlines));
});

router.get("/dashboard/alerts", async (_req, res): Promise<void> => {
  const today = new Date().toISOString().split("T")[0];
  const clients = await db.select({ id: clientsTable.id, name: clientsTable.name }).from(clientsTable);
  const clientMap: Record<number, string> = {};
  for (const c of clients) clientMap[c.id] = c.name;

  const overdueTasks = await db.select().from(tasksTable).where(eq(tasksTable.status, "Overdue")).limit(5);
  const pendingVat = await db.select().from(vatRecordsTable).where(eq(vatRecordsTable.status, "Pending")).limit(5);
  const filedVat = await db.select().from(vatRecordsTable).where(eq(vatRecordsTable.status, "Filed")).limit(3);

  const alerts = [
    ...overdueTasks.map((t, i) => ({
      id: i + 1,
      type: "Overdue" as const,
      message: `Task "${t.title}" is overdue`,
      clientName: clientMap[t.clientId] ?? "Unknown",
      dueDate: t.dueDate,
      referenceType: "Task",
    })),
    ...pendingVat.map((v, i) => ({
      id: overdueTasks.length + i + 1,
      type: "Upcoming" as const,
      message: `VAT filing due for period ${v.vatPeriod}`,
      clientName: clientMap[v.clientId] ?? "Unknown",
      dueDate: v.dueDate,
      referenceType: "VAT",
    })),
    ...filedVat.map((v, i) => ({
      id: overdueTasks.length + pendingVat.length + i + 1,
      type: "Completed" as const,
      message: `VAT filing completed for period ${v.vatPeriod}`,
      clientName: clientMap[v.clientId] ?? "Unknown",
      dueDate: v.dueDate,
      referenceType: "VAT",
    })),
  ];

  res.json(GetDashboardAlertsResponse.parse(alerts));
});

export default router;
