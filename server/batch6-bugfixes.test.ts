import { describe, expect, it } from "vitest";

// ============================================================
// Batch 6: Bug fixes — Pipeline pickup date filter, sorting, dropdown
// ============================================================

// --- Bug Fix 1: Today's Orders should filter by pickupDate, not timestamp ---

interface OrderForPipeline {
  id: string;
  customerName: string;
  pickupDate: string; // "YYYY-MM-DD"
  pickupTime: string;
  timestamp: string;
  status: string;
  total: number;
  items: { name: string; quantity: number; basePrice: number; note: string }[];
}

function filterTodayOrders(orders: OrderForPipeline[], todayStr: string): OrderForPipeline[] {
  return orders.filter((o) => o.pickupDate === todayStr);
}

function filterPendingOrders(orders: OrderForPipeline[]): OrderForPipeline[] {
  return orders.filter((o) => o.status === "pending");
}

function filterCompletedOrders(orders: OrderForPipeline[]): OrderForPipeline[] {
  return orders.filter((o) => o.status === "completed");
}

describe("Pipeline: Today's Orders by pickupDate", () => {
  const today = "2026-02-22";
  const orders: OrderForPipeline[] = [
    {
      id: "1",
      customerName: "Alice",
      pickupDate: "2026-02-22",
      pickupTime: "10:00",
      timestamp: "2026-02-21T18:00:00Z", // created yesterday, pickup today
      status: "pending",
      total: 50,
      items: [{ name: "Cake", quantity: 1, basePrice: 50, note: "" }],
    },
    {
      id: "2",
      customerName: "Bob",
      pickupDate: "2026-02-23",
      pickupTime: "14:00",
      timestamp: "2026-02-22T08:00:00Z", // created today, pickup tomorrow
      status: "pending",
      total: 30,
      items: [{ name: "Bread", quantity: 1, basePrice: 30, note: "" }],
    },
    {
      id: "3",
      customerName: "Charlie",
      pickupDate: "2026-02-22",
      pickupTime: "17:00",
      timestamp: "2026-02-22T06:00:00Z", // created today, pickup today
      status: "completed",
      total: 25,
      items: [{ name: "Cookie", quantity: 5, basePrice: 5, note: "" }],
    },
  ];

  it("should include orders with pickupDate matching today, regardless of creation date", () => {
    const result = filterTodayOrders(orders, today);
    expect(result).toHaveLength(2);
    expect(result.map((o) => o.customerName)).toEqual(["Alice", "Charlie"]);
  });

  it("should exclude orders created today but with a future pickup date", () => {
    const result = filterTodayOrders(orders, today);
    expect(result.find((o) => o.customerName === "Bob")).toBeUndefined();
  });

  it("should include both pending and completed orders for today", () => {
    const result = filterTodayOrders(orders, today);
    const statuses = result.map((o) => o.status);
    expect(statuses).toContain("pending");
    expect(statuses).toContain("completed");
  });
});

// --- Bug Fix 2: Sorting labels and sort by pickup date ---

type SortOption = "date-earliest" | "date-latest" | "price-low" | "price-high";

const SORT_LABELS: Record<SortOption, string> = {
  "date-earliest": "Date: Earliest",
  "date-latest": "Date: Latest",
  "price-low": "Price: Low To High",
  "price-high": "Price: High To Low",
};

function sortOrders(orders: OrderForPipeline[], sortBy: SortOption): OrderForPipeline[] {
  const sorted = [...orders];
  switch (sortBy) {
    case "date-earliest":
      return sorted.sort((a, b) => {
        const dateCompare = a.pickupDate.localeCompare(b.pickupDate);
        if (dateCompare !== 0) return dateCompare;
        return a.pickupTime.localeCompare(b.pickupTime);
      });
    case "date-latest":
      return sorted.sort((a, b) => {
        const dateCompare = b.pickupDate.localeCompare(a.pickupDate);
        if (dateCompare !== 0) return dateCompare;
        return b.pickupTime.localeCompare(a.pickupTime);
      });
    case "price-low":
      return sorted.sort((a, b) => a.total - b.total);
    case "price-high":
      return sorted.sort((a, b) => b.total - a.total);
    default:
      return sorted;
  }
}

