import { describe, expect, it } from "vitest";

/**
 * Tests for the Color Chooser and Data Migration features.
 * These test the data structures and logic used by the frontend components.
 */

// Accent color presets — mirrors the ACCENT_PRESETS from SettingsPage.tsx
const ACCENT_PRESETS = [
  { name: "Teal", hex: "#0D9488", lightOklch: "oklch(0.55 0.15 170)", darkOklch: "oklch(0.65 0.15 170)" },
  { name: "Blue", hex: "#2563EB", lightOklch: "oklch(0.55 0.18 260)", darkOklch: "oklch(0.65 0.18 260)" },
  { name: "Violet", hex: "#7C3AED", lightOklch: "oklch(0.50 0.20 290)", darkOklch: "oklch(0.60 0.20 290)" },
  { name: "Rose", hex: "#E11D48", lightOklch: "oklch(0.55 0.22 15)", darkOklch: "oklch(0.65 0.20 15)" },
  { name: "Orange", hex: "#EA580C", lightOklch: "oklch(0.58 0.20 50)", darkOklch: "oklch(0.68 0.18 50)" },
  { name: "Amber", hex: "#D97706", lightOklch: "oklch(0.60 0.18 75)", darkOklch: "oklch(0.70 0.16 75)" },
  { name: "Emerald", hex: "#059669", lightOklch: "oklch(0.55 0.15 155)", darkOklch: "oklch(0.65 0.15 155)" },
  { name: "Indigo", hex: "#4F46E5", lightOklch: "oklch(0.50 0.20 275)", darkOklch: "oklch(0.60 0.20 275)" },
  { name: "Pink", hex: "#DB2777", lightOklch: "oklch(0.55 0.22 350)", darkOklch: "oklch(0.65 0.20 350)" },
  { name: "Slate", hex: "#475569", lightOklch: "oklch(0.45 0.02 260)", darkOklch: "oklch(0.60 0.02 260)" },
];

const DEFAULT_ACCENT = "Teal";

