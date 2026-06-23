import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center p-6">
      <p className="text-4xl font-bold text-stone-200">404</p>
      <p className="font-semibold text-stone-900">Page not found</p>
      <p className="text-sm text-stone-500">This page doesn&apos;t exist.</p>
      <Link href="/">
        <Button variant="outline">Go to Tables</Button>
      </Link>
    </div>
  );
}
