import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import StatusBadge from "@/components/StatusBadge";
import UserSelector from "@/components/UserSelector";
import { formatDate } from "@/lib/utils";
import {
  useListTasks, useCreateTask, useUpdateTask, useDeleteTask, useListClients,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, LayoutList, Columns3, X, Trash2, Pencil } from "lucide-react";
import type { Task } from "@workspace/api-client-react";
import { useSearch } from "wouter";
import { toast } from "sonner";

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
              <UserSelector
                value={form.assignedTo}
                onChange={v => setForm({ ...form, assignedTo: v })}
              />
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
            {initial?.id ? "Save Changes" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

function KanbanCard({ task, onEdit }: { task: Task; onEdit: (task: Task) => void }) {
  return (
    <div onClick={() => onEdit(task)}
      className="bg-white border border-border rounded-xl p-3.5 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
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
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: tasks, isLoading } = useListTasks({ status: filterStatus, priority: filterPriority });
  const { data: clients } = useListClients({});

  const invalidate = () => qc.invalidateQueries({ queryKey: ["/api/tasks"] });

  const createTask = useCreateTask({
    mutation: {
      onSuccess: () => { invalidate(); toast.success("Task created successfully"); },
      onError: () => toast.error("Failed to create task"),
    }
  });
  const updateTask = useUpdateTask({
    mutation: {
      onSuccess: (updated) => {
        qc.setQueriesData(
          { queryKey: ["/api/tasks"] },
          (old: Task[] | undefined) => old ? old.map(t => t.id === updated.id ? { ...t, ...updated } : t) : old,
        );
        invalidate();
        toast.success("Task updated");
      },
      onError: () => toast.error("Failed to update task"),
    }
  });
  const deleteTask = useDeleteTask({
    mutation: {
      onSuccess: () => { invalidate(); toast.success("Task deleted"); },
      onError: () => toast.error("Failed to delete task"),
    }
  });

  const clientsForForm = (clients ?? []).map(c => ({ id: c.id, name: c.name }));

  const openCreate = () => { setEditingTask(null); setShowForm(true); };
  const openEdit = (task: Task) => { setEditingTask(task); setShowForm(true); };
  const closeForm = () => { setEditingTask(null); setShowForm(false); };

  return (
    <AppLayout title="Tasks">
      {showForm && (
        <TaskForm
          initial={editingTask ?? undefined}
          clients={clientsForForm}
          onClose={closeForm}
          onSave={(data) => {
            if (editingTask) {
              updateTask.mutate({ id: editingTask.id, data: data as Parameters<typeof updateTask.mutate>[0]["data"] });
            } else {
              createTask.mutate({ data: data as Parameters<typeof createTask.mutate>[0]["data"] });
            }
            closeForm();
          }}
        />
      )}

      <div className="space-y-5">
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

          <button onClick={openCreate}
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
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">{task.type === "CorporateTax" ? "Corp. Tax" : task.type}</span>
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground">{formatDate(task.dueDate)}</td>
                        <td className="px-4 py-3.5 text-muted-foreground">{task.assignedTo}</td>
                        <td className="px-4 py-3.5"><StatusBadge status={task.priority} /></td>
                        <td className="px-4 py-3.5"><StatusBadge status={task.status} /></td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1">
                            <button onClick={() => openEdit(task)}
                              className="p-1.5 hover:bg-yellow-50 text-yellow-600 rounded-lg transition-colors" title="Edit">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setDeleteId(task.id)}
                              className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors" title="Delete">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {(!tasks || tasks.length === 0) && <tr><td colSpan={8} className="px-5 py-12 text-center text-muted-foreground">No tasks found</td></tr>}
                  </tbody>
                </table>
              )}
            </div>
            {tasks && tasks.length > 0 && (
              <div className="px-5 py-3 border-t border-border">
                <span className="text-xs text-muted-foreground">{tasks.length} task{tasks.length !== 1 ? "s" : ""}</span>
              </div>
            )}
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
                    <KanbanCard key={task.id} task={task} onEdit={openEdit} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="font-semibold text-base mb-2">Delete Task</h3>
            <p className="text-sm text-muted-foreground mb-6">Are you sure you want to delete this task? This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">Cancel</button>
              <button onClick={() => { deleteTask.mutate({ id: deleteId }); setDeleteId(null); }}
                className="px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded-lg hover:opacity-90">Delete</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
