import { describe, expect, it } from "vitest";

/**
 * Batch 2: TDD tests for settings, export/import, and source management
 * - Source management (add, remove, edit, duplicates)
 * - CSV export formatting for menu items
 * - CSV import parsing for menu items and orders
 * - Theme/accent color persistence logic
 * - Edge cases for special characters
 */

// ============================================================
// Source Management Logic
// ============================================================

function addSource(sources: string[], newSource: string): { sources: string[]; error?: string } {
  const trimmed = newSource.trim();
  if (!trimmed) {
    return { sources, error: "Source name cannot be empty" };
  }
  if (sources.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
    return { sources, error: "Source already exists" };
  }
  return { sources: [...sources, trimmed] };
}

function removeSource(sources: string[], sourceToRemove: string): string[] {
  return sources.filter((s) => s !== sourceToRemove);
}

function editSource(
  sources: string[],
  oldName: string,
  newName: string
): { sources: string[]; error?: string } {
  const trimmed = newName.trim();
  if (!trimmed) {
    return { sources, error: "Source name cannot be empty" };
  }
  if (sources.some((s) => s !== oldName && s.toLowerCase() === trimmed.toLowerCase())) {
    return { sources, error: "Source already exists" };
  }
  return { sources: sources.map((s) => (s === oldName ? trimmed : s)) };
}

// ============================================================
// CSV Export for Menu Items
// ============================================================

interface MenuItem {
  id: string;
  name: string;
  basePrice: number;
  category: string;
  available: boolean;
}

function formatMenuForCSV(items: MenuItem[]): Array<Record<string, string | number | boolean>> {
  return items.map((item) => ({
    Name: item.name,
    Price: item.basePrice,
    Category: item.category,
    Available: item.available ? "Yes" : "No",
  }));
}

// ============================================================
// CSV Import Parsing for Menu Items
// ============================================================

interface ParsedMenuItem {
  name: string;
  basePrice: number;
  category: string;
  available: boolean;
}

function parseMenuCSVRow(row: Record<string, string>): {
  item?: ParsedMenuItem;
  error?: string;
} {
  const name = (row["Name"] || row["name"] || "").trim();
  const priceStr = row["Price"] || row["price"] || row["BasePrice"] || row["basePrice"] || "";
  const category = (row["Category"] || row["category"] || "").trim();
  const availableStr = (row["Available"] || row["available"] || "Yes").trim().toLowerCase();

  if (!name) {
    return { error: "Missing name" };
  }

  const price = parseFloat(priceStr);
  if (isNaN(price) || price < 0) {
    return { error: `Invalid price for "${name}": ${priceStr}` };
  }

  if (!category) {
    return { error: `Missing category for "${name}"` };
  }

  const available = availableStr !== "no" && availableStr !== "false" && availableStr !== "0";

  return {
    item: { name, basePrice: price, category, available },
  };
}

// ============================================================
// CSV Import Parsing for Orders
// ============================================================

interface ParsedOrderRow {
  orderId: string;
  customerName: string;
  itemName: string;
  quantity: number;
  price: number;
  itemNote: string;
  orderNotes: string;
  pickupDate: string;
  pickupTime: string;
  source: string;
  status: string;
  total: number;
  timestamp: string;
}

