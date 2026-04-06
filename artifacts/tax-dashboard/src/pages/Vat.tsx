import { useState, useMemo } from "react";
import AppLayout from "@/components/layout/AppLayout";
import StatusBadge from "@/components/StatusBadge";
import UserSelector from "@/components/UserSelector";
import { formatDate } from "@/lib/utils";
import {
  useListVatRecords, useCreateVatRecord, useUpdateVatRecord, useListClients,
} from "@workspace/api-client-react";
import { useRegion } from "@/contexts/RegionContext";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, X, Search, ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import type { VatRecord } from "@workspace/api-client-react";
import { toast } from "sonner";

const PAGE_SIZE = 25;

function VatForm({ initial, clients, onClose, onSave }: {
  initial?: Partial<VatRecord>;
  clients: { id: number; name: string }[];
  onClose: () => void;
  onSave: (data: unknown) => void;
}) {
  const [form, setForm] = useState({
    clientId: initial?.clientId ?? (clients[0]?.id ?? 0),
    vatPeriod: initial?.vatPeriod ?? "",
    dueDate: initial?.dueDate ?? "",
    status: (initial?.status ?? "Pending") as VatRecord["status"],
    assignedTo: initial?.assignedTo ?? "",
    amount: initial?.amount != null ? String(initial.amount) : "",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-base font-semibold">{initial?.id ? "Edit VAT Record" : "Add VAT Record"}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Client *</label>
            <select value={form.clientId} onChange={e => setForm({ ...form, clientId: parseInt(e.target.value) })}
              className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              disabled={!!initial?.id}>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">VAT Period *</label>
              <input placeholder="e.g. Jan - Mar 2026" value={form.vatPeriod} onChange={e => setForm({ ...form, vatPeriod: e.target.value })}
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
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Amount (AED)</label>
              <input type="number" placeholder="0.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Assigned To *</label>
            <UserSelector
              value={form.assignedTo}
              onChange={v => setForm({ ...form, assignedTo: v })}
            />
          </div>
        </div>
        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">Cancel</button>
          <button onClick={() => onSave({ ...form, clientId: Number(form.clientId), amount: form.amount ? Number(form.amount) : undefined })}
            disabled={!form.vatPeriod || !form.dueDate || !form.assignedTo}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50">
            {initial?.id ? "Save Changes" : "Add Record"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Vat() {
  const qc = useQueryClient();
  const { countryParam } = useRegion();
  const [filterStatus, setFilterStatus] = useState("");
  const [filterClientStatus, setFilterClientStatus] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<VatRecord | null>(null);
  const [page, setPage] = useState(1);

  const { data: records, isLoading } = useListVatRecords({ status: filterStatus, ...(countryParam ? { country: countryParam } : {}) });
  const { data: clients } = useListClients({});

  const clientStatusMap = useMemo(() => {
    const map: Record<number, string> = {};
    for (const c of (clients ?? [])) map[c.id] = c.status;
    return map;
  }, [clients]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["/api/vat"] });

  const createRecord = useCreateVatRecord({
    mutation: {
      onSuccess: () => { invalidate(); toast.success("VAT record added"); },
      onError: () => toast.error("Failed to add VAT record"),
    }
  });
  const updateRecord = useUpdateVatRecord({
    mutation: {
      onSuccess: (updated) => {
        qc.setQueriesData(
          { queryKey: ["/api/vat"] },
          (old: VatRecord[] | undefined) => old ? old.map(r => r.id === updated.id ? { ...r, ...updated } : r) : old,
        );
        invalidate();
        toast.success("VAT record updated");
      },
      onError: () => toast.error("Failed to update VAT record"),
    }
  });

  const clientsForForm = (clients ?? []).map(c => ({ id: c.id, name: c.name }));

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return (records ?? []).filter(r => {
      if (q && !r.clientName.toLowerCase().includes(q) && !r.vatPeriod.toLowerCase().includes(q)) return false;
      if (filterClientStatus && clientStatusMap[r.clientId] !== filterClientStatus) return false;
      return true;
    });
  }, [records, search, filterClientStatus, clientStatusMap]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openEdit = (r: VatRecord) => { setEditingRecord(r); setShowForm(true); };
  const closeForm = () => { setEditingRecord(null); setShowForm(false); };

  return (
    <AppLayout title="VAT Tracker">
      {showForm && (
        <VatForm
          initial={editingRecord ?? undefined}
          clients={clientsForForm}
          onClose={closeForm}
          onSave={(data) => {
            if (editingRecord) {
              updateRecord.mutate({ id: editingRecord.id, data: data as Parameters<typeof updateRecord.mutate>[0]["data"] });
            } else {
              createRecord.mutate({ data: data as Parameters<typeof createRecord.mutate>[0]["data"] });
            }
            closeForm();
          }}
        />
      )}

      <div className="space-y-5">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="search" placeholder="Search client or period..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="InProgress">In Progress</option>
            <option value="Filed">Filed</option>
            <option value="Overdue">Overdue</option>
          </select>
          <select value={filterClientStatus} onChange={e => { setFilterClientStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option value="">All Clients</option>
            <option value="Active">Active Clients</option>
            <option value="Inactive">Inactive Clients</option>
          </select>
          <button onClick={() => { setEditingRecord(null); setShowForm(true); }}
            className="ml-auto flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90">
            <Plus className="w-4 h-4" />
            Add VAT Record
          </button>
        </div>

        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-sm">VAT Filing Records</h2>
            <span className="text-xs text-muted-foreground">{filtered.length} records</span>
          </div>
          {isLoading ? (
            <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />)}</div>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Client</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">VAT Period</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Due Date</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assigned To</th>
                    <th className="px-4 py-3.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginated.map(r => (
                    <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-foreground">{r.clientName}</td>
                      <td className="px-4 py-3.5 text-muted-foreground">{r.vatPeriod}</td>
                      <td className="px-4 py-3.5 text-muted-foreground">{formatDate(r.dueDate)}</td>
                      <td className="px-4 py-3.5"><StatusBadge status={r.status} /></td>
                      <td className="px-4 py-3.5 font-medium">{r.amount != null ? `AED ${Number(r.amount).toLocaleString()}` : "—"}</td>
                      <td className="px-4 py-3.5 text-muted-foreground">{r.assignedTo}</td>
                      <td className="px-4 py-3.5">
                        <button onClick={() => openEdit(r)}
                          className="p-1.5 hover:bg-yellow-50 text-yellow-600 rounded-lg transition-colors" title="Edit">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {paginated.length === 0 && (
                    <tr><td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">No VAT records found</td></tr>
                  )}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div className="px-5 py-3 border-t border-border flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                      className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-40 transition-colors">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      let pg = i + 1;
                      if (totalPages > 7) {
                        if (page <= 4) pg = i + 1;
                        else if (page >= totalPages - 3) pg = totalPages - 6 + i;
                        else pg = page - 3 + i;
                      }
                      return (
                        <button key={pg} onClick={() => setPage(pg)}
                          className={`w-8 h-8 text-xs rounded-lg transition-colors ${pg === page ? "bg-primary text-white" : "hover:bg-muted text-muted-foreground"}`}>
                          {pg}
                        </button>
                      );
                    })}
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                      className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-40 transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
