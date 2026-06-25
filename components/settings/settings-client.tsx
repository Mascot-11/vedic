"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { createTable, renameTable, toggleTableActive } from "@/app/actions/tables";
import { Table } from "@/lib/types";
import { Pencil, Plus, PowerOff, Power, Check, X, Loader2 } from "lucide-react";

const schema = z.object({
  business_name: z.string().min(1),
  currency: z.string().min(1),
  tax_percent: z.coerce.number().nonnegative(),
  max_staff_discount_amount: z.coerce.number().nonnegative(),
  low_stock_default_threshold: z.coerce.number().nonnegative(),
});
type FormData = z.infer<typeof schema>;

interface Props {
  settings: any;
  tables: Table[];
  canEditShop: boolean;
}

function TableRow({ table, onSaved }: { table: Table; onSaved: () => void }) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(table.label);
  const [pending, start] = useTransition();

  function handleRename() {
    start(async () => {
      try {
        await renameTable(table.id, label);
        toast.success("Table renamed");
        setEditing(false);
        onSaved();
      } catch (e: any) { toast.error('Something went wrong. Please try again.'); }
    });
  }

  function handleToggle() {
    start(async () => {
      try {
        await toggleTableActive(table.id, !table.active);
        toast.success(table.active ? "Table removed" : "Table restored");
        onSaved();
      } catch (e: any) { toast.error('Something went wrong. Please try again.'); }
    });
  }

  return (
    <div className={`flex items-center gap-3 px-4 py-3 ${pending ? "opacity-60" : ""}`}>
      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex items-center gap-2">
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="h-9 text-sm flex-1"
              autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") handleRename(); if (e.key === "Escape") setEditing(false); }}
            />
            <button
              onClick={handleRename}
              disabled={pending}
              className="h-9 w-9 flex items-center justify-center text-green-600 disabled:opacity-50"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            </button>
            <button
              onClick={() => { setEditing(false); setLabel(table.label); }}
              disabled={pending}
              className="h-9 w-9 flex items-center justify-center text-stone-400"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="font-medium text-stone-900 truncate">{table.label}</span>
            <Badge variant={table.active ? "default" : "secondary"} className="text-[10px] shrink-0">
              {table.active ? "Active" : "Off"}
            </Badge>
          </div>
        )}
      </div>
      {!editing && (
        <div className="flex items-center gap-1 shrink-0">
          {table.active && (
            <button
              onClick={() => setEditing(true)}
              disabled={pending}
              className="h-10 w-10 flex items-center justify-center rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={handleToggle}
            disabled={pending}
            className="h-10 w-10 flex items-center justify-center rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100"
          >
            {pending
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : table.active
                ? <PowerOff className="h-4 w-4" />
                : <Power className="h-4 w-4 text-green-600" />}
          </button>
        </div>
      )}
    </div>
  );
}

export default function SettingsClient({ settings, tables: initialTables, canEditShop }: Props) {
  const [tables, setTables] = useState(initialTables);
  const [newLabel, setNewLabel] = useState("");
  const [addPending, startAdd] = useTransition();
  const [savePending, startSave] = useTransition();

  const { register, handleSubmit } = useForm<FormData>({
    resolver: standardSchemaResolver(schema),
    defaultValues: settings ?? {
      business_name: "Vedic Coffee",
      currency: "Rs.",
      tax_percent: 0,
      max_staff_discount_amount: 100,
      low_stock_default_threshold: 500,
    },
  });

  function onSaveSettings(data: FormData) {
    startSave(async () => {
      const supabase = createClient();
      const { error } = settings
        ? await supabase.from("shop_settings").update(data).eq("id", settings.id)
        : await supabase.from("shop_settings").insert(data);
      if (error) toast.error("Couldn't save settings. Please try again.");
      else toast.success("Settings saved");
    });
  }

  function handleAddTable() {
    if (!newLabel.trim()) return;
    startAdd(async () => {
      try {
        await createTable(newLabel);
        toast.success(`"${newLabel.trim()}" added`);
        setNewLabel("");
        setTables((prev) => [...prev, { id: crypto.randomUUID(), label: newLabel.trim(), active: true }]);
      } catch (e: any) { toast.error('Something went wrong. Please try again.'); }
    });
  }

  return (
    <Tabs defaultValue="tables" className="w-full max-w-lg">
      <TabsList>
        <TabsTrigger value="tables">Tables</TabsTrigger>
        {canEditShop && <TabsTrigger value="shop">Shop Config</TabsTrigger>}
      </TabsList>

      <TabsContent value="tables" className="mt-4 space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="e.g. Table 8 or Patio 1"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddTable()}
            className="flex-1"
            disabled={addPending}
          />
          <Button onClick={handleAddTable} disabled={addPending || !newLabel.trim()}>
            {addPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
            {addPending ? "Adding…" : "Add"}
          </Button>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden divide-y divide-stone-100">
          {tables.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-stone-400">No tables yet. Add one above.</p>
          )}
          {tables.map((t) => (
            <TableRow key={t.id} table={t} onSaved={() => {}} />
          ))}
        </div>
      </TabsContent>

      {canEditShop && (
        <TabsContent value="shop" className="mt-4">
          <form onSubmit={handleSubmit(onSaveSettings)} className="space-y-4 bg-white rounded-xl border border-stone-200 p-5">
            <div className="space-y-1.5">
              <Label>Business Name</Label>
              <Input {...register("business_name")} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Currency Symbol</Label>
                <Input {...register("currency")} placeholder="Rs." />
              </div>
              <div className="space-y-1.5">
                <Label>Tax %</Label>
                <Input type="number" step="0.1" {...register("tax_percent")} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Max Staff Discount (Rs.)</Label>
              <Input type="number" step="1" {...register("max_staff_discount_amount")} />
            </div>
            <div className="space-y-1.5">
              <Label>Default Low Stock Threshold (grams)</Label>
              <Input type="number" {...register("low_stock_default_threshold")} />
            </div>
            <Button type="submit" disabled={savePending} className="w-full sm:w-auto">
              {savePending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {savePending ? "Saving…" : "Save Settings"}
            </Button>
          </form>
        </TabsContent>
      )}
    </Tabs>
  );
}
