"use client";

import { AlertTriangle, TrendingUp, Clock, Calendar, CreditCard } from "lucide-react";

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
  const rate = data.revenue === 0 ? 100 : Math.round((data.collected / data.revenue) * 100);

  return (
    <div className={`rounded-2xl p-5 flex flex-col gap-4 ${accent ? "bg-stone-900 text-white" : "bg-white border border-stone-100"}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`h-3.5 w-3.5 ${accent ? "text-stone-400" : "text-stone-400"}`} />
          <span className={`text-xs font-semibold uppercase tracking-wider ${accent ? "text-stone-400" : "text-stone-400"}`}>{label}</span>
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${rate < 80 ? "bg-red-100 text-red-600" : rate < 100 ? "bg-amber-100 text-amber-700" : accent ? "bg-stone-800 text-stone-300" : "bg-stone-100 text-stone-500"}`}>
          {rate}%
        </span>
      </div>

      <div>
        <p className={`text-2xl font-bold tracking-tight leading-tight ${accent ? "text-white" : "text-stone-900"}`}>
          Rs. {fmt(data.revenue)}
        </p>
        <p className={`text-xs mt-1 ${accent ? "text-stone-400" : "text-stone-400"}`}>
          {data.count} order{data.count !== 1 ? "s" : ""}
        </p>
      </div>

      <div className={`h-px ${accent ? "bg-stone-800" : "bg-stone-100"}`} />

      <div className="flex justify-between text-xs">
        <span className={accent ? "text-stone-400" : "text-stone-400"}>
          Collected <span className={`font-semibold ${accent ? "text-stone-200" : "text-stone-700"}`}>Rs. {fmt(data.collected)}</span>
        </span>
        {outstanding > 0 && (
          <span className="text-amber-500 font-semibold">Due Rs. {fmt(outstanding)}</span>
        )}
      </div>
    </div>
  );
}

export default function ReportsDashboard({ daily, weekly, monthly, topProducts, brewing, totalDues }: Props) {
  const lowStock = brewing.filter((b) => b.qty_remaining_grams <= b.low_stock_threshold_grams);

  return (
    <div className="space-y-8">

      {/* Alerts */}
      {(lowStock.length > 0 || totalDues > 0) && (
        <div className="rounded-2xl border border-stone-100 bg-white overflow-hidden">
          {lowStock.map((b, i) => (
            <div key={b.bean_type} className={`flex items-center gap-3 px-4 py-3 text-sm ${i > 0 || totalDues > 0 ? "border-t border-stone-100" : ""}`}>
              <div className="h-6 w-6 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-3 w-3 text-red-500" />
              </div>
              <span className="text-stone-700">
                <strong className="font-semibold">{b.bean_type}</strong> is low —{" "}
                <span className="text-red-500">{Number(b.qty_remaining_grams).toFixed(0)}g</span> remaining
                <span className="text-stone-400 ml-1">(threshold {Number(b.low_stock_threshold_grams).toFixed(0)}g)</span>
              </span>
            </div>
          ))}
          {totalDues > 0 && (
            <div className={`flex items-center gap-3 px-4 py-3 text-sm ${lowStock.length > 0 ? "border-t border-stone-100" : ""}`}>
              <div className="h-6 w-6 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                <CreditCard className="h-3 w-3 text-amber-500" />
              </div>
              <span className="text-stone-700">
                Outstanding credit dues —{" "}
                <strong className="font-semibold text-amber-600">Rs. {fmt(totalDues)}</strong>
              </span>
            </div>
          )}
        </div>
      )}

      {/* Sales Overview */}
      <section>
        <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-3">Sales Overview</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <PeriodCard icon={Clock} label="Today" data={daily} accent />
          <PeriodCard icon={TrendingUp} label="Last 7 Days" data={weekly} />
          <PeriodCard icon={Calendar} label="This Month" data={monthly} />
        </div>
      </section>

      {/* Top Products */}
      <section>
        <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-3">Top Products This Month</p>
        {topProducts.length === 0 ? (
          <div className="rounded-2xl border border-stone-100 bg-white px-4 py-10 text-center text-sm text-stone-400">
            No sales recorded this month yet
          </div>
        ) : (
          <div className="rounded-2xl border border-stone-100 bg-white overflow-hidden">
            {topProducts.map((p, i) => (
              <div key={i} className={`flex items-center gap-4 px-4 py-3 ${i > 0 ? "border-t border-stone-100" : ""}`}>
                <span className={`text-xs font-bold w-5 text-center shrink-0 ${i === 0 ? "text-amber-400" : "text-stone-300"}`}>
                  {i + 1}
                </span>
                <p className="flex-1 text-sm font-medium text-stone-800 truncate">{p.name}</p>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-stone-900">Rs. {fmt(Number(p.total_revenue))}</p>
                  <p className="text-[10px] text-stone-400">{p.total_qty} sold</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Brewing Stock */}
      <section>
        <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-3">Brewing Stock</p>
        {brewing.length === 0 ? (
          <div className="rounded-2xl border border-stone-100 bg-white px-4 py-10 text-center text-sm text-stone-400">
            No brewing stock data
          </div>
        ) : (
          <div className="rounded-2xl border border-stone-100 bg-white overflow-hidden">
            {brewing.map((b, i) => {
              const isLow = b.qty_remaining_grams <= b.low_stock_threshold_grams;
              const pct = Math.min(100, Math.round((b.qty_remaining_grams / Math.max(b.qty_remaining_grams, b.low_stock_threshold_grams * 2)) * 100));
              return (
                <div key={b.bean_type} className={`px-4 py-3 ${i > 0 ? "border-t border-stone-100" : ""}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {isLow && <AlertTriangle className="h-3 w-3 text-red-400 shrink-0" />}
                      <span className="text-sm font-medium text-stone-700">{b.bean_type}</span>
                    </div>
                    <span className={`text-sm font-bold ${isLow ? "text-red-500" : "text-stone-900"}`}>
                      {Number(b.qty_remaining_grams).toFixed(0)}g
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${isLow ? "bg-red-400" : "bg-emerald-400"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-stone-400 shrink-0">min {Number(b.low_stock_threshold_grams).toFixed(0)}g</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
}