function parseOrderCSVRow(row: Record<string, string>): {
  parsed?: ParsedOrderRow;
  error?: string;
} {
  const orderId = (row["OrderID"] || row["orderId"] || "").trim();
  const customerName = (row["CustomerName"] || row["customerName"] || "").trim();
  const itemName = (row["ItemName"] || row["itemName"] || "").trim();
  const quantityStr = row["Quantity"] || row["quantity"] || "1";
  const priceStr = row["Price"] || row["price"] || "0";
  const itemNote = (row["ItemNote"] || row["itemNote"] || "").trim();
  const orderNotes = (row["OrderNotes"] || row["orderNotes"] || "").trim();
  const pickupDate = (row["PickupDate"] || row["pickupDate"] || "").trim();
  const pickupTime = (row["PickupTime"] || row["pickupTime"] || "").trim();
  const source = (row["Source"] || row["source"] || "").trim();
  const status = (row["Status"] || row["status"] || "pending").trim();
  const totalStr = row["Total"] || row["total"] || "0";
  const timestamp = (row["Timestamp"] || row["timestamp"] || "").trim();

  if (!customerName) {
    return { error: "Missing customer name" };
  }
  if (!itemName) {
    return { error: `Missing item name for order ${orderId}` };
  }

  const quantity = parseInt(quantityStr, 10);
  if (isNaN(quantity) || quantity <= 0) {
    return { error: `Invalid quantity for "${itemName}": ${quantityStr}` };
  }

  const price = parseFloat(priceStr);
  if (isNaN(price)) {
    return { error: `Invalid price for "${itemName}": ${priceStr}` };
  }

  const total = parseFloat(totalStr);

  return {
    parsed: {
      orderId,
      customerName,
      itemName,
      quantity,
      price,
      itemNote,
      orderNotes,
      pickupDate,
      pickupTime,
      source,
      status,
      total: isNaN(total) ? 0 : total,
      timestamp,
    },
  };
}

// ============================================================
// Group parsed CSV rows back into multi-item orders
// ============================================================

function groupOrderRows(rows: ParsedOrderRow[]): Map<string, {
  customerName: string;
  items: Array<{ name: string; basePrice: number; quantity: number; note: string }>;
  notes: string;
  pickupDate: string;
  pickupTime: string;
  source: string;
  status: string;
  total: number;
  timestamp: string;
}> {
  const orderMap = new Map<string, any>();

  for (const row of rows) {
    const key = row.orderId || `${row.customerName}-${row.timestamp}`;
    if (!orderMap.has(key)) {
      orderMap.set(key, {
        customerName: row.customerName,
        items: [],
        notes: row.orderNotes,
        pickupDate: row.pickupDate,
        pickupTime: row.pickupTime,
        source: row.source,
        status: row.status,
        total: row.total,
        timestamp: row.timestamp,
      });
    }
    orderMap.get(key).items.push({
      name: row.itemName,
      basePrice: row.price,
      quantity: row.quantity,
      note: row.itemNote,
    });
  }

  return orderMap;
}

// ============================================================
// TESTS
// ============================================================

describe("Source Management", () => {
  it("adds a new source", () => {
    const result = addSource(["Walk-in", "Phone"], "Marketplace");
    expect(result.sources).toEqual(["Walk-in", "Phone", "Marketplace"]);
    expect(result.error).toBeUndefined();
  });

  it("rejects empty source name", () => {
    const result = addSource(["Walk-in"], "");
    expect(result.error).toBe("Source name cannot be empty");
    expect(result.sources).toEqual(["Walk-in"]);
  });

  it("rejects whitespace-only source name", () => {
    const result = addSource(["Walk-in"], "   ");
    expect(result.error).toBe("Source name cannot be empty");
  });

  it("rejects duplicate source (case-insensitive)", () => {
    const result = addSource(["Walk-in", "Phone"], "walk-in");
    expect(result.error).toBe("Source already exists");
    expect(result.sources).toEqual(["Walk-in", "Phone"]);
  });

  it("trims whitespace from source name", () => {
    const result = addSource(["Walk-in"], "  Marketplace  ");
    expect(result.sources).toEqual(["Walk-in", "Marketplace"]);
  });

  it("removes a source", () => {
    const result = removeSource(["Walk-in", "Phone", "Marketplace"], "Phone");
    expect(result).toEqual(["Walk-in", "Marketplace"]);
  });

  it("returns same array when removing non-existent source", () => {
    const result = removeSource(["Walk-in", "Phone"], "Email");
    expect(result).toEqual(["Walk-in", "Phone"]);
  });

  it("edits a source name", () => {
    const result = editSource(["Walk-in", "Phone"], "Phone", "Telephone");
    expect(result.sources).toEqual(["Walk-in", "Telephone"]);
    expect(result.error).toBeUndefined();
  });

  it("rejects editing to empty name", () => {
    const result = editSource(["Walk-in", "Phone"], "Phone", "");
    expect(result.error).toBe("Source name cannot be empty");
  });

  it("rejects editing to duplicate name", () => {
    const result = editSource(["Walk-in", "Phone"], "Phone", "Walk-in");
    expect(result.error).toBe("Source already exists");
  });
});

