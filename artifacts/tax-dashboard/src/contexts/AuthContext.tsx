// @refresh reset
import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

const ROLE_DEFAULT_PERMISSIONS: Record<string, string[]> = {
  SuperAdmin: ["Create Client", "Edit Client", "Delete Client", "Assign Task", "Manage Users", "View Reports", "Tax Settings"],
  Admin: ["Create Client", "Edit Client", "Assign Task", "View Reports"],
  Manager: ["Create Client", "Edit Client", "Assign Task", "View Reports"],
  Employee: ["Edit Client", "Assign Task"],
};

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  username?: string | null;
  role: "SuperAdmin" | "Admin" | "Manager" | "Employee";
  status: string;
  permissions?: string | null;
  region?: "All" | "UK" | "UAE";
};

type AuthContextType = {
  user: AuthUser | null;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (perm: string) => boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  const login = useCallback(async (identifier: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? "Invalid email or password");
    }
    const data: AuthUser = await res.json();
    setUser(data);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const hasPermission = useCallback((perm: string): boolean => {
    if (!user) return false;
    if (user.permissions !== null && user.permissions !== undefined) {
      try {
        const parsed = JSON.parse(user.permissions);
        if (Array.isArray(parsed)) return parsed.includes(perm);
      } catch {
        // ignore malformed JSON
      }
      return false;
    }
    return (ROLE_DEFAULT_PERMISSIONS[user.role] ?? []).includes(perm);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
