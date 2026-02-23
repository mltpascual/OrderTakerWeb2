/*
 * Design: Warm Craft — Premium Food-Tech Aesthetic
 * New Order: Split panel — menu grid (left) + live cart (right) on desktop
 * Stacked on mobile with a sticky cart summary bar
 * Elevated cards, warm shadows, rounded-2xl, smooth transitions
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
  const [source, setSource] = useState("Marketplace");
  const [orderNotes, setOrderNotes] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [noteDialogItem, setNoteDialogItem] = useState<CartItem | null>(null);
  const [noteText, setNoteText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

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
      setCart([]);
      setCustomerName("");
      setPickupDate("");
      setPickupTime("");
      setSource("Marketplace");
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

  const hasError = (field: string) => {
    return validationErrors.some((e) => e.toLowerCase().includes(field.toLowerCase()));
  };

  // ---- Inline cart content JSX ----
  const cartContentJSX = (
    <div className="flex flex-col h-full">
      {/* Order details */}
      <div className="space-y-3.5 mb-5">
        <div>
          <Label htmlFor="customerName" className="text-[0.6875rem] font-semibold text-muted-foreground uppercase tracking-wider">
            Customer <span className="text-destructive">*</span>
          </Label>
          <Input
            id="customerName"
            placeholder="Customer name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className={cn("mt-1.5 h-11 rounded-xl", hasError("customer") && "border-destructive")}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="min-w-0 overflow-hidden">
            <Label htmlFor="pickupDate" className="text-[0.6875rem] font-semibold text-muted-foreground uppercase tracking-wider">
              Pickup Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="pickupDate"
              type="date"
              value={pickupDate}
              onChange={(e) => setPickupDate(e.target.value)}
              className={cn("mt-1.5 h-11 w-full text-sm rounded-xl", hasError("date") && "border-destructive")}
            />
          </div>
          <div className="min-w-0 overflow-hidden">
            <Label htmlFor="pickupTime" className="text-[0.6875rem] font-semibold text-muted-foreground uppercase tracking-wider">
              Pickup Time <span className="text-destructive">*</span>
            </Label>
            <Input
              id="pickupTime"
              type="time"
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
              className={cn("mt-1.5 h-11 w-full text-sm rounded-xl", hasError("time") && "border-destructive")}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="source" className="text-[0.6875rem] font-semibold text-muted-foreground uppercase tracking-wider">
            Source <span className="text-destructive">*</span>
          </Label>
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger className={cn("mt-1.5 h-11 rounded-xl", hasError("source") && "border-destructive")}>
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
        <div className="mb-3 p-3 rounded-xl bg-destructive/8 border border-destructive/15">
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
          <div className="text-center py-8 text-muted-foreground">
            <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-3">
              <ShoppingCart className="w-6 h-6 opacity-40" />
            </div>
            <p className="text-sm font-medium">No items yet</p>
            <p className="text-xs mt-1 text-muted-foreground/70">Tap menu items to add them</p>
          </div>
        ) : (
          cart.map((item) => (
            <div
              key={item.menuItemId}
              className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/40 border border-border/40 group transition-colors duration-150 hover:bg-muted/60"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">
                  {item.name}
                  {item.menuItemId.startsWith("custom-") && (
                    <Badge variant="outline" className="ml-1.5 text-[9px] px-1.5 py-0 align-middle rounded-md">
                      Custom
                    </Badge>
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatPrice(item.basePrice, currency)} each
                </p>
                {item.note && (
                  <p className="text-xs text-primary mt-0.5 italic truncate">
                    {item.note}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => openNoteDialog(item)}
                  className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors duration-150"
                  aria-label="Add note"
                >
                  <StickyNote className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => updateQuantity(item.menuItemId, -1)}
                  className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors duration-150"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-sm font-bold w-6 text-center tabular-nums">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(item.menuItemId, 1)}
                  className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors duration-150"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => removeFromCart(item.menuItemId)}
                  className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors duration-150"
                  aria-label="Remove item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}

        <Button
          variant="outline"
          size="sm"
          className="w-full gap-1.5 text-xs mt-1 rounded-xl border-dashed"
          onClick={() => setCustomDialogOpen(true)}
        >
          <PackagePlus className="w-3.5 h-3.5" />
          Add Custom Item
        </Button>
      </div>

      {/* Order notes */}
      {cart.length > 0 && (
        <div className="mt-3">
          <Label htmlFor="orderNotes" className="text-[0.6875rem] font-semibold text-muted-foreground uppercase tracking-wider">Order Notes</Label>
          <Textarea
            id="orderNotes"
            placeholder="General notes for this order..."
            value={orderNotes}
            onChange={(e) => setOrderNotes(e.target.value)}
            className="mt-1.5 h-16 resize-none rounded-xl"
          />
        </div>
      )}

      {/* Total & Submit */}
      <div className="mt-4 pt-4 border-t border-border/60 pb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-muted-foreground">Total</span>
          <span className="text-2xl font-bold tabular-nums tracking-tight">{formatPrice(cartTotal, currency)}</span>
        </div>
        <Button
          onClick={handleSubmit}
          className="w-full h-12 text-[0.9375rem] font-semibold rounded-xl shadow-warm-sm hover:shadow-warm transition-all duration-200"
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
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl font-bold tracking-tight">New Order</h1>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 rounded-xl"
          />
        </div>

        {/* Category filter */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setActiveCategory("All")}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200",
              activeCategory === "All"
                ? "bg-primary text-primary-foreground shadow-warm-sm"
                : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200",
                activeCategory === cat
                  ? "bg-primary text-primary-foreground shadow-warm-sm"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Menu grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-sm font-medium">No menu items found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredItems.map((item) => {
              const qty = getCartQuantity(item.id);
              return (
                <Card
                  key={item.id}
                  className={cn(
                    "relative cursor-pointer transition-all duration-200 hover:shadow-warm-md hover:-translate-y-0.5 active:scale-[0.97] rounded-2xl border-border/50 shadow-warm-sm",
                    qty > 0 && "ring-2 ring-primary/25 shadow-warm"
                  )}
                  onClick={() => addToCart(item)}
                >
                  <CardContent className="p-4 min-h-[6rem]">
                    <p className="text-[0.8125rem] font-semibold leading-snug mb-2 line-clamp-2">
                      {item.name}
                    </p>
                    <p className="text-[0.6875rem] text-muted-foreground mb-2 font-medium">
                      {item.category}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-primary tabular-nums">
                        {formatPrice(item.basePrice, currency)}
                      </span>
                    </div>
                    {qty > 0 && (
                      <Badge className="absolute top-2.5 right-2.5 h-6 min-w-6 flex items-center justify-center text-[0.6875rem] font-bold rounded-lg shadow-warm-sm">
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
        <Card className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-hidden rounded-2xl shadow-warm-md border-border/50">
          <CardContent className="p-5 h-full">
            <h2 className="text-[0.6875rem] font-bold text-muted-foreground uppercase tracking-wider mb-4">
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
            <Button size="lg" className="rounded-2xl shadow-warm-xl h-14 w-14 relative ring-2 ring-background">
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full h-5 min-w-5 flex items-center justify-center px-1">
                  {cartCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[95vh] rounded-t-3xl px-5 pb-8 overflow-y-auto overflow-x-hidden">
            <SheetHeader className="pb-3">
              <SheetTitle className="text-lg font-bold">Current Order</SheetTitle>
            </SheetHeader>
            {cartContentJSX}
          </SheetContent>
        </Sheet>
      </div>

      {/* Note dialog */}
      <Dialog open={!!noteDialogItem} onOpenChange={() => setNoteDialogItem(null)}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Note For {noteDialogItem?.name}</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="e.g., no sugar, extra spicy..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            className="h-24 rounded-xl"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialogItem(null)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={saveNote} className="rounded-xl">Save Note</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Custom order item dialog */}
      <Dialog open={customDialogOpen} onOpenChange={setCustomDialogOpen}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Add Custom Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-[0.6875rem] font-semibold text-muted-foreground uppercase tracking-wider">
                Item Name <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="e.g., Special Cake, Custom Order"
                value={customItemName}
                onChange={(e) => setCustomItemName(e.target.value)}
                className="mt-1.5 rounded-xl"
              />
            </div>
            <div>
              <Label className="text-[0.6875rem] font-semibold text-muted-foreground uppercase tracking-wider">
                Price <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                placeholder="0.00"
                min="0.01"
                step="0.01"
                value={customItemPrice}
                onChange={(e) => setCustomItemPrice(e.target.value)}
                className="mt-1.5 rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCustomDialogOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={addCustomItem} className="rounded-xl">Add To Cart</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
