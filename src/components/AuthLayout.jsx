import React from "react";
import { BRAND } from "@/lib/brand";

const AUTH_BG = 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1920&q=80';

export default function AuthLayout({ title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
      {/* Shopping background */}
      <div className="absolute inset-0">
        <img src={AUTH_BG} alt="" className="w-full h-full object-cover animate-ken-burns" />
        <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-black/70 to-black/50" />
      </div>

      <div className="relative w-full max-w-md py-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 mb-4 px-2">
            <img src={BRAND.logo} alt={BRAND.name} className="h-full w-auto object-contain" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">{title}</h1>
          {subtitle && <p className="text-white/70 mt-2">{subtitle}</p>}
        </div>
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8">
          {children}
        </div>
        {footer && (
          <p className="text-center text-sm text-white/60 mt-6">{footer}</p>
        )}
      </div>
    </div>
  );
}