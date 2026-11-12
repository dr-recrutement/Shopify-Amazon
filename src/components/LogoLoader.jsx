import React from "react";
import { BRAND } from "@/lib/brand";

// Full-area loading state: the logo centred, with a ring turning around it.
// Used wherever the app waits on auth / store data so the first thing people
// see is the brand rather than a bare spinner.
export default function LogoLoader({ fullScreen = true, className = "" }) {
  return (
    <div
      role="status"
      aria-label="Chargement"
      className={`${fullScreen ? "fixed inset-0 z-50" : "w-full py-24"} flex items-center justify-center bg-background ${className}`}
    >
      <div className="relative w-24 h-24 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-4 border-slate-200 border-t-slate-800 animate-spin" />
        <img src={BRAND.logo} alt="" className="w-12 h-12 object-contain animate-pulse" />
      </div>
    </div>
  );
}