describe("Menu CSV Export", () => {
  it("formats menu items for CSV", () => {
    const items: MenuItem[] = [
      { id: "1", name: "Iced Latte", basePrice: 120, category: "Drinks", available: true },
      { id: "2", name: "Brownie", basePrice: 80, category: "Dessert", available: false },
    ];

    const rows = formatMenuForCSV(items);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({ Name: "Iced Latte", Price: 120, Category: "Drinks", Available: "Yes" });
    expect(rows[1]).toEqual({ Name: "Brownie", Price: 80, Category: "Dessert", Available: "No" });
  });

  it("handles empty menu", () => {
    expect(formatMenuForCSV([])).toHaveLength(0);
  });
});

describe("Menu CSV Import Parsing", () => {
  it("parses a valid menu row", () => {
    const result = parseMenuCSVRow({ Name: "Latte", Price: "120", Category: "Drinks", Available: "Yes" });
    expect(result.item).toEqual({
      name: "Latte",
      basePrice: 120,
      category: "Drinks",
      available: true,
    });
  });

  it("handles lowercase headers", () => {
    const result = parseMenuCSVRow({ name: "Cookie", price: "50", category: "Pastries" });
    expect(result.item?.name).toBe("Cookie");
    expect(result.item?.basePrice).toBe(50);
  });

  it("defaults available to true when not specified", () => {
    const result = parseMenuCSVRow({ Name: "Cake", Price: "200", Category: "Dessert" });
    expect(result.item?.available).toBe(true);
  });

  it("parses 'No' as unavailable", () => {
    const result = parseMenuCSVRow({ Name: "Cake", Price: "200", Category: "Dessert", Available: "No" });
    expect(result.item?.available).toBe(false);
  });

  it("parses 'false' as unavailable", () => {
    const result = parseMenuCSVRow({ Name: "Cake", Price: "200", Category: "Dessert", Available: "false" });
    expect(result.item?.available).toBe(false);
  });

  it("rejects missing name", () => {
    const result = parseMenuCSVRow({ Price: "120", Category: "Drinks" });
    expect(result.error).toBe("Missing name");
  });

  it("rejects invalid price", () => {
    const result = parseMenuCSVRow({ Name: "Latte", Price: "abc", Category: "Drinks" });
    expect(result.error).toContain("Invalid price");
  });

  it("rejects negative price", () => {
    const result = parseMenuCSVRow({ Name: "Latte", Price: "-10", Category: "Drinks" });
    expect(result.error).toContain("Invalid price");
  });

  it("rejects missing category", () => {
    const result = parseMenuCSVRow({ Name: "Latte", Price: "120" });
    expect(result.error).toContain("Missing category");
  });

  it("handles decimal prices", () => {
    const result = parseMenuCSVRow({ Name: "Cookie", Price: "12.50", Category: "Pastries" });
    expect(result.item?.basePrice).toBe(12.5);
  });
});

describe("Order CSV Import Parsing", () => {
  it("parses a valid order row", () => {
    const result = parseOrderCSVRow({
      OrderID: "order1",
      CustomerName: "Alice",
      ItemName: "Latte",
      Quantity: "2",
      Price: "120",
      ItemNote: "no sugar",
      OrderNotes: "For pickup",
      PickupDate: "2026-02-22",
      PickupTime: "14:00",
      Source: "Walk-in",
      Status: "completed",
      Total: "240",
      Timestamp: "2026-02-22T10:00:00Z",
    });

    expect(result.parsed).toBeDefined();
    expect(result.parsed!.customerName).toBe("Alice");
    expect(result.parsed!.itemName).toBe("Latte");
    expect(result.parsed!.quantity).toBe(2);
    expect(result.parsed!.price).toBe(120);
    expect(result.parsed!.total).toBe(240);
  });

  it("rejects missing customer name", () => {
    const result = parseOrderCSVRow({ ItemName: "Latte", Quantity: "1", Price: "120" });
    expect(result.error).toBe("Missing customer name");
  });

  it("rejects missing item name", () => {
    const result = parseOrderCSVRow({ CustomerName: "Alice", Quantity: "1", Price: "120" });
    expect(result.error).toContain("Missing item name");
  });

  it("rejects invalid quantity", () => {
    const result = parseOrderCSVRow({ CustomerName: "Alice", ItemName: "Latte", Quantity: "abc", Price: "120" });
    expect(result.error).toContain("Invalid quantity");
  });

  it("rejects zero quantity", () => {
    const result = parseOrderCSVRow({ CustomerName: "Alice", ItemName: "Latte", Quantity: "0", Price: "120" });
    expect(result.error).toContain("Invalid quantity");
  });

  it("defaults status to pending", () => {
    const result = parseOrderCSVRow({
      CustomerName: "Alice",
      ItemName: "Latte",
      Quantity: "1",
      Price: "120",
    });
    expect(result.parsed!.status).toBe("pending");
  });
});

