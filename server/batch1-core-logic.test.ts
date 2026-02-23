import { describe, expect, it } from "vitest";

/**
 * Batch 1: TDD tests for core business logic
 * - Cart operations (add, remove, update quantity, clear)
 * - Pipeline filtering (Today, Pending, Completed tabs)
 * - Menu item validation
 * - Order creation validation
 * - Order number generation
 */

// ============================================================
// Types (mirroring app types)
// ============================================================

interface OrderItem {
  menuItemId: string;
  name: string;
  basePrice: number;
  quantity: number;
  note: string;
}

interface MenuItem {
  id: string;
  name: string;
  basePrice: number;
  category: string;
  available: boolean;
  createdAt: string;
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
// Cart Logic — functions under test
// ============================================================

function addItemToCart(cart: OrderItem[], menuItem: MenuItem): OrderItem[] {
  const existing = cart.find((item) => item.menuItemId === menuItem.id);
  if (existing) {
    return cart.map((item) =>
      item.menuItemId === menuItem.id
        ? { ...item, quantity: item.quantity + 1 }
        : item
    );
  }
  return [
    ...cart,
    {
      menuItemId: menuItem.id,
      name: menuItem.name,
      basePrice: menuItem.basePrice,
      quantity: 1,
      note: "",
    },
  ];
}

function removeItemFromCart(cart: OrderItem[], menuItemId: string): OrderItem[] {
  return cart.filter((item) => item.menuItemId !== menuItemId);
}

function updateItemQuantity(
  cart: OrderItem[],
  menuItemId: string,
  quantity: number
): OrderItem[] {
  if (quantity <= 0) {
    return removeItemFromCart(cart, menuItemId);
  }
  return cart.map((item) =>
    item.menuItemId === menuItemId ? { ...item, quantity } : item
  );
}

function updateItemNote(
  cart: OrderItem[],
  menuItemId: string,
  note: string
): OrderItem[] {
  return cart.map((item) =>
    item.menuItemId === menuItemId ? { ...item, note } : item
  );
}

function clearCart(): OrderItem[] {
  return [];
}

function calculateCartTotal(cart: OrderItem[]): number {
  return cart.reduce((sum, item) => sum + item.basePrice * item.quantity, 0);
}

// ============================================================
// Pipeline Filtering Logic
// ============================================================

function filterPipelineOrders(
  orders: Order[],
  tab: "today" | "pending" | "completed"
): Order[] {
  const today = new Date().toISOString().split("T")[0];

  switch (tab) {
    case "today":
      return orders.filter((order) => order.pickupDate === today);
    case "pending":
      return orders.filter((order) => order.status === "pending");
    case "completed":
      return orders.filter((order) => order.status === "completed");
    default:
      return orders;
  }
}

// ============================================================
// Menu Validation Logic
// ============================================================

interface MenuValidationResult {
  valid: boolean;
  errors: string[];
}

function validateMenuItem(item: {
  name?: string;
  basePrice?: number;
  category?: string;
}): MenuValidationResult {
  const errors: string[] = [];

  if (!item.name || item.name.trim() === "") {
    errors.push("Name is required");
  }

  if (item.basePrice === undefined || item.basePrice === null) {
    errors.push("Price is required");
  } else if (item.basePrice < 0) {
    errors.push("Price cannot be negative");
  } else if (item.basePrice === 0) {
    errors.push("Price must be greater than zero");
  }

  if (!item.category || item.category.trim() === "") {
    errors.push("Category is required");
  }

  return { valid: errors.length === 0, errors };
}

// ============================================================
// Order Creation Validation
// ============================================================

interface OrderValidationResult {
  valid: boolean;
  errors: string[];
}

function validateOrder(order: {
  customerName?: string;
  items?: OrderItem[];
  pickupDate?: string;
  pickupTime?: string;
  source?: string;
}): OrderValidationResult {
  const errors: string[] = [];

  if (!order.customerName || order.customerName.trim() === "") {
    errors.push("Customer name is required");
  }

  if (!order.items || order.items.length === 0) {
    errors.push("At least one item is required");
  }

  if (!order.pickupDate || order.pickupDate.trim() === "") {
    errors.push("Pickup date is required");
  }

  if (!order.pickupTime || order.pickupTime.trim() === "") {
    errors.push("Pickup time is required");
  }

  if (!order.source || order.source.trim() === "") {
    errors.push("Source is required");
  }

  return { valid: errors.length === 0, errors };
}

// ============================================================
// Order Number Generation
// ============================================================

function generateOrderNumber(existingOrders: Order[], today: Date): number {
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayOrders = existingOrders.filter((order) => {
    const orderDate = new Date(order.timestamp);
    return orderDate >= todayStart;
  });
  return todayOrders.length + 1;
}

// ============================================================
// TESTS
// ============================================================

describe("Cart Operations", () => {
  const sampleMenuItem: MenuItem = {
    id: "item1",
    name: "Iced Latte",
    basePrice: 120,
    category: "Drinks",
    available: true,
    createdAt: "2026-01-01T00:00:00Z",
  };

  const anotherMenuItem: MenuItem = {
    id: "item2",
    name: "Croissant",
    basePrice: 85,
    category: "Pastries",
    available: true,
    createdAt: "2026-01-01T00:00:00Z",
  };

  it("adds a new item to an empty cart", () => {
    const cart = addItemToCart([], sampleMenuItem);
    expect(cart).toHaveLength(1);
    expect(cart[0].menuItemId).toBe("item1");
    expect(cart[0].name).toBe("Iced Latte");
    expect(cart[0].basePrice).toBe(120);
    expect(cart[0].quantity).toBe(1);
    expect(cart[0].note).toBe("");
  });

  it("increments quantity when adding an existing item", () => {
    const cart = addItemToCart(
      [{ menuItemId: "item1", name: "Iced Latte", basePrice: 120, quantity: 1, note: "" }],
      sampleMenuItem
    );
    expect(cart).toHaveLength(1);
    expect(cart[0].quantity).toBe(2);
  });

  it("adds different items separately", () => {
    let cart = addItemToCart([], sampleMenuItem);
    cart = addItemToCart(cart, anotherMenuItem);
    expect(cart).toHaveLength(2);
    expect(cart[0].name).toBe("Iced Latte");
    expect(cart[1].name).toBe("Croissant");
  });

  it("removes an item from the cart", () => {
    const cart = removeItemFromCart(
      [
        { menuItemId: "item1", name: "Iced Latte", basePrice: 120, quantity: 2, note: "" },
        { menuItemId: "item2", name: "Croissant", basePrice: 85, quantity: 1, note: "" },
      ],
      "item1"
    );
    expect(cart).toHaveLength(1);
    expect(cart[0].menuItemId).toBe("item2");
  });

  it("returns empty array when removing from empty cart", () => {
    const cart = removeItemFromCart([], "item1");
    expect(cart).toHaveLength(0);
  });

  it("updates item quantity", () => {
    const cart = updateItemQuantity(
      [{ menuItemId: "item1", name: "Iced Latte", basePrice: 120, quantity: 1, note: "" }],
      "item1",
      5
    );
    expect(cart[0].quantity).toBe(5);
  });

  it("removes item when quantity is set to zero", () => {
    const cart = updateItemQuantity(
      [{ menuItemId: "item1", name: "Iced Latte", basePrice: 120, quantity: 3, note: "" }],
      "item1",
      0
    );
    expect(cart).toHaveLength(0);
  });

  it("removes item when quantity is set to negative", () => {
    const cart = updateItemQuantity(
      [{ menuItemId: "item1", name: "Iced Latte", basePrice: 120, quantity: 3, note: "" }],
      "item1",
      -1
    );
    expect(cart).toHaveLength(0);
  });

  it("updates item note", () => {
    const cart = updateItemNote(
      [{ menuItemId: "item1", name: "Iced Latte", basePrice: 120, quantity: 1, note: "" }],
      "item1",
      "no sugar, extra ice"
    );
    expect(cart[0].note).toBe("no sugar, extra ice");
  });

  it("clears the entire cart", () => {
    const cart = clearCart();
    expect(cart).toHaveLength(0);
  });

  it("calculates cart total correctly", () => {
    const cart: OrderItem[] = [
      { menuItemId: "item1", name: "Iced Latte", basePrice: 120, quantity: 2, note: "" },
      { menuItemId: "item2", name: "Croissant", basePrice: 85, quantity: 1, note: "" },
    ];
    expect(calculateCartTotal(cart)).toBe(325);
  });

  it("returns 0 for empty cart total", () => {
    expect(calculateCartTotal([])).toBe(0);
  });

  it("handles decimal prices in cart total", () => {
    const cart: OrderItem[] = [
      { menuItemId: "item1", name: "Cookie", basePrice: 12.5, quantity: 4, note: "" },
    ];
    expect(calculateCartTotal(cart)).toBe(50);
  });
});

describe("Pipeline Filtering", () => {
  // Use fixed dates for deterministic tests
  const todayStr = new Date().toISOString().split("T")[0];
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().split("T")[0];

  const orders: Order[] = [
    {
      id: "o1",
      customerName: "Alice",
      items: [{ menuItemId: "i1", name: "Latte", basePrice: 120, quantity: 1, note: "" }],
      notes: "",
      pickupDate: todayStr,
      pickupTime: "10:00",
      source: "Walk-in",
      status: "pending",
      total: 120,
      timestamp: `${todayStr}T08:00:00Z`,
      completedAt: null,
    },
    {
      id: "o2",
      customerName: "Bob",
      items: [{ menuItemId: "i2", name: "Cake", basePrice: 250, quantity: 1, note: "" }],
      notes: "",
      pickupDate: todayStr,
      pickupTime: "14:00",
      source: "Phone",
      status: "completed",
      total: 250,
      timestamp: `${todayStr}T09:00:00Z`,
      completedAt: `${todayStr}T14:00:00Z`,
    },
    {
      id: "o3",
      customerName: "Charlie",
      items: [{ menuItemId: "i3", name: "Muffin", basePrice: 60, quantity: 2, note: "" }],
      notes: "",
      pickupDate: yesterdayStr,
      pickupTime: "12:00",
      source: "Marketplace",
      status: "completed",
      total: 120,
      timestamp: `${yesterdayStr}T07:00:00Z`,
      completedAt: `${yesterdayStr}T12:00:00Z`,
    },
    {
      id: "o4",
      customerName: "Diana",
      items: [{ menuItemId: "i4", name: "Brownie", basePrice: 80, quantity: 1, note: "" }],
      notes: "",
      pickupDate: yesterdayStr,
      pickupTime: "16:00",
      source: "Walk-in",
      status: "pending",
      total: 80,
      timestamp: `${yesterdayStr}T10:00:00Z`,
      completedAt: null,
    },
  ];

  it("Today tab shows only today's orders (all statuses)", () => {
    const result = filterPipelineOrders(orders, "today");
    expect(result).toHaveLength(2);
    expect(result.map((o) => o.id)).toEqual(["o1", "o2"]);
  });

  it("Pending tab shows only pending orders (any date)", () => {
    const result = filterPipelineOrders(orders, "pending");
    expect(result).toHaveLength(2);
    expect(result.every((o) => o.status === "pending")).toBe(true);
  });

  it("Completed tab shows only completed orders (any date)", () => {
    const result = filterPipelineOrders(orders, "completed");
    expect(result).toHaveLength(2);
    expect(result.every((o) => o.status === "completed")).toBe(true);
  });

  it("returns empty array when no orders match", () => {
    const result = filterPipelineOrders([], "today");
    expect(result).toHaveLength(0);
  });

  it("Today tab excludes yesterday's orders", () => {
    const result = filterPipelineOrders(orders, "today");
    expect(result.find((o) => o.id === "o3")).toBeUndefined();
    expect(result.find((o) => o.id === "o4")).toBeUndefined();
  });
});

describe("Menu Item Validation", () => {
  it("validates a complete menu item", () => {
    const result = validateMenuItem({
      name: "Iced Latte",
      basePrice: 120,
      category: "Drinks",
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects empty name", () => {
    const result = validateMenuItem({
      name: "",
      basePrice: 120,
      category: "Drinks",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Name is required");
  });

  it("rejects whitespace-only name", () => {
    const result = validateMenuItem({
      name: "   ",
      basePrice: 120,
      category: "Drinks",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Name is required");
  });

  it("rejects missing name", () => {
    const result = validateMenuItem({
      basePrice: 120,
      category: "Drinks",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Name is required");
  });

  it("rejects negative price", () => {
    const result = validateMenuItem({
      name: "Latte",
      basePrice: -10,
      category: "Drinks",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Price cannot be negative");
  });

  it("rejects zero price", () => {
    const result = validateMenuItem({
      name: "Latte",
      basePrice: 0,
      category: "Drinks",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Price must be greater than zero");
  });

  it("rejects missing category", () => {
    const result = validateMenuItem({
      name: "Latte",
      basePrice: 120,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Category is required");
  });

  it("collects multiple errors at once", () => {
    const result = validateMenuItem({});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });

  it("accepts decimal prices", () => {
    const result = validateMenuItem({
      name: "Cookie",
      basePrice: 12.5,
      category: "Pastries",
    });
    expect(result.valid).toBe(true);
  });
});

describe("Order Creation Validation", () => {
  const validOrder = {
    customerName: "Alice",
    items: [{ menuItemId: "i1", name: "Latte", basePrice: 120, quantity: 1, note: "" }],
    pickupDate: "2026-02-22",
    pickupTime: "14:00",
    source: "Walk-in",
  };

  it("validates a complete order", () => {
    const result = validateOrder(validOrder);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects missing customer name", () => {
    const result = validateOrder({ ...validOrder, customerName: "" });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Customer name is required");
  });

  it("rejects empty items", () => {
    const result = validateOrder({ ...validOrder, items: [] });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("At least one item is required");
  });

  it("rejects missing pickup date", () => {
    const result = validateOrder({ ...validOrder, pickupDate: "" });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Pickup date is required");
  });

  it("rejects missing pickup time", () => {
    const result = validateOrder({ ...validOrder, pickupTime: "" });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Pickup time is required");
  });

  it("rejects missing source", () => {
    const result = validateOrder({ ...validOrder, source: "" });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Source is required");
  });

  it("collects all errors for completely empty order", () => {
    const result = validateOrder({});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBe(5);
  });
});

describe("Order Number Generation", () => {
  const today = new Date("2026-02-22T12:00:00Z");
  const todayStr = "2026-02-22";
  const yesterdayStr = "2026-02-21";

  it("returns 1 when no orders exist today", () => {
    expect(generateOrderNumber([], today)).toBe(1);
  });

  it("returns next number based on today's orders", () => {
    const orders: Order[] = [
      {
        id: "o1", customerName: "A", items: [], notes: "", pickupDate: todayStr,
        pickupTime: "10:00", source: "Walk-in", status: "pending", total: 100,
        timestamp: `${todayStr}T08:00:00Z`, completedAt: null,
      },
      {
        id: "o2", customerName: "B", items: [], notes: "", pickupDate: todayStr,
        pickupTime: "11:00", source: "Phone", status: "completed", total: 200,
        timestamp: `${todayStr}T09:00:00Z`, completedAt: `${todayStr}T11:00:00Z`,
      },
    ];
    expect(generateOrderNumber(orders, today)).toBe(3);
  });

  it("ignores yesterday's orders", () => {
    const orders: Order[] = [
      {
        id: "o1", customerName: "A", items: [], notes: "", pickupDate: yesterdayStr,
        pickupTime: "10:00", source: "Walk-in", status: "completed", total: 100,
        timestamp: `${yesterdayStr}T08:00:00Z`, completedAt: `${yesterdayStr}T10:00:00Z`,
      },
    ];
    expect(generateOrderNumber(orders, today)).toBe(1);
  });

  it("counts both pending and completed orders for today", () => {
    const orders: Order[] = [
      {
        id: "o1", customerName: "A", items: [], notes: "", pickupDate: todayStr,
        pickupTime: "10:00", source: "Walk-in", status: "pending", total: 100,
        timestamp: `${todayStr}T08:00:00Z`, completedAt: null,
      },
      {
        id: "o2", customerName: "B", items: [], notes: "", pickupDate: todayStr,
        pickupTime: "11:00", source: "Phone", status: "completed", total: 200,
        timestamp: `${todayStr}T09:00:00Z`, completedAt: `${todayStr}T11:00:00Z`,
      },
    ];
    expect(generateOrderNumber(orders, today)).toBe(3);
  });
});
