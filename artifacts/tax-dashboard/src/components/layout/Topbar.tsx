import { Bell, Search, ChevronDown, KeyRound, X, Eye, EyeOff } from "lucide-react";
import { useRef, useState } from "react";
import { useLocation } from "wouter";
import { useListClients, useListTasks } from "@workspace/api-client-react";
import { useRegion, type Region } from "@/contexts/RegionContext";
import { toast } from "sonner";

const CURRENT_USER = { id: 1, name: "Sarah Mitchell", role: "SuperAdmin", initials: "SM" };

function SearchDropdown({ query, onClose }: { query: string; onClose: () => void }) {
  const [, navigate] = useLocation();
  const { data: clients } = useListClients({ search: query });
  const { data: tasks } = useListTasks({});

  const matchedClients = (clients ?? []).slice(0, 4);
  const matchedTasks = (tasks ?? [])
    .filter(t => t.title.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 3);

  if (!query || (matchedClients.length === 0 && matchedTasks.length === 0)) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-xl shadow-xl z-50 overflow-hidden max-h-80 overflow-y-auto">
      {matchedClients.length > 0 && (
        <>
          <div className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted/50">Clients</div>
          {matchedClients.map(c => (
            <button key={c.id} onClick={() => { navigate(`/clients/${c.id}`); onClose(); }}
              className="w-full text-left px-3 py-2.5 text-sm hover:bg-muted/50 flex items-center gap-2.5 transition-colors">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ background: "hsl(224 76% 33%)" }}>
                {c.name.charAt(0)}
              </div>
              <div>
                <div className="font-medium">{c.name}</div>
                <div className="text-xs text-muted-foreground">{c.country} · {c.status}</div>
              </div>
            </button>
          ))}
        </>
      )}
      {matchedTasks.length > 0 && (
        <>
          <div className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted/50">Tasks</div>
          {matchedTasks.map(t => (
            <button key={t.id} onClick={() => { navigate("/tasks"); onClose(); }}
              className="w-full text-left px-3 py-2.5 text-sm hover:bg-muted/50 flex items-center gap-2.5 transition-colors">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 ml-2 shrink-0" />
              <div>
                <div className="font-medium">{t.title}</div>
                <div className="text-xs text-muted-foreground">{t.clientName} · {t.status}</div>
              </div>
            </button>
          ))}
        </>
      )}
      <div className="border-t border-border">
        <button onClick={() => { navigate(`/clients?search=${encodeURIComponent(query)}`); onClose(); }}
          className="w-full text-left px-3 py-2.5 text-xs text-primary hover:bg-muted/30 transition-colors">
          See all results for "{query}" →
        </button>
      </div>
    </div>
  );
}

function ResetPasswordModal({ onClose }: { onClose: () => void }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${CURRENT_USER.id}/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        toast.error(err.error ?? "Failed to reset password");
        return;
      }
      toast.success("Password updated successfully");
      onClose();
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "hsl(224 76% 33%)" }}>
              <KeyRound className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Reset Password</h2>
              <p className="text-xs text-muted-foreground">Update your account password</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="bg-muted/40 rounded-xl px-4 py-3 flex items-center gap-3 mb-1">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ background: "hsl(224 76% 33%)" }}>
              {CURRENT_USER.initials}
            </div>
            <div>
              <div className="text-sm font-medium text-foreground">{CURRENT_USER.name}</div>
              <div className="text-xs text-muted-foreground">{CURRENT_USER.role}</div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">New Password</label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
                className="w-full px-3 py-2.5 pr-10 text-sm border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <button type="button" onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                className="w-full px-3 py-2.5 pr-10 text-sm border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-500">Passwords do not match</p>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 text-sm font-medium border border-border rounded-lg hover:bg-muted transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-60"
              style={{ background: "hsl(224 76% 33%)" }}>
              {loading ? "Saving..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Topbar({ title }: { title: string }) {
  const [, navigate] = useLocation();
  const { region, setRegion } = useRegion();
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      navigate(`/clients?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowDropdown(false);
      inputRef.current?.blur();
    }
    if (e.key === "Escape") {
      setShowDropdown(false);
      inputRef.current?.blur();
    }
  };

  const isSuperAdmin = CURRENT_USER.role === "SuperAdmin";

  return (
    <>
      <div className="h-16 bg-white border-b border-border flex items-center px-6 gap-4 sticky top-0 z-20">
        <h1 className="text-base font-semibold text-foreground mr-4 shrink-0">{title}</h1>

        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            ref={inputRef}
            type="search"
            placeholder="Search clients, tasks..."
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            onKeyDown={handleKeyDown}
            className="w-full pl-9 pr-4 py-2 text-sm bg-muted border-0 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
          {showDropdown && searchQuery.length >= 2 && (
            <SearchDropdown query={searchQuery} onClose={() => { setShowDropdown(false); setSearchQuery(""); }} />
          )}
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <div className="relative">
            <select
              value={region}
              onChange={e => setRegion(e.target.value as Region)}
              className="appearance-none pl-3 pr-8 py-2 text-sm border border-border rounded-lg bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="All">All Regions</option>
              <option value="UK">UK</option>
              <option value="UAE">UAE</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>

          <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
          </button>

          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(prev => !prev)}
              onBlur={() => setTimeout(() => setShowUserMenu(false), 150)}
              className="flex items-center gap-2 cursor-pointer rounded-xl px-2 py-1.5 hover:bg-muted transition-colors"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: "hsl(224 76% 33%)" }}>
                SA
              </div>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-150 ${showUserMenu ? "rotate-180" : ""}`} />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-56 bg-white border border-border rounded-xl shadow-xl z-50 overflow-hidden py-1">
                <div className="px-4 py-3 border-b border-border">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ background: "hsl(224 76% 33%)" }}>
                      SA
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-foreground truncate">{CURRENT_USER.name}</div>
                      <div className="text-xs text-muted-foreground">{CURRENT_USER.role}</div>
                    </div>
                  </div>
                </div>

                {isSuperAdmin && (
                  <button
                    onClick={() => { setShowUserMenu(false); setShowResetModal(true); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-muted/60 transition-colors"
                  >
                    <KeyRound className="w-4 h-4 text-muted-foreground" />
                    Reset Password
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showResetModal && (
        <ResetPasswordModal onClose={() => setShowResetModal(false)} />
      )}
    </>
  );
}