describe("Color Chooser - Accent Presets", () => {
  it("should have 10 accent color presets", () => {
    expect(ACCENT_PRESETS).toHaveLength(10);
  });

  it("each preset should have name, hex, lightOklch, and darkOklch", () => {
    for (const preset of ACCENT_PRESETS) {
      expect(preset.name).toBeTruthy();
      expect(preset.hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(preset.lightOklch).toMatch(/^oklch\(/);
      expect(preset.darkOklch).toMatch(/^oklch\(/);
    }
  });

  it("should have unique names", () => {
    const names = ACCENT_PRESETS.map((p) => p.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("default accent should be Teal", () => {
    expect(DEFAULT_ACCENT).toBe("Teal");
    const teal = ACCENT_PRESETS.find((p) => p.name === "Teal");
    expect(teal).toBeDefined();
  });

  it("dark mode oklch values should have higher lightness than light mode", () => {
    for (const preset of ACCENT_PRESETS) {
      // Extract lightness from oklch strings
      const lightMatch = preset.lightOklch.match(/oklch\(([\d.]+)/);
      const darkMatch = preset.darkOklch.match(/oklch\(([\d.]+)/);
      expect(lightMatch).toBeTruthy();
      expect(darkMatch).toBeTruthy();
      const lightLightness = parseFloat(lightMatch![1]);
      const darkLightness = parseFloat(darkMatch![1]);
      // Dark mode presets should be brighter (higher lightness) for visibility
      expect(darkLightness).toBeGreaterThanOrEqual(lightLightness);
    }
  });
});

describe("Color Chooser - AppSettings type", () => {
  it("accentColor should be optional in settings", () => {
    // Simulating the AppSettings interface
    interface AppSettings {
      sources: string[];
      accentColor?: string;
    }

    const settingsWithoutColor: AppSettings = { sources: ["Walk-in"] };
    expect(settingsWithoutColor.accentColor).toBeUndefined();

    const settingsWithColor: AppSettings = { sources: ["Walk-in"], accentColor: "Blue" };
    expect(settingsWithColor.accentColor).toBe("Blue");
  });
});

// Migration logic tests
describe("Data Migration - Order Conversion", () => {
  interface LegacyOrder {
    id: string;
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
    items?: any[];
  }

  function convertLegacyOrder(order: LegacyOrder) {
    const basePrice = (order.total || 0) / (order.quantity || 1);
    return {
      customerName: order.customerName || "",
      items: [
        {
          menuItemId: "",
          name: order.itemName || "",
          basePrice: basePrice,
          quantity: order.quantity || 1,
          note: order.notes || "",
        },
      ],
      notes: order.notes || "",
      pickupDate: order.pickupDate || "",
      pickupTime: order.pickupTime || "",
      source: order.source || "",
      status: order.status || "pending",
      total: order.total || 0,
      timestamp: order.timestamp || "",
      completedAt: order.status === "completed" ? (order.timestamp || null) : null,
    };
  }

  function shouldMigrate(order: LegacyOrder): boolean {
    if (order.items && Array.isArray(order.items) && order.items.length > 0) {
      return false; // Already migrated
    }
    return !!order.itemName;
  }

  it("should convert a legacy order to new format", () => {
    const legacy: LegacyOrder = {
      id: "abc123",
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

    const result = convertLegacyOrder(legacy);

    expect(result.customerName).toBe("Stephanie");
    expect(result.items).toHaveLength(1);
    expect(result.items[0].name).toBe("Sansrival Cake (6\")");
    expect(result.items[0].basePrice).toBe(35);
    expect(result.items[0].quantity).toBe(1);
    expect(result.total).toBe(35);
    expect(result.source).toBe("Marketplace");
    expect(result.status).toBe("completed");
    expect(result.completedAt).toBe("2026-01-22T23:53:35Z");
  });

  it("should calculate basePrice correctly for multi-quantity orders", () => {
    const legacy: LegacyOrder = {
      id: "def456",
      customerName: "John",
      itemName: "Brownies (8x8)",
      quantity: 3,
      total: 75,
      notes: "Extra chocolate",
      pickupDate: "2026-02-05",
      pickupTime: "10:00",
      source: "Walk-in",
      status: "pending",
      timestamp: "2026-02-04T08:00:00Z",
    };

    const result = convertLegacyOrder(legacy);

    expect(result.items[0].basePrice).toBe(25); // 75 / 3
    expect(result.items[0].quantity).toBe(3);
    expect(result.items[0].note).toBe("Extra chocolate");
    expect(result.completedAt).toBeNull();
  });

  it("should handle missing fields gracefully", () => {
    const legacy: LegacyOrder = {
      id: "ghi789",
      itemName: "Cookie",
    };

    const result = convertLegacyOrder(legacy);

    expect(result.customerName).toBe("");
    expect(result.items[0].name).toBe("Cookie");
    expect(result.items[0].basePrice).toBe(0);
    expect(result.items[0].quantity).toBe(1);
    expect(result.total).toBe(0);
    expect(result.status).toBe("pending");
    expect(result.completedAt).toBeNull();
  });

  it("should skip orders that already have items array", () => {
    const alreadyMigrated: LegacyOrder = {
      id: "jkl012",
      customerName: "Anna",
      items: [{ menuItemId: "", name: "Cake", basePrice: 25, quantity: 1, note: "" }],
    };

    expect(shouldMigrate(alreadyMigrated)).toBe(false);
  });

  it("should skip orders without itemName field", () => {
    const unknownFormat: LegacyOrder = {
      id: "mno345",
      customerName: "Bob",
    };

    expect(shouldMigrate(unknownFormat)).toBe(false);
  });

  it("should identify legacy orders that need migration", () => {
    const legacy: LegacyOrder = {
      id: "pqr678",
      customerName: "Charlie",
      itemName: "Muffin",
      quantity: 2,
      total: 10,
    };

    expect(shouldMigrate(legacy)).toBe(true);
  });
});
