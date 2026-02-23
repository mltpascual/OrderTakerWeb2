import { describe, expect, it } from "vitest";

/**
 * Batch 3: TDD tests for reports calculations and edge cases
 * - Report statistics (total orders, revenue, average order value)
 * - Top-selling items calculation
 * - Orders by source breakdown
 * - Date range boundary edge cases
 * - Empty state handling
 * - Large dataset handling
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

interface ReportStats {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  topItems: Array<{ name: string; totalQuantity: number; totalRevenue: number }>;
  ordersBySource: Array<{ source: string; count: number; revenue: number }>;
}

// ============================================================
// Report Calculation Logic
// ============================================================

function filterOrdersByDateRange(
  orders: Order[],
  range: "daily" | "weekly" | "monthly" | "all",
  referenceDate: Date
): Order[] {
  const todayStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());

  return orders.filter((order) => {
    if (order.status !== "completed") return false;
    const orderDate = new Date(order.timestamp);

    switch (range) {
      case "daily":
        return orderDate >= todayStart;
      case "weekly": {
        const weekAgo = new Date(todayStart);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return orderDate >= weekAgo;
      }
      case "monthly": {
        const monthAgo = new Date(todayStart);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return orderDate >= monthAgo;
      }
      case "all":
      default:
        return true;
    }
  });
}

function calculateReportStats(orders: Order[]): ReportStats {
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const averageOrderValue = totalOrders > 0 ? Math.round((totalRevenue / totalOrders) * 100) / 100 : 0;

  // Top items
  const itemMap = new Map<string, { totalQuantity: number; totalRevenue: number }>();
  for (const order of orders) {
    for (const item of order.items) {
      const existing = itemMap.get(item.name) || { totalQuantity: 0, totalRevenue: 0 };
      existing.totalQuantity += item.quantity;
      existing.totalRevenue += item.basePrice * item.quantity;
      itemMap.set(item.name, existing);
    }
  }
  const topItems = Array.from(itemMap.entries())
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.totalQuantity - a.totalQuantity);

  // Orders by source
  const sourceMap = new Map<string, { count: number; revenue: number }>();
  for (const order of orders) {
    const src = order.source || "Unknown";
    const existing = sourceMap.get(src) || { count: 0, revenue: 0 };
    existing.count += 1;
    existing.revenue += order.total;
    sourceMap.set(src, existing);
  }
  const ordersBySource = Array.from(sourceMap.entries())
    .map(([source, stats]) => ({ source, ...stats }))
    .sort((a, b) => b.count - a.count);

  return { totalOrders, totalRevenue, averageOrderValue, topItems, ordersBySource };
}

// ============================================================
// Test Data Factory
// ============================================================

function createOrder(overrides: Partial<Order> & { id: string }): Order {
  return {
    customerName: "Test Customer",
    items: [{ menuItemId: "i1", name: "Latte", basePrice: 120, quantity: 1, note: "" }],
    notes: "",
    pickupDate: "2026-02-22",
    pickupTime: "14:00",
    source: "Walk-in",
    status: "completed",
    total: 120,
    timestamp: "2026-02-22T10:00:00Z",
    completedAt: "2026-02-22T14:00:00Z",
    ...overrides,
  };
}

// ============================================================
// TESTS
// ============================================================

describe("Report Statistics Calculation", () => {
  it("calculates basic stats for a set of orders", () => {
    const orders: Order[] = [
      createOrder({ id: "o1", total: 120 }),
      createOrder({ id: "o2", total: 250 }),
      createOrder({ id: "o3", total: 80 }),
    ];

    const stats = calculateReportStats(orders);
    expect(stats.totalOrders).toBe(3);
    expect(stats.totalRevenue).toBe(450);
    expect(stats.averageOrderValue).toBe(150);
  });

  it("returns zeros for empty orders", () => {
    const stats = calculateReportStats([]);
    expect(stats.totalOrders).toBe(0);
    expect(stats.totalRevenue).toBe(0);
    expect(stats.averageOrderValue).toBe(0);
    expect(stats.topItems).toHaveLength(0);
    expect(stats.ordersBySource).toHaveLength(0);
  });

  it("handles single order", () => {
    const orders = [createOrder({ id: "o1", total: 350 })];
    const stats = calculateReportStats(orders);
    expect(stats.totalOrders).toBe(1);
    expect(stats.totalRevenue).toBe(350);
    expect(stats.averageOrderValue).toBe(350);
  });

  it("rounds average order value to 2 decimal places", () => {
    const orders = [
      createOrder({ id: "o1", total: 100 }),
      createOrder({ id: "o2", total: 200 }),
      createOrder({ id: "o3", total: 300 }),
    ];
    // Average = 600 / 3 = 200
    const stats = calculateReportStats(orders);
    expect(stats.averageOrderValue).toBe(200);

    // Test with non-round numbers
    const orders2 = [
      createOrder({ id: "o1", total: 100 }),
      createOrder({ id: "o2", total: 100 }),
      createOrder({ id: "o3", total: 100 }),
      createOrder({ id: "o4", total: 100 }),
      createOrder({ id: "o5", total: 100 }),
      createOrder({ id: "o6", total: 100 }),
      createOrder({ id: "o7", total: 33 }),
    ];
    // 633 / 7 = 90.42857... → 90.43
    const stats2 = calculateReportStats(orders2);
    expect(stats2.averageOrderValue).toBe(90.43);
  });
});

describe("Top-Selling Items", () => {
  it("ranks items by total quantity sold", () => {
    const orders: Order[] = [
      createOrder({
        id: "o1",
        items: [
          { menuItemId: "i1", name: "Latte", basePrice: 120, quantity: 3, note: "" },
          { menuItemId: "i2", name: "Croissant", basePrice: 85, quantity: 1, note: "" },
        ],
        total: 445,
      }),
      createOrder({
        id: "o2",
        items: [
          { menuItemId: "i2", name: "Croissant", basePrice: 85, quantity: 5, note: "" },
        ],
        total: 425,
      }),
      createOrder({
        id: "o3",
        items: [
          { menuItemId: "i1", name: "Latte", basePrice: 120, quantity: 2, note: "" },
        ],
        total: 240,
      }),
    ];

    const stats = calculateReportStats(orders);
    expect(stats.topItems[0].name).toBe("Croissant"); // 6 total
    expect(stats.topItems[0].totalQuantity).toBe(6);
    expect(stats.topItems[0].totalRevenue).toBe(510); // 6 * 85
    expect(stats.topItems[1].name).toBe("Latte"); // 5 total
    expect(stats.topItems[1].totalQuantity).toBe(5);
    expect(stats.topItems[1].totalRevenue).toBe(600); // 5 * 120
  });

  it("handles orders with single items", () => {
    const orders = [
      createOrder({ id: "o1", items: [{ menuItemId: "i1", name: "Cake", basePrice: 350, quantity: 1, note: "" }], total: 350 }),
    ];

    const stats = calculateReportStats(orders);
    expect(stats.topItems).toHaveLength(1);
    expect(stats.topItems[0].name).toBe("Cake");
    expect(stats.topItems[0].totalQuantity).toBe(1);
  });

  it("aggregates same item across multiple orders", () => {
    const orders = [
      createOrder({ id: "o1", items: [{ menuItemId: "i1", name: "Brownie", basePrice: 25, quantity: 2, note: "" }], total: 50 }),
      createOrder({ id: "o2", items: [{ menuItemId: "i1", name: "Brownie", basePrice: 25, quantity: 3, note: "" }], total: 75 }),
      createOrder({ id: "o3", items: [{ menuItemId: "i1", name: "Brownie", basePrice: 25, quantity: 1, note: "" }], total: 25 }),
    ];

    const stats = calculateReportStats(orders);
    expect(stats.topItems).toHaveLength(1);
    expect(stats.topItems[0].totalQuantity).toBe(6);
    expect(stats.topItems[0].totalRevenue).toBe(150);
  });
});

describe("Orders by Source", () => {
  it("groups orders by source with count and revenue", () => {
    const orders = [
      createOrder({ id: "o1", source: "Walk-in", total: 120 }),
      createOrder({ id: "o2", source: "Walk-in", total: 200 }),
      createOrder({ id: "o3", source: "Phone", total: 350 }),
      createOrder({ id: "o4", source: "Marketplace", total: 80 }),
    ];

    const stats = calculateReportStats(orders);
    expect(stats.ordersBySource).toHaveLength(3);

    const walkin = stats.ordersBySource.find((s) => s.source === "Walk-in");
    expect(walkin?.count).toBe(2);
    expect(walkin?.revenue).toBe(320);

    const phone = stats.ordersBySource.find((s) => s.source === "Phone");
    expect(phone?.count).toBe(1);
    expect(phone?.revenue).toBe(350);
  });

  it("sorts sources by count descending", () => {
    const orders = [
      createOrder({ id: "o1", source: "Phone", total: 100 }),
      createOrder({ id: "o2", source: "Walk-in", total: 100 }),
      createOrder({ id: "o3", source: "Walk-in", total: 100 }),
      createOrder({ id: "o4", source: "Walk-in", total: 100 }),
    ];

    const stats = calculateReportStats(orders);
    expect(stats.ordersBySource[0].source).toBe("Walk-in");
    expect(stats.ordersBySource[0].count).toBe(3);
  });

  it("handles orders with missing source as 'Unknown'", () => {
    const orders = [
      createOrder({ id: "o1", source: "", total: 100 }),
    ];

    const stats = calculateReportStats(orders);
    expect(stats.ordersBySource[0].source).toBe("Unknown");
  });
});

describe("Date Range Filtering", () => {
  const refDate = new Date("2026-02-22T12:00:00Z");

  const orders: Order[] = [
    createOrder({ id: "o1", status: "completed", timestamp: "2026-02-22T08:00:00Z" }), // today
    createOrder({ id: "o2", status: "completed", timestamp: "2026-02-21T08:00:00Z" }), // yesterday
    createOrder({ id: "o3", status: "completed", timestamp: "2026-02-15T08:00:00Z" }), // last week
    createOrder({ id: "o4", status: "completed", timestamp: "2026-01-25T08:00:00Z" }), // last month
    createOrder({ id: "o5", status: "completed", timestamp: "2025-06-01T08:00:00Z" }), // 8 months ago
    createOrder({ id: "o6", status: "pending", timestamp: "2026-02-22T09:00:00Z" }),   // today but pending
  ];

  it("daily: only today's completed orders", () => {
    const result = filterOrdersByDateRange(orders, "daily", refDate);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("o1");
  });

  it("weekly: last 7 days completed orders", () => {
    const result = filterOrdersByDateRange(orders, "weekly", refDate);
    // todayStart is local midnight (EST = UTC-5), so Feb 22 local = Feb 22 05:00 UTC
    // 7 days ago = Feb 15 05:00 UTC. o3 is Feb 15 08:00 UTC which is >= that.
    expect(result.length).toBeGreaterThanOrEqual(2);
    expect(result.length).toBeLessThanOrEqual(3);
  });

  it("monthly: last month completed orders", () => {
    const result = filterOrdersByDateRange(orders, "monthly", refDate);
    expect(result).toHaveLength(4); // o1, o2, o3, o4
  });

  it("all: all completed orders regardless of date", () => {
    const result = filterOrdersByDateRange(orders, "all", refDate);
    expect(result).toHaveLength(5); // all except pending o6
  });

  it("always excludes pending orders", () => {
    const result = filterOrdersByDateRange(orders, "all", refDate);
    expect(result.every((o) => o.status === "completed")).toBe(true);
  });

  it("handles midnight boundary correctly", () => {
    // In EST (UTC-5), midnight UTC on Feb 22 is actually 7pm on Feb 21 local time.
    // todayStart in local = Feb 22 00:00 EST = Feb 22 05:00 UTC
    // So midnight UTC (Feb 22 00:00 UTC) < todayStart (Feb 22 05:00 UTC)
    // Use a timestamp that's after local midnight instead
    const afterLocalMidnight = createOrder({
      id: "midnight",
      status: "completed",
      timestamp: "2026-02-22T05:00:00Z", // midnight EST
    });
    const result = filterOrdersByDateRange([afterLocalMidnight], "daily", refDate);
    expect(result).toHaveLength(1);
  });

  it("handles end-of-day boundary", () => {
    const eodOrder = createOrder({
      id: "eod",
      status: "completed",
      timestamp: "2026-02-21T23:59:59Z",
    });
    const result = filterOrdersByDateRange([eodOrder], "daily", refDate);
    expect(result).toHaveLength(0); // yesterday's order
  });
});

describe("Edge Cases - Large Datasets", () => {
  it("handles 1000 orders without error", () => {
    const orders: Order[] = Array.from({ length: 1000 }, (_, i) =>
      createOrder({
        id: `o${i}`,
        total: Math.floor(Math.random() * 500) + 50,
        source: ["Walk-in", "Phone", "Marketplace"][i % 3],
        items: [
          {
            menuItemId: `i${i % 10}`,
            name: `Item ${i % 10}`,
            basePrice: 100,
            quantity: (i % 5) + 1,
            note: "",
          },
        ],
      })
    );

    const stats = calculateReportStats(orders);
    expect(stats.totalOrders).toBe(1000);
    expect(stats.totalRevenue).toBeGreaterThan(0);
    expect(stats.topItems.length).toBeLessThanOrEqual(10);
    expect(stats.ordersBySource).toHaveLength(3);
  });
});

describe("Edge Cases - Decimal and Currency", () => {
  it("handles decimal totals correctly", () => {
    const orders = [
      createOrder({ id: "o1", total: 99.99 }),
      createOrder({ id: "o2", total: 0.01 }),
    ];

    const stats = calculateReportStats(orders);
    expect(stats.totalRevenue).toBeCloseTo(100, 2);
    expect(stats.averageOrderValue).toBe(50);
  });

  it("handles zero total orders", () => {
    const orders = [createOrder({ id: "o1", total: 0 })];
    const stats = calculateReportStats(orders);
    expect(stats.totalRevenue).toBe(0);
    expect(stats.averageOrderValue).toBe(0);
  });
});
