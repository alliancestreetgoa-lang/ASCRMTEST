import { pgTable, text, serial, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const corporateTaxTable = pgTable("corporate_tax", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  financialYear: text("financial_year").notNull(),
  deadline: text("deadline").notNull(),
  status: text("status").notNull().default("Pending"),
  assignedTo: text("assigned_to").notNull(),
  filedDate: text("filed_date"),
  taxAmount: numeric("tax_amount", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCorporateTaxSchema = createInsertSchema(corporateTaxTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCorporateTax = z.infer<typeof insertCorporateTaxSchema>;
export type CorporateTax = typeof corporateTaxTable.$inferSelect;
