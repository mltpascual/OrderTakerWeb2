import { useState, useEffect } from "react";
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
import type { MenuItem } from "@/lib/types";

export function useMenu() {
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

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: MenuItem[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as MenuItem[];
      setMenuItems(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addMenuItem = async (item: Omit<MenuItem, "id">) => {
    if (!user) return;
    const menuRef = collection(db, "users", user.uid, "menu");
    await addDoc(menuRef, { ...item, createdAt: new Date().toISOString() });
  };

  const updateMenuItem = async (id: string, updates: Partial<MenuItem>) => {
    if (!user) return;
    const docRef = doc(db, "users", user.uid, "menu", id);
    await updateDoc(docRef, updates);
  };

  const deleteMenuItem = async (id: string) => {
    if (!user) return;
    const docRef = doc(db, "users", user.uid, "menu", id);
    await deleteDoc(docRef);
  };

  const categories = Array.from(new Set(menuItems.map((item) => item.category))).sort();

  return {
    menuItems,
    categories,
    loading,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
  };
}
