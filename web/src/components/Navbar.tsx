"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "Get Started", href: "/get-started" },
  { label: "Challenges", href: "/challenges" },
  { label: "Home", href: "/" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center justify-between px-8 h-12 bg-surface-hover/60 backdrop-blur-lg border-b border-surface-hover flex-shrink-0">
      <Link href="/" className="hover:text-accent transition-colors">
        <span className="text-xl text-heading font-black tracking-tighter uppercase">BountyBot</span>
      </Link>

      <div className="flex items-center gap-0">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`px-4 py-1.5 text-xs transition-colors ${
              pathname === item.href
                ? "text-heading font-semibold"
                : "text-body hover:text-heading"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
