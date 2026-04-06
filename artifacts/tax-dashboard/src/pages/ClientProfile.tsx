import { useParams, useLocation } from "wouter";
import AppLayout from "@/components/layout/AppLayout";
import StatusBadge from "@/components/StatusBadge";
import { formatDate } from "@/lib/utils";
import {
  useGetClient, useListTasks, useListVatRecords, useListCorporateTax,
} from "@workspace/api-client-react";
import { ArrowLeft, Building2, Mail, Phone, MapPin } from "lucide-react";
import { useState } from "react";

const tabs = ["Overview", "VAT", "Corporate Tax", "Tasks", "Documents"];

export default function ClientProfile() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const clientId = parseInt(id ?? "0", 10);
  const [tab, setTab] = useState("Overview");

  const { data: client, isLoading } = useGetClient(clientId, {
    query: { enabled: !!clientId }
  });
  const { data: tasks } = useListTasks({ clientId });
  const { data: vatRecords } = useListVatRecords({ clientId });
  const { data: ctRecords } = useListCorporateTax({ clientId });

  if (isLoading) {
    return (
      <AppLayout title="Client Profile">
        <div className="space-y-4">
          <div className="h-8 w-32 bg-muted rounded-lg animate-pulse" />
          <div className="h-40 bg-muted rounded-xl animate-pulse" />
        </div>
      </AppLayout>
    );
  }

  if (!client) {
    return (
      <AppLayout title="Client Profile">
        <div className="text-center py-20 text-muted-foreground">Client not found</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={client.name}>
      <div className="space-y-5">
        {/* Back + Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/clients")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Clients
          </button>
        </div>

        {/* Profile card */}
        <div className="bg-white rounded-xl border border-border shadow-sm p-6">
          <div className="flex items-start gap-5">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold text-white shrink-0"
              style={{ background: "hsl(224 76% 33%)" }}>
              {client.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-bold text-foreground">{client.name}</h2>
                <StatusBadge status={client.status} />
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{client.country}</span>
              </div>
              <div className="mt-3 grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                {client.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{client.email}</span>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    <span>{client.phone}</span>
                  </div>
                )}
                {client.address && (
                  <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{client.address}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="text-right shrink-0 text-sm text-muted-foreground">
              <div>Assigned to</div>
              <div className="font-medium text-foreground mt-0.5">{client.assignedTo}</div>
              <div className="mt-2 text-xs">Since {formatDate(client.createdAt)}</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border flex gap-1">
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
              {t}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "Overview" && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
              <h3 className="text-sm font-semibold mb-4">Client Details</h3>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">VAT Number</dt><dd className="font-mono">{client.vatNumber ?? "—"}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Corp. Tax Status</dt><dd><StatusBadge status={client.corporateTaxStatus ?? "Pending"} /></dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Country</dt><dd>{client.country}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Client Since</dt><dd>{formatDate(client.createdAt)}</dd></div>
              </dl>
            </div>
            <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
              <h3 className="text-sm font-semibold mb-4">Activity Summary</h3>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">Active Tasks</dt><dd className="font-semibold">{tasks?.filter(t => t.status === "Pending" || t.status === "InProgress").length ?? 0}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">VAT Filings</dt><dd className="font-semibold">{vatRecords?.length ?? 0}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Corp. Tax Records</dt><dd className="font-semibold">{ctRecords?.length ?? 0}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Overdue Items</dt><dd className="font-semibold text-red-600">{(tasks?.filter(t => t.status === "Overdue").length ?? 0) + (vatRecords?.filter(v => v.status === "Overdue").length ?? 0)}</dd></div>
              </dl>
            </div>
          </div>
        )}

        {tab === "VAT" && (
          <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-muted/30">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase">VAT Period</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase">Due Date</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase">Amount</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase">Assigned</th>
              </tr></thead>
              <tbody className="divide-y divide-border">
                {(vatRecords ?? []).map(v => (
                  <tr key={v.id} className="hover:bg-muted/20">
                    <td className="px-5 py-3.5 font-medium">{v.vatPeriod}</td>
                    <td className="px-4 py-3.5 text-muted-foreground">{formatDate(v.dueDate)}</td>
                    <td className="px-4 py-3.5"><StatusBadge status={v.status} /></td>
                    <td className="px-4 py-3.5">{v.amount != null ? `£${Number(v.amount).toLocaleString()}` : "—"}</td>
                    <td className="px-4 py-3.5 text-muted-foreground">{v.assignedTo}</td>
                  </tr>
                ))}
                {(!vatRecords || vatRecords.length === 0) && <tr><td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">No VAT records</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {tab === "Corporate Tax" && (
          <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-muted/30">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase">Financial Year</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase">Deadline</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase">Tax Amount</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase">Assigned</th>
              </tr></thead>
              <tbody className="divide-y divide-border">
                {(ctRecords ?? []).map(c => (
                  <tr key={c.id} className="hover:bg-muted/20">
                    <td className="px-5 py-3.5 font-medium">{c.financialYear}</td>
                    <td className="px-4 py-3.5 text-muted-foreground">{formatDate(c.deadline)}</td>
                    <td className="px-4 py-3.5"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3.5">{c.taxAmount != null ? `£${Number(c.taxAmount).toLocaleString()}` : "—"}</td>
                    <td className="px-4 py-3.5 text-muted-foreground">{c.assignedTo}</td>
                  </tr>
                ))}
                {(!ctRecords || ctRecords.length === 0) && <tr><td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">No corporate tax records</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {tab === "Tasks" && (
          <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-muted/30">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase">Task</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase">Type</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase">Due Date</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase">Priority</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase">Status</th>
              </tr></thead>
              <tbody className="divide-y divide-border">
                {(tasks ?? []).map(t => (
                  <tr key={t.id} className="hover:bg-muted/20">
                    <td className="px-5 py-3.5 font-medium">{t.title}</td>
                    <td className="px-4 py-3.5 text-muted-foreground">{t.type}</td>
                    <td className="px-4 py-3.5 text-muted-foreground">{formatDate(t.dueDate)}</td>
                    <td className="px-4 py-3.5"><StatusBadge status={t.priority} /></td>
                    <td className="px-4 py-3.5"><StatusBadge status={t.status} /></td>
                  </tr>
                ))}
                {(!tasks || tasks.length === 0) && <tr><td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">No tasks</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {tab === "Documents" && (
          <div className="bg-white rounded-xl border border-border shadow-sm p-12 text-center">
            <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Document management coming soon</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
