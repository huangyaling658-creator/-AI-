"use client";

import { useState, useEffect, useCallback } from "react";
import { defaultSortableItems, type NavItem } from "@/lib/nav-items";

const STORAGE_KEY = "pm-nav-order";

export function useNavOrder() {
  const [items, setItems] = useState<NavItem[]>(defaultSortableItems);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const ids: string[] = JSON.parse(saved);
        const ordered = ids
          .map((id) => defaultSortableItems.find((item) => item.id === id))
          .filter((item): item is NavItem => !!item);
        // Append any new items not in saved order
        const missing = defaultSortableItems.filter(
          (item) => !ids.includes(item.id)
        );
        setItems([...ordered, ...missing]);
      }
    } catch {
      // ignore parse errors
    }
    setLoaded(true);
  }, []);

  const updateOrder = useCallback((newItems: NavItem[]) => {
    setItems(newItems);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems.map((i) => i.id)));
  }, []);

  return { items, updateOrder, loaded };
}
