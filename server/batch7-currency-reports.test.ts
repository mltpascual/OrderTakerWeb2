import { describe, expect, it } from "vitest";

// ============================================================
// Batch 7: Currency selector + Reports by source/category
// ============================================================

// --- Feature 1: Currency selector ---

type CurrencyOption = "PHP" | "USD";

interface CurrencyConfig {
  code: CurrencyOption;
  symbol: string;
  name: string;
}

const CURRENCIES: Record<CurrencyOption, CurrencyConfig> = {
  PHP: { code: "PHP", symbol: "₱", name: "Philippine Peso" },
  USD: { code: "USD", symbol: "$", name: "US Dollar" },
};

function formatPrice(amount: number, currency: CurrencyOption): string {
  const config = CURRENCIES[currency];
  return `${config.symbol}${amount.toFixed(2)}`;
}

describe("Currency selector", () => {
  it("should format price in Philippine Peso", () => {
    expect(formatPrice(150, "PHP")).toBe("₱150.00");
  });

  it("should format price in US Dollar", () => {
    expect(formatPrice(150, "USD")).toBe("$150.00");
  });

  it("should handle zero amount", () => {
    expect(formatPrice(0, "PHP")).toBe("₱0.00");
    expect(formatPrice(0, "USD")).toBe("$0.00");
  });

  it("should handle decimal amounts", () => {
    expect(formatPrice(25.5, "PHP")).toBe("₱25.50");
    expect(formatPrice(25.5, "USD")).toBe("$25.50");
  });

  it("should have correct currency names", () => {
    expect(CURRENCIES.PHP.name).toBe("Philippine Peso");
    expect(CURRENCIES.USD.name).toBe("US Dollar");
  });

  it("should have correct symbols", () => {
    expect(CURRENCIES.PHP.symbol).toBe("₱");
    expect(CURRENCIES.USD.symbol).toBe("$");
  });
});

// --- Feature 2: Reports by source ---

interface OrderForReport {
  id: string;
  customerName: string;
  items: { name: string; quantity: number; basePrice: number; category?: string }[];
  total: number;
  source: string;
  status: string;
  pickupDate: string;
  timestamp: string;
}

interface SourceBreakdown {
  source: string;
  orderCount: number;
  revenue: number;
}

