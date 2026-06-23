"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface CustomerSearchProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

interface Customer {
  id: string;
  name: string;
  total_balance?: number;
}

export default function CustomerSearch({ selectedId, onSelect }: CustomerSearchProps) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Customer[]>([]);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    if (!search.trim()) {
      setResults([]);
      return;
    }
    debounce.current = setTimeout(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("customers")
        .select("id, name")
        .ilike("name", `%${search}%`)
        .limit(8);
      setResults(data ?? []);
    }, 250);
  }, [search]);

  async function handleCreate() {
    if (!search.trim()) return;
    setCreating(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("customers")
      .insert({ name: search.trim() })
      .select()
      .single();
    setCreating(false);
    if (error) return;
    setSelected(data);
    onSelect(data.id);
    setOpen(false);
    setSearch("");
  }

  if (selected) {
    return (
      <div className="flex items-center justify-between rounded-md border border-stone-200 px-3 py-2 text-sm">
        <span className="font-medium">{selected.name}</span>
        <button
          onClick={() => { setSelected(null); onSelect(""); }}
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
      />
      {open && (search.trim() || results.length > 0) && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-stone-200 rounded-md shadow-lg overflow-hidden">
          {results.map((c) => (
            <button
              key={c.id}
              className="w-full text-left px-3 py-2 text-sm hover:bg-stone-50 flex justify-between"
              onMouseDown={() => {
                setSelected(c);
                onSelect(c.id);
                setOpen(false);
                setSearch("");
              }}
            >
              <span>{c.name}</span>
            </button>
          ))}
          {search.trim() && !results.find((r) => r.name.toLowerCase() === search.toLowerCase()) && (
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
