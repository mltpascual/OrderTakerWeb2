import { describe, expect, it } from "vitest";

/**
 * Batch 4: TDD tests for new features
 * - Date/time validation
 * - Order search/filter
 * - Duplicate order logic
 * - Return to pending logic
 */

// ============================================================
// Types
// ============================================================

interface OrderItem {
  menuItemId: string;
  name: string;
  basePrice: number;
  quantity: number;
  note: string;
}

interface Order {
  id: string;
  customerName: string;
  items: OrderItem[];
  notes: string;
  pickupDate: string;
  pickupTime: string;
  source: string;
  status: "pending" | "completed";
  total: number;
  timestamp: string;
  completedAt: string | null;
}

// ============================================================
// Date/Time Validation Logic
// ============================================================

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function validateOrderForm(data: {
  customerName: string;
  cart: OrderItem[];
  pickupDate: string;
  pickupTime: string;
}): ValidationResult {
  const errors: string[] = [];

  if (!data.customerName.trim()) {
    errors.push("Customer name is required");
  }

  if (data.cart.length === 0) {
    errors.push("At least one item is required");
  }

  if (!data.pickupDate) {
    errors.push("Pickup date is required");
  } else {
    // Validate date format YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(data.pickupDate)) {
      errors.push("Invalid date format");
    } else {
      const date = new Date(data.pickupDate + "T00:00:00");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) {
        errors.push("Pickup date cannot be in the past");
      }
    }
  }

  if (!data.pickupTime) {
    errors.push("Pickup time is required");
  } else {
    // Validate time format HH:MM
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(data.pickupTime)) {
      errors.push("Invalid time format");
    }
  }

  return { valid: errors.length === 0, errors };
}

// ============================================================
// Search/Filter Logic
// ============================================================

function searchOrders(orders: Order[], query: string): Order[] {
  if (!query.trim()) return orders;
  const q = query.toLowerCase().trim();
  return orders.filter((order) => {
    // Search by customer name
    if (order.customerName.toLowerCase().includes(q)) return true;
    // Search by order ID
    if (order.id.toLowerCase().includes(q)) return true;
    // Search by item names
    if (order.items.some((item) => item.name.toLowerCase().includes(q))) return true;
    return false;
  });
}

// ============================================================
// Duplicate Order Logic
// ============================================================

function createDuplicateOrder(original: Order): Omit<Order, "id"> {
  return {
    customerName: original.customerName,
    items: original.items.map((item) => ({ ...item })),
    notes: original.notes,
    pickupDate: "", // Reset — user should set new pickup date
    pickupTime: "", // Reset — user should set new pickup time
    source: original.source,
    status: "pending",
    total: original.total,
    timestamp: new Date().toISOString(),
    completedAt: null,
  };
}

// ============================================================
// Return to Pending Logic
// ============================================================

function returnToPending(order: Order): Order {
  return {
    ...order,
    status: "pending",
    completedAt: null,
  };
}

// ============================================================
// TESTS
// ============================================================

