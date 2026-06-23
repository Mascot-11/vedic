/**
 * Wraps a <table> in a horizontally-scrollable container on small screens.
 * Usage: <ResponsiveTable><table>...</table></ResponsiveTable>
 */
export function ResponsiveTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto -mx-1 px-1">
      {children}
    </div>
  );
}
