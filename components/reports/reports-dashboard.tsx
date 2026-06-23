"use client";

import { AlertTriangle, TrendingUp, Clock, Calendar, DollarSign, Package } from "lucide-react";

interface PeriodData { revenue: number; collected: number; count: number; }
interface Props {
  daily: PeriodData;
  weekly: PeriodData;
  monthly: PeriodData;
  topProducts: { name: string; total_qty: number; total_revenue: number }[];
  brewing: { bean_type: string; qty_remaining_grams: number; low_stock_threshold_grams: number }[];
  totalDues: number;
}

function fmt(n: number) {
  return n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function collectionRate(collected: number, revenue: number) {
  if (revenue === 0) return 100;
  return Math.round((collected / revenue) * 100);
}

function PeriodCard({
  icon: Icon,
  label,
  data,
  accent = false,
}: {
  icon: React.ElementType;
  label: string;
  data: PeriodData;
  accent?: boolean;
}) {
  const outstanding = data.revenue - data.collected;
  const rate = collectionRate(data.collected, data.revenue);

  return (
    <div className={`rounded-2xl border p-4 ${accent ? "bg-amber-50 border-amber-200" : "bg-white border-stone-200"}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`h-4 w-4 ${accent ? "text-amber-600" : "text-stone-400"}`} />
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">{label}</p>
      </div>

      <p className={`text-2xl font-bold ${accent ? "text-amber-900" : "text-stone-900"}`}>
        Rs. {fmt(data.revenue)}
      </p>

      <div className="mt-2 space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-stone-400">{data.count} order{data.count !== 1 ? "s" : ""}</span>
          <span className={`font-medium ${rate < 80 ? "text-red-600" : rate < 100 ? "text-amber-600" : "text-green-600"}`}>
            {rate}% collected
          </span>
        </div>
        <div className="w-full bg-stone-100 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all ${rate < 80 ? "bg-red-400" : rate < 100 ? "bg-amber-400" : "bg-green-400"}`}
            style={{ width: `${rate}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-stone-400">
          <span>Collected: Rs. {fmt(data.collected)}</span>
          {outstanding > 0 && <span className="text-amber-600">Due: Rs. {fmt(outstanding)}</span>}
        </div>
      </div>
    </div>
  );
}

function BrewingCard({ bean_type, qty_remaining_grams, low_stock_threshold_grams }: {
  bean_type: string;
  qty_remaining_grams: number;
  low_stock_threshold_grams: number;
}) {
  const isLow = qty_remaining_grams <= low_stock_threshold_grams;
  // Show up to 2× threshold as the "full" reference
  const maxDisplay = Math.max(qty_remaining_grams, low_stock_threshold_grams * 2);
  const pct = Math.min(100, Math.round((qty_remaining_grams / maxDisplay) * 100));

  return (
    <div className={`rounded-2xl border p-3 ${isLow ? "border-red-200 bg-red-50" : "border-stone-200 bg-white"}`}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-medium text-stone-600 truncate">{bean_type}</p>
        {isLow && <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />}
      </div>
      <p className={`text-xl font-bold ${isLow ? "text-red-600" : "text-stone-900"}`}>
        {Number(qty_remaining_grams).toFixed(0)}g
      </p>
      <div className="mt-2 w-full bg-stone-100 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full transition-all ${isLow ? "bg-red-400" : "bg-green-400"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[10px] text-stone-400 mt-1">threshold: {Number(low_stock_threshold_grams).toFixed(0)}g</p>
    </div>
  );
}

export default function ReportsDashboard({ daily, weekly, monthly, topProducts, brewing, totalDues }: Props) {
  const lowStock = brewing.filter((b) => b.qty_remaining_grams <= b.low_stock_threshold_grams);
  const hasAlerts = lowStock.length > 0 || totalDues > 0;

  return (
    <div className="space-y-6">

      {/* Alerts */}
      {hasAlerts && (
        <div className="space-y-2">
          {lowStock.map((b) => (
            <div key={b.bean_type} className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-sm text-red-700">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>
                <strong>{b.bean_type}</strong> is low —{" "}
                {Number(b.qty_remaining_grams).toFixed(0)}g left
                <span className="text-red-400"> (threshold: {Number(b.low_stock_threshold_grams).toFixed(0)}g)</span>
              </span>
            </div>
          ))}
          {totalDues > 0 && (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-sm text-amber-800">
              <DollarSign className="h-4 w-4 shrink-0" />
              <span>Outstanding credit dues: <strong>Rs. {fmt(totalDues)}</strong></span>
            </div>
          )}
        </div>
      )}

      {/* Period stats */}
      <section>
        <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3">Sales Overview</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <PeriodCard icon={Clock} label="Today" data={daily} accent />
          <PeriodCard icon={TrendingUp} label="Last 7 Days" data={weekly} />
          <PeriodCard icon={Calendar} label="This Month" data={monthly} />
        </div>
      </section>

      {/* Top products */}
      <section>
        <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3">Top Products This Month</p>
        {topProducts.length === 0 ? (
          <p className="text-center text-stone-400 text-sm py-6">No sales data yet this month</p>
        ) : (
          <div className="space-y-2">
            {topProducts.map((p, i) => (
              <div key={i} className="bg-white rounded-2xl border border-stone-200 px-4 py-3 flex items-center gap-3">
                <span className={`text-sm font-bold w-6 shrink-0 text-center ${i === 0 ? "text-amber-500" : i === 1 ? "text-stone-400" : i === 2 ? "text-amber-700" : "text-stone-200"}`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-stone-900 truncate">{p.name}</p>
                  <p className="text-xs text-stone-400">{p.total_qty} unit{Number(p.total_qty) !== 1 ? "s" : ""} sold</p>
                </div>
                <p className="font-bold text-stone-900 text-sm shrink-0">Rs. {fmt(Number(p.total_revenue))}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Brewing stock */}
      <section>
        <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3">Brewing Stock</p>
        {brewing.length === 0 ? (
          <p className="text-center text-stone-400 text-sm py-6">No brewing stock data</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {brewing.map((b) => (
              <BrewingCard key={b.bean_type} {...b} />
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
