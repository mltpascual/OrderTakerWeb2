/*
 * Design: Swiss Utility — Functional Minimalism
 * New Order: Split panel — menu grid (left) + live cart (right) on desktop
 * Stacked on mobile with a sticky cart summary bar
 *
 * BUG FIX: CartContent was defined as an inline component function inside the
 * render body. Every re-render created a new function reference, causing React
 * to unmount/remount the subtree and losing input focus. Fixed by inlining the
 * JSX directly instead of wrapping it in a component function.
 *
 * BUG FIX: Past time validation — now checks if pickup time is in the past
 * when the selected date is today.
 *
 * FEATURE: Source is now required with default placeholder "Marketplace".
 * FEATURE: Custom order item — add a custom item with custom name + price.
 */
import { useState, useMemo } from "react";
import { useMenu } from "@/hooks/useMenu";
import { useOrders } from "@/hooks/useOrders";
import { useSettings } from "@/hooks/useSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Search,
  StickyNote,
  Loader2,
  AlertCircle,
  PackagePlus,
} from "lucide-react";
import type { CartItem, MenuItem } from "@/lib/types";
import { formatPrice } from "@/lib/types";
import { cn } from "@/lib/utils";

// Updated validation logic — now checks past TIME on same day + source required
function validateOrderForm(data: {
  customerName: string;
  cart: CartItem[];
  pickupDate: string;
  pickupTime: string;
  source: string;
}): { valid: boolean; errors: string[] } {
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

export default function NewOrder() {
  const { menuItems, categories, loading: menuLoading } = useMenu();
  const { addOrder } = useOrders();
  const { settings, currency } = useSettings();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [source, setSource] = useState("Marketplace"); // Default to Marketplace
  const [orderNotes, setOrderNotes] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [noteDialogItem, setNoteDialogItem] = useState<CartItem | null>(null);
  const [noteText, setNoteText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Custom order dialog state
  const [customDialogOpen, setCustomDialogOpen] = useState(false);
  const [customItemName, setCustomItemName] = useState("");
  const [customItemPrice, setCustomItemPrice] = useState("");

  const availableItems = useMemo(() => {
    return menuItems.filter((item) => item.available !== false);
  }, [menuItems]);

  const filteredItems = useMemo(() => {
    let items = availableItems;
    if (activeCategory !== "All") {
      items = items.filter((item) => item.category === activeCategory);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter((item) => item.name.toLowerCase().includes(q));
    }
    return items;
  }, [availableItems, activeCategory, searchQuery]);

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.basePrice * item.quantity, 0);
  }, [cart]);

  const cartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const addToCart = (menuItem: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === menuItem.id);
      if (existing) {
        return prev.map((c) =>
          c.menuItemId === menuItem.id
            ? { ...c, quantity: c.quantity + 1 }
            : c
        );
      }
      return [
        ...prev,
        {
          menuItemId: menuItem.id,
          name: menuItem.name,
          basePrice: menuItem.basePrice,
          quantity: 1,
          note: "",
        },
      ];
    });
  };

  const addCustomItem = () => {
    const name = customItemName.trim();
    const price = parseFloat(customItemPrice);

    if (!name) {
      toast.error("Item name is required");
      return;
    }
    if (isNaN(price) || price <= 0) {
      toast.error("Price must be greater than 0");
      return;
    }

    const customId = `custom-${Date.now()}`;
    setCart((prev) => [
      ...prev,
      {
        menuItemId: customId,
        name,
        basePrice: price,
        quantity: 1,
        note: "",
      },
    ]);
    setCustomItemName("");
    setCustomItemPrice("");
    setCustomDialogOpen(false);
    toast.success(`Custom item "${name}" added`);
  };

  const updateQuantity = (menuItemId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((c) =>
          c.menuItemId === menuItemId
            ? { ...c, quantity: Math.max(0, c.quantity + delta) }
            : c
        )
        .filter((c) => c.quantity > 0);
    });
  };

  const removeFromCart = (menuItemId: string) => {
    setCart((prev) => prev.filter((c) => c.menuItemId !== menuItemId));
  };

  const openNoteDialog = (item: CartItem) => {
    setNoteDialogItem(item);
    setNoteText(item.note);
  };

  const saveNote = () => {
    if (!noteDialogItem) return;
    setCart((prev) =>
      prev.map((c) =>
        c.menuItemId === noteDialogItem.menuItemId
          ? { ...c, note: noteText }
          : c
      )
    );
    setNoteDialogItem(null);
    setNoteText("");
  };

  const handleSubmit = async () => {
    // Validate — now includes source
    const validation = validateOrderForm({
      customerName,
      cart,
      pickupDate,
      pickupTime,
      source,
    });

    if (!validation.valid) {
      setValidationErrors(validation.errors);
      validation.errors.forEach((err) => toast.error(err));
      return;
    }

    setValidationErrors([]);
    setIsSubmitting(true);
    try {
      await addOrder({
        customerName: customerName.trim(),
        items: cart.map((c) => ({
          menuItemId: c.menuItemId,
          name: c.name,
          basePrice: c.basePrice,
          quantity: c.quantity,
          note: c.note,
        })),
        notes: orderNotes,
        pickupDate,
        pickupTime,
        source,
        status: "pending",
        total: cartTotal,
        timestamp: new Date().toISOString(),
        completedAt: null,
      });
      toast.success(`Order for ${customerName} created!`);
      // Reset form
      setCart([]);
      setCustomerName("");
      setPickupDate("");
      setPickupTime("");
      setSource("Marketplace"); // Reset to default
      setOrderNotes("");
      setValidationErrors([]);
      setMobileCartOpen(false);
    } catch (err) {
      toast.error("Failed to create order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCartQuantity = (menuItemId: string) => {
    const item = cart.find((c) => c.menuItemId === menuItemId);
    return item?.quantity || 0;
  };

  // Helper to check if a specific field has a validation error
  const hasError = (field: string) => {
    return validationErrors.some((e) => e.toLowerCase().includes(field.toLowerCase()));
  };

  // ---- Inline cart content JSX (NOT a component function — prevents focus loss) ----
  const cartContentJSX = (
    <div className="flex flex-col h-full">
      {/* Order details */}
      <div className="space-y-3 mb-4">
        <div>
          <Label htmlFor="customerName" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Customer <span className="text-destructive">*</span>
          </Label>
          <Input
            id="customerName"
            placeholder="Customer name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className={cn("mt-1 h-11", hasError("customer") && "border-destructive")}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="min-w-0 overflow-hidden">
            <Label htmlFor="pickupDate" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Pickup Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="pickupDate"
              type="date"
              value={pickupDate}
              onChange={(e) => setPickupDate(e.target.value)}
              className={cn("mt-1 h-11 w-full text-sm", hasError("date") && "border-destructive")}
            />
          </div>
          <div className="min-w-0 overflow-hidden">
            <Label htmlFor="pickupTime" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Pickup Time <span className="text-destructive">*</span>
            </Label>
            <Input
              id="pickupTime"
              type="time"
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
              className={cn("mt-1 h-11 w-full text-sm", hasError("time") && "border-destructive")}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="source" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Source <span className="text-destructive">*</span>
          </Label>
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger className={cn("mt-1 h-11", hasError("source") && "border-destructive")}>
              <SelectValue placeholder="Marketplace" />
            </SelectTrigger>
            <SelectContent>
              {settings.sources.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Validation errors summary */}
      {validationErrors.length > 0 && (
        <div className="mb-3 p-2.5 rounded-md bg-destructive/10 border border-destructive/20">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
            <div className="text-xs text-destructive space-y-0.5">
              {validationErrors.map((err, i) => (
                <p key={i}>{err}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Cart items */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {cart.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>No items yet</p>
            <p className="text-xs mt-1">Tap menu items to add them</p>
          </div>
        ) : (
          cart.map((item) => (
            <div
              key={item.menuItemId}
              className="flex items-start gap-2 p-2.5 rounded-md bg-muted/50 group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {item.name}
                  {item.menuItemId.startsWith("custom-") && (
                    <Badge variant="outline" className="ml-1.5 text-[9px] px-1 py-0 align-middle">
                      Custom
                    </Badge>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatPrice(item.basePrice, currency)} each
                </p>
                {item.note && (
                  <p className="text-xs text-primary mt-0.5 italic truncate">
                    {item.note}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openNoteDialog(item)}
                  className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Add note"
                >
                  <StickyNote className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => updateQuantity(item.menuItemId, -1)}
                  className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-sm font-medium w-6 text-center tabular-nums">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(item.menuItemId, 1)}
                  className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => removeFromCart(item.menuItemId)}
                  className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  aria-label="Remove item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}

        {/* Add custom item button — inside the items list */}
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-1.5 text-xs mt-1"
          onClick={() => setCustomDialogOpen(true)}
        >
          <PackagePlus className="w-3.5 h-3.5" />
          Add Custom Item
        </Button>
      </div>

      {/* Order notes */}
      {cart.length > 0 && (
        <div className="mt-3">
          <Label htmlFor="orderNotes" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Order Notes</Label>
          <Textarea
            id="orderNotes"
            placeholder="General notes for this order..."
            value={orderNotes}
            onChange={(e) => setOrderNotes(e.target.value)}
            className="mt-1 h-16 resize-none"
          />
        </div>
      )}

      {/* Total & Submit */}
      <div className="mt-4 pt-3 border-t border-border pb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-muted-foreground">Total</span>
          <span className="text-xl font-bold tabular-nums">{formatPrice(cartTotal, currency)}</span>
        </div>
        <Button
          onClick={handleSubmit}
          className="w-full h-12 text-base font-semibold"
          disabled={isSubmitting || cart.length === 0}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            `Place Order (${cartCount} items)`
          )}
        </Button>
      </div>
    </div>
  );

  if (menuLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Menu section */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold tracking-tight">New Order</h1>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-11"
          />
        </div>

        {/* Category filter */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setActiveCategory("All")}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors duration-150",
              activeCategory === "All"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            )}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors duration-150",
                activeCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Menu grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">No menu items found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredItems.map((item) => {
              const qty = getCartQuantity(item.id);
              return (
                <Card
                  key={item.id}
                  className={cn(
                    "relative cursor-pointer transition-all duration-150 hover:shadow-md active:scale-[0.97]",
                    qty > 0 && "ring-2 ring-primary/30"
                  )}
                  onClick={() => addToCart(item)}
                >
                  <CardContent className="p-4 min-h-[5.5rem]">
                    <p className="text-sm sm:text-sm font-medium leading-snug mb-1.5 line-clamp-2">
                      {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground mb-1.5">
                      {item.category}
                    </p>
                    <p className="text-sm font-semibold text-primary tabular-nums">
                      {formatPrice(item.basePrice, currency)}
                    </p>
                    {qty > 0 && (
                      <Badge className="absolute top-2 right-2 h-6 min-w-6 flex items-center justify-center text-xs px-1.5 bg-primary text-primary-foreground">
                        {qty}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Desktop cart sidebar */}
      <div className="hidden lg:block w-80 xl:w-96 shrink-0">
        <Card className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-hidden">
          <CardContent className="p-4 h-full">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Current Order
            </h2>
            {cartContentJSX}
          </CardContent>
        </Card>
      </div>

      {/* Mobile cart button + sheet */}
      <div className="lg:hidden fixed bottom-24 right-4 z-20">
        <Sheet open={mobileCartOpen} onOpenChange={setMobileCartOpen}>
          <SheetTrigger asChild>
            <Button size="lg" className="rounded-full shadow-xl h-14 w-14 relative ring-2 ring-background">
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full h-5 min-w-5 flex items-center justify-center px-1">
                  {cartCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[95vh] rounded-t-2xl px-5 pb-8 overflow-y-auto overflow-x-hidden">
            <SheetHeader className="pb-3">
              <SheetTitle>Current Order</SheetTitle>
            </SheetHeader>
            {cartContentJSX}
          </SheetContent>
        </Sheet>
      </div>

      {/* Note dialog */}
      <Dialog open={!!noteDialogItem} onOpenChange={() => setNoteDialogItem(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Note For {noteDialogItem?.name}</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="e.g., no sugar, extra spicy..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            className="h-24"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialogItem(null)}>
              Cancel
            </Button>
            <Button onClick={saveNote}>Save Note</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Custom order item dialog */}
      <Dialog open={customDialogOpen} onOpenChange={setCustomDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Custom Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Item Name <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="e.g., Special Cake, Custom Order"
                value={customItemName}
                onChange={(e) => setCustomItemName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Price <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                placeholder="0.00"
                min="0.01"
                step="0.01"
                value={customItemPrice}
                onChange={(e) => setCustomItemPrice(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCustomDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addCustomItem}>Add To Cart</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
