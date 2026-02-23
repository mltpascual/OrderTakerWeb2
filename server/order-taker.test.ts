import { describe, expect, it } from "vitest";

/**
 * Unit tests for Order Taker app data models and business logic.
 * Firebase operations are tested via the client-side hooks,
 * these tests validate data structures and computation logic.
 */

// Test order total calculation
function calculateOrderTotal(items: Array<{ basePrice: number; quantity: number }>): number {
  return items.reduce((sum, item) => sum + item.basePrice * item.quantity, 0);
}

// Test legacy order migration logic
function migrateLegacyOrder(legacyOrder: {
  customerName?: string;
  itemName?: string;
  quantity?: number;
  total?: number;
  notes?: string;
  pickupDate?: string;
  pickupTime?: string;
  source?: string;
  status?: string;
  timestamp?: string;
}) {
  return {
    customerName: legacyOrder.customerName || "",
    items: [
      {
        menuItemId: "",
        name: legacyOrder.itemName || "",
        basePrice: (legacyOrder.total || 0) / (legacyOrder.quantity || 1),
        quantity: legacyOrder.quantity || 1,
        note: legacyOrder.notes || "",
      },
    ],
    notes: legacyOrder.notes || "",
    pickupDate: legacyOrder.pickupDate || "",
    pickupTime: legacyOrder.pickupTime || "",
    source: legacyOrder.source || "",
    status: legacyOrder.status || "pending",
    total: legacyOrder.total || 0,
    timestamp: legacyOrder.timestamp || "",
    completedAt: null,
  };
}

// Test report filtering logic
function filterOrdersByRange(
  orders: Array<{ timestamp: string; status: string }>,
  range: string
): Array<{ timestamp: string; status: string }> {
  const now = new Date("2026-02-22T12:00:00Z");
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return orders.filter((order) => {
    if (order.status !== "completed") return false;
    const orderDate = new Date(order.timestamp);

    switch (range) {
      case "daily":
        return orderDate >= today;
      case "weekly": {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return orderDate >= weekAgo;
      }
      case "monthly": {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return orderDate >= monthAgo;
      }
      case "all":
      default:
        return true;
    }
  });
}

// Test CSV export format
function formatOrdersForCSV(
  orders: Array<{
    id: string;
    customerName: string;
    items: Array<{ name: string; quantity: number; basePrice: number; note: string }>;
    notes: string;
    pickupDate: string;
    pickupTime: string;
    source: string;
    status: string;
    total: number;
    timestamp: string;
    completedAt: string | null;
  }>
) {
  return orders.flatMap((order) =>
    order.items.map((item) => ({
      OrderID: order.id,
      CustomerName: order.customerName,
      ItemName: item.name,
      Quantity: item.quantity,
      Price: item.basePrice,
      ItemNote: item.note,
      OrderNotes: order.notes,
      PickupDate: order.pickupDate,
      PickupTime: order.pickupTime,
      Source: order.source,
      Status: order.status,
      Total: order.total,
      Timestamp: order.timestamp,
      CompletedAt: order.completedAt || "",
    }))
  );
}

describe("Order total calculation", () => {
  it("calculates total for single item", () => {
    const items = [{ basePrice: 25, quantity: 1 }];
    expect(calculateOrderTotal(items)).toBe(25);
  });

  it("calculates total for multiple items", () => {
    const items = [
      { basePrice: 25, quantity: 2 },
      { basePrice: 15, quantity: 3 },
    ];
    expect(calculateOrderTotal(items)).toBe(95);
  });

  it("returns 0 for empty cart", () => {
    expect(calculateOrderTotal([])).toBe(0);
  });

  it("handles decimal prices", () => {
    const items = [{ basePrice: 12.5, quantity: 3 }];
    expect(calculateOrderTotal(items)).toBe(37.5);
  });
});

