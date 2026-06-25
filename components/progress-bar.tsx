"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export default function ProgressBar() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevPathname = useRef(pathname);

  useEffect(() => {
    if (pathname !== prevPathname.current) {
      // Navigation completed — finish the bar
      setWidth(100);
      timerRef.current = setTimeout(() => {
        setVisible(false);
        setWidth(0);
      }, 300);
      prevPathname.current = pathname;
    }
  }, [pathname]);

  // Start the bar when a link is clicked (listen on capture phase)
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;
      const href = target.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("http") || href === pathname) return;

      if (timerRef.current) clearTimeout(timerRef.current);
      setVisible(true);
      setWidth(0);
      // Animate to ~70% quickly, then slow down
      requestAnimationFrame(() => {
        setWidth(15);
        timerRef.current = setTimeout(() => setWidth(60), 100);
      });
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [pathname]);

  if (!visible && width === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 z-[9999] h-[3px] transition-all duration-300 ease-out pointer-events-none"
      style={{
        width: `${width}%`,
        background: "linear-gradient(to right, oklch(0.72 0.14 58), oklch(0.65 0.18 50))",
        opacity: visible || width < 100 ? 1 : 0,
        boxShadow: "0 0 8px oklch(0.72 0.14 58 / 0.6)",
      }}
    />
  );
}
