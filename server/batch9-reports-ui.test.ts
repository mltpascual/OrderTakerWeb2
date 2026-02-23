import { describe, expect, it } from "vitest";

// ============================================================
// Batch 9: Reports UI improvements
// 1. Top Selling Items — quantity only with progress bar
// 2. Top Earning Items — price only with progress bar
// 3. Revenue trend data for chart
// 4. Expandable category with individual item breakdown
// ============================================================

interface OrderItem {
  menuItemId: string;
  name: string;
  basePrice: number;
  quantity: number;
  note: string;
  category?: string;
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
  completedAt?: string | null;
}

// ============================================================
// Feature 1: Top Selling Items — quantity only with progress bar %
// ============================================================

interface TopSellingDisplay {
  name: string;
  quantity: number;
  percentage: number; // percentage relative to max quantity
}

function getTopSellingDisplay(orders: Order[]): TopSellingDisplay[] {
  const itemMap = new Map<string, number>();
  for (const order of orders) {
    for (const item of order.items) {
      itemMap.set(item.name, (itemMap.get(item.name) || 0) + item.quantity);
    }
  }

  const sorted = Array.from(itemMap.entries())
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  const maxQty = sorted.length > 0 ? sorted[0].quantity : 1;

  return sorted.map((item) => ({
    name: item.name,
    quantity: item.quantity,
    percentage: (item.quantity / maxQty) * 100,
  }));
}

describe("Top Selling Items — quantity only with progress bar", () => {
  const orders: Order[] = [
    {
      id: "1", customerName: "A", notes: "", pickupDate: "2026-02-22", pickupTime: "10:00",
      source: "Walk-in", status: "completed", total: 500, timestamp: "2026-02-22T08:00:00Z",
      items: [
        { menuItemId: "i1", name: "Cookie", basePrice: 10, quantity: 50, note: "" },
        { menuItemId: "i2", name: "Cake", basePrice: 200, quantity: 5, note: "" },
      ],
    },
    {
      id: "2", customerName: "B", notes: "", pickupDate: "2026-02-22", pickupTime: "11:00",
      source: "Walk-in", status: "completed", total: 300, timestamp: "2026-02-22T09:00:00Z",
      items: [
        { menuItemId: "i1", name: "Cookie", basePrice: 10, quantity: 30, note: "" },
        { menuItemId: "i3", name: "Bread", basePrice: 50, quantity: 10, note: "" },
      ],
    },
  ];

  it("should sort by quantity (highest first)", () => {
    const result = getTopSellingDisplay(orders);
    expect(result[0].name).toBe("Cookie");
    expect(result[0].quantity).toBe(80); // 50 + 30
    expect(result[1].name).toBe("Bread");
    expect(result[1].quantity).toBe(10);
    expect(result[2].name).toBe("Cake");
    expect(result[2].quantity).toBe(5);
  });

  it("should calculate percentage relative to max quantity", () => {
    const result = getTopSellingDisplay(orders);
    expect(result[0].percentage).toBe(100); // Cookie is max
    expect(result[1].percentage).toBeCloseTo(12.5, 1); // 10/80 * 100
    expect(result[2].percentage).toBeCloseTo(6.25, 1); // 5/80 * 100
  });

  it("should NOT include revenue/price data", () => {
    const result = getTopSellingDisplay(orders);
    // TypeScript enforces this, but let's verify the shape
    const keys = Object.keys(result[0]);
    expect(keys).toContain("name");
    expect(keys).toContain("quantity");
    expect(keys).toContain("percentage");
    expect(keys).not.toContain("revenue");
    expect(keys).not.toContain("price");
  });
});

// ============================================================
// Feature 2: Top Earning Items — price only with progress bar %
// ============================================================

interface TopEarningDisplay {
  name: string;
  revenue: number;
  percentage: number; // percentage relative to max revenue
}

function getTopEarningDisplay(orders: Order[]): TopEarningDisplay[] {
  const itemMap = new Map<string, number>();
  for (const order of orders) {
    for (const item of order.items) {
      itemMap.set(item.name, (itemMap.get(item.name) || 0) + item.basePrice * item.quantity);
    }
  }

  const sorted = Array.from(itemMap.entries())
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  const maxRev = sorted.length > 0 ? sorted[0].revenue : 1;

  return sorted.map((item) => ({
    name: item.name,
    revenue: item.revenue,
    percentage: (item.revenue / maxRev) * 100,
  }));
}

