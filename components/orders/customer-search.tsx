"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { Plus } from "lucide-react";

interface Props {
  selectedId: string | null;
  onSelect: (id: string, name: string) => void;
}

interface Customer { id: string; name: string; }

export default function CustomerSearch({ selectedId, onSelect }: Props) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Customer[]>([]);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    if (!search.trim()) { setResults([]); return; }
    debounce.current = setTimeout(async () => {
      const db = createClient();
      const { data } = await db
        .from("customers")
        .select("id, name")
        .ilike("name", `%${search}%`)
        .limit(8);
      setResults(data ?? []);
    }, 200);
  }, [search]);

  async function handleCreate() {
    if (!search.trim()) return;
    setCreating(true);
    const db = createClient();
    const { data, error } = await db
      .from("customers")
      .insert({ name: search.trim() })
      .select()
      .single();
    setCreating(false);
    if (error) return;
    pick(data);
  }

  function pick(c: Customer) {
    setSelected(c);
    onSelect(c.id, c.name);
    setOpen(false);
    setSearch("");
    setResults([]);
  }

  if (selected) {
    return (
      <div className="flex items-center justify-between rounded-md border border-stone-200 px-3 py-2 text-sm">
        <span className="font-medium">{selected.name}</span>
        <button
          onClick={() => { setSelected(null); onSelect("", ""); }}
          className="text-xs text-stone-400 hover:text-stone-700"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <Input
        placeholder="Search customer name…"
        value={search}
        onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && search.trim() && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-stone-200 rounded-md shadow-lg overflow-hidden">
          {results.map((c) => (
            <button
              key={c.id}
              className="w-full text-left px-3 py-2 text-sm hover:bg-stone-50"
              onMouseDown={() => pick(c)}
            >
              {c.name}
            </button>
          ))}
          {!results.find((r) => r.name.toLowerCase() === search.toLowerCase()) && (
            <button
              className="w-full text-left px-3 py-2 text-sm text-stone-500 hover:bg-stone-50 flex items-center gap-1.5 border-t border-stone-100"
              onMouseDown={handleCreate}
              disabled={creating}
            >
              <Plus className="h-3.5 w-3.5" />
              {creating ? "Creating…" : `Create "${search.trim()}"`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
