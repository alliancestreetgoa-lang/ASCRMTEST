import { useLocation } from "wouter";
import {
  LayoutDashboard, Users, CheckSquare, FileText, BarChart3,
  Settings, ChevronDown, TrendingUp, LogOut, Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: Users, label: "Clients", href: "/clients" },
  { icon: CheckSquare, label: "Tasks", href: "/tasks" },
  {
    icon: FileText, label: "Tax",
    children: [
      { label: "VAT Tracker", href: "/vat" },
      { label: "Corporate Tax", href: "/corporate-tax" },
    ]
  },
  { icon: BarChart3, label: "Reports", href: "/reports" },
  { icon: Shield, label: "Users", href: "/settings/users" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export default function Sidebar() {
  const [location, navigate] = useLocation();
  const { user, logout } = useAuth();
  const [taxOpen, setTaxOpen] = useState(
    location.startsWith("/vat") || location.startsWith("/corporate-tax")
  );
  const initials = user ? user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "?";

  return (
    <div className="fixed left-0 top-0 h-screen w-60 flex flex-col z-30" style={{ background: "hsl(222 47% 11%)" }}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b" style={{ borderColor: "hsl(222 40% 18%)" }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "hsl(224 76% 45%)" }}>
          <TrendingUp className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="text-white font-bold text-sm leading-tight">TaxFlow</div>
          <div className="text-xs" style={{ color: "hsl(215 16% 55%)" }}>Pro Dashboard</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          if (item.children) {
            const isParentActive = item.children.some(c => location.startsWith(c.href));
            return (
              <div key={item.label}>
                <button
                  onClick={() => setTaxOpen(!taxOpen)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                    isParentActive ? "text-white bg-white/10" : "hover:bg-white/5"
                  )}
                  style={{ color: isParentActive ? "white" : "hsl(215 20% 65%)" }}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronDown className={cn("w-4 h-4 transition-transform", taxOpen ? "rotate-180" : "")} />
                </button>
                {taxOpen && (
                  <div className="ml-7 mt-0.5 space-y-0.5">
                    {item.children.map(child => {
                      const isActive = location === child.href || location.startsWith(child.href + "/");
                      return (
                        <button
                          key={child.href}
                          onClick={() => navigate(child.href)}
                          className={cn(
                            "w-full text-left block px-3 py-2 rounded-lg text-sm transition-all duration-150",
                            isActive ? "text-white bg-white/10 font-medium" : "hover:bg-white/5"
                          )}
                          style={{ color: isActive ? "white" : "hsl(215 20% 65%)" }}
                        >
                          {child.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const isActive = item.href === "/"
            ? location === "/"
            : location.startsWith(item.href);

          return (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              className={cn(
                "w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                isActive ? "text-white bg-white/10" : "hover:bg-white/5"
              )}
              style={{ color: isActive ? "white" : "hsl(215 20% 65%)" }}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
              {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t" style={{ borderColor: "hsl(222 40% 18%)" }}>
        <div onClick={logout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 cursor-pointer transition-all group">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ background: "hsl(224 76% 45%)" }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-xs font-medium truncate">{user?.name}</div>
            <div className="text-xs truncate" style={{ color: "hsl(215 16% 55%)" }}>{user?.role}</div>
          </div>
          <LogOut className="w-4 h-4 shrink-0 group-hover:text-red-400 transition-colors" style={{ color: "hsl(215 16% 55%)" }} />
        </div>
      </div>
    </div>
  );
}