describe("Order CSV Row Grouping", () => {
  it("groups rows by orderId into multi-item orders", () => {
    const rows: ParsedOrderRow[] = [
      {
        orderId: "order1", customerName: "Alice", itemName: "Latte", quantity: 2,
        price: 120, itemNote: "no sugar", orderNotes: "", pickupDate: "2026-02-22",
        pickupTime: "14:00", source: "Walk-in", status: "pending", total: 325,
        timestamp: "2026-02-22T10:00:00Z",
      },
      {
        orderId: "order1", customerName: "Alice", itemName: "Croissant", quantity: 1,
        price: 85, itemNote: "", orderNotes: "", pickupDate: "2026-02-22",
        pickupTime: "14:00", source: "Walk-in", status: "pending", total: 325,
        timestamp: "2026-02-22T10:00:00Z",
      },
    ];

    const grouped = groupOrderRows(rows);
    expect(grouped.size).toBe(1);
    const order = grouped.get("order1");
    expect(order).toBeDefined();
    expect(order!.items).toHaveLength(2);
    expect(order!.items[0].name).toBe("Latte");
    expect(order!.items[1].name).toBe("Croissant");
  });

  it("separates different orders", () => {
    const rows: ParsedOrderRow[] = [
      {
        orderId: "order1", customerName: "Alice", itemName: "Latte", quantity: 1,
        price: 120, itemNote: "", orderNotes: "", pickupDate: "2026-02-22",
        pickupTime: "14:00", source: "Walk-in", status: "pending", total: 120,
        timestamp: "2026-02-22T10:00:00Z",
      },
      {
        orderId: "order2", customerName: "Bob", itemName: "Cake", quantity: 1,
        price: 250, itemNote: "", orderNotes: "", pickupDate: "2026-02-22",
        pickupTime: "15:00", source: "Phone", status: "completed", total: 250,
        timestamp: "2026-02-22T11:00:00Z",
      },
    ];

    const grouped = groupOrderRows(rows);
    expect(grouped.size).toBe(2);
  });

  it("handles empty rows", () => {
    const grouped = groupOrderRows([]);
    expect(grouped.size).toBe(0);
  });
});

describe("Special Characters Edge Cases", () => {
  it("handles menu item names with quotes", () => {
    const result = parseMenuCSVRow({ Name: 'Sansrival Cake (6")', Price: "350", Category: "Cakes" });
    expect(result.item?.name).toBe('Sansrival Cake (6")');
  });

  it("handles customer names with special characters", () => {
    const result = parseOrderCSVRow({
      CustomerName: "José María",
      ItemName: "Café con Leche",
      Quantity: "1",
      Price: "100",
    });
    expect(result.parsed?.customerName).toBe("José María");
    expect(result.parsed?.itemName).toBe("Café con Leche");
  });

  it("handles source names with ampersand", () => {
    const result = addSource(["Walk-in"], "Facebook & Instagram");
    expect(result.sources).toContain("Facebook & Instagram");
  });

  it("handles notes with commas (CSV-safe)", () => {
    const result = parseOrderCSVRow({
      CustomerName: "Alice",
      ItemName: "Latte",
      Quantity: "1",
      Price: "120",
      ItemNote: "no sugar, extra ice, oat milk",
    });
    expect(result.parsed?.itemNote).toBe("no sugar, extra ice, oat milk");
  });
});
