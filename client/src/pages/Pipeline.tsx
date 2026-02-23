/*
 * Design: Swiss Utility — Functional Minimalism
 * Pipeline: Three tabs (Today, Pending, Completed) with order cards
 * Pill-shaped status badges, inline actions
 * Features: Search/filter, return to pending, duplicate order, edit order,
 *           sorting options, date/time validation on edit, custom items in edit
 */
import { useState, useMemo, useCallback } from "react";
import { useOrders } from "@/hooks/useOrders";
import { useMenu } from "@/hooks/useMenu";
import { useSettings } from "@/hooks/useSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
} from "@/components/ui/sheet";
import { toast } from "sonner";
import {
  Check,
  Trash2,
  Pencil,
  Clock,
  User,
  Tag,
  Loader2,
  Plus,
  Minus,
  Search,
  Copy,
  Undo2,
  StickyNote,
  ArrowUpDown,
  PackagePlus,
  AlertCircle,
} from "lucide-react";
import type { Order, OrderItem, CartItem } from "@/lib/types";
import { formatPrice } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatDisplayDate } from "@/lib/dateFormat";
import PullToRefresh from "@/components/PullToRefresh";
import { useIsMobile } from "@/hooks/useMobile";

// Search function (matches tested pure function)
function searchOrders(orders: Order[], query: string): Order[] {
  if (!query.trim()) return orders;
  const q = query.toLowerCase().trim();
  return orders.filter((order) => {
    if (order.customerName.toLowerCase().includes(q)) return true;
    if (order.id.toLowerCase().includes(q)) return true;
    if (order.items.some((item) => item.name.toLowerCase().includes(q))) return true;
    return false;
  });
}

// Sort function — sorts by pickup date/time, not creation timestamp
type SortOption = "date-earliest" | "date-latest" | "price-low" | "price-high";

