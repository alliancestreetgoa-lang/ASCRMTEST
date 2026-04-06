import AppLayout from "@/components/layout/AppLayout";
import StatusBadge from "@/components/StatusBadge";
import { formatDate, getDaysUntil } from "@/lib/utils";
import {
  useGetDashboardSummary,
  useGetUpcomingDeadlines,
  useGetDashboardAlerts,
} from "@workspace/api-client-react";
import {
  Users, CheckSquare, AlertTriangle, CheckCircle,
  FileText, Building2, Calendar, TrendingUp
} from "lucide-react";
import { Link } from "wouter";

function StatCard({ icon: Icon, value, label, color, sub, href }: {
  icon: React.ElementType;
  value: number | undefined;
  label: string;
  color: string;
  sub?: string;
  href?: string;
}) {
  const card = (
    <div className={`bg-white rounded-xl border border-border p-5 shadow-sm transition-all hover:shadow-md ${href ? "cursor-pointer hover:border-gray-300 hover:-translate-y-0.5" : ""}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{label}</p>
          <p className="text-3xl font-bold mt-1" style={{ color }}>
            {value ?? "—"}
          </p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + "18" }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} className="block no-underline">{card}</Link>;
  }
  return card;
}

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary();
  const { data: deadlines, isLoading: loadingDeadlines } = useGetUpcomingDeadlines({ limit: 8 });
  const { data: alerts, isLoading: loadingAlerts } = useGetDashboardAlerts();

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            value={summary?.totalClients}
            label="Total Clients"
            color="hsl(224 76% 33%)"
            sub="Active accounts"
            href="/clients"
          />
          <StatCard
            icon={CheckSquare}
            value={summary?.pendingTasks}
            label="Pending Tasks"
            color="hsl(43 96% 45%)"
            sub="Awaiting action"
            href="/tasks?status=Pending"
          />
          <StatCard
            icon={AlertTriangle}
            value={summary?.overdueTasks}
            label="Overdue"
            color="hsl(0 84% 55%)"
            sub="Tasks, VAT & Corp. Tax"
            href="/corporate-tax"
          />
          <StatCard
            icon={CheckCircle}
            value={summary?.completedTasks}
            label="Completed"
            color="hsl(142 71% 35%)"
            sub="This period"
            href="/tasks?status=Completed"
          />
        </div>

        {/* Main content */}
        <div className="grid grid-cols-10 gap-6">
          {/* Upcoming Deadlines — 70% */}
          <div className="col-span-7">
            <div className="bg-white rounded-xl border border-border shadow-sm">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm">Upcoming Deadlines</h2>
                </div>
                <span className="text-xs text-muted-foreground">Sorted by due date</span>
              </div>
              <div className="overflow-x-auto">
                {loadingDeadlines ? (
                  <div className="p-6 space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-10 bg-muted rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Client</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Due Date</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assigned</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {(deadlines ?? []).map((dl) => {
                        const days = getDaysUntil(dl.dueDate);
                        return (
                          <tr key={dl.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-5 py-3.5 font-medium text-foreground">{dl.clientName}</td>
                            <td className="px-4 py-3.5">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                dl.type === "VAT" ? "bg-blue-100 text-blue-800" :
                                dl.type === "CorporateTax" ? "bg-purple-100 text-purple-800" :
                                "bg-gray-100 text-gray-700"
                              }`}>
                                {dl.type === "CorporateTax" ? "CT" : dl.type}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-foreground">
                              <div>{formatDate(dl.dueDate)}</div>
                              {days < 0 ? (
                                <div className="text-xs text-red-600 font-medium">{Math.abs(days)}d overdue</div>
                              ) : days === 0 ? (
                                <div className="text-xs text-orange-600 font-medium">Due today</div>
                              ) : days <= 7 ? (
                                <div className="text-xs text-yellow-600 font-medium">In {days}d</div>
                              ) : null}
                            </td>
                            <td className="px-4 py-3.5"><StatusBadge status={dl.status} /></td>
                            <td className="px-4 py-3.5 text-muted-foreground">{dl.assignedTo}</td>
                          </tr>
                        );
                      })}
                      {(!deadlines || deadlines.length === 0) && (
                        <tr><td colSpan={5} className="px-5 py-8 text-center text-muted-foreground text-sm">No upcoming deadlines</td></tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          {/* Alerts Panel — 30% */}
          <div className="col-span-3">
            <div className="bg-white rounded-xl border border-border shadow-sm h-full">
              <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-sm">Alerts</h2>
                <span className="ml-auto bg-red-100 text-red-700 text-xs font-medium px-2 py-0.5 rounded-full">
                  {alerts?.filter(a => a.type === "Overdue").length ?? 0}
                </span>
              </div>
              <div className="p-3 space-y-2 overflow-y-auto max-h-96">
                {loadingAlerts ? (
                  [...Array(4)].map((_, i) => (
                    <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
                  ))
                ) : (
                  (alerts ?? []).map((alert) => (
                    <div key={alert.id} className={`p-3 rounded-lg border text-xs ${
                      alert.type === "Overdue" ? "bg-red-50 border-red-200" :
                      alert.type === "Upcoming" ? "bg-yellow-50 border-yellow-200" :
                      "bg-green-50 border-green-200"
                    }`}>
                      <div className={`font-semibold mb-0.5 ${
                        alert.type === "Overdue" ? "text-red-800" :
                        alert.type === "Upcoming" ? "text-yellow-800" :
                        "text-green-800"
                      }`}>
                        {alert.type}
                      </div>
                      <div className="text-gray-700 leading-snug">{alert.message}</div>
                      <div className="text-gray-500 mt-1 flex justify-between">
                        <span>{alert.clientName}</span>
                        <span>{formatDate(alert.dueDate)}</span>
                      </div>
                    </div>
                  ))
                )}
                {!loadingAlerts && (!alerts || alerts.length === 0) && (
                  <div className="text-center py-6 text-muted-foreground text-sm">No alerts</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* VAT / CT Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-border p-5 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">VAT Due This Month</p>
              <p className="text-2xl font-bold text-blue-700">{summary?.vatDueThisMonth ?? "—"}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-border p-5 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Corp. Tax Due This Month</p>
              <p className="text-2xl font-bold text-purple-700">{summary?.corporateTaxDueThisMonth ?? "—"}</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
