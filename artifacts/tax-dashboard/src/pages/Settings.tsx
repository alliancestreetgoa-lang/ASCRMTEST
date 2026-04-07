import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import StatusBadge from "@/components/StatusBadge";
import { formatDate } from "@/lib/utils";
import {
  useListUsers, useCreateUser, useUpdateUser, useDeleteUser,
  getListUsersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, X, Trash2, Pencil, Shield, Check, Eye, EyeOff } from "lucide-react";
import type { User } from "@workspace/api-client-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const settingsTabs = ["General", "Tax Settings", "Users", "Roles & Permissions"];

const defaultRoles: Record<string, string[]> = {
  "Super Admin": ["Create Client", "Edit Client", "Delete Client", "Assign Task", "Manage Users", "View Reports", "Tax Settings"],
  "SuperAdmin": ["Create Client", "Edit Client", "Delete Client", "Assign Task", "Manage Users", "View Reports", "Tax Settings"],
  "Admin": ["Create Client", "Edit Client", "Assign Task", "View Reports"],
  "Manager": ["Create Client", "Edit Client", "Assign Task", "View Reports"],
  "Employee": ["Edit Client", "Assign Task"],
};

const roleNames = ["Super Admin", "Admin", "Manager", "Employee"];

const allPermissions = ["Create Client", "Edit Client", "Delete Client", "Assign Task", "Manage Users", "View Reports", "Tax Settings"];

function parseUserPermissions(user: User): string[] | null {
  if (!user.permissions) return null;
  try {
    const parsed = JSON.parse(user.permissions);
    if (Array.isArray(parsed)) return parsed as string[];
  } catch {
    // ignore
  }
  return null;
}

function getEffectivePermissions(user: User): string[] {
  const custom = parseUserPermissions(user);
  if (custom !== null) return custom;
  return defaultRoles[user.role] ?? [];
}

