import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import StatusBadge from "@/components/StatusBadge";
import { formatDate } from "@/lib/utils";
import {
  useListUsers, useCreateUser, useDeleteUser,
  getListUsersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, X, Trash2, Shield, Check } from "lucide-react";
import type { User } from "@workspace/api-client-react";
import { toast } from "sonner";

const settingsTabs = ["General", "Tax Settings", "Users", "Roles & Permissions"];

const defaultRoles = [
  { name: "Super Admin", users: 1, permissions: ["Create Client", "Edit Client", "Delete Client", "Assign Task", "Manage Users", "View Reports", "Tax Settings"] },
  { name: "Admin", users: 1, permissions: ["Create Client", "Edit Client", "Assign Task", "View Reports"] },
  { name: "Manager", users: 1, permissions: ["Create Client", "Edit Client", "Assign Task", "View Reports"] },
  { name: "Employee", users: 2, permissions: ["Edit Client", "Assign Task"] },
];

const allPermissions = ["Create Client", "Edit Client", "Delete Client", "Assign Task", "Manage Users", "View Reports", "Tax Settings"];

function UserForm({ onClose, onSave }: {
  onClose: () => void;
  onSave: (data: unknown) => void;
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "Employee" as User["role"],
    status: "Active" as User["status"],
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-base font-semibold">Add User</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Full Name *</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email *</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Role *</label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as User["role"] })}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="SuperAdmin">Super Admin</option>
                <option value="Admin">Admin</option>
                <option value="Manager">Manager</option>
                <option value="Employee">Employee</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as User["status"] })}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">Cancel</button>
          <button onClick={() => onSave(form)} disabled={!form.name || !form.email}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50">
            Add User
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Settings() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("Users");
  const [showUserForm, setShowUserForm] = useState(false);
  const [editRole, setEditRole] = useState<string | null>(null);
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>(
    Object.fromEntries(defaultRoles.map(r => [r.name, [...r.permissions]]))
  );

  const { data: users, isLoading } = useListUsers();
  const createUser = useCreateUser({
    mutation: {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListUsersQueryKey() }); toast.success("User added"); },
      onError: () => toast.error("Failed to add user"),
    }
  });
  const deleteUser = useDeleteUser({
    mutation: {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListUsersQueryKey() }); toast.success("User removed"); },
      onError: () => toast.error("Failed to remove user"),
    }
  });

  const togglePermission = (roleName: string, perm: string) => {
    setRolePermissions(prev => {
      const current = prev[roleName] ?? [];
      const updated = current.includes(perm)
        ? current.filter(p => p !== perm)
        : [...current, perm];
      return { ...prev, [roleName]: updated };
    });
  };

  const savePermissions = (roleName: string) => {
    toast.success(`Permissions saved for ${roleName}`);
  };

  return (
    <AppLayout title="Settings">
      {showUserForm && (
        <UserForm
          onClose={() => setShowUserForm(false)}
          onSave={(data) => {
            createUser.mutate({ data: data as Parameters<typeof createUser.mutate>[0]["data"] });
            setShowUserForm(false);
          }}
        />
      )}

      <div className="space-y-5">
        {/* Tab bar */}
        <div className="border-b border-border flex gap-1">
          {settingsTabs.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
              {t}
            </button>
          ))}
        </div>

        {tab === "General" && (
          <div className="max-w-lg space-y-6">
            <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
              <h3 className="font-semibold text-sm mb-4">Organisation Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Organisation Name</label>
                  <input defaultValue="TaxFlow Accounting Ltd" className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Primary Region</label>
                  <select defaultValue="UK" className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20">
                    <option value="UK">United Kingdom</option>
                    <option value="UAE">United Arab Emirates</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Time Zone</label>
                  <select defaultValue="Europe/London" className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20">
                    <option value="Europe/London">Europe/London (GMT+0)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GMT+4)</option>
                  </select>
                </div>
              </div>
              <div className="mt-5 flex justify-end">
                <button className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90">Save Changes</button>
              </div>
            </div>
          </div>
        )}

        {tab === "Tax Settings" && (
          <div className="max-w-lg space-y-4">
            <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
              <h3 className="font-semibold text-sm mb-4">UK Tax Settings</h3>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Standard VAT Rate</span>
                  <span className="font-medium">20%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Reduced VAT Rate</span>
                  <span className="font-medium">5%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Corporation Tax Rate</span>
                  <span className="font-medium">25%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Filing Reminder Days</span>
                  <span className="font-medium">14 days</span>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
              <h3 className="font-semibold text-sm mb-4">UAE Tax Settings</h3>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">VAT Rate</span>
                  <span className="font-medium">5%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Corporate Tax Rate (2023+)</span>
                  <span className="font-medium">9%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "Users" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button onClick={() => setShowUserForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90">
                <Plus className="w-4 h-4" />
                Add User
              </button>
            </div>
            <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
              {isLoading ? (
                <div className="p-6 space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />)}</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase">Name</th>
                      <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase">Email</th>
                      <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase">Role</th>
                      <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                      <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase">Added</th>
                      <th className="px-4 py-3.5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {(users ?? []).map(u => (
                      <tr key={u.id} className="hover:bg-muted/20">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                              style={{ background: "hsl(224 76% 33%)" }}>
                              {u.name.charAt(0)}
                            </div>
                            <span className="font-medium">{u.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground">{u.email}</td>
                        <td className="px-4 py-3.5">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">{u.role}</span>
                        </td>
                        <td className="px-4 py-3.5"><StatusBadge status={u.status} /></td>
                        <td className="px-4 py-3.5 text-muted-foreground text-xs">{formatDate(u.createdAt)}</td>
                        <td className="px-4 py-3.5">
                          <button onClick={() => deleteUser.mutate({ id: u.id })}
                            className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(!users || users.length === 0) && <tr><td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">No users</td></tr>}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {tab === "Roles & Permissions" && (
          <div className="grid grid-cols-5 gap-5">
            {/* Role list */}
            <div className="col-span-2 bg-white rounded-xl border border-border shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border">
                <h3 className="font-semibold text-sm">Roles</h3>
              </div>
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Users</th>
                  <th className="px-4 py-3"></th>
                </tr></thead>
                <tbody className="divide-y divide-border">
                  {defaultRoles.map(r => (
                    <tr key={r.name} className={`hover:bg-muted/20 transition-colors cursor-pointer ${editRole === r.name ? "bg-primary/5" : ""}`}
                      onClick={() => setEditRole(r.name)}>
                      <td className="px-5 py-3.5 font-medium">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-primary" />
                          {r.name}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground">{r.users}</td>
                      <td className="px-4 py-3.5">
                        <button className="text-xs text-primary hover:underline" onClick={e => { e.stopPropagation(); setEditRole(r.name); }}>Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Permission editor */}
            <div className="col-span-3 bg-white rounded-xl border border-border shadow-sm overflow-hidden">
              {editRole ? (
                <>
                  <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Permissions — {editRole}</h3>
                    <button onClick={() => setEditRole(null)} className="p-1 hover:bg-muted rounded-lg"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="p-5 space-y-3">
                    {allPermissions.map(perm => {
                      const has = (rolePermissions[editRole] ?? []).includes(perm);
                      return (
                        <button key={perm} onClick={() => togglePermission(editRole, perm)}
                          className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/20 transition-colors cursor-pointer text-left">
                          <span className="text-sm font-medium">{perm}</span>
                          <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-colors shrink-0 ${
                            has ? "bg-primary border-primary" : "border-border bg-white"
                          }`}>
                            {has && <Check className="w-3 h-3 text-white" />}
                          </div>
                        </button>
                      );
                    })}
                    <div className="pt-3 flex justify-end">
                      <button onClick={() => savePermissions(editRole)}
                        className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90">
                        Save Permissions
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
                  Select a role to edit permissions
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