describe("Top Earning Items — price only with progress bar", () => {
  const orders: Order[] = [
    {
      id: "1", customerName: "A", notes: "", pickupDate: "2026-02-22", pickupTime: "10:00",
      source: "Walk-in", status: "completed", total: 500, timestamp: "2026-02-22T08:00:00Z",
      items: [
        { menuItemId: "i1", name: "Cookie", basePrice: 10, quantity: 50, note: "" }, // $500
        { menuItemId: "i2", name: "Cake", basePrice: 200, quantity: 5, note: "" }, // $1000
      ],
    },
    {
      id: "2", customerName: "B", notes: "", pickupDate: "2026-02-22", pickupTime: "11:00",
      source: "Walk-in", status: "completed", total: 300, timestamp: "2026-02-22T09:00:00Z",
      items: [
        { menuItemId: "i2", name: "Cake", basePrice: 200, quantity: 3, note: "" }, // $600
        { menuItemId: "i3", name: "Bread", basePrice: 50, quantity: 10, note: "" }, // $500
      ],
    },
  ];

  it("should sort by revenue (highest first)", () => {
    const result = getTopEarningDisplay(orders);
    expect(result[0].name).toBe("Cake");
    expect(result[0].revenue).toBe(1600); // 1000 + 600
    // Cookie: 10*50=500, Bread: 50*10=500 — tied at 500, order may vary
    expect(result[1].revenue).toBe(500);
    expect(result[2].revenue).toBe(500);
  });

  it("should calculate percentage relative to max revenue", () => {
    const result = getTopEarningDisplay(orders);
    expect(result[0].percentage).toBe(100); // Cake is max
    expect(result[1].percentage).toBeCloseTo(31.25, 1); // 500/1600 * 100
  });

  it("should NOT include quantity data", () => {
    const result = getTopEarningDisplay(orders);
    const keys = Object.keys(result[0]);
    expect(keys).toContain("name");
    expect(keys).toContain("revenue");
    expect(keys).toContain("percentage");
    expect(keys).not.toContain("quantity");
  });
});

// ============================================================
// Feature 3: Revenue trend data for chart
// ============================================================

interface RevenueTrendPoint {
  label: string;
  revenue: number;
}

function getRevenueTrend(orders: Order[], range: string): RevenueTrendPoint[] {
  const completed = orders.filter((o) => o.status === "completed");
  const now = new Date();

  if (range === "daily") {
    // Hourly breakdown for today
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const hourlyData: Record<number, number> = {};
    completed.forEach((order) => {
      const d = new Date(order.timestamp);
      if (d >= today) {
        const hour = d.getHours();
        hourlyData[hour] = (hourlyData[hour] || 0) + order.total;
      }
    });
    const points: RevenueTrendPoint[] = [];
    for (let h = 0; h <= 23; h++) {
      const ampm = h === 0 ? "12AM" : h < 12 ? `${h}AM` : h === 12 ? "12PM" : `${h - 12}PM`;
      points.push({ label: ampm, revenue: hourlyData[h] || 0 });
    }
    return points;
  }

  if (range === "weekly") {
    // Daily breakdown for last 7 days
    const points: RevenueTrendPoint[] = [];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const dayRevenue = completed
        .filter((o) => {
          const t = new Date(o.timestamp);
          return t >= dayStart && t < dayEnd;
        })
        .reduce((sum, o) => sum + o.total, 0);
      points.push({ label: dayNames[dayStart.getDay()], revenue: dayRevenue });
    }
    return points;
  }

  if (range === "monthly") {
    // Weekly breakdown for last 4 weeks with specific date ranges
    const points: RevenueTrendPoint[] = [];
    const monthAbbr = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    for (let w = 3; w >= 0; w--) {
      const weekEnd = new Date(now);
      weekEnd.setDate(weekEnd.getDate() - w * 7);
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekStart.getDate() - 7);
      const weekRevenue = completed
        .filter((o) => {
          const t = new Date(o.timestamp);
          return t >= weekStart && t < weekEnd;
        })
        .reduce((sum, o) => sum + o.total, 0);
      const startLabel = `${monthAbbr[weekStart.getMonth()]} ${weekStart.getDate()}`;
      const endDate = new Date(weekEnd);
      endDate.setDate(endDate.getDate() - 1); // inclusive end
      const endLabel = `${monthAbbr[endDate.getMonth()]} ${endDate.getDate()}`;
      points.push({ label: `${startLabel}-${endLabel}`, revenue: weekRevenue });
    }
    return points;
  }

  // "all" — monthly breakdown (last 6 months)
  const points: RevenueTrendPoint[] = [];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  for (let m = 5; m >= 0; m--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const nextMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);
    const monthRevenue = completed
      .filter((o) => {
        const t = new Date(o.timestamp);
        return t >= monthDate && t < nextMonth;
      })
      .reduce((sum, o) => sum + o.total, 0);
    points.push({ label: monthNames[monthDate.getMonth()], revenue: monthRevenue });
  }
  return points;
}

