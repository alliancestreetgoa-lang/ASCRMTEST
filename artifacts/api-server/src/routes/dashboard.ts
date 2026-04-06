import { Router, type IRouter } from "express";
import { eq, count, and, lt, ne, or, sql, inArray } from "drizzle-orm";
import { db, clientsTable, tasksTable, vatRecordsTable, corporateTaxTable } from "@workspace/db";
import {
  GetDashboardSummaryQueryParams,
  GetDashboardSummaryResponse,
  GetUpcomingDeadlinesQueryParams,
  GetUpcomingDeadlinesResponse,
  GetDashboardAlertsQueryParams,
  GetDashboardAlertsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dashboard/summary", async (req, res): Promise<void> => {
  const parsed = GetDashboardSummaryQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { country } = parsed.data;
  const today = new Date().toISOString().split("T")[0];

  let clientIds: number[] | undefined;
  if (country) {
    const filteredClients = await db.select({ id: clientsTable.id }).from(clientsTable).where(eq(clientsTable.country, country));
    clientIds = filteredClients.map(c => c.id);
    if (clientIds.length === 0) {
      const summary = {
        totalClients: 0,
        pendingTasks: 0,
        overdueTasks: 0,
        completedTasks: 0,
        vatDueThisMonth: 0,
        corporateTaxDueThisMonth: 0,
      };
      res.json(GetDashboardSummaryResponse.parse(summary));
      return;
    }
  }

  const clientFilter = clientIds ? inArray(clientsTable.id, clientIds) : undefined;
  const taskClientFilter = clientIds ? inArray(tasksTable.clientId, clientIds) : undefined;
  const vatClientFilter = clientIds ? inArray(vatRecordsTable.clientId, clientIds) : undefined;
  const ctClientFilter = clientIds ? inArray(corporateTaxTable.clientId, clientIds) : undefined;

  const [totalClientsResult] = clientFilter
    ? await db.select({ count: count() }).from(clientsTable).where(clientFilter)
    : await db.select({ count: count() }).from(clientsTable);

  const [pendingTasksResult] = taskClientFilter
    ? await db.select({ count: count() }).from(tasksTable).where(and(eq(tasksTable.status, "Pending"), taskClientFilter))
    : await db.select({ count: count() }).from(tasksTable).where(eq(tasksTable.status, "Pending"));

  const [completedTasksResult] = taskClientFilter
    ? await db.select({ count: count() }).from(tasksTable).where(and(eq(tasksTable.status, "Completed"), taskClientFilter))
    : await db.select({ count: count() }).from(tasksTable).where(eq(tasksTable.status, "Completed"));

  const [overdueTasksResult] = taskClientFilter
    ? await db.select({ count: count() }).from(tasksTable).where(and(eq(tasksTable.status, "Overdue"), taskClientFilter))
    : await db.select({ count: count() }).from(tasksTable).where(eq(tasksTable.status, "Overdue"));

  const [overdueVatResult] = vatClientFilter
    ? await db.select({ count: count() }).from(vatRecordsTable).where(and(sql`${vatRecordsTable.dueDate} < ${today}`, ne(vatRecordsTable.status, "Filed"), vatClientFilter))
    : await db.select({ count: count() }).from(vatRecordsTable).where(and(sql`${vatRecordsTable.dueDate} < ${today}`, ne(vatRecordsTable.status, "Filed")));

  const [overdueCtResult] = ctClientFilter
    ? await db.select({ count: count() }).from(corporateTaxTable).where(and(sql`${corporateTaxTable.deadline} < ${today}`, ne(corporateTaxTable.status, "Filed"), ctClientFilter))
    : await db.select({ count: count() }).from(corporateTaxTable).where(and(sql`${corporateTaxTable.deadline} < ${today}`, ne(corporateTaxTable.status, "Filed")));

  const [vatDueResult] = vatClientFilter
    ? await db.select({ count: count() }).from(vatRecordsTable).where(and(eq(vatRecordsTable.status, "Pending"), vatClientFilter))
    : await db.select({ count: count() }).from(vatRecordsTable).where(eq(vatRecordsTable.status, "Pending"));

  const [ctDueResult] = ctClientFilter
    ? await db.select({ count: count() }).from(corporateTaxTable).where(and(eq(corporateTaxTable.status, "Pending"), ctClientFilter))
    : await db.select({ count: count() }).from(corporateTaxTable).where(eq(corporateTaxTable.status, "Pending"));

  const totalOverdue =
    Number(overdueTasksResult?.count ?? 0) +
    Number(overdueVatResult?.count ?? 0) +
    Number(overdueCtResult?.count ?? 0);

  const summary = {
    totalClients: Number(totalClientsResult?.count ?? 0),
    pendingTasks: Number(pendingTasksResult?.count ?? 0),
    overdueTasks: totalOverdue,
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

  const { limit, country } = parsed.data;

  let clientIds: number[] | undefined;
  if (country) {
    const filteredClients = await db.select({ id: clientsTable.id }).from(clientsTable).where(eq(clientsTable.country, country));
    clientIds = filteredClients.map(c => c.id);
    if (clientIds.length === 0) {
      res.json(GetUpcomingDeadlinesResponse.parse([]));
      return;
    }
  }

  const clients = await db.select({ id: clientsTable.id, name: clientsTable.name }).from(clientsTable);
  const clientMap: Record<number, string> = {};
  for (const c of clients) clientMap[c.id] = c.name;

  const taskClientFilter = clientIds ? inArray(tasksTable.clientId, clientIds) : undefined;
  const vatClientFilter = clientIds ? inArray(vatRecordsTable.clientId, clientIds) : undefined;
  const ctClientFilter = clientIds ? inArray(corporateTaxTable.clientId, clientIds) : undefined;

  const tasks = taskClientFilter
    ? await db.select().from(tasksTable).where(taskClientFilter).orderBy(tasksTable.dueDate).limit(limit)
    : await db.select().from(tasksTable).orderBy(tasksTable.dueDate).limit(limit);

  const vatRecords = vatClientFilter
    ? await db.select().from(vatRecordsTable).where(vatClientFilter).orderBy(vatRecordsTable.dueDate).limit(limit)
    : await db.select().from(vatRecordsTable).orderBy(vatRecordsTable.dueDate).limit(limit);

  const ctRecords = ctClientFilter
    ? await db.select().from(corporateTaxTable).where(ctClientFilter).orderBy(corporateTaxTable.deadline).limit(limit)
    : await db.select().from(corporateTaxTable).orderBy(corporateTaxTable.deadline).limit(limit);

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

router.get("/dashboard/alerts", async (req, res): Promise<void> => {
  const parsed = GetDashboardAlertsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { country } = parsed.data;

  let clientIds: number[] | undefined;
  if (country) {
    const filteredClients = await db.select({ id: clientsTable.id }).from(clientsTable).where(eq(clientsTable.country, country));
    clientIds = filteredClients.map(c => c.id);
    if (clientIds.length === 0) {
      res.json(GetDashboardAlertsResponse.parse([]));
      return;
    }
  }

  const clients = await db.select({ id: clientsTable.id, name: clientsTable.name }).from(clientsTable);
  const clientMap: Record<number, string> = {};
  for (const c of clients) clientMap[c.id] = c.name;

  const taskClientFilter = clientIds ? inArray(tasksTable.clientId, clientIds) : undefined;
  const vatClientFilter = clientIds ? inArray(vatRecordsTable.clientId, clientIds) : undefined;

  const overdueTasks = taskClientFilter
    ? await db.select().from(tasksTable).where(and(eq(tasksTable.status, "Overdue"), taskClientFilter)).limit(5)
    : await db.select().from(tasksTable).where(eq(tasksTable.status, "Overdue")).limit(5);

  const pendingVat = vatClientFilter
    ? await db.select().from(vatRecordsTable).where(and(eq(vatRecordsTable.status, "Pending"), vatClientFilter)).limit(5)
    : await db.select().from(vatRecordsTable).where(eq(vatRecordsTable.status, "Pending")).limit(5);

  const filedVat = vatClientFilter
    ? await db.select().from(vatRecordsTable).where(and(eq(vatRecordsTable.status, "Filed"), vatClientFilter)).limit(3)
    : await db.select().from(vatRecordsTable).where(eq(vatRecordsTable.status, "Filed")).limit(3);

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