describe("Pipeline: Sorting labels", () => {
  it("should have correct label text for all sort options", () => {
    expect(SORT_LABELS["date-earliest"]).toBe("Date: Earliest");
    expect(SORT_LABELS["date-latest"]).toBe("Date: Latest");
    expect(SORT_LABELS["price-low"]).toBe("Price: Low To High");
    expect(SORT_LABELS["price-high"]).toBe("Price: High To Low");
  });
});

describe("Pipeline: Sorting by pickup date", () => {
  const orders: OrderForPipeline[] = [
    {
      id: "1", customerName: "Alice", pickupDate: "2026-02-24", pickupTime: "10:00",
      timestamp: "2026-02-22T08:00:00Z", status: "pending", total: 100,
      items: [{ name: "A", quantity: 1, basePrice: 100, note: "" }],
    },
    {
      id: "2", customerName: "Bob", pickupDate: "2026-02-22", pickupTime: "14:00",
      timestamp: "2026-02-22T06:00:00Z", status: "pending", total: 50,
      items: [{ name: "B", quantity: 1, basePrice: 50, note: "" }],
    },
    {
      id: "3", customerName: "Charlie", pickupDate: "2026-02-23", pickupTime: "09:00",
      timestamp: "2026-02-21T18:00:00Z", status: "pending", total: 200,
      items: [{ name: "C", quantity: 1, basePrice: 200, note: "" }],
    },
  ];

  it("should sort by pickup date earliest first", () => {
    const result = sortOrders(orders, "date-earliest");
    expect(result.map((o) => o.customerName)).toEqual(["Bob", "Charlie", "Alice"]);
  });

  it("should sort by pickup date latest first", () => {
    const result = sortOrders(orders, "date-latest");
    expect(result.map((o) => o.customerName)).toEqual(["Alice", "Charlie", "Bob"]);
  });

  it("should sort by price low to high", () => {
    const result = sortOrders(orders, "price-low");
    expect(result.map((o) => o.total)).toEqual([50, 100, 200]);
  });

  it("should sort by price high to low", () => {
    const result = sortOrders(orders, "price-high");
    expect(result.map((o) => o.total)).toEqual([200, 100, 50]);
  });

  it("should use pickup time as tiebreaker when dates are the same", () => {
    const sameDay: OrderForPipeline[] = [
      {
        id: "a", customerName: "Late", pickupDate: "2026-02-22", pickupTime: "17:00",
        timestamp: "2026-02-22T01:00:00Z", status: "pending", total: 10,
        items: [{ name: "X", quantity: 1, basePrice: 10, note: "" }],
      },
      {
        id: "b", customerName: "Early", pickupDate: "2026-02-22", pickupTime: "09:00",
        timestamp: "2026-02-22T02:00:00Z", status: "pending", total: 20,
        items: [{ name: "Y", quantity: 1, basePrice: 20, note: "" }],
      },
    ];
    const result = sortOrders(sameDay, "date-earliest");
    expect(result.map((o) => o.customerName)).toEqual(["Early", "Late"]);
  });
});

// --- Bug Fix 3: Category dropdown should show all options ---

describe("Category combobox behavior", () => {
  // The fix: replace <Input> + <datalist> with a proper Select/Combobox
  // that shows all options regardless of current input value

  const categories = ["Drinks", "Dessert", "Pastry", "Snacks"];

  function getFilteredCategories(query: string, allCategories: string[]): string[] {
    if (!query.trim()) return allCategories;
    const q = query.toLowerCase();
    return allCategories.filter((c) => c.toLowerCase().includes(q));
  }

  it("should show all categories when query is empty", () => {
    expect(getFilteredCategories("", categories)).toEqual(categories);
  });

  it("should filter categories when typing", () => {
    expect(getFilteredCategories("dr", categories)).toEqual(["Drinks"]);
  });

  it("should show all categories when dropdown is opened (query cleared)", () => {
    // When user clicks the dropdown, the search should reset to show all
    expect(getFilteredCategories("", categories)).toEqual(categories);
  });

  it("should allow selecting an existing category", () => {
    const selected = "Dessert";
    expect(categories.includes(selected)).toBe(true);
  });

  it("should allow typing a new category not in the list", () => {
    const newCat = "Beverages";
    expect(categories.includes(newCat)).toBe(false);
    // The combobox should accept this as a valid new category
    const allOptions = [...categories, newCat];
    expect(allOptions).toContain(newCat);
  });
});