function UserPermissionsModal({ user, onClose, onSaved }: {
  user: User;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [perms, setPerms] = useState<string[]>(getEffectivePermissions(user));
  const [saving, setSaving] = useState(false);
  const hasCustom = parseUserPermissions(user) !== null;

  const toggle = (perm: string) => {
    setPerms(prev =>
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${user.id}/permissions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: perms }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(`Permissions saved for ${user.name}`);
      onSaved();
      onClose();
    } catch {
      toast.error("Failed to save permissions");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    const roleDefaults = defaultRoles[user.role] ?? [];
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${user.id}/permissions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: null }),
      });
      if (!res.ok) throw new Error("Failed");
      setPerms(roleDefaults);
      toast.success(`Reset to ${user.role} defaults`);
      onSaved();
    } catch {
      toast.error("Failed to reset permissions");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-base font-semibold">Permissions — {user.name}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {hasCustom ? "Custom permissions set" : `Using ${user.role} role defaults`}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-2.5">
          {allPermissions.map(perm => {
            const has = perms.includes(perm);
            return (
              <button
                key={perm}
                onClick={() => toggle(perm)}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/20 transition-colors text-left"
              >
                <span className="text-sm font-medium">{perm}</span>
                <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-colors shrink-0 ${
                  has ? "bg-primary border-primary" : "border-border bg-white"
                }`}>
                  {has && <Check className="w-3 h-3 text-white" />}
                </div>
              </button>
            );
          })}
        </div>

        <div className="px-6 py-4 border-t flex items-center justify-between gap-3">
          {hasCustom && (
            <button
              onClick={handleReset}
              disabled={saving}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors disabled:opacity-50"
            >
              Reset to role defaults
            </button>
          )}
          <div className="flex gap-3 ml-auto">
            <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save Permissions"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function UserForm({ onClose, onSave, editUser }: {
  onClose: () => void;
  onSave: (data: { name: string; email: string; username?: string; role: User["role"]; status: User["status"]; password?: string }) => void;
  editUser?: User;
}) {
  const isEditing = !!editUser;
  const [form, setForm] = useState({
    name: editUser?.name ?? "",
    email: editUser?.email ?? "",
    username: editUser?.username ?? "",
    role: (editUser?.role ?? "Employee") as User["role"],
    status: (editUser?.status ?? "Active") as User["status"],
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleSave = () => {
    const payload: { name: string; email: string; username?: string; role: User["role"]; status: User["status"]; password?: string } = {
      name: form.name,
      email: form.email,
      role: form.role,
      status: form.status,
    };
    if (form.username.trim()) payload.username = form.username.trim();
    if (form.password.trim()) payload.password = form.password.trim();
    onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-base font-semibold">{isEditing ? "Edit User" : "Add User"}</h2>
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
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Username
              <span className="ml-1 text-muted-foreground/60 font-normal">(used for login)</span>
            </label>
            <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
              placeholder="e.g. shaukin"
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
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              {isEditing ? "New Password" : "Password"}
              {isEditing && <span className="ml-1 text-muted-foreground/60 font-normal">(leave blank to keep unchanged)</span>}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder={isEditing ? "Enter new password…" : "Set a password…"}
                className="w-full px-3 py-2.5 pr-10 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">Cancel</button>
          <button onClick={handleSave} disabled={!form.name || !form.email}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50">
            {isEditing ? "Save Changes" : "Add User"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SuperAdmin";
  const qc = useQueryClient();
  const [tab, setTab] = useState("Users");
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [permissionsUser, setPermissionsUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState<string | null>(null);
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>(
    Object.fromEntries(roleNames.map(name => [name, [...(defaultRoles[name] ?? defaultRoles[name === "Super Admin" ? "SuperAdmin" : name] ?? [])]]))
  );

  const { data: users, isLoading } = useListUsers();
  const createUser = useCreateUser({
    mutation: {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListUsersQueryKey() }); toast.success("User added"); },
      onError: () => toast.error("Failed to add user"),
    }
  });
  const updateUser = useUpdateUser({
    mutation: {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListUsersQueryKey() }); toast.success("User updated"); setEditingUser(null); },
      onError: () => toast.error("Failed to update user"),
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
            const { password: _pw, ...rest } = data as { name: string; email: string; role: User["role"]; status: User["status"]; password?: string };
            createUser.mutate({ data: rest });
            setShowUserForm(false);
          }}
        />
      )}
      {editingUser && (
        <UserForm
          editUser={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={async (data) => {
            const { password, ...rest } = data as { name: string; email: string; role: User["role"]; status: User["status"]; password?: string };
            updateUser.mutate({ id: editingUser.id, data: rest });
            if (password) {
              try {
                const res = await fetch(`/api/users/${editingUser.id}/password`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ newPassword: password }),
                });
                if (!res.ok) toast.error("User updated but password change failed");
              } catch {
                toast.error("User updated but password change failed");
              }
            }
          }}
        />
      )}
      {permissionsUser && (
        <UserPermissionsModal
          user={permissionsUser}
          onClose={() => setPermissionsUser(null)}
          onSaved={() => qc.invalidateQueries({ queryKey: getListUsersQueryKey() })}
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
            {isSuperAdmin && (
              <div className="flex justify-end">
                <button onClick={() => setShowUserForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90">
                  <Plus className="w-4 h-4" />
                  Add User
                </button>
              </div>
            )}
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
                      {isSuperAdmin && <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase text-left">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {(users ?? []).map(u => {
                      const hasCustomPerms = parseUserPermissions(u) !== null;
                      return (
                        <tr key={u.id} className="hover:bg-muted/20">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                                style={{ background: "hsl(224 76% 33%)" }}>
                                {u.name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-medium">{u.name}</div>
                                {u.username && <div className="text-xs text-muted-foreground">@{u.username}</div>}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-muted-foreground">{u.email}</td>
                          <td className="px-4 py-3.5">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">{u.role}</span>
                          </td>
                          <td className="px-4 py-3.5"><StatusBadge status={u.status} /></td>
                          <td className="px-4 py-3.5 text-muted-foreground text-xs">{formatDate(u.createdAt)}</td>
                          {isSuperAdmin && (
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setPermissionsUser(u)}
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    hasCustomPerms
                                      ? "bg-teal-50 text-teal-600 hover:bg-teal-100"
                                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                  }`}
                                  title={hasCustomPerms ? "Custom permissions set — click to edit" : "Set permissions"}
                                >
                                  <Shield className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => setEditingUser(u)}
                                  className="p-1.5 hover:bg-blue-50 text-blue-500 rounded-lg transition-colors"
                                  title="Edit user">
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => deleteUser.mutate({ id: u.id })}
                                  className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                                  title="Delete user">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                    {(!users || users.length === 0) && <tr><td colSpan={isSuperAdmin ? 6 : 5} className="px-5 py-12 text-center text-muted-foreground">No users</td></tr>}
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
                  {roleNames.map(roleName => {
                    const dbKey = roleName === "Super Admin" ? "SuperAdmin" : roleName;
                    const count = (users ?? []).filter(u => u.role === dbKey).length;
                    return (
                      <tr key={roleName} className={`hover:bg-muted/20 transition-colors cursor-pointer ${editRole === roleName ? "bg-primary/5" : ""}`}
                        onClick={() => setEditRole(roleName)}>
                        <td className="px-5 py-3.5 font-medium">
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-primary" />
                            {roleName}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground">{count}</td>
                        <td className="px-4 py-3.5">
                          {isSuperAdmin && (
                            <button className="text-xs text-primary hover:underline" onClick={e => { e.stopPropagation(); setEditRole(roleName); }}>Edit</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
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
                        <button key={perm}
                          onClick={() => isSuperAdmin && togglePermission(editRole, perm)}
                          disabled={!isSuperAdmin}
                          className={`w-full flex items-center justify-between p-3 rounded-lg border border-border transition-colors text-left ${isSuperAdmin ? "hover:bg-muted/20 cursor-pointer" : "cursor-default opacity-80"}`}>
                          <span className="text-sm font-medium">{perm}</span>
                          <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-colors shrink-0 ${
                            has ? "bg-primary border-primary" : "border-border bg-white"
                          }`}>
                            {has && <Check className="w-3 h-3 text-white" />}
                          </div>
                        </button>
                      );
                    })}
                    {isSuperAdmin && (
                      <div className="pt-3 flex justify-end">
                        <button onClick={() => savePermissions(editRole)}
                          className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90">
                          Save Permissions
                        </button>
                      </div>
                    )}
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
