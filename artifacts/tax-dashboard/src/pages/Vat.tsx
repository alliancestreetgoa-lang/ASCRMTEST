import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import StatusBadge from "@/components/StatusBadge";
import { formatDate } from "@/lib/utils";
import {
  useListVatRecords, useCreateVatRecord, useUpdateVatRecord, useListClients,
  getListVatRecordsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import type { VatRecord } from "@workspace/api-client-react";

function VatForm({ clients, onClose, onSave }: {
  clients: { id: number; name: string }[];
  onClose: () => void;
  onSave: (data: unknown) => void;
}) {
  const [form, setForm] = useState({
    clientId: clients[0]?.id ?? 0,
    vatPeriod: "",
    dueDate: "",
    status: "Pending" as VatRecord["status"],
    assignedTo: "",
    amount: "",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-base font-semibold">Add VAT Record</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Client *</label>
            <select value={form.clientId} onChange={e => setForm({ ...form, clientId: parseInt(e.target.value) })}
              className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20">
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">VAT Period *</label>
              <input placeholder="e.g. Q1 2026 (Jan-Mar)" value={form.vatPeriod} onChange={e => setForm({ ...form, vatPeriod: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Due Date *</label>
              <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as VatRecord["status"] })}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="Pending">Pending</option>
                <option value="InProgress">In Progress</option>
                <option value="Filed">Filed</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Amount</label>
              <input type="number" placeholder="0.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Assigned To *</label>
            <input value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })}
              className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>
        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">Cancel</button>
          <button onClick={() => onSave({ ...form, clientId: Number(form.clientId), amount: form.amount ? Number(form.amount) : undefined })}
            disabled={!form.vatPeriod || !form.dueDate || !form.assignedTo}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50">
            Add Record
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Vat() {
  const qc = useQueryClient();
  const [filterStatus, setFilterStatus] = useState("");
  const [showForm, setShowForm] = useState(false);

  const { data: records, isLoading } = useListVatRecords({ status: filterStatus });
  const { data: clients } = useListClients({});
  const createRecord = useCreateVatRecord({ mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: getListVatRecordsQueryKey() }) } });

  const clientsForForm = (clients ?? []).map(c => ({ id: c.id, name: c.name }));

  return (
    <AppLayout title="VAT Tracker">
      {showForm && (
        <VatForm
          clients={clientsForForm}
          onClose={() => setShowForm(false)}
          onSave={(data) => {
            createRecord.mutate({ data: data as Parameters<typeof createRecord.mutate>[0]["data"] });
            setShowForm(false);
          }}
        />
      )}

      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="InProgress">In Progress</option>
            <option value="Filed">Filed</option>
            <option value="Overdue">Overdue</option>
          </select>
          <button onClick={() => setShowForm(true)}
            className="ml-auto flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90">
            <Plus className="w-4 h-4" />
            Add VAT Record
          </button>
        </div>

        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-sm">VAT Filing Records</h2>
            <span className="text-xs text-muted-foreground">{records?.length ?? 0} records</span>
          </div>
          {isLoading ? (
            <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />)}</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Client</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">VAT Period</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Due Date</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assigned To</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(records ?? []).map(r => (
                  <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-foreground">{r.clientName}</td>
                    <td className="px-4 py-3.5 text-muted-foreground">{r.vatPeriod}</td>
                    <td className="px-4 py-3.5 text-muted-foreground">{formatDate(r.dueDate)}</td>
                    <td className="px-4 py-3.5"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3.5 font-medium">{r.amount != null ? `£${Number(r.amount).toLocaleString()}` : "—"}</td>
                    <td className="px-4 py-3.5 text-muted-foreground">{r.assignedTo}</td>
                  </tr>
                ))}
                {(!records || records.length === 0) && <tr><td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">No VAT records found</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
