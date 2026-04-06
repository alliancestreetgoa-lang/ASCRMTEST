import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import StatusBadge from "@/components/StatusBadge";
import { formatDate } from "@/lib/utils";
import {
  useListTasks, useCreateTask, useUpdateTask, useDeleteTask, useListClients,
  getListTasksQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, LayoutList, Columns3, X, Trash2, Pencil } from "lucide-react";
import type { Task } from "@workspace/api-client-react";
import { useSearch } from "wouter";

const statusColumns = ["Pending", "InProgress", "Completed", "Overdue"] as const;

function TaskForm({ initial, clients, onClose, onSave }: {
  initial?: Partial<Task>;
  clients: { id: number; name: string }[];
  onClose: () => void;
  onSave: (data: unknown) => void;
}) {
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    clientId: initial?.clientId ?? (clients[0]?.id ?? 0),
    type: initial?.type ?? "General",
    dueDate: initial?.dueDate ?? "",
    assignedTo: initial?.assignedTo ?? "",
    status: initial?.status ?? "Pending",
    priority: initial?.priority ?? "Medium",
    description: initial?.description ?? "",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-base font-semibold">{initial?.id ? "Edit Task" : "Create Task"}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Task Title *</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Client *</label>
              <select value={form.clientId} onChange={e => setForm({ ...form, clientId: parseInt(e.target.value) })}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20">
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Type *</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as Task["type"] })}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="VAT">VAT</option>
                <option value="CorporateTax">Corporate Tax</option>
                <option value="General">General</option>
                <option value="Compliance">Compliance</option>
                <option value="Filing">Filing</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Due Date *</label>
              <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Assigned To *</label>
              <input value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Priority</label>
              <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as Task["priority"] })}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Task["status"] })}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="Pending">Pending</option>
                <option value="InProgress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Description</label>
            <textarea value={form.description ?? ""} onChange={e => setForm({ ...form, description: e.target.value })} rows={3}
              className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
          </div>
        </div>
        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">Cancel</button>
          <button onClick={() => onSave(form)} disabled={!form.title || !form.assignedTo || !form.dueDate}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50">
            {initial?.id ? "Save" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

function KanbanCard({ task, onUpdate }: { task: Task; onUpdate: (id: number, status: string) => void }) {
  return (
    <div className="bg-white border border-border rounded-xl p-3.5 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-sm font-medium text-foreground leading-snug">{task.title}</span>
        <StatusBadge status={task.priority} />
      </div>
      <div className="text-xs text-muted-foreground mb-2">{task.clientName}</div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{formatDate(task.dueDate)}</span>
        <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{task.type}</span>
      </div>
    </div>
  );
}

export default function Tasks() {
  const qc = useQueryClient();
  const searchString = useSearch();
  const [view, setView] = useState<"table" | "kanban">("table");
  const [filterStatus, setFilterStatus] = useState(() => {
    const params = new URLSearchParams(searchString);
    return params.get("status") ?? "";
  });
  const [filterPriority, setFilterPriority] = useState("");
  const [showForm, setShowForm] = useState(false);

  const { data: tasks, isLoading } = useListTasks({ status: filterStatus, priority: filterPriority });
  const { data: clients } = useListClients({});
  const createTask = useCreateTask({ mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: getListTasksQueryKey() }) } });
  const updateTask = useUpdateTask({ mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: getListTasksQueryKey() }) } });
  const deleteTask = useDeleteTask({ mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: getListTasksQueryKey() }) } });

  const clientsForForm = (clients ?? []).map(c => ({ id: c.id, name: c.name }));

  return (
    <AppLayout title="Tasks">
      {showForm && (
        <TaskForm
          clients={clientsForForm}
          onClose={() => setShowForm(false)}
          onSave={(data) => {
            createTask.mutate({ data: data as Parameters<typeof createTask.mutate>[0]["data"] });
            setShowForm(false);
          }}
        />
      )}

      <div className="space-y-5">
        {/* Toolbar */}
        <div className="flex items-center gap-3 flex-wrap">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="InProgress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Overdue">Overdue</option>
          </select>
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
            className="px-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>

          <div className="flex items-center gap-1 ml-auto bg-muted rounded-lg p-1">
            <button onClick={() => setView("table")}
              className={`p-1.5 rounded-md transition-colors ${view === "table" ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              <LayoutList className="w-4 h-4" />
            </button>
            <button onClick={() => setView("kanban")}
              className={`p-1.5 rounded-md transition-colors ${view === "kanban" ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              <Columns3 className="w-4 h-4" />
            </button>
          </div>

          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90">
            <Plus className="w-4 h-4" />
            Create Task
          </button>
        </div>

        {view === "table" ? (
          <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="p-6 space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />)}</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Task</th>
                      <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Client</th>
                      <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                      <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Due Date</th>
                      <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assigned</th>
                      <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Priority</th>
                      <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3.5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {(tasks ?? []).map(task => (
                      <tr key={task.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="font-medium text-foreground">{task.title}</div>
                          {task.description && <div className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">{task.description}</div>}
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground">{task.clientName}</td>
                        <td className="px-4 py-3.5">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">{task.type}</span>
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground">{formatDate(task.dueDate)}</td>
                        <td className="px-4 py-3.5 text-muted-foreground">{task.assignedTo}</td>
                        <td className="px-4 py-3.5"><StatusBadge status={task.priority} /></td>
                        <td className="px-4 py-3.5"><StatusBadge status={task.status} /></td>
                        <td className="px-4 py-3.5">
                          <button onClick={() => deleteTask.mutate({ id: task.id })}
                            className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(!tasks || tasks.length === 0) && <tr><td colSpan={8} className="px-5 py-12 text-center text-muted-foreground">No tasks found</td></tr>}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            {statusColumns.map(col => (
              <div key={col} className="bg-muted/50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-2 h-2 rounded-full ${
                    col === "Pending" ? "bg-yellow-400" :
                    col === "InProgress" ? "bg-blue-400" :
                    col === "Completed" ? "bg-green-400" :
                    "bg-red-400"
                  }`} />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {col === "InProgress" ? "In Progress" : col}
                  </span>
                  <span className="ml-auto bg-white text-muted-foreground text-xs px-1.5 py-0.5 rounded-full border border-border">
                    {tasks?.filter(t => t.status === col).length ?? 0}
                  </span>
                </div>
                <div className="space-y-2">
                  {(tasks ?? []).filter(t => t.status === col).map(task => (
                    <KanbanCard key={task.id} task={task} onUpdate={(id, status) =>
                      updateTask.mutate({ id, data: { title: task.title, clientId: task.clientId, type: task.type, dueDate: task.dueDate, assignedTo: task.assignedTo, status: status as Task["status"], priority: task.priority } })
                    } />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
