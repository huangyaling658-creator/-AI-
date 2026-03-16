"use client";

import Link from "next/link";
import { useSortable } from "@dnd-kit/sortable";
import type { NavItem } from "@/lib/nav-items";

interface Props {
  item: NavItem;
  isActive: boolean;
}

export default function SortableNavItem({ item, isActive }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  // Only use translate, skip scale to avoid flickering
  const style: React.CSSProperties = {
    transform: transform
      ? `translate3d(${Math.round(transform.x)}px, ${Math.round(transform.y)}px, 0)`
      : undefined,
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
    position: "relative" as const,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Link
        href={item.href}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group ${
          isActive
            ? "bg-primary text-white"
            : "text-text-secondary hover:bg-gray-100 hover:text-text"
        }`}
      >
        {/* Drag handle */}
        <span
          {...listeners}
          className={`cursor-grab active:cursor-grabbing flex-shrink-0 ${
            isActive ? "text-white/50" : "text-gray-300 group-hover:text-gray-400"
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
          </svg>
        </span>
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.iconPath} />
        </svg>
        {item.name}
      </Link>
    </div>
  );
}
