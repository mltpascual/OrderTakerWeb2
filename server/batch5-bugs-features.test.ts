import { describe, expect, it } from "vitest";

/**
 * Batch 5: TDD tests for bug fixes and new features
 * - Bug: Past time validation on same-day orders (add + edit)
 * - Feature: Source is required with default "Marketplace"
 * - Feature: Custom order (custom item name + custom price)
 * - Feature: Pipeline sorting (by time, customer name, total)
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

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// ============================================================
// UPDATED Validation Logic — now checks past TIME on same day
// ============================================================

function validateOrderForm(data: {
  customerName: string;
  cart: OrderItem[];
  pickupDate: string;
  pickupTime: string;
  source: string;
}): ValidationResult {
  const errors: string[] = [];

  if (!data.customerName.trim()) {
    errors.push("Customer name is required");
  }

  if (data.cart.length === 0) {
    errors.push("At least one item is required");
  }

  if (!data.source || !data.source.trim()) {
    errors.push("Source is required");
  }

  if (!data.pickupDate) {
    errors.push("Pickup date is required");
  } else {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(data.pickupDate)) {
      errors.push("Invalid date format");
    } else {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const selectedDate = new Date(data.pickupDate + "T00:00:00");

      if (selectedDate < today) {
        errors.push("Pickup date cannot be in the past");
      }

      // If same day, check if time is in the past
      if (
        selectedDate.getTime() === today.getTime() &&
        data.pickupTime
      ) {
        const timeRegex = /^\d{2}:\d{2}$/;
        if (timeRegex.test(data.pickupTime)) {
          const [hours, minutes] = data.pickupTime.split(":").map(Number);
          const pickupDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
          if (pickupDateTime < now) {
            errors.push("Pickup time cannot be in the past");
          }
        }
      }
    }
  }

  if (!data.pickupTime) {
    errors.push("Pickup time is required");
  } else {
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(data.pickupTime)) {
      errors.push("Invalid time format");
    }
  }

  return { valid: errors.length === 0, errors };
}

// ============================================================
// Edit Order Validation — same rules apply
// ============================================================

function validateEditOrder(data: {
  customerName: string;
  items: OrderItem[];
  pickupDate: string;
  pickupTime: string;
  source: string;
}): ValidationResult {
  // Reuse the same validation with items mapped to cart
  return validateOrderForm({
    customerName: data.customerName,
    cart: data.items,
    pickupDate: data.pickupDate,
    pickupTime: data.pickupTime,
    source: data.source,
  });
}

// ============================================================
// Custom Order Item — not from menu
// ============================================================

function createCustomOrderItem(name: string, price: number): OrderItem | { error: string } {
  if (!name.trim()) {
    return { error: "Item name is required" };
  }
  if (price <= 0 || isNaN(price)) {
    return { error: "Price must be greater than 0" };
  }
  return {
    menuItemId: `custom-${Date.now()}`,
    name: name.trim(),
    basePrice: price,
    quantity: 1,
    note: "",
  };
}

// ============================================================
// Pipeline Sorting
// ============================================================

type SortOption = "newest" | "oldest" | "name-asc" | "name-desc" | "total-high" | "total-low";

function sortOrders(orders: Order[], sortBy: SortOption): Order[] {
  const sorted = [...orders];
  switch (sortBy) {
    case "newest":
      return sorted.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    case "oldest":
      return sorted.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    case "name-asc":
      return sorted.sort((a, b) => a.customerName.localeCompare(b.customerName));
    case "name-desc":
      return sorted.sort((a, b) => b.customerName.localeCompare(a.customerName));
    case "total-high":
      return sorted.sort((a, b) => b.total - a.total);
    case "total-low":
      return sorted.sort((a, b) => a.total - b.total);
    default:
      return sorted;
  }
}

// ============================================================
// TESTS
// ============================================================

const validItem: OrderItem = {
  menuItemId: "i1",
  name: "Latte",
  basePrice: 120,
  quantity: 1,
  note: "",
};

describe("Bug Fix: Past time validation on same-day orders", () => {
  it("rejects past time on today's date", () => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    // Set time to 2 hours ago
    const pastHour = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const pastTimeStr = `${String(pastHour.getHours()).padStart(2, "0")}:${String(pastHour.getMinutes()).padStart(2, "0")}`;

    // Only test if we're past 2am (so 2 hours ago is still today)
    if (pastHour.getDate() === now.getDate()) {
      const result = validateOrderForm({
        customerName: "John",
        cart: [validItem],
        pickupDate: todayStr,
        pickupTime: pastTimeStr,
        source: "Marketplace",
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Pickup time cannot be in the past");
    }
  });

  it("accepts future time on today's date", () => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    // Set time to 2 hours from now
    const futureHour = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const futureTimeStr = `${String(futureHour.getHours()).padStart(2, "0")}:${String(futureHour.getMinutes()).padStart(2, "0")}`;

    // Only test if future time is still today
    if (futureHour.getDate() === now.getDate()) {
      const result = validateOrderForm({
        customerName: "John",
        cart: [validItem],
        pickupDate: todayStr,
        pickupTime: futureTimeStr,
        source: "Marketplace",
      });
      expect(result.valid).toBe(true);
    }
  });

  it("does not check time for future dates", () => {
    const result = validateOrderForm({
      customerName: "John",
      cart: [validItem],
      pickupDate: "2027-12-25",
      pickupTime: "01:00",
      source: "Marketplace",
    });
    expect(result.valid).toBe(true);
  });

  it("still rejects past dates", () => {
    const result = validateOrderForm({
      customerName: "John",
      cart: [validItem],
      pickupDate: "2020-01-01",
      pickupTime: "14:00",
      source: "Marketplace",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Pickup date cannot be in the past");
  });
});

describe("Bug Fix: Edit order validation", () => {
  it("validates edit order with same rules as new order", () => {
    const result = validateEditOrder({
      customerName: "",
      items: [],
      pickupDate: "",
      pickupTime: "",
      source: "",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(4);
  });

  it("rejects past date on edit", () => {
    const result = validateEditOrder({
      customerName: "John",
      items: [validItem],
      pickupDate: "2020-01-01",
      pickupTime: "14:00",
      source: "Marketplace",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Pickup date cannot be in the past");
  });

  it("rejects past time on same day for edit", () => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const pastHour = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const pastTimeStr = `${String(pastHour.getHours()).padStart(2, "0")}:${String(pastHour.getMinutes()).padStart(2, "0")}`;

    if (pastHour.getDate() === now.getDate()) {
      const result = validateEditOrder({
        customerName: "John",
        items: [validItem],
        pickupDate: todayStr,
        pickupTime: pastTimeStr,
        source: "Marketplace",
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Pickup time cannot be in the past");
    }
  });

  it("accepts valid edit data", () => {
    const result = validateEditOrder({
      customerName: "John",
      items: [validItem],
      pickupDate: "2027-06-15",
      pickupTime: "14:00",
      source: "Walk-in",
    });
    expect(result.valid).toBe(true);
  });
});

describe("Feature: Source is required", () => {
  it("fails when source is empty string", () => {
    const result = validateOrderForm({
      customerName: "John",
      cart: [validItem],
      pickupDate: "2027-06-15",
      pickupTime: "14:00",
      source: "",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Source is required");
  });

  it("fails when source is whitespace only", () => {
    const result = validateOrderForm({
      customerName: "John",
      cart: [validItem],
      pickupDate: "2027-06-15",
      pickupTime: "14:00",
      source: "   ",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Source is required");
  });

  it("passes when source is provided", () => {
    const result = validateOrderForm({
      customerName: "John",
      cart: [validItem],
      pickupDate: "2027-06-15",
      pickupTime: "14:00",
      source: "Marketplace",
    });
    expect(result.valid).toBe(true);
  });
});

describe("Feature: Custom order item", () => {
  it("creates a custom item with name and price", () => {
    const result = createCustomOrderItem("Special Cake", 500);
    expect(result).not.toHaveProperty("error");
    if (!("error" in result)) {
      expect(result.name).toBe("Special Cake");
      expect(result.basePrice).toBe(500);
      expect(result.quantity).toBe(1);
      expect(result.note).toBe("");
      expect(result.menuItemId).toMatch(/^custom-/);
    }
  });

  it("trims whitespace from name", () => {
    const result = createCustomOrderItem("  Custom Item  ", 100);
    if (!("error" in result)) {
      expect(result.name).toBe("Custom Item");
    }
  });

  it("rejects empty name", () => {
    const result = createCustomOrderItem("", 100);
    expect(result).toHaveProperty("error");
    if ("error" in result) {
      expect(result.error).toBe("Item name is required");
    }
  });

  it("rejects whitespace-only name", () => {
    const result = createCustomOrderItem("   ", 100);
    expect(result).toHaveProperty("error");
    if ("error" in result) {
      expect(result.error).toBe("Item name is required");
    }
  });

  it("rejects zero price", () => {
    const result = createCustomOrderItem("Item", 0);
    expect(result).toHaveProperty("error");
    if ("error" in result) {
      expect(result.error).toBe("Price must be greater than 0");
    }
  });

  it("rejects negative price", () => {
    const result = createCustomOrderItem("Item", -50);
    expect(result).toHaveProperty("error");
    if ("error" in result) {
      expect(result.error).toBe("Price must be greater than 0");
    }
  });

  it("rejects NaN price", () => {
    const result = createCustomOrderItem("Item", NaN);
    expect(result).toHaveProperty("error");
    if ("error" in result) {
      expect(result.error).toBe("Price must be greater than 0");
    }
  });

  it("accepts decimal prices", () => {
    const result = createCustomOrderItem("Item", 99.50);
    if (!("error" in result)) {
      expect(result.basePrice).toBe(99.50);
    }
  });
});

describe("Feature: Pipeline sorting", () => {
  const orders: Order[] = [
    {
      id: "o1",
      customerName: "Charlie",
      items: [validItem],
      notes: "",
      pickupDate: "2026-02-22",
      pickupTime: "10:00",
      source: "Walk-in",
      status: "pending",
      total: 300,
      timestamp: "2026-02-22T08:00:00Z",
      completedAt: null,
    },
    {
      id: "o2",
      customerName: "Anna",
      items: [validItem],
      notes: "",
      pickupDate: "2026-02-22",
      pickupTime: "14:00",
      source: "Phone",
      status: "pending",
      total: 150,
      timestamp: "2026-02-22T10:00:00Z",
      completedAt: null,
    },
    {
      id: "o3",
      customerName: "Bob",
      items: [validItem],
      notes: "",
      pickupDate: "2026-02-22",
      pickupTime: "12:00",
      source: "Marketplace",
      status: "completed",
      total: 500,
      timestamp: "2026-02-22T06:00:00Z",
      completedAt: "2026-02-22T11:00:00Z",
    },
  ];

  it("sorts by newest first", () => {
    const result = sortOrders(orders, "newest");
    expect(result[0].id).toBe("o2"); // 10:00 UTC
    expect(result[1].id).toBe("o1"); // 08:00 UTC
    expect(result[2].id).toBe("o3"); // 06:00 UTC
  });

  it("sorts by oldest first", () => {
    const result = sortOrders(orders, "oldest");
    expect(result[0].id).toBe("o3"); // 06:00 UTC
    expect(result[1].id).toBe("o1"); // 08:00 UTC
    expect(result[2].id).toBe("o2"); // 10:00 UTC
  });

  it("sorts by name ascending", () => {
    const result = sortOrders(orders, "name-asc");
    expect(result[0].customerName).toBe("Anna");
    expect(result[1].customerName).toBe("Bob");
    expect(result[2].customerName).toBe("Charlie");
  });

  it("sorts by name descending", () => {
    const result = sortOrders(orders, "name-desc");
    expect(result[0].customerName).toBe("Charlie");
    expect(result[1].customerName).toBe("Bob");
    expect(result[2].customerName).toBe("Anna");
  });

  it("sorts by total high to low", () => {
    const result = sortOrders(orders, "total-high");
    expect(result[0].total).toBe(500);
    expect(result[1].total).toBe(300);
    expect(result[2].total).toBe(150);
  });

  it("sorts by total low to high", () => {
    const result = sortOrders(orders, "total-low");
    expect(result[0].total).toBe(150);
    expect(result[1].total).toBe(300);
    expect(result[2].total).toBe(500);
  });

  it("does not mutate original array", () => {
    const original = [...orders];
    sortOrders(orders, "name-asc");
    expect(orders[0].id).toBe(original[0].id);
  });

  it("handles empty array", () => {
    const result = sortOrders([], "newest");
    expect(result).toHaveLength(0);
  });

  it("handles single item array", () => {
    const result = sortOrders([orders[0]], "newest");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("o1");
  });
});