describe("Revenue trend data", () => {
  const refDate = new Date("2026-02-22T14:00:00Z");

  it("should return 24 hourly points for daily range", () => {
    const result = getRevenueTrend([], "daily");
    expect(result).toHaveLength(24);
    expect(result[0].label).toBe("12AM");
    expect(result[12].label).toBe("12PM");
  });

  it("should return 7 daily points for weekly range", () => {
    const result = getRevenueTrend([], "weekly");
    expect(result).toHaveLength(7);
  });

  it("should return 4 weekly points for monthly range with date ranges", () => {
    const result = getRevenueTrend([], "monthly");
    expect(result).toHaveLength(4);
    // Labels should be specific date ranges like "Jan 25-Jan 31" not "Week 1"
    result.forEach((point) => {
      expect(point.label).toMatch(/^[A-Z][a-z]{2} \d{1,2}-[A-Z][a-z]{2} \d{1,2}$/);
      expect(point.label).not.toContain("Week");
    });
  });

  it("should return 6 monthly points for all range", () => {
    const result = getRevenueTrend([], "all");
    expect(result).toHaveLength(6);
  });

  it("should aggregate revenue correctly for daily", () => {
    const todayStr = new Date().toISOString().split("T")[0];
    const orders: Order[] = [
      {
        id: "1", customerName: "A", notes: "", pickupDate: todayStr, pickupTime: "10:00",
        source: "Walk-in", status: "completed", total: 100,
        timestamp: new Date(new Date().setHours(10, 0, 0, 0)).toISOString(),
        items: [{ menuItemId: "i1", name: "X", basePrice: 100, quantity: 1, note: "" }],
      },
      {
        id: "2", customerName: "B", notes: "", pickupDate: todayStr, pickupTime: "10:30",
        source: "Walk-in", status: "completed", total: 200,
        timestamp: new Date(new Date().setHours(10, 30, 0, 0)).toISOString(),
        items: [{ menuItemId: "i2", name: "Y", basePrice: 200, quantity: 1, note: "" }],
      },
      {
        id: "3", customerName: "C", notes: "", pickupDate: todayStr, pickupTime: "14:00",
        source: "Walk-in", status: "pending", total: 50, // pending — should be excluded
        timestamp: new Date(new Date().setHours(14, 0, 0, 0)).toISOString(),
        items: [{ menuItemId: "i3", name: "Z", basePrice: 50, quantity: 1, note: "" }],
      },
    ];
    const result = getRevenueTrend(orders, "daily");
    expect(result[10].revenue).toBe(300); // 100 + 200 at hour 10
    expect(result[14].revenue).toBe(0); // pending excluded
  });
});

// ============================================================
// Feature 4: Expandable category with item breakdown
// ============================================================

interface CategoryItemBreakdown {
  name: string;
  quantity: number;
  percentage: number; // relative to max in category
}

interface CategoryWithItems {
  category: string;
  totalQuantity: number;
  totalRevenue: number;
  items: CategoryItemBreakdown[];
}

