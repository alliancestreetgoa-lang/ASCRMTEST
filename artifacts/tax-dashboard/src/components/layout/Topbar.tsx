import { Bell, Search, ChevronDown } from "lucide-react";
import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useListClients, useListTasks } from "@workspace/api-client-react";

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

export default function Topbar({ title }: { title: string }) {
  const [, navigate] = useLocation();
  const [country, setCountry] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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

  return (
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

        <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
        </button>

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
