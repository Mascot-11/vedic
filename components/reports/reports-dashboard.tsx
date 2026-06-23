"use client";

import { AlertTriangle } from "lucide-react";

interface PeriodData {
  revenue: number;
  collected: number;
  count: number;
}

interface Props {
  daily: PeriodData;
  weekly: PeriodData;
  monthly: PeriodData;
  topProducts: { name: string; total_qty: number; total_revenue: number }[];
  brewing: { bean_type: string; qty_remaining_grams: number; low_stock_threshold_grams: number }[];
  totalDues: number;
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4">
      <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-stone-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-stone-500 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function ReportsDashboard({ daily, weekly, monthly, topProducts, brewing, totalDues }: Props) {
  const lowStock = brewing.filter((b) => b.qty_remaining_grams <= b.low_stock_threshold_grams);

  return (
    <div className="space-y-8">
      {/* Alerts */}
      {(lowStock.length > 0 || totalDues > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {lowStock.map((b) => (
            <div key={b.bean_type} className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span><strong>{b.bean_type}</strong> low — {Number(b.qty_remaining_grams).toFixed(0)}g remaining</span>
            </div>
          ))}
          {totalDues > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700">
              <span>Total outstanding credit dues: <strong>Rs. {totalDues.toFixed(2)}</strong></span>
            </div>
          )}
        </div>
      )}

      {/* Period stats */}
      <section>
        <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">Sales Summary</h2>
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            label="Today"
            value={`Rs. ${daily.revenue.toFixed(2)}`}
            sub={`${daily.count} orders · Rs. ${daily.collected.toFixed(2)} collected`}
          />
          <StatCard
            label="Last 7 days"
            value={`Rs. ${weekly.revenue.toFixed(2)}`}
            sub={`${weekly.count} orders`}
          />
          <StatCard
            label="This month"
            value={`Rs. ${monthly.revenue.toFixed(2)}`}
            sub={`${monthly.count} orders`}
          />
        </div>
      </section>

      {/* Top products */}
      {topProducts.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">Top Products (this month)</h2>
          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium text-stone-600">Product</th>
                  <th className="text-right px-4 py-2.5 font-medium text-stone-600">Qty Sold</th>
                  <th className="text-right px-4 py-2.5 font-medium text-stone-600">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {topProducts.map((p, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 font-medium text-stone-900">{p.name}</td>
                    <td className="px-4 py-3 text-right text-stone-600">{p.total_qty}</td>
                    <td className="px-4 py-3 text-right">Rs. {Number(p.total_revenue).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Brewing stock */}
      <section>
        <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">Brewing Stock</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {brewing.map((b) => {
            const isLow = b.qty_remaining_grams <= b.low_stock_threshold_grams;
            return (
              <div key={b.bean_type} className={`rounded-xl border p-3 ${isLow ? "border-red-200 bg-red-50" : "border-stone-200 bg-white"}`}>
                <p className="text-sm font-medium text-stone-700">{b.bean_type}</p>
                <p className={`text-xl font-bold mt-1 ${isLow ? "text-red-600" : "text-stone-900"}`}>
                  {Number(b.qty_remaining_grams).toFixed(0)}g
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
