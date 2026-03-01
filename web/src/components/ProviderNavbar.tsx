"use client";

import Link from "next/link";

export default function ProviderNavbar() {
  return (
    <nav className="flex items-center justify-between px-8 h-12 bg-surface-hover/60 backdrop-blur-lg border-b border-surface-hover flex-shrink-0">
      <span className="text-sm text-muted">
        Provider Dashboard &mdash;{" "}
        <span className="text-heading font-semibold">Creevo</span>
      </span>

      <div className="flex items-center gap-0">
        <Link href="/" className="px-4 py-1.5 text-xs text-body hover:text-heading transition-colors">
          About
        </Link>
      </div>
    </nav>
  );
}
