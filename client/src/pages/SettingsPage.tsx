/*
 * Design: Warm Craft — Premium Food-Tech Aesthetic
 * Settings: Grouped sections — Sources, Appearance (Theme + Color), Currency, Export/Import, Migration, Account
 * Rounded-2xl cards, warm shadows, refined spacing
 */
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { CURRENCIES, type CurrencyOption } from "@/lib/types";
import { useOrders } from "@/contexts/OrdersContext";
import { useMenu } from "@/contexts/MenuContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  LogOut,
  Download,
  Upload,
  Sun,
  Moon,
  Plus,
  X,
  Pencil,
  Tag,
  Loader2,
  Palette,
  RotateCcw,
  Database,
  DollarSign,
} from "lucide-react";
import { Link } from "wouter";
import Papa from "papaparse";

// Preset accent colors with OKLCH values for light and dark modes
const ACCENT_PRESETS = [
  { name: "Amber", hex: "#E07A2F", lightOklch: "oklch(0.62 0.17 52)", darkOklch: "oklch(0.72 0.16 52)" },
  { name: "Teal", hex: "#0D9488", lightOklch: "oklch(0.55 0.15 170)", darkOklch: "oklch(0.65 0.15 170)" },
  { name: "Blue", hex: "#2563EB", lightOklch: "oklch(0.55 0.18 260)", darkOklch: "oklch(0.65 0.18 260)" },
  { name: "Violet", hex: "#7C3AED", lightOklch: "oklch(0.50 0.20 290)", darkOklch: "oklch(0.60 0.20 290)" },
  { name: "Rose", hex: "#E11D48", lightOklch: "oklch(0.55 0.22 15)", darkOklch: "oklch(0.65 0.20 15)" },
  { name: "Orange", hex: "#EA580C", lightOklch: "oklch(0.58 0.20 50)", darkOklch: "oklch(0.68 0.18 50)" },
  { name: "Emerald", hex: "#059669", lightOklch: "oklch(0.55 0.15 155)", darkOklch: "oklch(0.65 0.15 155)" },
  { name: "Indigo", hex: "#4F46E5", lightOklch: "oklch(0.50 0.20 275)", darkOklch: "oklch(0.60 0.20 275)" },
  { name: "Pink", hex: "#DB2777", lightOklch: "oklch(0.55 0.22 350)", darkOklch: "oklch(0.65 0.20 350)" },
  { name: "Slate", hex: "#475569", lightOklch: "oklch(0.45 0.02 260)", darkOklch: "oklch(0.60 0.02 260)" },
];

const DEFAULT_ACCENT = "Amber";

