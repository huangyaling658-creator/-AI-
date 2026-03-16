"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis, restrictToParentElement } from "@dnd-kit/modifiers";
import { homeItem, type NavItem } from "@/lib/nav-items";
import { useNavOrder } from "@/hooks/useNavOrder";
import { useAuth } from "@/contexts/AuthContext";
import SortableNavItem from "./SortableNavItem";
import NavItemOverlay from "./NavItemOverlay";
import SettingsModal from "./SettingsModal";

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { items, updateOrder } = useNavOrder();
  const [showSettings, setShowSettings] = useState(false);
  const [activeItem, setActiveItem] = useState<NavItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  function handleDragStart(event: DragStartEvent) {
    const item = items.find((i) => i.id === event.active.id);
    setActiveItem(item || null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveItem(null);
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      updateOrder(arrayMove(items, oldIndex, newIndex));
    }
  }

  return (
    <>
      <aside className="w-60 h-screen bg-surface border-r border-border flex flex-col fixed left-0 top-0 z-40">
        <div className="p-5 border-b border-border">
          <h1 className="text-xl font-bold text-primary">PM Copilot</h1>
          <p className="text-xs text-text-secondary mt-1">产品经理 AI 工作台</p>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {/* Home - pinned, not draggable */}
          <Link
            href={homeItem.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              pathname === homeItem.href
                ? "bg-primary text-white"
                : "text-text-secondary hover:bg-gray-100 hover:text-text"
            }`}
          >
            <span className="w-3.5" /> {/* spacer to align with drag handle items */}
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={homeItem.iconPath} />
            </svg>
            {homeItem.name}
          </Link>

          {/* Sortable items */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={items} strategy={verticalListSortingStrategy}>
              {items.map((item) => (
                <SortableNavItem
                  key={item.id}
                  item={item}
                  isActive={pathname === item.href}
                />
              ))}
            </SortableContext>
            <DragOverlay dropAnimation={null}>
              {activeItem ? <NavItemOverlay item={activeItem} /> : null}
            </DragOverlay>
          </DndContext>
        </nav>

        {/* User profile + settings trigger */}
        <div className="p-4 border-t border-border">
          <div
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded-lg p-1.5 -m-1.5 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold flex-shrink-0">
              {user?.name?.[0] || "PM"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name || "产品经理"}</p>
              <p className="text-xs text-text-secondary truncate">{user?.email || ""}</p>
            </div>
            <svg className="w-4 h-4 text-text-secondary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <button
            onClick={logout}
            className="mt-2 w-full text-xs text-text-secondary hover:text-red-500 transition-colors text-left px-1.5"
          >
            退出登录
          </button>
        </div>
      </aside>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </>
  );
}
