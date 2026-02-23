/*
 * Design: Swiss Utility — Functional Minimalism
 * Menu Management: Table/list of items with add/edit modal
 * Category filter, availability toggle, inline actions
 */
import { useState, useRef } from "react";
import { useMenu } from "@/hooks/useMenu";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, Loader2, ChevronDown } from "lucide-react";
import type { MenuItem } from "@/lib/types";
import { formatPrice } from "@/lib/types";
import { useSettings } from "@/hooks/useSettings";
import { cn } from "@/lib/utils";

interface MenuFormData {
  name: string;
  basePrice: string;
  category: string;
  available: boolean;
}

const emptyForm: MenuFormData = {
  name: "",
  basePrice: "",
  category: "",
  available: true,
};

export default function MenuManagement() {
  const { menuItems, categories, loading, addMenuItem, updateMenuItem, deleteMenuItem } = useMenu();
  const { currency } = useSettings();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState<MenuFormData>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [isSaving, setIsSaving] = useState(false);

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = activeCategory === "All" || item.category === activeCategory;
    const matchesSearch = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const openAdd = () => {
    setEditingItem(null);
    setFormData(emptyForm);
    setIsFormOpen(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      basePrice: item.basePrice.toString(),
      category: item.category,
      available: item.available !== false,
    });
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.basePrice || !formData.category.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSaving(true);
    try {
      const data = {
        name: formData.name.trim(),
        basePrice: parseFloat(formData.basePrice),
        category: formData.category.trim(),
        available: formData.available,
      };

      if (editingItem) {
        await updateMenuItem(editingItem.id, data);
        toast.success("Menu item updated!");
      } else {
        await addMenuItem(data);
        toast.success("Menu item added!");
      }
      setIsFormOpen(false);
    } catch {
      toast.error("Failed to save menu item");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMenuItem(deleteTarget);
      toast.success("Menu item deleted");
    } catch {
      toast.error("Failed to delete menu item");
    }
    setDeleteTarget(null);
  };

  const handleToggleAvailability = async (item: MenuItem) => {
    try {
      await updateMenuItem(item.id, { available: !(item.available !== false) });
    } catch {
      toast.error("Failed to update availability");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Menu</h1>
        <Button onClick={openAdd} size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" />
          Add Item
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search menu items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveCategory("All")}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors duration-150",
            activeCategory === "All"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-accent"
          )}
        >
          All ({menuItems.length})
        </button>
        {categories.map((cat) => {
          const count = menuItems.filter((i) => i.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors duration-150",
                activeCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              )}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Items list */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">
            {menuItems.length === 0
              ? "No menu items yet. Add your first item!"
              : "No items match your search"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredItems.map((item) => (
            <Card key={item.id} className={cn(item.available === false && "opacity-60")}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    {item.available === false && (
                      <Badge variant="outline" className="text-[10px] text-muted-foreground">
                        Unavailable
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">{item.category}</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-sm font-semibold text-primary tabular-nums">
                      {formatPrice(item.basePrice, currency)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={item.available !== false}
                    onCheckedChange={() => handleToggleAvailability(item)}
                    aria-label="Toggle availability"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                    onClick={() => openEdit(item)}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => setDeleteTarget(item.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Item" : "Add Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="itemName">Name</Label>
              <Input
                id="itemName"
                placeholder="e.g., Iced Latte"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="itemPrice">Price</Label>
              <Input
                id="itemPrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.basePrice}
                onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="itemCategory">Category</Label>
              {categories.length > 0 ? (
                <div className="mt-1 space-y-2">
                  <Select
                    value={categories.includes(formData.category) ? formData.category : "__new__"}
                    onValueChange={(val) => {
                      if (val === "__new__") {
                        setFormData({ ...formData, category: "" });
                      } else {
                        setFormData({ ...formData, category: val });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                      <SelectItem value="__new__">+ New category...</SelectItem>
                    </SelectContent>
                  </Select>
                  {!categories.includes(formData.category) && (
                    <Input
                      id="itemCategory"
                      placeholder="Type new category name"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      autoFocus
                    />
                  )}
                </div>
              ) : (
                <Input
                  id="itemCategory"
                  placeholder="e.g., Drinks, Dessert"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="mt-1"
                />
              )}
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="itemAvailable">Available</Label>
              <Switch
                id="itemAvailable"
                checked={formData.available}
                onCheckedChange={(checked) => setFormData({ ...formData, available: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : editingItem ? (
                "Update"
              ) : (
                "Add Item"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this menu item?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The item will be permanently removed from your menu.
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
    </div>
  );
}
