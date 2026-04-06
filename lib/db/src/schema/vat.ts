import { pgTable, text, serial, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const vatRecordsTable = pgTable("vat_records", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  vatPeriod: text("vat_period").notNull(),
  dueDate: text("due_date").notNull(),
  status: text("status").notNull().default("Pending"),
  assignedTo: text("assigned_to").notNull(),
  filedDate: text("filed_date"),
  amount: numeric("amount", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertVatRecordSchema = createInsertSchema(vatRecordsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertVatRecord = z.infer<typeof insertVatRecordSchema>;
export type VatRecord = typeof vatRecordsTable.$inferSelect;
