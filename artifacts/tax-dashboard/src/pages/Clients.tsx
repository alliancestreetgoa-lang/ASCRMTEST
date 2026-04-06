import { useState } from "react";
import { useLocation } from "wouter";
import AppLayout from "@/components/layout/AppLayout";
import StatusBadge from "@/components/StatusBadge";
import UserSelector from "@/components/UserSelector";
import { formatDate } from "@/lib/utils";
import {
  useListClients, useCreateClient, useUpdateClient, useDeleteClient,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Eye, Pencil, Trash2, X, Globe } from "lucide-react";
import type { Client } from "@workspace/api-client-react";
import { toast } from "sonner";

function ClientForm({ initial, onClose, onSave }: {
  initial?: Partial<Client>;
  onClose: () => void;
  onSave: (data: unknown) => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    country: initial?.country ?? "UK",
    vatNumber: initial?.vatNumber ?? "",
    corporateTaxStatus: initial?.corporateTaxStatus ?? "Pending",
    status: initial?.status ?? "Active",
    assignedTo: initial?.assignedTo ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    address: initial?.address ?? "",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-base font-semibold">{initial?.id ? "Edit Client" : "Add Client"}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Company Name *</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Country *</label>
              <select value={form.country} onChange={e => setForm({ ...form, country: e.target.value as "UK" | "UAE" })}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="UK">UK</option>
                <option value="UAE">UAE</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">VAT Number</label>
              <input value={form.vatNumber} onChange={e => setForm({ ...form, vatNumber: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Corp. Tax Status</label>
              <select value={form.corporateTaxStatus ?? ""} onChange={e => setForm({ ...form, corporateTaxStatus: e.target.value as "Active" | "Inactive" | "Pending" })}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Status *</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as "Active" | "Inactive" })}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Assigned To *</label>
              <UserSelector
                value={form.assignedTo}
                onChange={v => setForm({ ...form, assignedTo: v })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email</label>
              <input type="email" value={form.email ?? ""} onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Phone</label>
              <input value={form.phone ?? ""} onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Address</label>
              <input value={form.address ?? ""} onChange={e => setForm({ ...form, address: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors">Cancel</button>
          <button onClick={() => onSave(form)} disabled={!form.name || !form.assignedTo}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
            {initial?.id ? "Save Changes" : "Add Client"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Clients() {
  const qc = useQueryClient();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [status, setStatus] = useState("");
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: clients, isLoading } = useListClients({ search, country, status });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["/api/clients"] });
  const createClient = useCreateClient({
    mutation: {
      onSuccess: () => { invalidate(); toast.success("Client added successfully"); },
      onError: () => toast.error("Failed to add client"),
    }
  });
  const updateClient = useUpdateClient({
    mutation: {
      onSuccess: () => { invalidate(); toast.success("Client updated"); },
      onError: () => toast.error("Failed to update client"),
    }
  });
  const deleteClient = useDeleteClient({
    mutation: {
      onSuccess: () => { invalidate(); toast.success("Client deleted"); },
      onError: () => toast.error("Failed to delete client"),
    }
  });

  const openCreate = () => { setEditingClient(null); setShowForm(true); };
  const openEdit = (client: Client) => { setEditingClient(client); setShowForm(true); };
  const closeForm = () => { setEditingClient(null); setShowForm(false); };

  return (
    <AppLayout title="Clients">
      {showForm && (
        <ClientForm
          initial={editingClient ?? undefined}
          onClose={closeForm}
          onSave={(data) => {
            if (editingClient) {
              updateClient.mutate({ id: editingClient.id, data: data as Parameters<typeof updateClient.mutate>[0]["data"] });
            } else {
              createClient.mutate({ data: data as Parameters<typeof createClient.mutate>[0]["data"] });
            }
            closeForm();
          }}
        />
      )}

      <div className="space-y-5">
        {/* Toolbar */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="search" placeholder="Search clients..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Country filter chips */}
          <div className="flex items-center gap-1.5">
            {(["", "UK", "UAE"] as const).map((val) => {
              const label = val === "" ? "All" : val;
              const active = country === val;
              return (
                <button
                  key={val}
                  onClick={() => setCountry(val)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-white text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="w-px h-6 bg-border" />

          {/* Status filter chips */}
          <div className="flex items-center gap-1.5">
            {(["", "Active", "Inactive"] as const).map((val) => {
              const label = val === "" ? "All" : val;
              const active = status === val;
              const colorClass = active
                ? val === "Active"
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : val === "Inactive"
                  ? "bg-slate-500 text-white border-slate-500"
                  : "bg-primary text-primary-foreground border-primary"
                : "bg-white text-muted-foreground border-border hover:border-primary/50 hover:text-foreground";
              return (
                <button
                  key={val}
                  onClick={() => setStatus(val)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-colors ${colorClass}`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <button onClick={openCreate}
            className="ml-auto flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" />
            Add Client
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {[...Array(6)].map((_, i) => <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />)}
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Client</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Country</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">VAT No.</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">CT Status</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assigned To</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(clients ?? []).map((c) => (
                    <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-medium text-foreground">{c.name}</div>
                        {c.email && <div className="text-xs text-muted-foreground mt-0.5">{c.email}</div>}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5">
                          <Globe className="w-3 h-3 text-muted-foreground" />
                          <span>{c.country}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground font-mono text-xs">{c.vatNumber ?? "—"}</td>
                      <td className="px-4 py-4">
                        {c.corporateTaxStatus
                          ? <StatusBadge status={c.corporateTaxStatus} />
                          : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-4"><StatusBadge status={c.status} /></td>
                      <td className="px-4 py-4 text-muted-foreground">{c.assignedTo}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1">
                          <button onClick={() => navigate(`/clients/${c.id}`)}
                            className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors" title="View">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => openEdit(c)} className="p-1.5 hover:bg-yellow-50 text-yellow-600 rounded-lg transition-colors" title="Edit">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteId(c.id)}
                            className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(!clients || clients.length === 0) && (
                    <tr><td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">No clients found</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
          {clients && clients.length > 0 && (
            <div className="px-5 py-3 border-t border-border flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{clients.length} client{clients.length !== 1 ? "s" : ""}</span>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirm */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="font-semibold text-base mb-2">Delete Client</h3>
            <p className="text-sm text-muted-foreground mb-6">Are you sure you want to delete this client? This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">Cancel</button>
              <button onClick={() => { deleteClient.mutate({ id: deleteId }); setDeleteId(null); }}
                className="px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded-lg hover:opacity-90">Delete</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
