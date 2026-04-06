import { Router, type IRouter } from "express";
import { eq, and, SQL } from "drizzle-orm";
import { db, vatRecordsTable, clientsTable } from "@workspace/db";
import {
  ListVatRecordsQueryParams,
  CreateVatRecordBody,
  UpdateVatRecordParams,
  UpdateVatRecordBody,
  UpdateVatRecordResponse,
  ListVatRecordsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/vat", async (req, res): Promise<void> => {
  const parsed = ListVatRecordsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { clientId, status } = parsed.data;
  const conditions: SQL[] = [];
  if (clientId != null) conditions.push(eq(vatRecordsTable.clientId, clientId));
  if (status) conditions.push(eq(vatRecordsTable.status, status));

  const rawRecords = conditions.length > 0
    ? await db.select().from(vatRecordsTable).where(and(...conditions)).orderBy(vatRecordsTable.dueDate)
    : await db.select().from(vatRecordsTable).orderBy(vatRecordsTable.dueDate);

  const clients = await db.select({ id: clientsTable.id, name: clientsTable.name }).from(clientsTable);
  const clientMap: Record<number, string> = {};
  for (const c of clients) clientMap[c.id] = c.name;

  const records = rawRecords.map(r => ({
    ...r,
    clientName: clientMap[r.clientId] ?? "Unknown",
    amount: r.amount != null ? Number(r.amount) : undefined,
  }));

  res.json(ListVatRecordsResponse.parse(records));
});

router.post("/vat", async (req, res): Promise<void> => {
  const parsed = CreateVatRecordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [record] = await db.insert(vatRecordsTable).values(parsed.data).returning();
  const [client] = await db.select({ name: clientsTable.name }).from(clientsTable).where(eq(clientsTable.id, record.clientId));

  res.status(201).json({
    ...record,
    clientName: client?.name ?? "Unknown",
    amount: record.amount != null ? Number(record.amount) : undefined,
  });
});

router.put("/vat/:id", async (req, res): Promise<void> => {
  const params = UpdateVatRecordParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateVatRecordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [record] = await db.update(vatRecordsTable).set(parsed.data).where(eq(vatRecordsTable.id, params.data.id)).returning();
  if (!record) {
    res.status(404).json({ error: "VAT record not found" });
    return;
  }

  const [client] = await db.select({ name: clientsTable.name }).from(clientsTable).where(eq(clientsTable.id, record.clientId));
  res.json(UpdateVatRecordResponse.parse({
    ...record,
    clientName: client?.name ?? "Unknown",
    amount: record.amount != null ? Number(record.amount) : undefined,
  }));
});

export default router;
