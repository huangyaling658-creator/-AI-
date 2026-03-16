"use client";

import type { NavItem } from "@/lib/nav-items";

interface Props {
  item: NavItem;
}

export default function NavItemOverlay({ item }: Props) {
  return (
    <div className="bg-surface rounded-lg shadow-lg border border-primary/30 px-3 py-2.5 flex items-center gap-3 text-sm font-medium text-primary w-[216px]">
      <span className="flex-shrink-0 text-primary/50">
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
        </svg>
      </span>
      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.iconPath} />
      </svg>
      {item.name}
    </div>
  );
}