function applyAccentColor(colorName: string, isDark: boolean) {
  const preset = ACCENT_PRESETS.find((p) => p.name === colorName);
  if (!preset) return;

  const oklch = isDark ? preset.darkOklch : preset.lightOklch;
  const root = document.documentElement;
  root.style.setProperty("--primary", oklch);
  root.style.setProperty("--ring", oklch);
  root.style.setProperty("--sidebar-primary", oklch);
  root.style.setProperty("--sidebar-ring", oklch);
}

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { settings, addSource, removeSource, updateSource, updateSettings, setCurrency, currency } = useSettings();
  const { orders } = useOrders();
  const { menuItems, addMenuItem } = useMenu();
  const { theme, toggleTheme } = useTheme();

  const [newSource, setNewSource] = useState("");
  const [editSourceDialog, setEditSourceDialog] = useState<string | null>(null);
  const [editSourceValue, setEditSourceValue] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [selectedAccent, setSelectedAccent] = useState(DEFAULT_ACCENT);

  const menuImportRef = useRef<HTMLInputElement>(null);
  const ordersImportRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (settings.accentColor) {
      setSelectedAccent(settings.accentColor);
      applyAccentColor(settings.accentColor, theme === "dark");
    }
  }, [settings.accentColor]);

  useEffect(() => {
    applyAccentColor(selectedAccent, theme === "dark");
  }, [theme, selectedAccent]);

  const handleAccentChange = async (colorName: string) => {
    setSelectedAccent(colorName);
    applyAccentColor(colorName, theme === "dark");
    await updateSettings({ accentColor: colorName });
    toast.success(`Accent color changed to ${colorName}`);
  };

  const handleResetAccent = async () => {
    setSelectedAccent(DEFAULT_ACCENT);
    applyAccentColor(DEFAULT_ACCENT, theme === "dark");
    await updateSettings({ accentColor: DEFAULT_ACCENT });
    toast.success("Accent color reset to default");
  };

  const handleAddSource = async () => {
    if (!newSource.trim()) return;
    if (settings.sources.includes(newSource.trim())) {
      toast.error("Source already exists");
      return;
    }
    await addSource(newSource.trim());
    setNewSource("");
    toast.success("Source added");
  };

  const handleRemoveSource = async (source: string) => {
    await removeSource(source);
    toast.success("Source removed");
  };

  const openEditSource = (source: string) => {
    setEditSourceDialog(source);
    setEditSourceValue(source);
  };

  const handleEditSource = async () => {
    if (!editSourceDialog || !editSourceValue.trim()) return;
    await updateSource(editSourceDialog, editSourceValue.trim());
    setEditSourceDialog(null);
    toast.success("Source updated");
  };

  const exportOrders = () => {
    if (orders.length === 0) {
      toast.error("No orders to export");
      return;
    }
    const rows = orders.flatMap((order) =>
      order.items.map((item) => ({
        OrderID: order.id,
        CustomerName: order.customerName,
        ItemName: item.name,
        Quantity: item.quantity,
        Price: item.basePrice,
        ItemNote: item.note,
        OrderNotes: order.notes,
        PickupDate: order.pickupDate,
        PickupTime: order.pickupTime,
        Source: order.source,
        Status: order.status,
        Total: order.total,
        Timestamp: order.timestamp,
        CompletedAt: order.completedAt || "",
      }))
    );
    const csv = Papa.unparse(rows);
    downloadCSV(csv, `orders-${new Date().toISOString().split("T")[0]}.csv`);
    toast.success("Orders exported!");
  };

  const exportMenu = () => {
    if (menuItems.length === 0) {
      toast.error("No menu items to export");
      return;
    }
    const rows = menuItems.map((item) => ({
      Name: item.name,
      BasePrice: item.basePrice,
      Category: item.category,
      Available: item.available !== false ? "Yes" : "No",
    }));
    const csv = Papa.unparse(rows);
    downloadCSV(csv, `menu-${new Date().toISOString().split("T")[0]}.csv`);
    toast.success("Menu exported!");
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleMenuImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        let count = 0;
        for (const row of results.data as any[]) {
          if (row.Name && row.BasePrice && row.Category) {
            try {
              await addMenuItem({
                name: row.Name,
                basePrice: parseFloat(row.BasePrice),
                category: row.Category,
                available: row.Available !== "No",
              });
              count++;
            } catch {
              // skip invalid rows
            }
          }
        }
        toast.success(`Imported ${count} menu items!`);
        if (menuImportRef.current) menuImportRef.current.value = "";
      },
      error: () => {
        toast.error("Failed to parse CSV file");
      },
    });
  };

  const handleOrdersImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    toast.info("Order import is for reference only. Orders should be created through the app.");
    if (ordersImportRef.current) ordersImportRef.current.value = "";
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch {
      toast.error("Failed to sign out");
    }
    setIsLoggingOut(false);
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight mb-6">Settings</h1>

      <div className="space-y-5">
        {/* Order Sources */}
        <Card className="rounded-2xl border-border/50 shadow-warm-sm">
          <CardHeader className="pb-3 px-5 pt-5">
            <CardTitle className="text-base flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Tag className="w-3.5 h-3.5 text-primary" />
              </div>
              Order Sources
            </CardTitle>
            <CardDescription>Manage where orders come from</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 px-5 pb-5">
            <div className="flex gap-2">
              <Input
                placeholder="Add new source..."
                value={newSource}
                onChange={(e) => setNewSource(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddSource()}
                className="rounded-xl"
              />
              <Button onClick={handleAddSource} size="sm" className="shrink-0 rounded-xl">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {settings.sources.map((source) => (
                <Badge
                  key={source}
                  variant="secondary"
                  className="gap-1.5 py-1.5 px-3 text-sm rounded-lg"
                >
                  {source}
                  <button
                    onClick={() => openEditSource(source)}
                    className="hover:text-foreground transition-colors duration-150"
                    aria-label={`Edit ${source}`}
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleRemoveSource(source)}
                    className="hover:text-destructive transition-colors duration-150"
                    aria-label={`Remove ${source}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card className="rounded-2xl border-border/50 shadow-warm-sm">
          <CardHeader className="pb-3 px-5 pt-5">
            <CardTitle className="text-base flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                {theme === "dark" ? (
                  <Moon className="w-3.5 h-3.5 text-primary" />
                ) : (
                  <Sun className="w-3.5 h-3.5 text-primary" />
                )}
              </div>
              Appearance
            </CardTitle>
            <CardDescription>Customize the look and feel of your app</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 px-5 pb-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Dark Mode</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {theme === "dark" ? "Currently using dark theme" : "Currently using light theme"}
                </p>
              </div>
              <Switch
                checked={theme === "dark"}
                onCheckedChange={toggleTheme}
              />
            </div>

            <Separator className="bg-border/50" />

            {/* Color Chooser */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold flex items-center gap-2">
                    <Palette className="w-4 h-4 text-primary" />
                    Accent Color
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Choose the primary color for buttons, links, and highlights
                  </p>
                </div>
                {selectedAccent !== DEFAULT_ACCENT && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetAccent}
                    className="gap-1.5 text-xs text-muted-foreground hover:text-foreground rounded-lg"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-5 gap-3">
                {ACCENT_PRESETS.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => handleAccentChange(color.name)}
                    className={`group flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-all duration-200 ${
                      selectedAccent === color.name
                        ? "bg-secondary ring-2 ring-primary ring-offset-2 ring-offset-background"
                        : "hover:bg-secondary/60"
                    }`}
                    title={color.name}
                  >
                    <div
                      className="w-8 h-8 rounded-full border-2 border-background shadow-warm-sm transition-transform duration-200 group-hover:scale-110"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span className="text-[10px] font-semibold text-muted-foreground">
                      {color.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Currency */}
        <Card className="rounded-2xl border-border/50 shadow-warm-sm">
          <CardHeader className="pb-3 px-5 pt-5">
            <CardTitle className="text-base flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-3.5 h-3.5 text-primary" />
              </div>
              Currency
            </CardTitle>
            <CardDescription>Choose the currency symbol for prices</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="flex gap-3">
              {(Object.keys(CURRENCIES) as CurrencyOption[]).map((code) => {
                const curr = CURRENCIES[code];
                return (
                  <button
                    key={code}
                    onClick={() => setCurrency(code)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-200 ${
                      currency === code
                        ? "border-primary bg-primary/10 text-primary ring-2 ring-primary ring-offset-2 ring-offset-background"
                        : "border-border/50 hover:bg-secondary/60"
                    }`}
                  >
                    <span className="text-lg font-bold">{curr.symbol}</span>
                    <div className="text-left">
                      <p className="text-sm font-semibold">{curr.code}</p>
                      <p className="text-[10px] text-muted-foreground">{curr.name}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Export / Import */}
        <Card className="rounded-2xl border-border/50 shadow-warm-sm">
          <CardHeader className="pb-3 px-5 pt-5">
            <CardTitle className="text-base flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Download className="w-3.5 h-3.5 text-primary" />
              </div>
              Export & Import
            </CardTitle>
            <CardDescription>Backup and restore your data as CSV files</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-5 pb-5">
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={exportOrders} className="gap-2 rounded-xl">
                <Download className="w-4 h-4" />
                Export Orders
              </Button>
              <Button variant="outline" onClick={exportMenu} className="gap-2 rounded-xl">
                <Download className="w-4 h-4" />
                Export Menu
              </Button>
            </div>
            <Separator className="bg-border/50" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  ref={ordersImportRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleOrdersImport}
                />
                <Button
                  variant="outline"
                  onClick={() => ordersImportRef.current?.click()}
                  className="w-full gap-2 rounded-xl"
                >
                  <Upload className="w-4 h-4" />
                  Import Orders
                </Button>
              </div>
              <div>
                <input
                  ref={menuImportRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleMenuImport}
                />
                <Button
                  variant="outline"
                  onClick={() => menuImportRef.current?.click()}
                  className="w-full gap-2 rounded-xl"
                >
                  <Upload className="w-4 h-4" />
                  Import Menu
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Migration */}
        <Card className="rounded-2xl border-border/50 shadow-warm-sm">
          <CardHeader className="pb-3 px-5 pt-5">
            <CardTitle className="text-base flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Database className="w-3.5 h-3.5 text-primary" />
              </div>
              Data Migration
            </CardTitle>
            <CardDescription>Convert legacy single-item orders to multi-item format</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <Link href="/migrate">
              <Button variant="outline" className="gap-2 rounded-xl">
                <Database className="w-4 h-4" />
                Open Migration Tool
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Account */}
        <Card className="rounded-2xl border-border/50 shadow-warm-sm">
          <CardHeader className="pb-3 px-5 pt-5">
            <CardTitle className="text-base flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <LogOut className="w-3.5 h-3.5 text-primary" />
              </div>
              Account
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{user?.email}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Signed in</p>
              </div>
              <Button
                variant="outline"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="gap-2 text-destructive hover:text-destructive rounded-xl"
              >
                {isLoggingOut ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4" />
                )}
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit source dialog */}
      <Dialog open={!!editSourceDialog} onOpenChange={() => setEditSourceDialog(null)}>
        <DialogContent className="sm:max-w-xs rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit Source</DialogTitle>
          </DialogHeader>
          <Input
            value={editSourceValue}
            onChange={(e) => setEditSourceValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleEditSource()}
            className="rounded-xl"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditSourceDialog(null)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleEditSource} className="rounded-xl">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
