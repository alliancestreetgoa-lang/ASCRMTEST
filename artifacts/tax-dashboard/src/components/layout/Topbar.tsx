import { Bell, Search, ChevronDown } from "lucide-react";
import { useState } from "react";

export default function Topbar({ title }: { title: string }) {
  const [country, setCountry] = useState("All");

  return (
    <div className="h-16 bg-white border-b border-border flex items-center px-6 gap-4 sticky top-0 z-20">
      {/* Page title */}
      <h1 className="text-base font-semibold text-foreground mr-4 shrink-0">{title}</h1>

      {/* Search */}
      <div className="flex-1 max-w-md relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search clients, tasks..."
          className="w-full pl-9 pr-4 py-2 text-sm bg-muted border-0 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 transition-all"
        />
      </div>

      <div className="flex items-center gap-3 ml-auto">
        {/* Country filter */}
        <div className="relative">
          <select
            value={country}
            onChange={e => setCountry(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 text-sm border border-border rounded-lg bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="All">All Regions</option>
            <option value="UK">UK</option>
            <option value="UAE">UAE</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>

        {/* Notification bell */}
        <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
        </button>

        {/* Profile */}
        <div className="flex items-center gap-2 cursor-pointer">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ background: "hsl(224 76% 33%)" }}>
            SA
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}
