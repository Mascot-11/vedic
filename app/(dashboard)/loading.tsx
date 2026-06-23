export default function DashboardLoading() {
  return (
    <div className="p-6 space-y-4 animate-pulse">
      <div className="h-6 w-32 bg-stone-200 rounded" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-28 bg-stone-100 rounded-xl border border-stone-200" />
        ))}
      </div>
    </div>
  );
}
