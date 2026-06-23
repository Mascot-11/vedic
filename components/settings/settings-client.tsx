"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

const schema = z.object({
  business_name: z.string().min(1),
  currency: z.string().min(1),
  tax_percent: z.coerce.number().nonnegative(),
  max_staff_discount_amount: z.coerce.number().nonnegative(),
  low_stock_default_threshold: z.coerce.number().nonnegative(),
});

type FormData = z.infer<typeof schema>;

export default function SettingsClient({ settings }: { settings: any }) {
  const [pending, startTransition] = useTransition();

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

  function onSubmit(data: FormData) {
    startTransition(async () => {
      const supabase = createClient();
      const { error } = settings
        ? await supabase.from("shop_settings").update(data).eq("id", settings.id)
        : await supabase.from("shop_settings").insert(data);
      if (error) toast.error(error.message);
      else toast.success("Settings saved");
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-white rounded-xl border border-stone-200 p-5">
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
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save Settings"}
      </Button>
    </form>
  );
}
