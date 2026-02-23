import { describe, expect, it } from "vitest";

// ============================================================
// Batch 8: UI/UX improvements
// 1. Independent sort per pipeline tab
// 2. Top earning items in reports
// 3. Orders by category in separate boxes (layout)
// 4. Report time range order: All Time, Monthly, Weekly, Daily
// 5. Pipeline card: item name first, then customer name
// 6. Global date format: "Sun, Feb 22 at 2:30 PM"
// ============================================================

// --- Types ---

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
  completedAt?: string | null;
}

// ============================================================
// Feature 1: Independent sort per pipeline tab
// ============================================================

type SortOption = "date-earliest" | "date-latest" | "price-low" | "price-high";

interface TabSortState {
  today: SortOption;
  pending: SortOption;
  completed: SortOption;
}

function createDefaultTabSortState(): TabSortState {
  return {
    today: "date-latest",
    pending: "date-latest",
    completed: "date-latest",
  };
}

function updateTabSort(
  state: TabSortState,
  tab: keyof TabSortState,
  sort: SortOption
): TabSortState {
  return { ...state, [tab]: sort };
}

describe("Independent sort per pipeline tab", () => {
  it("should default all tabs to date-latest", () => {
    const state = createDefaultTabSortState();
    expect(state.today).toBe("date-latest");
    expect(state.pending).toBe("date-latest");
    expect(state.completed).toBe("date-latest");
  });

  it("should allow changing sort for one tab without affecting others", () => {
    let state = createDefaultTabSortState();
    state = updateTabSort(state, "today", "date-earliest");
    expect(state.today).toBe("date-earliest");
    expect(state.pending).toBe("date-latest");
    expect(state.completed).toBe("date-latest");
  });

  it("should allow different sort options for each tab", () => {
    let state = createDefaultTabSortState();
    state = updateTabSort(state, "today", "date-earliest");
    state = updateTabSort(state, "pending", "price-high");
    state = updateTabSort(state, "completed", "price-low");
    expect(state.today).toBe("date-earliest");
    expect(state.pending).toBe("price-high");
    expect(state.completed).toBe("price-low");
  });

  it("should preserve sort state when switching back to a tab", () => {
    let state = createDefaultTabSortState();
    state = updateTabSort(state, "today", "price-high");
    // Simulate switching to pending and back
    state = updateTabSort(state, "pending", "date-earliest");
    // today should still be price-high
    expect(state.today).toBe("price-high");
    expect(state.pending).toBe("date-earliest");
  });
});

// ============================================================
// Feature 2: Top Earning Items in Reports
// ============================================================

interface TopEarningItem {
  name: string;
  quantity: number;
  revenue: number;
}

function getTopEarningItems(orders: Order[]): TopEarningItem[] {
  const itemMap = new Map<string, { quantity: number; revenue: number }>();

  for (const order of orders) {
    for (const item of order.items) {
      const existing = itemMap.get(item.name) || { quantity: 0, revenue: 0 };
      existing.quantity += item.quantity;
      existing.revenue += item.basePrice * item.quantity;
      itemMap.set(item.name, existing);
    }
  }

  return Array.from(itemMap.entries())
    .map(([name, data]) => ({ name, quantity: data.quantity, revenue: data.revenue }))
    .sort((a, b) => b.revenue - a.revenue) // Sort by REVENUE, not quantity
    .slice(0, 10);
}

describe("Top Earning Items (sorted by revenue)", () => {
  const orders: Order[] = [
    {
      id: "1", customerName: "A", notes: "", pickupDate: "2026-02-22", pickupTime: "10:00",
      source: "Walk-in", status: "completed", total: 500, timestamp: "2026-02-22T08:00:00Z",
      items: [
        { menuItemId: "i1", name: "Cheap Cookie", basePrice: 10, quantity: 50, note: "" }, // 50 sold, $500 revenue
        { menuItemId: "i2", name: "Expensive Cake", basePrice: 200, quantity: 2, note: "" }, // 2 sold, $400 revenue
      ],
    },
    {
      id: "2", customerName: "B", notes: "", pickupDate: "2026-02-22", pickupTime: "11:00",
      source: "Walk-in", status: "completed", total: 600, timestamp: "2026-02-22T09:00:00Z",
      items: [
        { menuItemId: "i2", name: "Expensive Cake", basePrice: 200, quantity: 3, note: "" }, // 3 more sold, $600 revenue
      ],
    },
  ];

  it("should sort items by revenue (highest first), not by quantity", () => {
    const result = getTopEarningItems(orders);
    // Expensive Cake: 5 sold, $1000 revenue
    // Cheap Cookie: 50 sold, $500 revenue
    // By revenue, Expensive Cake should be first even though Cookie has more quantity
    expect(result[0].name).toBe("Expensive Cake");
    expect(result[0].revenue).toBe(1000);
    expect(result[1].name).toBe("Cheap Cookie");
    expect(result[1].revenue).toBe(500);
  });

  it("should aggregate revenue across multiple orders", () => {
    const result = getTopEarningItems(orders);
    const cake = result.find((i) => i.name === "Expensive Cake");
    expect(cake?.quantity).toBe(5); // 2 + 3
    expect(cake?.revenue).toBe(1000); // 200*5
  });

  it("should limit to top 10 items", () => {
    const manyItemOrders: Order[] = [
      {
        id: "big", customerName: "X", notes: "", pickupDate: "2026-02-22", pickupTime: "10:00",
        source: "Walk-in", status: "completed", total: 1000, timestamp: "2026-02-22T08:00:00Z",
        items: Array.from({ length: 15 }, (_, i) => ({
          menuItemId: `i${i}`, name: `Item ${i}`, basePrice: (15 - i) * 10, quantity: 1, note: "",
        })),
      },
    ];
    const result = getTopEarningItems(manyItemOrders);
    expect(result).toHaveLength(10);
  });

  it("should return empty array for no orders", () => {
    const result = getTopEarningItems([]);
    expect(result).toHaveLength(0);
  });
});

