/**
 * Global Orders Context — single Firestore listener shared across all pages.
 * Fixes OT-3 (triple data subscription) and OT-7 (missing error handling).
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
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Order } from "@/lib/types";

const ORDERS_LIMIT = 200;

interface OrdersContextType {
  orders: Order[];
  loading: boolean;
  addOrder: (order: Omit<Order, "id">) => Promise<void>;
  updateOrder: (id: string, updates: Partial<Order>) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  completeOrder: (id: string) => Promise<void>;
  returnToPending: (id: string) => Promise<void>;
  duplicateOrder: (order: Order) => Promise<void>;
}

const OrdersContext = createContext<OrdersContextType | null>(null);

export function OrdersProvider({ children }: { children: ReactNode }) {
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
    const q = query(ordersRef, orderBy("timestamp", "desc"), limit(ORDERS_LIMIT));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
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
      },
      (error) => {
        console.error("[Orders] Firestore listener error:", error);
        toast.error("Failed to load orders. Please refresh.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const addOrder = useCallback(async (order: Omit<Order, "id">) => {
    if (!user) return;
    try {
      const ordersRef = collection(db, "users", user.uid, "orders");
      await addDoc(ordersRef, order);
    } catch (err) {
      console.error("[Orders] Failed to add order:", err);
      toast.error("Failed to create order");
      throw err;
    }
  }, [user]);

  const updateOrder = useCallback(async (id: string, updates: Partial<Order>) => {
    if (!user) return;
    try {
      const docRef = doc(db, "users", user.uid, "orders", id);
      await updateDoc(docRef, updates);
    } catch (err) {
      console.error("[Orders] Failed to update order:", err);
      toast.error("Failed to update order");
      throw err;
    }
  }, [user]);

  const deleteOrder = useCallback(async (id: string) => {
    if (!user) return;
    try {
      const docRef = doc(db, "users", user.uid, "orders", id);
      await deleteDoc(docRef);
    } catch (err) {
      console.error("[Orders] Failed to delete order:", err);
      toast.error("Failed to delete order");
      throw err;
    }
  }, [user]);

  const completeOrder = useCallback(async (id: string) => {
    if (!user) return;
    try {
      const docRef = doc(db, "users", user.uid, "orders", id);
      await updateDoc(docRef, {
        status: "completed",
        completedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error("[Orders] Failed to complete order:", err);
      toast.error("Failed to complete order");
      throw err;
    }
  }, [user]);

  const returnToPending = useCallback(async (id: string) => {
    if (!user) return;
    try {
      const docRef = doc(db, "users", user.uid, "orders", id);
      await updateDoc(docRef, {
        status: "pending",
        completedAt: null,
      });
    } catch (err) {
      console.error("[Orders] Failed to return order to pending:", err);
      toast.error("Failed to update order status");
      throw err;
    }
  }, [user]);

  const duplicateOrder = useCallback(async (order: Order) => {
    if (!user) return;
    try {
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
    } catch (err) {
      console.error("[Orders] Failed to duplicate order:", err);
      toast.error("Failed to duplicate order");
      throw err;
    }
  }, [user]);

  return (
    <OrdersContext.Provider
      value={{
        orders,
        loading,
        addOrder,
        updateOrder,
        deleteOrder,
        completeOrder,
        returnToPending,
        duplicateOrder,
      }}
    >
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrdersContext);
  if (!context) {
    throw new Error("useOrders must be used within an OrdersProvider");
  }
  return context;
}