describe("Order Form Validation - Date/Time", () => {
  const validData = {
    customerName: "John",
    cart: [{ menuItemId: "i1", name: "Latte", basePrice: 120, quantity: 1, note: "" }],
    pickupDate: "2026-12-25",
    pickupTime: "14:00",
  };

  it("passes with all valid data", () => {
    const result = validateOrderForm(validData);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("fails when customer name is empty", () => {
    const result = validateOrderForm({ ...validData, customerName: "" });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Customer name is required");
  });

  it("fails when customer name is whitespace only", () => {
    const result = validateOrderForm({ ...validData, customerName: "   " });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Customer name is required");
  });

  it("fails when cart is empty", () => {
    const result = validateOrderForm({ ...validData, cart: [] });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("At least one item is required");
  });

  it("fails when pickup date is empty", () => {
    const result = validateOrderForm({ ...validData, pickupDate: "" });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Pickup date is required");
  });

  it("fails when pickup date is in the past", () => {
    const result = validateOrderForm({ ...validData, pickupDate: "2020-01-01" });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Pickup date cannot be in the past");
  });

  it("fails when pickup date has invalid format", () => {
    const result = validateOrderForm({ ...validData, pickupDate: "25-12-2026" });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Invalid date format");
  });

  it("fails when pickup time is empty", () => {
    const result = validateOrderForm({ ...validData, pickupTime: "" });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Pickup time is required");
  });

  it("fails when pickup time has invalid format", () => {
    const result = validateOrderForm({ ...validData, pickupTime: "2pm" });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Invalid time format");
  });

  it("collects multiple errors at once", () => {
    const result = validateOrderForm({
      customerName: "",
      cart: [],
      pickupDate: "",
      pickupTime: "",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(4);
  });

  it("accepts today's date", () => {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const result = validateOrderForm({ ...validData, pickupDate: dateStr });
    expect(result.valid).toBe(true);
  });
});

describe("Order Search/Filter", () => {
  const orders: Order[] = [
    {
      id: "order-001",
      customerName: "Stephanie",
      items: [{ menuItemId: "i1", name: "Sansrival Cake", basePrice: 350, quantity: 1, note: "" }],
      notes: "",
      pickupDate: "2026-02-22",
      pickupTime: "17:00",
      source: "Walk-in",
      status: "pending",
      total: 350,
      timestamp: "2026-02-22T10:00:00Z",
      completedAt: null,
    },
    {
      id: "order-002",
      customerName: "Miguel",
      items: [{ menuItemId: "i2", name: "Brownies", basePrice: 25, quantity: 3, note: "" }],
      notes: "",
      pickupDate: "2026-02-22",
      pickupTime: "14:00",
      source: "Phone",
      status: "completed",
      total: 75,
      timestamp: "2026-02-22T08:00:00Z",
      completedAt: "2026-02-22T12:00:00Z",
    },
    {
      id: "order-003",
      customerName: "Anna",
      items: [
        { menuItemId: "i1", name: "Sansrival Cake", basePrice: 350, quantity: 1, note: "" },
        { menuItemId: "i3", name: "Iced Latte", basePrice: 120, quantity: 2, note: "" },
      ],
      notes: "",
      pickupDate: "2026-02-23",
      pickupTime: "10:00",
      source: "Marketplace",
      status: "pending",
      total: 590,
      timestamp: "2026-02-22T09:00:00Z",
      completedAt: null,
    },
  ];

  it("returns all orders when query is empty", () => {
    expect(searchOrders(orders, "")).toHaveLength(3);
    expect(searchOrders(orders, "  ")).toHaveLength(3);
  });

  it("filters by customer name (case-insensitive)", () => {
    const result = searchOrders(orders, "stephanie");
    expect(result).toHaveLength(1);
    expect(result[0].customerName).toBe("Stephanie");
  });

  it("filters by partial customer name", () => {
    const result = searchOrders(orders, "ann");
    expect(result).toHaveLength(1);
    expect(result[0].customerName).toBe("Anna");
  });

  it("filters by order ID", () => {
    const result = searchOrders(orders, "order-002");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("order-002");
  });

  it("filters by item name", () => {
    const result = searchOrders(orders, "sansrival");
    expect(result).toHaveLength(2); // Stephanie and Anna both have Sansrival
  });

  it("returns empty array when no match", () => {
    const result = searchOrders(orders, "nonexistent");
    expect(result).toHaveLength(0);
  });

  it("handles special characters in query", () => {
    const result = searchOrders(orders, "order-");
    expect(result).toHaveLength(3); // all orders match
  });
});

describe("Duplicate Order", () => {
  const original: Order = {
    id: "order-001",
    customerName: "Stephanie",
    items: [
      { menuItemId: "i1", name: "Sansrival Cake", basePrice: 350, quantity: 1, note: "no nuts" },
      { menuItemId: "i2", name: "Brownies", basePrice: 25, quantity: 3, note: "" },
    ],
    notes: "Rush order",
    pickupDate: "2026-02-20",
    pickupTime: "17:00",
    source: "Walk-in",
    status: "completed",
    total: 425,
    timestamp: "2026-02-20T10:00:00Z",
    completedAt: "2026-02-20T16:00:00Z",
  };

  it("copies customer name, items, notes, source, and total", () => {
    const dup = createDuplicateOrder(original);
    expect(dup.customerName).toBe("Stephanie");
    expect(dup.items).toHaveLength(2);
    expect(dup.items[0].name).toBe("Sansrival Cake");
    expect(dup.items[0].note).toBe("no nuts");
    expect(dup.items[1].name).toBe("Brownies");
    expect(dup.notes).toBe("Rush order");
    expect(dup.source).toBe("Walk-in");
    expect(dup.total).toBe(425);
  });

  it("resets pickup date and time", () => {
    const dup = createDuplicateOrder(original);
    expect(dup.pickupDate).toBe("");
    expect(dup.pickupTime).toBe("");
  });

  it("sets status to pending and clears completedAt", () => {
    const dup = createDuplicateOrder(original);
    expect(dup.status).toBe("pending");
    expect(dup.completedAt).toBeNull();
  });

  it("creates a new timestamp", () => {
    const dup = createDuplicateOrder(original);
    expect(dup.timestamp).not.toBe(original.timestamp);
  });

  it("creates deep copies of items (not references)", () => {
    const dup = createDuplicateOrder(original);
    dup.items[0].note = "changed";
    expect(original.items[0].note).toBe("no nuts"); // original unchanged
  });

  it("does not include the original id", () => {
    const dup = createDuplicateOrder(original);
    expect(dup).not.toHaveProperty("id");
  });
});

describe("Return to Pending", () => {
  const completedOrder: Order = {
    id: "order-001",
    customerName: "Stephanie",
    items: [{ menuItemId: "i1", name: "Cake", basePrice: 350, quantity: 1, note: "" }],
    notes: "",
    pickupDate: "2026-02-22",
    pickupTime: "17:00",
    source: "Walk-in",
    status: "completed",
    total: 350,
    timestamp: "2026-02-22T10:00:00Z",
    completedAt: "2026-02-22T16:00:00Z",
  };

  it("changes status from completed to pending", () => {
    const result = returnToPending(completedOrder);
    expect(result.status).toBe("pending");
  });

  it("clears completedAt", () => {
    const result = returnToPending(completedOrder);
    expect(result.completedAt).toBeNull();
  });

  it("preserves all other fields", () => {
    const result = returnToPending(completedOrder);
    expect(result.id).toBe("order-001");
    expect(result.customerName).toBe("Stephanie");
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(350);
    expect(result.pickupDate).toBe("2026-02-22");
    expect(result.source).toBe("Walk-in");
    expect(result.timestamp).toBe("2026-02-22T10:00:00Z");
  });

  it("does not mutate the original order", () => {
    const result = returnToPending(completedOrder);
    expect(completedOrder.status).toBe("completed");
    expect(completedOrder.completedAt).toBe("2026-02-22T16:00:00Z");
  });
});
