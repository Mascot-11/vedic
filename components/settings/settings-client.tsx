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
import { Pencil, Plus, PowerOff, Power, Check, X } from "lucide-react";

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
  isSuperadmin: boolean;
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
      } catch (e: any) { toast.error(e.message); }
    });
  }

  function handleToggle() {
    start(async () => {
      try {
        await toggleTableActive(table.id, !table.active);
        toast.success(table.active ? "Table removed" : "Table restored");
        onSaved();
      } catch (e: any) { toast.error(e.message); }
    });
  }

  return (
    <tr>
      <td className="px-4 py-3">
        {editing ? (
          <div className="flex items-center gap-2">
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="h-8 text-sm w-40"
              autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") handleRename(); if (e.key === "Escape") setEditing(false); }}
            />
            <button onClick={handleRename} disabled={pending} className="text-green-600 hover:text-green-700">
              <Check className="h-4 w-4" />
            </button>
            <button onClick={() => { setEditing(false); setLabel(table.label); }} className="text-stone-400 hover:text-stone-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <span className="font-medium text-stone-900">{table.label}</span>
        )}
      </td>
      <td className="px-4 py-3">
        <Badge variant={table.active ? "default" : "secondary"} className="text-xs">
          {table.active ? "Active" : "Removed"}
        </Badge>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-1">
          {table.active && !editing && (
            <button onClick={() => setEditing(true)} className="p-1 text-stone-400 hover:text-stone-700">
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={handleToggle}
            disabled={pending}
            title={table.active ? "Remove table" : "Restore table"}
            className="p-1 text-stone-400 hover:text-stone-700"
          >
            {table.active ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5 text-green-600" />}
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function SettingsClient({ settings, tables: initialTables, isSuperadmin }: Props) {
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
      if (error) toast.error(error.message);
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
        // Refresh from server handled by revalidatePath; optimistic update:
        setTables((prev) => [...prev, { id: crypto.randomUUID(), label: newLabel.trim(), active: true }]);
      } catch (e: any) { toast.error(e.message); }
    });
  }

  return (
    <Tabs defaultValue="tables" className="max-w-lg">
      <TabsList>
        <TabsTrigger value="tables">Tables</TabsTrigger>
        {isSuperadmin && <TabsTrigger value="shop">Shop Config</TabsTrigger>}
      </TabsList>

      {/* ── Tables ── */}
      <TabsContent value="tables" className="mt-4 space-y-4">
        {/* Add new table */}
        <div className="flex gap-2">
          <Input
            placeholder="e.g. Table 8 or Patio 1"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddTable()}
            className="flex-1"
          />
          <Button onClick={handleAddTable} disabled={addPending || !newLabel.trim()}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium text-stone-600">Name</th>
                <th className="text-left px-4 py-2.5 font-medium text-stone-600">Status</th>
                <th className="w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {tables.map((t) => (
                <TableRow key={t.id} table={t} onSaved={() => {}} />
              ))}
              {tables.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-sm text-stone-400">
                    No tables yet. Add one above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </TabsContent>

      {/* ── Shop Config (superadmin only) ── */}
      {isSuperadmin && (
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
            <Button type="submit" disabled={savePending}>
              {savePending ? "Saving…" : "Save Settings"}
            </Button>
          </form>
        </TabsContent>
      )}
    </Tabs>
  );
}