describe("Legacy order migration", () => {
  it("converts single-item order to multi-item format", () => {
    const legacy = {
      customerName: "Stephanie",
      itemName: "Sansrival Cake (6\")",
      quantity: 1,
      total: 35,
      notes: "",
      pickupDate: "2026-02-01",
      pickupTime: "17:00",
      source: "Marketplace",
      status: "completed",
      timestamp: "2026-01-22T23:53:35Z",
    };

    const migrated = migrateLegacyOrder(legacy);

    expect(migrated.customerName).toBe("Stephanie");
    expect(migrated.items).toHaveLength(1);
    expect(migrated.items[0].name).toBe("Sansrival Cake (6\")");
    expect(migrated.items[0].basePrice).toBe(35);
    expect(migrated.items[0].quantity).toBe(1);
    expect(migrated.total).toBe(35);
    expect(migrated.source).toBe("Marketplace");
    expect(migrated.status).toBe("completed");
  });

  it("handles missing fields gracefully", () => {
    const legacy = {};
    const migrated = migrateLegacyOrder(legacy);

    expect(migrated.customerName).toBe("");
    expect(migrated.items[0].name).toBe("");
    expect(migrated.total).toBe(0);
    expect(migrated.status).toBe("pending");
  });

  it("calculates per-item price from total and quantity", () => {
    const legacy = {
      itemName: "Brownies (8x8)",
      quantity: 2,
      total: 50,
    };

    const migrated = migrateLegacyOrder(legacy);
    expect(migrated.items[0].basePrice).toBe(25);
    expect(migrated.items[0].quantity).toBe(2);
  });
});

describe("Report filtering", () => {
  const orders = [
    { timestamp: "2026-02-22T10:00:00Z", status: "completed" },
    { timestamp: "2026-02-20T10:00:00Z", status: "completed" },
    { timestamp: "2026-02-01T10:00:00Z", status: "completed" },
    { timestamp: "2025-12-01T10:00:00Z", status: "completed" },
    { timestamp: "2026-02-22T08:00:00Z", status: "pending" },
  ];

  it("filters daily — only today's completed orders", () => {
    const result = filterOrdersByRange(orders, "daily");
    expect(result).toHaveLength(1);
    expect(result[0].timestamp).toBe("2026-02-22T10:00:00Z");
  });

  it("filters weekly — last 7 days completed orders", () => {
    const result = filterOrdersByRange(orders, "weekly");
    expect(result).toHaveLength(2);
  });

  it("filters monthly — last month completed orders", () => {
    const result = filterOrdersByRange(orders, "monthly");
    expect(result).toHaveLength(3);
  });

  it("filters all — all completed orders", () => {
    const result = filterOrdersByRange(orders, "all");
    expect(result).toHaveLength(4);
  });

  it("excludes pending orders from all ranges", () => {
    const result = filterOrdersByRange(orders, "all");
    expect(result.every((o) => o.status === "completed")).toBe(true);
  });
});

describe("CSV export formatting", () => {
  it("flattens multi-item orders into rows", () => {
    const orders = [
      {
        id: "order1",
        customerName: "John",
        items: [
          { name: "Latte", quantity: 2, basePrice: 120, note: "no sugar" },
          { name: "Croissant", quantity: 1, basePrice: 85, note: "" },
        ],
        notes: "For pickup",
        pickupDate: "2026-02-22",
        pickupTime: "14:00",
        source: "Walk-in",
        status: "completed",
        total: 325,
        timestamp: "2026-02-22T10:00:00Z",
        completedAt: "2026-02-22T14:00:00Z",
      },
    ];

    const rows = formatOrdersForCSV(orders);
    expect(rows).toHaveLength(2);
    expect(rows[0].ItemName).toBe("Latte");
    expect(rows[0].Quantity).toBe(2);
    expect(rows[0].ItemNote).toBe("no sugar");
    expect(rows[1].ItemName).toBe("Croissant");
    expect(rows[1].OrderID).toBe("order1");
  });

  it("handles empty orders array", () => {
    const rows = formatOrdersForCSV([]);
    expect(rows).toHaveLength(0);
  });
});
