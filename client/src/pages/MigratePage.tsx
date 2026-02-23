/*
 * Data Migration Page
 * Converts legacy single-item orders to multi-item format.
 * Accessible via /migrate route (hidden from nav, only for the shop owner).
 *
 * Legacy format:
 *   { customerName, itemName, quantity, total, notes, pickupDate, pickupTime, source, status, timestamp }
 *
 * New format:
 *   { customerName, items: [{ menuItemId, name, basePrice, quantity, note }], notes, pickupDate, pickupTime, source, status, total, timestamp, completedAt }
 */
import { useState } from "react";
import { collection, getDocs, doc, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, ArrowLeft, CheckCircle2, AlertTriangle, Database } from "lucide-react";
import { Link } from "wouter";

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
  // New format fields (if already migrated)
  items?: any[];
}

interface MigrationResult {
  total: number;
  migrated: number;
  skipped: number;
  errors: number;
  details: string[];
}

export default function MigratePage() {
  const { user } = useAuth();
  const [running, setRunning] = useState(false);
  const [dryRun, setDryRun] = useState(true);
  const [result, setResult] = useState<MigrationResult | null>(null);

  const runMigration = async () => {
    if (!user) return;

    setRunning(true);
    setResult(null);

    const migrationResult: MigrationResult = {
      total: 0,
      migrated: 0,
      skipped: 0,
      errors: 0,
      details: [],
    };

    try {
      const ordersRef = collection(db, "users", user.uid, "orders");
      const snapshot = await getDocs(ordersRef);

      migrationResult.total = snapshot.size;
      migrationResult.details.push(`Found ${snapshot.size} total orders.`);

      const ordersToMigrate: LegacyOrder[] = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as LegacyOrder;
        data.id = docSnap.id;

        // Check if already in new format (has items array)
        if (data.items && Array.isArray(data.items) && data.items.length > 0) {
          migrationResult.skipped++;
          migrationResult.details.push(`Skipped ${docSnap.id} — already has items array.`);
          return;
        }

        // Check if it has the old format (has itemName field)
        if (data.itemName) {
          ordersToMigrate.push(data);
        } else {
          migrationResult.skipped++;
          migrationResult.details.push(`Skipped ${docSnap.id} — no itemName field found.`);
        }
      });

      migrationResult.details.push(`${ordersToMigrate.length} orders need migration.`);

      if (!dryRun && ordersToMigrate.length > 0) {
        // Use batched writes for efficiency (max 500 per batch)
        const batchSize = 450;
        for (let i = 0; i < ordersToMigrate.length; i += batchSize) {
          const batch = writeBatch(db);
          const chunk = ordersToMigrate.slice(i, i + batchSize);

          for (const order of chunk) {
            try {
              const orderRef = doc(db, "users", user.uid, "orders", order.id);
              const basePrice = (order.total || 0) / (order.quantity || 1);

              const updatedData = {
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

              batch.update(orderRef, updatedData);
              migrationResult.migrated++;
              migrationResult.details.push(
                `Migrated ${order.id}: "${order.itemName}" (qty: ${order.quantity}, total: ${order.total})`
              );
            } catch (err: any) {
              migrationResult.errors++;
              migrationResult.details.push(`Error migrating ${order.id}: ${err.message}`);
            }
          }

          await batch.commit();
          migrationResult.details.push(`Committed batch of ${chunk.length} orders.`);
        }
      } else if (dryRun) {
        // Dry run — just show what would happen
        for (const order of ordersToMigrate) {
          const basePrice = (order.total || 0) / (order.quantity || 1);
          migrationResult.migrated++;
          migrationResult.details.push(
            `[DRY RUN] Would migrate ${order.id}: "${order.itemName}" → items: [{ name: "${order.itemName}", basePrice: ${basePrice}, qty: ${order.quantity} }]`
          );
        }
      }
    } catch (err: any) {
      migrationResult.errors++;
      migrationResult.details.push(`Fatal error: ${err.message}`);
    }

    setResult(migrationResult);
    setRunning(false);
  };

  return (
    <div className="min-h-screen bg-background p-4 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/settings">
          <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 cursor-pointer transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back To Settings
          </div>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              Data Migration
            </CardTitle>
            <CardDescription>
              Convert legacy single-item orders to the new multi-item format. This is a one-time
              operation for existing orders that use the old format (with <code>itemName</code> field
              instead of <code>items</code> array).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800 dark:text-amber-300">Before You Start</p>
                  <ul className="mt-1 space-y-1 text-amber-700 dark:text-amber-400">
                    <li>1. Export your orders as CSV from Settings first (as a backup).</li>
                    <li>2. Run a Dry Run first to preview what will change.</li>
                    <li>3. Then run the actual migration when you're satisfied.</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setDryRun(true);
                  runMigration();
                }}
                disabled={running}
                variant="outline"
                className="gap-2"
              >
                {running && dryRun ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : null}
                Dry Run (Preview)
              </Button>
              <Button
                onClick={() => {
                  setDryRun(false);
                  runMigration();
                }}
                disabled={running}
                className="gap-2"
              >
                {running && !dryRun ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : null}
                Run Migration
              </Button>
            </div>

            {result && (
              <div className="space-y-3 mt-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-secondary rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold">{result.total}</p>
                    <p className="text-xs text-muted-foreground">Total Orders</p>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-emerald-600">{result.migrated}</p>
                    <p className="text-xs text-muted-foreground">
                      {dryRun ? "Would Migrate" : "Migrated"}
                    </p>
                  </div>
                  <div className="bg-secondary rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold">{result.skipped}</p>
                    <p className="text-xs text-muted-foreground">Skipped</p>
                  </div>
                  <div className={`rounded-lg p-3 text-center ${result.errors > 0 ? "bg-red-50 dark:bg-red-950/30" : "bg-secondary"}`}>
                    <p className={`text-2xl font-bold ${result.errors > 0 ? "text-red-600" : ""}`}>
                      {result.errors}
                    </p>
                    <p className="text-xs text-muted-foreground">Errors</p>
                  </div>
                </div>

                {result.errors === 0 && result.migrated > 0 && !dryRun && (
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-sm font-medium">Migration completed successfully!</span>
                  </div>
                )}

                <div className="bg-muted rounded-lg p-3 max-h-64 overflow-y-auto">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Migration Log:</p>
                  {result.details.map((detail, i) => (
                    <p key={i} className="text-xs text-muted-foreground font-mono leading-relaxed">
                      {detail}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