function sortOrders(orders: Order[], sortBy: SortOption): Order[] {
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

// Edit order validation (matches tested pure function)
function validateEditOrder(data: {
  customerName: string;
  items: OrderItem[];
  pickupDate: string;
  pickupTime: string;
  source: string;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.customerName.trim()) {
    errors.push("Customer name is required");
  }

  if (data.items.length === 0) {
    errors.push("At least one item is required");
  }

  if (!data.source || !data.source.trim()) {
    errors.push("Source is required");
  }

  if (data.pickupDate) {
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

  if (data.pickupTime) {
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(data.pickupTime)) {
      errors.push("Invalid time format");
    }
  }

  return { valid: errors.length === 0, errors };
}

export default function Pipeline() {
  const { orders, loading, completeOrder, deleteOrder, updateOrder, returnToPending, duplicateOrder } = useOrders();
  const { menuItems } = useMenu();
  const { settings, currency } = useSettings();
  const isMobile = useIsMobile();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"today" | "pending" | "completed">("today");
  const [tabSorts, setTabSorts] = useState<Record<string, SortOption>>({
    today: "date-latest",
    pending: "date-latest",
    completed: "date-latest",
  });
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Edit order state
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [editItems, setEditItems] = useState<OrderItem[]>([]);
  const [editNotes, setEditNotes] = useState("");
  const [editCustomerName, setEditCustomerName] = useState("");
  const [editPickupDate, setEditPickupDate] = useState("");
  const [editPickupTime, setEditPickupTime] = useState("");
  const [editSource, setEditSource] = useState("");
  const [editErrors, setEditErrors] = useState<string[]>([]);

  // Custom item in edit dialog
  const [editCustomDialogOpen, setEditCustomDialogOpen] = useState(false);
  const [editCustomItemName, setEditCustomItemName] = useState("");
  const [editCustomItemPrice, setEditCustomItemPrice] = useState("");

  const today = new Date().toISOString().split("T")[0];

  // Pull-to-refresh: Firebase uses realtime listeners so data is always fresh,
  // but we simulate a refresh with a brief delay for tactile feedback
  const handleRefresh = useCallback(async () => {
    await new Promise((resolve) => setTimeout(resolve, 600));
  }, []);

  // Apply search filter (shared) then sort per-tab independently
  const searchedOrders = useMemo(() => searchOrders(orders, searchQuery), [orders, searchQuery]);

  const todayOrders = useMemo(
    () => sortOrders(searchedOrders.filter((o) => o.pickupDate === today), tabSorts.today),
    [searchedOrders, today, tabSorts.today]
  );
  const pendingOrders = useMemo(
    () => sortOrders(searchedOrders.filter((o) => o.status === "pending"), tabSorts.pending),
    [searchedOrders, tabSorts.pending]
  );
  const completedOrders = useMemo(
    () => sortOrders(searchedOrders.filter((o) => o.status === "completed"), tabSorts.completed),
    [searchedOrders, tabSorts.completed]
  );

  const currentSort = tabSorts[activeTab];
  const setCurrentSort = (sort: SortOption) => {
    setTabSorts((prev) => ({ ...prev, [activeTab]: sort }));
  };

  const handleComplete = async (id: string) => {
    try {
      await completeOrder(id);
      toast.success("Order completed!");
    } catch {
      toast.error("Failed to complete order");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteOrder(deleteTarget);
      toast.success("Order deleted");
    } catch {
      toast.error("Failed to delete order");
    }
    setDeleteTarget(null);
  };

  const handleReturnToPending = async (id: string) => {
    try {
      await returnToPending(id);
      toast.success("Order returned to pending");
    } catch {
      toast.error("Failed to return order to pending");
    }
  };

  const handleDuplicate = async (order: Order) => {
    try {
      await duplicateOrder(order);
      toast.success(`Order duplicated for ${order.customerName}`);
    } catch {
      toast.error("Failed to duplicate order");
    }
  };

  const openEdit = (order: Order) => {
    setEditOrder(order);
    setEditItems(order.items.map((i) => ({ ...i })));
    setEditNotes(order.notes);
    setEditCustomerName(order.customerName);
    setEditPickupDate(order.pickupDate);
    setEditPickupTime(order.pickupTime);
    setEditSource(order.source);
    setEditErrors([]);
  };

  const handleEditSave = async () => {
    if (!editOrder) return;

    // Validate with date/time + source
    const validation = validateEditOrder({
      customerName: editCustomerName,
      items: editItems,
      pickupDate: editPickupDate,
      pickupTime: editPickupTime,
      source: editSource,
    });

    if (!validation.valid) {
      setEditErrors(validation.errors);
      validation.errors.forEach((err) => toast.error(err));
      return;
    }

    setEditErrors([]);
    const total = editItems.reduce((s, i) => s + i.basePrice * i.quantity, 0);
    try {
      await updateOrder(editOrder.id, {
        customerName: editCustomerName.trim(),
        items: editItems,
        notes: editNotes,
        pickupDate: editPickupDate,
        pickupTime: editPickupTime,
        source: editSource,
        total,
      });
      toast.success("Order updated!");
      setEditOrder(null);
    } catch {
      toast.error("Failed to update order");
    }
  };

  const updateEditItemQty = (idx: number, delta: number) => {
    setEditItems((prev) =>
      prev
        .map((item, i) =>
          i === idx ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const updateEditItemNote = (idx: number, note: string) => {
    setEditItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, note } : item))
    );
  };

  // Add a menu item to the edit order
  const addMenuItemToEdit = (menuItem: { id: string; name: string; basePrice: number }) => {
    setEditItems((prev) => {
      const existing = prev.find((c) => c.menuItemId === menuItem.id);
      if (existing) {
        return prev.map((c) =>
          c.menuItemId === menuItem.id ? { ...c, quantity: c.quantity + 1 } : c
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

  // Add custom item in edit dialog
  const addCustomItemToEdit = () => {
    const name = editCustomItemName.trim();
    const price = parseFloat(editCustomItemPrice);
    if (!name) {
      toast.error("Item name is required");
      return;
    }
    if (isNaN(price) || price <= 0) {
      toast.error("Price must be greater than 0");
      return;
    }
    const customId = `custom-${Date.now()}`;
    setEditItems((prev) => [
      ...prev,
      { menuItemId: customId, name, basePrice: price, quantity: 1, note: "" },
    ]);
    setEditCustomItemName("");
    setEditCustomItemPrice("");
    setEditCustomDialogOpen(false);
    toast.success(`Custom item "${name}" added`);
  };

  const OrderCard = ({ order }: { order: Order }) => (
    <Card className="transition-all duration-150 hover:shadow-md">
      <CardContent className="p-4">
        {/* Items first */}
        <div className="space-y-1 mb-2">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm">
              <span className="text-foreground font-medium">
                {item.quantity}x {item.name}
                {item.menuItemId?.startsWith("custom-") && (
                  <Badge variant="outline" className="ml-1 text-[9px] px-1 py-0 align-middle">
                    Custom
                  </Badge>
                )}
                {item.note && (
                  <span className="text-primary text-xs ml-1 italic">({item.note})</span>
                )}
              </span>
              <span className="text-muted-foreground tabular-nums">
                {formatPrice(item.basePrice * item.quantity, currency)}
              </span>
            </div>
          ))}
        </div>

        {/* Customer name + status */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{order.customerName}</span>
          </div>
          <Badge
            variant={order.status === "pending" ? "outline" : "default"}
            className={
              order.status === "pending"
                ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800"
                : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800"
            }
          >
            {order.status === "pending" ? "Pending" : "Completed"}
          </Badge>
        </div>

        {order.notes && (
          <p className="text-xs text-muted-foreground italic mb-3 bg-muted/50 p-2 rounded">
            {order.notes}
          </p>
        )}

        {/* Meta */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mb-3">
          {order.pickupDate && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDisplayDate(order.pickupDate, order.pickupTime)}
            </span>
          )}
          {order.source && (
            <span className="flex items-center gap-1">
              <Tag className="w-3 h-3" />
              {order.source}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <span className="font-bold tabular-nums shrink-0">{formatPrice(order.total, currency)}</span>
          <div className="flex items-center gap-0.5 sm:gap-1 flex-wrap justify-end">
            {/* Duplicate — available for all orders */}
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-2 text-muted-foreground hover:text-foreground"
              onClick={() => handleDuplicate(order)}
              title="Duplicate order"
            >
              <Copy className="w-3.5 h-3.5" />
            </Button>

            {order.status === "pending" && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2 text-muted-foreground hover:text-foreground"
                  onClick={() => openEdit(order)}
                  title="Edit order"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2 text-muted-foreground hover:text-destructive"
                  onClick={() => setDeleteTarget(order.id)}
                  title="Delete order"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="sm"
                  className="h-8 gap-1"
                  onClick={() => handleComplete(order.id)}
                >
                  <Check className="w-3.5 h-3.5" />
                  Complete
                </Button>
              </>
            )}
            {order.status === "completed" && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2 text-muted-foreground hover:text-foreground"
                  onClick={() => handleReturnToPending(order.id)}
                  title="Return to pending"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2 text-muted-foreground hover:text-destructive"
                  onClick={() => setDeleteTarget(order.id)}
                  title="Delete order"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const EmptyState = ({ message }: { message: string }) => (
    <div className="text-center py-12 text-muted-foreground">
      <p className="text-sm">{message}</p>
    </div>
  );

  // ---- Inline edit form JSX (shared between Sheet mobile + Dialog desktop) ----
  const editFormContent = (
    <div className="flex flex-col h-full">
      {/* Order details */}
      <div className="space-y-3 mb-4">
        <div>
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Customer Name <span className="text-destructive">*</span>
          </Label>
          <Input
            value={editCustomerName}
            onChange={(e) => setEditCustomerName(e.target.value)}
            className={cn("mt-1 h-11", editErrors.some(e => e.toLowerCase().includes("customer")) && "border-destructive")}
            placeholder="Customer name"
          />
        </div>
        <div className="grid grid-cols-1 gap-3">
          <div className="min-w-0 overflow-hidden">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Pickup Date
            </Label>
            <Input
              type="date"
              value={editPickupDate}
              onChange={(e) => setEditPickupDate(e.target.value)}
              className={cn("mt-1 h-11 w-full text-sm", editErrors.some(e => e.toLowerCase().includes("date")) && "border-destructive")}
            />
          </div>
          <div className="min-w-0 overflow-hidden">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Pickup Time
            </Label>
            <Input
              type="time"
              value={editPickupTime}
              onChange={(e) => setEditPickupTime(e.target.value)}
              className={cn("mt-1 h-11 w-full text-sm", editErrors.some(e => e.toLowerCase().includes("time")) && "border-destructive")}
            />
          </div>
        </div>
        <div>
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Source <span className="text-destructive">*</span>
          </Label>
          <Select value={editSource} onValueChange={setEditSource}>
            <SelectTrigger className={cn("mt-1 h-11", editErrors.some(e => e.toLowerCase().includes("source")) && "border-destructive")}>
              <SelectValue placeholder="Select source" />
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

      {/* Validation errors */}
      {editErrors.length > 0 && (
        <div className="mb-3 p-2.5 rounded-md bg-destructive/10 border border-destructive/20">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
            <div className="text-xs text-destructive space-y-0.5">
              {editErrors.map((err, i) => (
                <p key={i}>{err}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Items */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {editItems.map((item, idx) => (
          <div key={idx} className="flex items-start gap-2 p-2.5 rounded-md bg-muted/50">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {item.name}
                {item.menuItemId?.startsWith("custom-") && (
                  <Badge variant="outline" className="ml-1 text-[9px] px-1 py-0 align-middle">
                    Custom
                  </Badge>
                )}
              </p>
              <p className="text-xs text-muted-foreground">{formatPrice(item.basePrice, currency)}</p>
              {item.note && (
                <p className="text-xs text-primary italic mt-0.5">{item.note}</p>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  const note = prompt("Note for " + item.name + ":", item.note);
                  if (note !== null) updateEditItemNote(idx, note);
                }}
                className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                title="Edit note"
              >
                <StickyNote className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => updateEditItemQty(idx, -1)}
                className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-6 text-center text-sm tabular-nums">{item.quantity}</span>
              <button
                onClick={() => updateEditItemQty(idx, 1)}
                className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}

        {/* Add from menu + custom item */}
        <div className="flex flex-col gap-2">
          {menuItems.length > 0 && (
            <Select
              onValueChange={(val) => {
                const item = menuItems.find((m) => m.id === val);
                if (item) addMenuItemToEdit(item);
              }}
            >
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="+ Add from menu" />
              </SelectTrigger>
              <SelectContent>
                {menuItems
                  .filter((m) => m.available !== false)
                  .map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name} — {formatPrice(m.basePrice, currency)}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-1.5 text-xs"
            onClick={() => setEditCustomDialogOpen(true)}
          >
            <PackagePlus className="w-3.5 h-3.5" />
            Add Custom Item
          </Button>
        </div>
      </div>

      {/* Notes */}
      <div className="mt-3">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Notes</Label>
        <Textarea
          value={editNotes}
          onChange={(e) => setEditNotes(e.target.value)}
          className="mt-1 h-16 resize-none"
          placeholder="Order notes..."
        />
      </div>

      {/* Total & Save */}
      <div className="mt-4 pt-3 border-t border-border pb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-muted-foreground">Total</span>
          <span className="text-xl font-bold tabular-nums">
            {formatPrice(editItems.reduce((s, i) => s + i.basePrice * i.quantity, 0), currency)}
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 h-12 text-base"
            onClick={() => setEditOrder(null)}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 h-12 text-base font-semibold"
            onClick={handleEditSave}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold tracking-tight">Order Pipeline</h1>
        </div>

      {/* Search bar */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Tabs defaultValue="today" className="w-full" onValueChange={(v) => setActiveTab(v as "today" | "pending" | "completed")}>
        <div className="mb-4 space-y-3">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="today" className="gap-1.5">
              Today
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 text-[10px]">
                {todayOrders.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="pending" className="gap-1.5">
              Pending
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 text-[10px]">
                {pendingOrders.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-1.5">
              Completed
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 text-[10px]">
                {completedOrders.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* Per-tab sort selector — below tabs */}
          <div>
            <Select value={currentSort} onValueChange={(v) => setCurrentSort(v as SortOption)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <ArrowUpDown className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-earliest">Date: Earliest</SelectItem>
                <SelectItem value="date-latest">Date: Latest</SelectItem>
                <SelectItem value="price-low">Price: Low To High</SelectItem>
                <SelectItem value="price-high">Price: High To Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="today">
          {todayOrders.length === 0 ? (
            <EmptyState message={searchQuery ? "No matching orders today" : "No orders today yet"} />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {todayOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending">
          {pendingOrders.length === 0 ? (
            <EmptyState message={searchQuery ? "No matching pending orders" : "No pending orders"} />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {pendingOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed">
          {completedOrders.length === 0 ? (
            <EmptyState message={searchQuery ? "No matching completed orders" : "No completed orders"} />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {completedOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this order?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The order will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit order — Sheet on mobile, Dialog on desktop */}
      {/* Both are always rendered; only the correct one opens based on viewport */}
      <Sheet open={isMobile && !!editOrder} onOpenChange={() => setEditOrder(null)}>
        <SheetContent side="bottom" className="h-[95vh] rounded-t-2xl px-5 pb-8 overflow-y-auto overflow-x-hidden">
          <SheetHeader className="pb-3">
            <SheetTitle>Edit Order</SheetTitle>
          </SheetHeader>
          {editFormContent}
        </SheetContent>
      </Sheet>

      <Dialog open={!isMobile && !!editOrder} onOpenChange={() => setEditOrder(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Order</DialogTitle>
          </DialogHeader>
          {editFormContent}
        </DialogContent>
      </Dialog>

      {/* Custom item dialog for edit */}
      <Dialog open={editCustomDialogOpen} onOpenChange={setEditCustomDialogOpen}>
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
                value={editCustomItemName}
                onChange={(e) => setEditCustomItemName(e.target.value)}
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
                value={editCustomItemPrice}
                onChange={(e) => setEditCustomItemPrice(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCustomDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addCustomItemToEdit}>Add To Order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </PullToRefresh>
  );
}
