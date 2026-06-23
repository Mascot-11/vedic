"use client";

import { AlertTriangle, TrendingUp, Clock, Calendar } from "lucide-react";

interface PeriodData { revenue: number; collected: number; count: number; }
interface Props {
  daily: PeriodData;
  weekly: PeriodData;
  monthly: PeriodData;
  topProducts: { name: string; total_qty: number; total_revenue: number }[];
  brewing: { bean_type: string; qty_remaining_grams: number; low_stock_threshold_grams: number }[];
  totalDues: number;
}

function StatCard({ label, value, sub, icon: Icon, accent = false }: {
  label: string; value: string; sub?: string; icon: React.ElementType; accent?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${accent ? "bg-amber-50 border-amber-200" : "bg-white border-stone-200"}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`h-4 w-4 ${accent ? "text-amber-600" : "text-stone-400"}`} />
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">{label}</p>
      </div>
      <p className={`text-2xl font-bold ${accent ? "text-amber-900" : "text-stone-900"}`}>{value}</p>
      {sub && <p className="text-xs text-stone-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function ReportsDashboard({ daily, weekly, monthly, topProducts, brewing, totalDues }: Props) {
  const lowStock = brewing.filter((b) => b.qty_remaining_grams <= b.low_stock_threshold_grams);

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {(lowStock.length > 0 || totalDues > 0) && (
        <div className="space-y-2">
          {lowStock.map((b) => (
            <div key={b.bean_type} className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-sm text-red-700">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span><strong>{b.bean_type}</strong> low — {Number(b.qty_remaining_grams).toFixed(0)}g left</span>
            </div>
          ))}
          {totalDues > 0 && (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>Total credit dues: <strong>Rs. {totalDues.toFixed(2)}</strong></span>
            </div>
          )}
        </div>
      )}

      {/* Period stats */}
      <section>
        <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3">Sales</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard icon={Clock} label="Today" value={`Rs. ${daily.revenue.toFixed(0)}`} sub={`${daily.count} orders · Rs. ${daily.collected.toFixed(0)} collected`} accent />
          <StatCard icon={TrendingUp} label="Last 7 days" value={`Rs. ${weekly.revenue.toFixed(0)}`} sub={`${weekly.count} orders`} />
          <StatCard icon={Calendar} label="This month" value={`Rs. ${monthly.revenue.toFixed(0)}`} sub={`${monthly.count} orders`} />
        </div>
      </section>

      {/* Top products */}
      {topProducts.length > 0 && (
        <section>
          <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3">Top This Month</p>
          <div className="space-y-2">
            {topProducts.map((p, i) => (
              <div key={i} className="bg-white rounded-2xl border border-stone-200 px-4 py-3 flex items-center gap-3">
                <span className="text-lg font-bold text-stone-200 w-6 shrink-0 text-center">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-stone-900 truncate">{p.name}</p>
                  <p className="text-xs text-stone-400">{p.total_qty} sold</p>
                </div>
                <p className="font-bold text-stone-900 text-sm shrink-0">Rs. {Number(p.total_revenue).toFixed(0)}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Brewing stock */}
      <section>
        <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3">Brewing Stock</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {brewing.map((b) => {
            const isLow = b.qty_remaining_grams <= b.low_stock_threshold_grams;
            return (
              <div key={b.bean_type} className={`rounded-2xl border p-3 ${isLow ? "border-red-200 bg-red-50" : "border-stone-200 bg-white"}`}>
                <p className="text-xs font-medium text-stone-600 truncate">{b.bean_type}</p>
                <p className={`text-xl font-bold mt-1 ${isLow ? "text-red-600" : "text-stone-900"}`}>
                  {Number(b.qty_remaining_grams).toFixed(0)}g
                </p>
              </div>
            );
          })}
          {brewing.length === 0 && (
            <p className="col-span-full text-center text-stone-400 text-sm py-6">No brewing stock data</p>
          )}
        </div>
      </section>
    </div>
  );
}
