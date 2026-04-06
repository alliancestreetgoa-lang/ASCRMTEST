import { useState } from "react";
import { Eye, EyeOff, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Please enter your email and password");
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "hsl(222 47% 11%)" }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-10"
            style={{ background: "hsl(224 76% 45%)" }} />
          <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full opacity-10"
            style={{ background: "hsl(172 66% 50%)" }} />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "hsl(224 76% 45%)" }}>
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-xl">TaxFlow</span>
          </div>
          <div className="text-sm" style={{ color: "hsl(215 16% 55%)" }}>Pro Dashboard</div>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-white leading-tight mb-3">
              Streamline your tax<br />& accounting workflow
            </h2>
            <p className="text-base leading-relaxed" style={{ color: "hsl(215 16% 55%)" }}>
              Manage clients, track VAT filings, corporate tax deadlines, and team tasks — all in one place.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { label: "Client Management", desc: "135+ UAE & UK clients organised at a glance" },
              { label: "VAT & Corporate Tax Tracker", desc: "Deadline alerts, overdue flags, filing status" },
              { label: "Team Task Management", desc: "Assign, track, and complete tasks effortlessly" },
            ].map(f => (
              <div key={f.label} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: "hsl(172 66% 35%)" }}>
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <div className="text-white text-sm font-medium">{f.label}</div>
                  <div className="text-xs mt-0.5" style={{ color: "hsl(215 16% 50%)" }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-xs" style={{ color: "hsl(215 16% 40%)" }}>
          © 2026 TaxFlow Pro · UK & UAE Accounting
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "hsl(224 76% 45%)" }}>
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg" style={{ color: "hsl(222 47% 11%)" }}>TaxFlow</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-1" style={{ color: "hsl(222 47% 11%)" }}>Welcome back</h1>
            <p className="text-sm text-muted-foreground">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@alliancestreet.ae"
                autoComplete="email"
                className="w-full px-3.5 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full px-3.5 py-2.5 pr-11 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60"
              style={{ background: "hsl(224 76% 33%)" }}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