function getOrdersBySource(orders: OrderForReport[]): SourceBreakdown[] {
  const sourceMap = new Map<string, { count: number; revenue: number }>();

  for (const order of orders) {
    const source = order.source || "Unknown";
    const existing = sourceMap.get(source) || { count: 0, revenue: 0 };
    existing.count += 1;
    existing.revenue += order.total;
    sourceMap.set(source, existing);
  }

  return Array.from(sourceMap.entries())
    .map(([source, data]) => ({
      source,
      orderCount: data.count,
      revenue: data.revenue,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

describe("Reports: Orders by source", () => {
  const orders: OrderForReport[] = [
    { id: "1", customerName: "A", items: [], total: 100, source: "Marketplace", status: "completed", pickupDate: "2026-02-22", timestamp: "2026-02-22T08:00:00Z" },
    { id: "2", customerName: "B", items: [], total: 50, source: "Walk-in", status: "completed", pickupDate: "2026-02-22", timestamp: "2026-02-22T09:00:00Z" },
    { id: "3", customerName: "C", items: [], total: 200, source: "Marketplace", status: "completed", pickupDate: "2026-02-22", timestamp: "2026-02-22T10:00:00Z" },
    { id: "4", customerName: "D", items: [], total: 75, source: "Phone", status: "completed", pickupDate: "2026-02-22", timestamp: "2026-02-22T11:00:00Z" },
    { id: "5", customerName: "E", items: [], total: 150, source: "Marketplace", status: "completed", pickupDate: "2026-02-22", timestamp: "2026-02-22T12:00:00Z" },
  ];

  it("should group orders by source", () => {
    const result = getOrdersBySource(orders);
    expect(result).toHaveLength(3);
  });

  it("should calculate correct order count per source", () => {
    const result = getOrdersBySource(orders);
    const marketplace = result.find((r) => r.source === "Marketplace");
    expect(marketplace?.orderCount).toBe(3);
  });

  it("should calculate correct revenue per source", () => {
    const result = getOrdersBySource(orders);
    const marketplace = result.find((r) => r.source === "Marketplace");
    expect(marketplace?.revenue).toBe(450);
  });

  it("should sort by revenue descending", () => {
    const result = getOrdersBySource(orders);
    expect(result[0].source).toBe("Marketplace");
    expect(result[result.length - 1].source).toBe("Walk-in");
  });

  it("should handle orders with no source as 'Unknown'", () => {
    const ordersWithEmpty = [
      ...orders,
      { id: "6", customerName: "F", items: [], total: 30, source: "", status: "completed", pickupDate: "2026-02-22", timestamp: "2026-02-22T13:00:00Z" },
    ];
    const result = getOrdersBySource(ordersWithEmpty);
    const unknown = result.find((r) => r.source === "Unknown");
    expect(unknown?.orderCount).toBe(1);
    expect(unknown?.revenue).toBe(30);
  });
});

// --- Feature 3: Reports by category ---

interface CategoryBreakdown {
  category: string;
  itemCount: number;
  revenue: number;
}

function getOrdersByCategory(orders: OrderForReport[]): CategoryBreakdown[] {
  const catMap = new Map<string, { count: number; revenue: number }>();

  for (const order of orders) {
    for (const item of order.items) {
      const category = item.category || "Uncategorized";
      const existing = catMap.get(category) || { count: 0, revenue: 0 };
      existing.count += item.quantity;
      existing.revenue += item.basePrice * item.quantity;
      catMap.set(category, existing);
    }
  }

  return Array.from(catMap.entries())
    .map(([category, data]) => ({
      category,
      itemCount: data.count,
      revenue: data.revenue,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

describe("Reports: Orders by category", () => {
  const orders: OrderForReport[] = [
    {
      id: "1", customerName: "A", total: 125, source: "Marketplace", status: "completed",
      pickupDate: "2026-02-22", timestamp: "2026-02-22T08:00:00Z",
      items: [
        { name: "Latte", quantity: 2, basePrice: 25, category: "Drinks" },
        { name: "Brownie", quantity: 1, basePrice: 75, category: "Dessert" },
      ],
    },
    {
      id: "2", customerName: "B", total: 100, source: "Walk-in", status: "completed",
      pickupDate: "2026-02-22", timestamp: "2026-02-22T09:00:00Z",
      items: [
        { name: "Espresso", quantity: 3, basePrice: 20, category: "Drinks" },
        { name: "Cake", quantity: 1, basePrice: 40, category: "Dessert" },
      ],
    },
    {
      id: "3", customerName: "C", total: 50, source: "Phone", status: "completed",
      pickupDate: "2026-02-22", timestamp: "2026-02-22T10:00:00Z",
      items: [
        { name: "Custom Cake", quantity: 1, basePrice: 50 }, // no category
      ],
    },
  ];

  it("should group items by category", () => {
    const result = getOrdersByCategory(orders);
    expect(result.length).toBeGreaterThanOrEqual(2);
  });

  it("should calculate correct item count per category", () => {
    const result = getOrdersByCategory(orders);
    const drinks = result.find((r) => r.category === "Drinks");
    expect(drinks?.itemCount).toBe(5); // 2 lattes + 3 espressos
  });

  it("should calculate correct revenue per category", () => {
    const result = getOrdersByCategory(orders);
    const drinks = result.find((r) => r.category === "Drinks");
    expect(drinks?.revenue).toBe(110); // 2*25 + 3*20
  });

  it("should sort by revenue descending", () => {
    const result = getOrdersByCategory(orders);
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].revenue).toBeGreaterThanOrEqual(result[i].revenue);
    }
  });

  it("should handle items without category as 'Uncategorized'", () => {
    const result = getOrdersByCategory(orders);
    const uncategorized = result.find((r) => r.category === "Uncategorized");
    expect(uncategorized?.itemCount).toBe(1);
    expect(uncategorized?.revenue).toBe(50);
  });

  it("should handle dessert category correctly", () => {
    const result = getOrdersByCategory(orders);
    const dessert = result.find((r) => r.category === "Dessert");
    expect(dessert?.itemCount).toBe(2); // 1 brownie + 1 cake
    expect(dessert?.revenue).toBe(115); // 75 + 40
  });
});