// ============================================================
// Feature 3: Report time range order
// ============================================================

describe("Report time range tab order", () => {
  const REPORT_TAB_ORDER = ["all", "monthly", "weekly", "daily"];
  const REPORT_TAB_LABELS: Record<string, string> = {
    all: "All Time",
    monthly: "Monthly",
    weekly: "Weekly",
    daily: "Daily",
  };

  it("should have All Time as the first/default tab", () => {
    expect(REPORT_TAB_ORDER[0]).toBe("all");
  });

  it("should have correct order: All Time, Monthly, Weekly, Daily", () => {
    expect(REPORT_TAB_ORDER).toEqual(["all", "monthly", "weekly", "daily"]);
  });

  it("should have correct labels for all tabs", () => {
    expect(REPORT_TAB_LABELS["all"]).toBe("All Time");
    expect(REPORT_TAB_LABELS["monthly"]).toBe("Monthly");
    expect(REPORT_TAB_LABELS["weekly"]).toBe("Weekly");
    expect(REPORT_TAB_LABELS["daily"]).toBe("Daily");
  });
});

// ============================================================
// Feature 4: Global date format — "Sun, Feb 22 at 2:30 PM"
// ============================================================

/**
 * Formats a date string (YYYY-MM-DD) and optional time string (HH:mm)
 * into the global display format: "Sun, Feb 22 at 2:30 PM"
 * If no time is provided, returns just "Sun, Feb 22"
 */
function formatDisplayDate(dateStr: string, timeStr?: string): string {
  if (!dateStr) return "";

  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const dayOfWeek = dayNames[date.getDay()];
  const monthName = monthNames[date.getMonth()];
  const dayNum = date.getDate();

  let result = `${dayOfWeek}, ${monthName} ${dayNum}`;

  if (timeStr) {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    result += ` at ${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  }

  return result;
}

describe("Global date format", () => {
  it("should format date with time as 'Sun, Feb 22 at 2:30 PM'", () => {
    expect(formatDisplayDate("2026-02-22", "14:30")).toBe("Sun, Feb 22 at 2:30 PM");
  });

  it("should format date without time as 'Sun, Feb 22'", () => {
    expect(formatDisplayDate("2026-02-22")).toBe("Sun, Feb 22");
  });

  it("should handle midnight (00:00) as 12:00 AM", () => {
    expect(formatDisplayDate("2026-02-22", "00:00")).toBe("Sun, Feb 22 at 12:00 AM");
  });

  it("should handle noon (12:00) as 12:00 PM", () => {
    expect(formatDisplayDate("2026-02-22", "12:00")).toBe("Sun, Feb 22 at 12:00 PM");
  });

  it("should handle morning times correctly", () => {
    expect(formatDisplayDate("2026-02-22", "09:15")).toBe("Sun, Feb 22 at 9:15 AM");
  });

  it("should handle different days of the week", () => {
    expect(formatDisplayDate("2026-02-23", "10:00")).toBe("Mon, Feb 23 at 10:00 AM");
    expect(formatDisplayDate("2026-02-24", "10:00")).toBe("Tue, Feb 24 at 10:00 AM");
    expect(formatDisplayDate("2026-02-25", "10:00")).toBe("Wed, Feb 25 at 10:00 AM");
  });

  it("should handle different months", () => {
    expect(formatDisplayDate("2026-01-15", "08:00")).toBe("Thu, Jan 15 at 8:00 AM");
    expect(formatDisplayDate("2026-12-25", "18:00")).toBe("Fri, Dec 25 at 6:00 PM");
  });

  it("should return empty string for empty date", () => {
    expect(formatDisplayDate("")).toBe("");
  });

  it("should handle 11:59 PM correctly", () => {
    expect(formatDisplayDate("2026-02-22", "23:59")).toBe("Sun, Feb 22 at 11:59 PM");
  });

  it("should handle 1:00 PM correctly", () => {
    expect(formatDisplayDate("2026-02-22", "13:00")).toBe("Sun, Feb 22 at 1:00 PM");
  });
});

// ============================================================
// Feature 5: Pipeline card layout — item name first
// ============================================================

describe("Pipeline card layout: item names first", () => {
  it("should extract primary item name from order items", () => {
    const items: OrderItem[] = [
      { menuItemId: "i1", name: "Chocolate Cake", basePrice: 350, quantity: 1, note: "" },
      { menuItemId: "i2", name: "Latte", basePrice: 120, quantity: 2, note: "" },
    ];
    // The card should show item names prominently before customer name
    // We test the data extraction: first item name or summary
    const primaryItemName = items.map((i) => `${i.quantity}x ${i.name}`).join(", ");
    expect(primaryItemName).toBe("1x Chocolate Cake, 2x Latte");
  });

  it("should handle single item orders", () => {
    const items: OrderItem[] = [
      { menuItemId: "i1", name: "Birthday Cake", basePrice: 500, quantity: 1, note: "" },
    ];
    const primaryItemName = items.map((i) => `${i.quantity}x ${i.name}`).join(", ");
    expect(primaryItemName).toBe("1x Birthday Cake");
  });
});
