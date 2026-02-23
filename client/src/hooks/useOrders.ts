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
import type { Order, OrderItem } from "@/lib/types";

export function useOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const ordersRef = collection(db, "users", user.uid, "orders");
    const q = query(ordersRef, orderBy("timestamp", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: Order[] = snapshot.docs.map((d) => {
        const data = d.data();
        // Handle legacy single-item orders
        if (!data.items && data.itemName) {
          return {
            id: d.id,
            customerName: data.customerName || "",
            items: [
              {
                menuItemId: "",
                name: data.itemName,
                basePrice: data.total / (data.quantity || 1),
                quantity: data.quantity || 1,
                note: data.notes || "",
              },
            ],
            notes: data.notes || "",
            pickupDate: data.pickupDate || "",
            pickupTime: data.pickupTime || "",
            source: data.source || "",
            status: data.status || "pending",
            total: data.total || 0,
            timestamp: data.timestamp || "",
            completedAt: data.completedAt || null,
          } as Order;
        }
        return {
          id: d.id,
          customerName: data.customerName || "",
          items: data.items || [],
          notes: data.notes || "",
          pickupDate: data.pickupDate || "",
          pickupTime: data.pickupTime || "",
          source: data.source || "",
          status: data.status || "pending",
          total: data.total || 0,
          timestamp: data.timestamp || "",
          completedAt: data.completedAt || null,
        } as Order;
      });
      setOrders(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addOrder = async (order: Omit<Order, "id">) => {
    if (!user) return;
    const ordersRef = collection(db, "users", user.uid, "orders");
    await addDoc(ordersRef, order);
  };

  const updateOrder = async (id: string, updates: Partial<Order>) => {
    if (!user) return;
    const docRef = doc(db, "users", user.uid, "orders", id);
    await updateDoc(docRef, updates);
  };

  const deleteOrder = async (id: string) => {
    if (!user) return;
    const docRef = doc(db, "users", user.uid, "orders", id);
    await deleteDoc(docRef);
  };

  const completeOrder = async (id: string) => {
    if (!user) return;
    const docRef = doc(db, "users", user.uid, "orders", id);
    await updateDoc(docRef, {
      status: "completed",
      completedAt: new Date().toISOString(),
    });
  };

  const returnToPending = async (id: string) => {
    if (!user) return;
    const docRef = doc(db, "users", user.uid, "orders", id);
    await updateDoc(docRef, {
      status: "pending",
      completedAt: null,
    });
  };

  const duplicateOrder = async (order: Order) => {
    if (!user) return;
    const ordersRef = collection(db, "users", user.uid, "orders");
    const newOrder = {
      customerName: order.customerName,
      items: order.items.map((item) => ({ ...item })),
      notes: order.notes,
      pickupDate: "",
      pickupTime: "",
      source: order.source,
      status: "pending" as const,
      total: order.total,
      timestamp: new Date().toISOString(),
      completedAt: null,
    };
    await addDoc(ordersRef, newOrder);
  };

  return {
    orders,
    loading,
    addOrder,
    updateOrder,
    deleteOrder,
    completeOrder,
    returnToPending,
    duplicateOrder,
  };
}
