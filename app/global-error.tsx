"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="flex min-h-screen items-center justify-center bg-stone-50 font-sans">
        <div className="text-center space-y-3">
          <p className="font-semibold text-stone-900">Application error</p>
          <p className="text-sm text-stone-500">{error.message}</p>
          <button
            onClick={reset}
            className="rounded-md border border-stone-300 px-4 py-2 text-sm hover:bg-stone-100"
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
