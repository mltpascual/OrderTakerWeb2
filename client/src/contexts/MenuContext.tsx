/**
 * Global Menu Context — single Firestore listener shared across all pages.
 * Fixes OT-5 (menu re-subscribed per page) and OT-7 (missing error handling).
 */
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { MenuItem } from "@/lib/types";

interface MenuContextType {
  menuItems: MenuItem[];
  categories: string[];
  loading: boolean;
  addMenuItem: (item: Omit<MenuItem, "id">) => Promise<void>;
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => Promise<void>;
  deleteMenuItem: (id: string) => Promise<void>;
}

const MenuContext = createContext<MenuContextType | null>(null);

export function MenuProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setMenuItems([]);
      setLoading(false);
      return;
    }

    const menuRef = collection(db, "users", user.uid, "menu");
    const q = query(menuRef, orderBy("name"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: MenuItem[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as MenuItem[];
        setMenuItems(items);
        setLoading(false);
      },
      (error) => {
        console.error("[Menu] Firestore listener error:", error);
        toast.error("Failed to load menu. Please refresh.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const addMenuItem = useCallback(async (item: Omit<MenuItem, "id">) => {
    if (!user) return;
    try {
      const menuRef = collection(db, "users", user.uid, "menu");
      await addDoc(menuRef, { ...item, createdAt: new Date().toISOString() });
    } catch (err) {
      console.error("[Menu] Failed to add menu item:", err);
      toast.error("Failed to add menu item");
      throw err;
    }
  }, [user]);

  const updateMenuItem = useCallback(async (id: string, updates: Partial<MenuItem>) => {
    if (!user) return;
    try {
      const docRef = doc(db, "users", user.uid, "menu", id);
      await updateDoc(docRef, updates);
    } catch (err) {
      console.error("[Menu] Failed to update menu item:", err);
      toast.error("Failed to update menu item");
      throw err;
    }
  }, [user]);

  const deleteMenuItem = useCallback(async (id: string) => {
    if (!user) return;
    try {
      const docRef = doc(db, "users", user.uid, "menu", id);
      await deleteDoc(docRef);
    } catch (err) {
      console.error("[Menu] Failed to delete menu item:", err);
      toast.error("Failed to delete menu item");
      throw err;
    }
  }, [user]);

  const categories = Array.from(new Set(menuItems.map((item) => item.category))).sort();

  return (
    <MenuContext.Provider
      value={{
        menuItems,
        categories,
        loading,
        addMenuItem,
        updateMenuItem,
        deleteMenuItem,
      }}
    >
      {children}
    </MenuContext.Provider>
  );
}

export function useMenu() {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error("useMenu must be used within a MenuProvider");
  }
  return context;
}
