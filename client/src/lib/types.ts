export interface MenuItem {
  id: string;
  name: string;
  basePrice: number;
  category: string;
  available?: boolean;
  createdAt?: string;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  basePrice: number;
  quantity: number;
  note: string;
}

export interface Order {
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

export type CurrencyOption = "PHP" | "USD";

export interface CurrencyConfig {
  code: CurrencyOption;
  symbol: string;
  name: string;
}

export const CURRENCIES: Record<CurrencyOption, CurrencyConfig> = {
  PHP: { code: "PHP", symbol: "₱", name: "Philippine Peso" },
  USD: { code: "USD", symbol: "$", name: "US Dollar" },
};

export function formatPrice(amount: number, currency: CurrencyOption = "PHP"): string {
  const config = CURRENCIES[currency];
  return `${config.symbol}${amount.toFixed(2)}`;
}

export interface AppSettings {
  sources: string[];
  accentColor?: string;
  currency?: CurrencyOption;
}

export interface CartItem extends OrderItem {
  // Cart-specific: same as OrderItem but mutable
}
