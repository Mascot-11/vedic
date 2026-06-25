export default function DashboardLoading() {
  return (
    <div className="flex-1 flex flex-col p-4 animate-pulse">
      {/* Header skeleton */}
      <div className="mb-5 space-y-2">
        <div className="h-7 w-36 bg-stone-200 rounded-lg" />
        <div className="h-4 w-24 bg-stone-100 rounded" />
      </div>

      {/* Card skeletons */}
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-2xl"
            style={{
              background: i % 3 === 0
                ? "linear-gradient(135deg, oklch(0.94 0.03 75), oklch(0.90 0.05 70))"
                : "oklch(0.97 0 0)",
              border: "1px solid oklch(0.91 0.01 75)",
            }}
          />
        ))}
      </div>

      {/* List skeletons */}
      <div className="mt-6 space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-14 bg-white rounded-2xl border border-stone-100" />
        ))}
      </div>
    </div>
  );
}
