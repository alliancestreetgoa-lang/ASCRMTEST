import { useState, useRef, useEffect } from "react";
import { useListUsers } from "@workspace/api-client-react";
import { ChevronDown, X } from "lucide-react";

interface UserSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function UserSelector({ value, onChange, className = "" }: UserSelectorProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: users } = useListUsers();

  const filtered = (users ?? []).filter(u =>
    u.name.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleOpen() {
    setOpen(true);
    setQuery("");
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function handleSelect(name: string) {
    onChange(name);
    setOpen(false);
    setQuery("");
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange("");
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div
        onClick={handleOpen}
        className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus-within:ring-2 focus-within:ring-primary/20 bg-white flex items-center gap-2 cursor-pointer"
      >
        {open ? (
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={value || "Search users..."}
            className="flex-1 outline-none bg-transparent text-sm placeholder:text-muted-foreground"
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span className={`flex-1 truncate ${value ? "text-foreground" : "text-muted-foreground"}`}>
            {value || "Select user..."}
          </span>
        )}
        {value && !open && (
          <button
            type="button"
            onClick={handleClear}
            className="p-0.5 rounded hover:bg-muted transition-colors"
          >
            <X className="w-3 h-3 text-muted-foreground" />
          </button>
        )}
        <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </div>

      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border border-border rounded-lg shadow-lg overflow-hidden max-h-48 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-3 py-3 text-sm text-muted-foreground text-center">No users found</div>
          ) : (
            filtered.map(u => (
              <button
                key={u.id}
                type="button"
                onClick={() => handleSelect(u.name)}
                className={`w-full text-left px-3 py-2.5 text-sm hover:bg-muted/60 transition-colors flex items-center gap-2 ${
                  value === u.name ? "bg-primary/5 text-primary font-medium" : "text-foreground"
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-medium">{u.name}</div>
                  {u.email && <div className="text-xs text-muted-foreground">{u.email}</div>}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
