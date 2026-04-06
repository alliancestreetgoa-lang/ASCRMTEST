import { Router, type IRouter } from "express";
import { eq, and, SQL } from "drizzle-orm";
import { db, corporateTaxTable, clientsTable } from "@workspace/db";
import {
  ListCorporateTaxQueryParams,
  CreateCorporateTaxRecordBody,
  UpdateCorporateTaxRecordParams,
  UpdateCorporateTaxRecordBody,
  UpdateCorporateTaxRecordResponse,
  ListCorporateTaxResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/corporate-tax", async (req, res): Promise<void> => {
  const parsed = ListCorporateTaxQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { clientId, status } = parsed.data;
  const conditions: SQL[] = [];
  if (clientId != null) conditions.push(eq(corporateTaxTable.clientId, clientId));
  if (status) conditions.push(eq(corporateTaxTable.status, status));

  const rawRecords = conditions.length > 0
    ? await db.select().from(corporateTaxTable).where(and(...conditions)).orderBy(corporateTaxTable.deadline)
    : await db.select().from(corporateTaxTable).orderBy(corporateTaxTable.deadline);

  const clients = await db.select({ id: clientsTable.id, name: clientsTable.name }).from(clientsTable);
  const clientMap: Record<number, string> = {};
  for (const c of clients) clientMap[c.id] = c.name;

  const records = rawRecords.map(r => ({
    ...r,
    clientName: clientMap[r.clientId] ?? "Unknown",
    taxAmount: r.taxAmount != null ? Number(r.taxAmount) : undefined,
  }));

  res.json(ListCorporateTaxResponse.parse(records));
});

router.post("/corporate-tax", async (req, res): Promise<void> => {
  const parsed = CreateCorporateTaxRecordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [record] = await db.insert(corporateTaxTable).values(parsed.data).returning();
  const [client] = await db.select({ name: clientsTable.name }).from(clientsTable).where(eq(clientsTable.id, record.clientId));

  res.status(201).json({
    ...record,
    clientName: client?.name ?? "Unknown",
    taxAmount: record.taxAmount != null ? Number(record.taxAmount) : undefined,
  });
});

router.put("/corporate-tax/:id", async (req, res): Promise<void> => {
  const params = UpdateCorporateTaxRecordParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateCorporateTaxRecordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [record] = await db.update(corporateTaxTable).set(parsed.data).where(eq(corporateTaxTable.id, params.data.id)).returning();
  if (!record) {
    res.status(404).json({ error: "Corporate tax record not found" });
    return;
  }

  const [client] = await db.select({ name: clientsTable.name }).from(clientsTable).where(eq(clientsTable.id, record.clientId));
  res.json(UpdateCorporateTaxRecordResponse.parse({
    ...record,
    clientName: client?.name ?? "Unknown",
    taxAmount: record.taxAmount != null ? Number(record.taxAmount) : undefined,
  }));
});

export default router;