function getCategoryBreakdown(
  orders: Order[],
  getCategoryFn: (itemName: string, menuItemId?: string) => string
): CategoryWithItems[] {
  // Build category → item → quantity map
  const catMap = new Map<string, Map<string, number>>();
  const catRevenue = new Map<string, number>();
  const catQuantity = new Map<string, number>();

  for (const order of orders) {
    for (const item of order.items) {
      const cat = getCategoryFn(item.name, item.menuItemId);
      if (!catMap.has(cat)) catMap.set(cat, new Map());
      const itemMap = catMap.get(cat)!;
      itemMap.set(item.name, (itemMap.get(item.name) || 0) + item.quantity);
      catRevenue.set(cat, (catRevenue.get(cat) || 0) + item.basePrice * item.quantity);
      catQuantity.set(cat, (catQuantity.get(cat) || 0) + item.quantity);
    }
  }

  return Array.from(catMap.entries())
    .map(([category, itemMap]) => {
      const items = Array.from(itemMap.entries())
        .map(([name, quantity]) => ({ name, quantity, percentage: 0 }))
        .sort((a, b) => b.quantity - a.quantity);

      const maxQty = items.length > 0 ? items[0].quantity : 1;
      items.forEach((item) => {
        item.percentage = (item.quantity / maxQty) * 100;
      });

      return {
        category,
        totalQuantity: catQuantity.get(category) || 0,
        totalRevenue: catRevenue.get(category) || 0,
        items,
      };
    })
    .sort((a, b) => b.totalRevenue - a.totalRevenue);
}

describe("Expandable category with item breakdown", () => {
  const orders: Order[] = [
    {
      id: "1", customerName: "A", notes: "", pickupDate: "2026-02-22", pickupTime: "10:00",
      source: "Walk-in", status: "completed", total: 500, timestamp: "2026-02-22T08:00:00Z",
      items: [
        { menuItemId: "i1", name: "Sanrival Cake", basePrice: 350, quantity: 6, note: "" },
        { menuItemId: "i2", name: "Chocolate Cake", basePrice: 300, quantity: 10, note: "" },
      ],
    },
    {
      id: "2", customerName: "B", notes: "", pickupDate: "2026-02-22", pickupTime: "11:00",
      source: "Walk-in", status: "completed", total: 300, timestamp: "2026-02-22T09:00:00Z",
      items: [
        { menuItemId: "i3", name: "Latte", basePrice: 120, quantity: 5, note: "" },
        { menuItemId: "i1", name: "Sanrival Cake", basePrice: 350, quantity: 2, note: "" },
      ],
    },
  ];

  const getCat = (name: string) => {
    if (name.includes("Cake")) return "Cakes";
    if (name.includes("Latte")) return "Drinks";
    return "Other";
  };

  it("should group items by category", () => {
    const result = getCategoryBreakdown(orders, getCat);
    expect(result.length).toBe(2);
    const cakes = result.find((c) => c.category === "Cakes");
    expect(cakes).toBeDefined();
    expect(cakes!.items).toHaveLength(2);
  });

  it("should show individual items within a category sorted by quantity", () => {
    const result = getCategoryBreakdown(orders, getCat);
    const cakes = result.find((c) => c.category === "Cakes")!;
    // Chocolate Cake: 10, Sanrival Cake: 8 (6+2)
    expect(cakes.items[0].name).toBe("Chocolate Cake");
    expect(cakes.items[0].quantity).toBe(10);
    expect(cakes.items[1].name).toBe("Sanrival Cake");
    expect(cakes.items[1].quantity).toBe(8);
  });

  it("should calculate percentage relative to max in category", () => {
    const result = getCategoryBreakdown(orders, getCat);
    const cakes = result.find((c) => c.category === "Cakes")!;
    expect(cakes.items[0].percentage).toBe(100); // Chocolate Cake is max
    expect(cakes.items[1].percentage).toBe(80); // 8/10 * 100
  });

  it("should sort categories by total revenue", () => {
    const result = getCategoryBreakdown(orders, getCat);
    // Cakes: 350*8 + 300*10 = 5800, Drinks: 120*5 = 600
    expect(result[0].category).toBe("Cakes");
    expect(result[1].category).toBe("Drinks");
  });

  it("should include total quantity and revenue per category", () => {
    const result = getCategoryBreakdown(orders, getCat);
    const cakes = result.find((c) => c.category === "Cakes")!;
    expect(cakes.totalQuantity).toBe(18); // 6+10+2
    expect(cakes.totalRevenue).toBe(5800); // 350*8 + 300*10
  });
});
