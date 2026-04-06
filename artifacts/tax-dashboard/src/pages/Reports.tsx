import { useMemo, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import StatusBadge from "@/components/StatusBadge";
import { formatDate } from "@/lib/utils";
import {
  useGetDashboardSummary,
  useListTasks,
  useListVatRecords,
  useListCorporateTax,
  useListClients,
} from "@workspace/api-client-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  TrendingUp, Users, FileText, Building2, CheckCircle,
  AlertTriangle, Clock,
} from "lucide-react";

const COLORS = {
  primary: "hsl(224, 76%, 33%)",
  teal: "hsl(172, 60%, 25%)",
  yellow: "hsl(43, 96%, 50%)",
  red: "hsl(0, 84%, 55%)",
  green: "hsl(142, 71%, 35%)",
  purple: "hsl(262, 52%, 47%)",
  blue: "hsl(213, 94%, 55%)",
  orange: "hsl(25, 95%, 53%)",
};

const PIE_COLORS = [COLORS.green, COLORS.yellow, COLORS.blue, COLORS.red];

const reportTabs = ["Overview", "VAT Analysis", "Corporate Tax", "Task Performance", "Client Insights"];

function StatMini({ icon: Icon, value, label, color }: { icon: React.ElementType; value: string | number; label: string; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-border p-4 shadow-sm flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: color + "18" }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-bold" style={{ color }}>{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function ChartCard({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-border shadow-sm ${className ?? ""}`}>
      <div className="px-5 py-4 border-b border-border">
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function Reports() {
  const [tab, setTab] = useState("Overview");

  const { data: summary } = useGetDashboardSummary();
  const { data: tasks } = useListTasks({});
  const { data: vatRecords } = useListVatRecords({});
  const { data: ctRecords } = useListCorporateTax({});
  const { data: clients } = useListClients({});

  const taskStatusData = useMemo(() => {
    if (!tasks) return [];
    const counts: Record<string, number> = {};
    tasks.forEach(t => { counts[t.status] = (counts[t.status] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name: name === "InProgress" ? "In Progress" : name, value }));
  }, [tasks]);

  const taskTypeData = useMemo(() => {
    if (!tasks) return [];
    const counts: Record<string, number> = {};
    tasks.forEach(t => { counts[t.type] = (counts[t.type] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name: name === "CorporateTax" ? "Corp. Tax" : name, value }));
  }, [tasks]);

  const taskPriorityData = useMemo(() => {
    if (!tasks) return [];
    const counts: Record<string, number> = {};
    tasks.forEach(t => { counts[t.priority] = (counts[t.priority] || 0) + 1; });
    return ["Low", "Medium", "High", "Critical"].filter(p => counts[p]).map(name => ({ name, value: counts[name] }));
  }, [tasks]);

  const assigneeData = useMemo(() => {
    if (!tasks) return [];
    const counts: Record<string, { total: number; completed: number; overdue: number }> = {};
    tasks.forEach(t => {
      if (!counts[t.assignedTo]) counts[t.assignedTo] = { total: 0, completed: 0, overdue: 0 };
      counts[t.assignedTo].total++;
      if (t.status === "Completed") counts[t.assignedTo].completed++;
      if (t.status === "Overdue") counts[t.assignedTo].overdue++;
    });
    return Object.entries(counts).map(([name, d]) => ({ name, ...d }));
  }, [tasks]);

  const vatStatusData = useMemo(() => {
    if (!vatRecords) return [];
    const counts: Record<string, number> = {};
    vatRecords.forEach(v => { counts[v.status] = (counts[v.status] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name: name === "InProgress" ? "In Progress" : name, value }));
  }, [vatRecords]);

  const vatAmountByClient = useMemo(() => {
    if (!vatRecords) return [];
    const totals: Record<number, { name: string; amount: number }> = {};
    vatRecords.forEach(v => {
      if (v.amount != null) {
        if (!totals[v.clientId]) totals[v.clientId] = { name: v.clientName, amount: 0 };
        totals[v.clientId].amount += Number(v.amount);
      }
    });
    return Object.values(totals)
      .map(({ name, amount }) => ({ name, amount: Math.round(amount) }))
      .sort((a, b) => b.amount - a.amount);
  }, [vatRecords]);

  const ctStatusData = useMemo(() => {
    if (!ctRecords) return [];
    const counts: Record<string, number> = {};
    ctRecords.forEach(c => { counts[c.status] = (counts[c.status] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name: name === "InProgress" ? "In Progress" : name, value }));
  }, [ctRecords]);

  const ctAmountByClient = useMemo(() => {
    if (!ctRecords) return [];
    const totals: Record<number, { name: string; amount: number }> = {};
    ctRecords.forEach(c => {
      if (c.taxAmount != null) {
        if (!totals[c.clientId]) totals[c.clientId] = { name: c.clientName, amount: 0 };
        totals[c.clientId].amount += Number(c.taxAmount);
      }
    });
    return Object.values(totals)
      .map(({ name, amount }) => ({ name, amount: Math.round(amount) }))
      .sort((a, b) => b.amount - a.amount);
  }, [ctRecords]);

  const clientsByCountry = useMemo(() => {
    if (!clients) return [];
    const counts: Record<string, number> = {};
    clients.forEach(c => { counts[c.country] = (counts[c.country] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [clients]);

  const clientsByStatus = useMemo(() => {
    if (!clients) return [];
    const counts: Record<string, number> = {};
    clients.forEach(c => { counts[c.status] = (counts[c.status] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [clients]);

  const clientWorkload = useMemo(() => {
    if (!clients || !tasks || !vatRecords || !ctRecords) return [];
    const taskCounts: Record<number, number> = {};
    const vatCounts: Record<number, number> = {};
    const ctCounts: Record<number, number> = {};
    tasks.forEach(t => { taskCounts[t.clientId] = (taskCounts[t.clientId] || 0) + 1; });
    vatRecords.forEach(v => { vatCounts[v.clientId] = (vatCounts[v.clientId] || 0) + 1; });
    ctRecords.forEach(c => { ctCounts[c.clientId] = (ctCounts[c.clientId] || 0) + 1; });
    return clients.map(c => ({
      name: c.name.length > 18 ? c.name.substring(0, 16) + "..." : c.name,
      tasks: taskCounts[c.id] || 0,
      vat: vatCounts[c.id] || 0,
      ct: ctCounts[c.id] || 0,
    })).sort((a, b) => (b.tasks + b.vat + b.ct) - (a.tasks + a.vat + a.ct));
  }, [clients, tasks, vatRecords, ctRecords]);

  const totalVatAmount = useMemo(() => {
    if (!vatRecords) return 0;
    return vatRecords.reduce((sum, v) => sum + (v.amount != null ? Number(v.amount) : 0), 0);
  }, [vatRecords]);

  const totalCtAmount = useMemo(() => {
    if (!ctRecords) return 0;
    return ctRecords.reduce((sum, c) => sum + (c.taxAmount != null ? Number(c.taxAmount) : 0), 0);
  }, [ctRecords]);

  const isLoading = !summary || !tasks || !vatRecords || !ctRecords || !clients;

  if (isLoading) {
    return (
      <AppLayout title="Reports">
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-40 bg-muted rounded-xl animate-pulse" />)}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Reports">
      <div className="space-y-6">
        {/* Tab bar */}
        <div className="flex items-center justify-between">
          <div className="border-b border-border flex gap-1">
            {reportTabs.map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* ==================== OVERVIEW TAB ==================== */}
        {tab === "Overview" && (
          <div className="space-y-6">
            {/* Top stats */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
              <StatMini icon={Users} value={summary.totalClients} label="Total Clients" color={COLORS.primary} />
              <StatMini icon={CheckCircle} value={summary.completedTasks} label="Completed Tasks" color={COLORS.green} />
              <StatMini icon={Clock} value={summary.pendingTasks} label="Pending Tasks" color={COLORS.yellow} />
              <StatMini icon={AlertTriangle} value={summary.overdueTasks} label="Overdue" color={COLORS.red} />
              <StatMini icon={FileText} value={`£${Math.round(totalVatAmount).toLocaleString()}`} label="Total VAT" color={COLORS.blue} />
              <StatMini icon={Building2} value={`£${Math.round(totalCtAmount).toLocaleString()}`} label="Total Corp. Tax" color={COLORS.purple} />
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-2 gap-6">
              <ChartCard title="Task Status Distribution">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={taskStatusData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                      {taskStatusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Workload by Assignee">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={assigneeData} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" fontSize={12} tick={{ fill: "#64748b" }} />
                    <YAxis fontSize={12} tick={{ fill: "#64748b" }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="total" name="Total" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="completed" name="Completed" fill={COLORS.green} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="overdue" name="Overdue" fill={COLORS.red} radius={[4, 4, 0, 0]} />
                    <Legend />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* VAT + CT summary side by side */}
            <div className="grid grid-cols-2 gap-6">
              <ChartCard title="VAT Amount by Client">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={vatAmountByClient} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" fontSize={12} tick={{ fill: "#64748b" }} tickFormatter={v => `£${(v / 1000).toFixed(0)}k`} />
                    <YAxis dataKey="name" type="category" fontSize={11} tick={{ fill: "#64748b" }} width={130} />
                    <Tooltip formatter={(v: number) => `£${v.toLocaleString()}`} />
                    <Bar dataKey="amount" fill={COLORS.blue} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Corporate Tax by Client">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={ctAmountByClient} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" fontSize={12} tick={{ fill: "#64748b" }} tickFormatter={v => `£${(v / 1000).toFixed(0)}k`} />
                    <YAxis dataKey="name" type="category" fontSize={11} tick={{ fill: "#64748b" }} width={130} />
                    <Tooltip formatter={(v: number) => `£${v.toLocaleString()}`} />
                    <Bar dataKey="amount" fill={COLORS.purple} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </div>
        )}

        {/* ==================== VAT ANALYSIS TAB ==================== */}
        {tab === "VAT Analysis" && (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <StatMini icon={FileText} value={vatRecords.length} label="Total VAT Records" color={COLORS.blue} />
              <StatMini icon={CheckCircle} value={vatRecords.filter(v => v.status === "Filed").length} label="Filed" color={COLORS.green} />
              <StatMini icon={Clock} value={vatRecords.filter(v => v.status === "Pending" || v.status === "InProgress").length} label="Pending / In Progress" color={COLORS.yellow} />
              <StatMini icon={AlertTriangle} value={vatRecords.filter(v => v.status === "Overdue").length} label="Overdue" color={COLORS.red} />
            </div>

            <div className="grid grid-cols-5 gap-6">
              <div className="col-span-2">
                <ChartCard title="VAT Filing Status">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={vatStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {vatStatusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
              <div className="col-span-3">
                <ChartCard title="VAT Amounts by Client">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={vatAmountByClient}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" fontSize={11} tick={{ fill: "#64748b" }} angle={-20} textAnchor="end" height={60} />
                      <YAxis fontSize={12} tick={{ fill: "#64748b" }} tickFormatter={v => `£${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: number) => `£${v.toLocaleString()}`} />
                      <Bar dataKey="amount" name="VAT Amount" fill={COLORS.blue} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
            </div>

            {/* VAT records table */}
            <ChartCard title="All VAT Records">
              <div className="overflow-x-auto -mx-5 -mb-5">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Client</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Period</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Due Date</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {vatRecords.map(v => (
                      <tr key={v.id} className="hover:bg-muted/20">
                        <td className="px-5 py-3 font-medium">{v.clientName}</td>
                        <td className="px-4 py-3 text-muted-foreground">{v.vatPeriod}</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatDate(v.dueDate)}</td>
                        <td className="px-4 py-3"><StatusBadge status={v.status} /></td>
                        <td className="px-5 py-3 text-right font-medium">{v.amount != null ? `£${Number(v.amount).toLocaleString()}` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-border bg-muted/30">
                      <td colSpan={4} className="px-5 py-3 text-sm font-semibold">Total</td>
                      <td className="px-5 py-3 text-right text-sm font-bold text-primary">£{Math.round(totalVatAmount).toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </ChartCard>
          </div>
        )}

        {/* ==================== CORPORATE TAX TAB ==================== */}
        {tab === "Corporate Tax" && (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <StatMini icon={Building2} value={ctRecords.length} label="Total CT Records" color={COLORS.purple} />
              <StatMini icon={CheckCircle} value={ctRecords.filter(c => c.status === "Filed").length} label="Filed" color={COLORS.green} />
              <StatMini icon={Clock} value={ctRecords.filter(c => c.status === "Pending" || c.status === "InProgress").length} label="Pending / In Progress" color={COLORS.yellow} />
              <StatMini icon={AlertTriangle} value={ctRecords.filter(c => c.status === "Overdue").length} label="Overdue" color={COLORS.red} />
            </div>

            <div className="grid grid-cols-5 gap-6">
              <div className="col-span-2">
                <ChartCard title="Corporate Tax Filing Status">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={ctStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {ctStatusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
              <div className="col-span-3">
                <ChartCard title="Corporate Tax Amounts by Client">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={ctAmountByClient}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" fontSize={11} tick={{ fill: "#64748b" }} angle={-20} textAnchor="end" height={60} />
                      <YAxis fontSize={12} tick={{ fill: "#64748b" }} tickFormatter={v => `£${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: number) => `£${v.toLocaleString()}`} />
                      <Bar dataKey="amount" name="Tax Amount" fill={COLORS.purple} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
            </div>

            <ChartCard title="All Corporate Tax Records">
              <div className="overflow-x-auto -mx-5 -mb-5">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Client</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Financial Year</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Deadline</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Tax Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {ctRecords.map(c => (
                      <tr key={c.id} className="hover:bg-muted/20">
                        <td className="px-5 py-3 font-medium">{c.clientName}</td>
                        <td className="px-4 py-3 text-muted-foreground">{c.financialYear}</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatDate(c.deadline)}</td>
                        <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                        <td className="px-5 py-3 text-right font-medium">{c.taxAmount != null ? `£${Number(c.taxAmount).toLocaleString()}` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-border bg-muted/30">
                      <td colSpan={4} className="px-5 py-3 text-sm font-semibold">Total</td>
                      <td className="px-5 py-3 text-right text-sm font-bold text-primary">£{Math.round(totalCtAmount).toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </ChartCard>
          </div>
        )}

        {/* ==================== TASK PERFORMANCE TAB ==================== */}
        {tab === "Task Performance" && (
          <div className="space-y-6">
            <div className="grid grid-cols-5 gap-4">
              <StatMini icon={CheckCircle} value={tasks.length} label="Total Tasks" color={COLORS.primary} />
              <StatMini icon={CheckCircle} value={tasks.filter(t => t.status === "Completed").length} label="Completed" color={COLORS.green} />
              <StatMini icon={Clock} value={tasks.filter(t => t.status === "InProgress").length} label="In Progress" color={COLORS.blue} />
              <StatMini icon={Clock} value={tasks.filter(t => t.status === "Pending").length} label="Pending" color={COLORS.yellow} />
              <StatMini icon={AlertTriangle} value={tasks.filter(t => t.status === "Overdue").length} label="Overdue" color={COLORS.red} />
            </div>

            <div className="grid grid-cols-3 gap-6">
              <ChartCard title="Task Status">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={taskStatusData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value"
                      label={({ name, value }) => `${name} (${value})`}>
                      {taskStatusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Tasks by Type">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={taskTypeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" fontSize={12} tick={{ fill: "#64748b" }} />
                    <YAxis fontSize={12} tick={{ fill: "#64748b" }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" name="Tasks" fill={COLORS.teal} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Tasks by Priority">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={taskPriorityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" fontSize={12} tick={{ fill: "#64748b" }} />
                    <YAxis fontSize={12} tick={{ fill: "#64748b" }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" name="Tasks" fill={COLORS.orange} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            <ChartCard title="Team Performance — Workload by Assignee">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={assigneeData} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" fontSize={12} tick={{ fill: "#64748b" }} />
                  <YAxis fontSize={12} tick={{ fill: "#64748b" }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="total" name="Total Tasks" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completed" name="Completed" fill={COLORS.green} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="overdue" name="Overdue" fill={COLORS.red} radius={[4, 4, 0, 0]} />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        )}

        {/* ==================== CLIENT INSIGHTS TAB ==================== */}
        {tab === "Client Insights" && (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <StatMini icon={Users} value={clients.length} label="Total Clients" color={COLORS.primary} />
              <StatMini icon={CheckCircle} value={clients.filter(c => c.status === "Active").length} label="Active" color={COLORS.green} />
              <StatMini icon={Clock} value={clients.filter(c => c.status === "Inactive").length} label="Inactive" color={COLORS.red} />
              <StatMini icon={TrendingUp} value={`${clients.filter(c => c.country === "UK").length} UK / ${clients.filter(c => c.country === "UAE").length} UAE`} label="By Region" color={COLORS.teal} />
            </div>

            <div className="grid grid-cols-3 gap-6">
              <ChartCard title="Clients by Region">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={clientsByCountry} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value"
                      label={({ name, value }) => `${name} (${value})`}>
                      {clientsByCountry.map((entry, i) => {
                        const colorMap: Record<string, string> = { UK: COLORS.primary, UAE: COLORS.teal };
                        return <Cell key={i} fill={colorMap[entry.name] ?? PIE_COLORS[i % PIE_COLORS.length]} />;
                      })}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Client Status">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={clientsByStatus} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value"
                      label={({ name, value }) => `${name} (${value})`}>
                      {clientsByStatus.map((entry, i) => {
                        const colorMap: Record<string, string> = { Active: COLORS.green, Inactive: COLORS.red };
                        return <Cell key={i} fill={colorMap[entry.name] ?? PIE_COLORS[i % PIE_COLORS.length]} />;
                      })}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Corp. Tax Status Breakdown">
                <div className="space-y-3 pt-2">
                  {["Active", "Inactive", "Pending"].map(status => {
                    const count = clients.filter(c => c.corporateTaxStatus === status).length;
                    const pct = clients.length > 0 ? (count / clients.length) * 100 : 0;
                    return (
                      <div key={status}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">{status}</span>
                          <span className="font-medium">{count} ({pct.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{
                            width: `${pct}%`,
                            backgroundColor: status === "Active" ? COLORS.green : status === "Pending" ? COLORS.yellow : COLORS.red,
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ChartCard>
            </div>

            <ChartCard title="Client Workload — Tasks, VAT & Corporate Tax per Client">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={clientWorkload} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" fontSize={11} tick={{ fill: "#64748b" }} angle={-15} textAnchor="end" height={60} />
                  <YAxis fontSize={12} tick={{ fill: "#64748b" }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="tasks" name="Tasks" fill={COLORS.primary} radius={[4, 4, 0, 0]} stackId="a" />
                  <Bar dataKey="vat" name="VAT Records" fill={COLORS.blue} radius={[0, 0, 0, 0]} stackId="a" />
                  <Bar dataKey="ct" name="CT Records" fill={COLORS.purple} radius={[4, 4, 0, 0]} stackId="a" />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
