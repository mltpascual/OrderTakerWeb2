/*
 * Design: Warm Craft — Premium Food-Tech Aesthetic
 * Reports: Time range tabs with elevated metric cards, warm progress bars,
 *          revenue trend bar chart, top selling/earning items, orders by source/category
 */
import { useState, useMemo, useCallback } from "react";
import { useOrders } from "@/hooks/useOrders";
import { useMenu } from "@/hooks/useMenu";
import { useSettings } from "@/hooks/useSettings";
import { formatPrice } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Award,
  Tag,
  Layers,
  Trophy,
  ChevronDown,
  ChevronRight,
  BarChart3,
} from "lucide-react";
import PullToRefresh from "@/components/PullToRefresh";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Reports() {
  const { orders, loading } = useOrders();
  const { menuItems } = useMenu();
  const { currency } = useSettings();

  const nameToCategoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    menuItems.forEach((item) => {
      map[item.name] = item.category || "Uncategorized";
    });
    return map;
  }, [menuItems]);

  const getCategoryForItem = (itemName: string, menuItemId?: string): string => {
    if (menuItemId?.startsWith("custom-")) return "Custom";
    return nameToCategoryMap[itemName] || "Uncategorized";
  };

  const filterOrders = (range: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return orders.filter((order) => {
      if (order.status !== "completed") return false;
      const orderDate = new Date(order.timestamp);

      switch (range) {
        case "daily":
          return orderDate >= today;
        case "weekly": {
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return orderDate >= weekAgo;
        }
        case "monthly": {
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return orderDate >= monthAgo;
        }
        case "all":
        default:
          return true;
      }
    });
  };

  const getRevenueTrend = (filteredOrders: typeof orders, range: string) => {
    const now = new Date();

    if (range === "daily") {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const hourlyData: Record<number, number> = {};
      filteredOrders.forEach((order) => {
        const d = new Date(order.timestamp);
        if (d >= today) {
          const hour = d.getHours();
          hourlyData[hour] = (hourlyData[hour] || 0) + order.total;
        }
      });
      const points = [];
      for (let h = 0; h <= 23; h++) {
        const ampm = h === 0 ? "12AM" : h < 12 ? `${h}AM` : h === 12 ? "12PM" : `${h - 12}PM`;
        points.push({ label: ampm, revenue: hourlyData[h] || 0 });
      }
      return points;
    }

    if (range === "weekly") {
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const points = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);
        const dayRevenue = filteredOrders
          .filter((o) => {
            const t = new Date(o.timestamp);
            return t >= dayStart && t < dayEnd;
          })
          .reduce((sum, o) => sum + o.total, 0);
        points.push({ label: dayNames[dayStart.getDay()], revenue: dayRevenue });
      }
      return points;
    }

    if (range === "monthly") {
      const points = [];
      const monthAbbr = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      for (let w = 3; w >= 0; w--) {
        const weekEnd = new Date(now);
        weekEnd.setDate(weekEnd.getDate() - w * 7);
        const weekStart = new Date(weekEnd);
        weekStart.setDate(weekStart.getDate() - 7);
        const weekRevenue = filteredOrders
          .filter((o) => {
            const t = new Date(o.timestamp);
            return t >= weekStart && t < weekEnd;
          })
          .reduce((sum, o) => sum + o.total, 0);
        const startLabel = `${monthAbbr[weekStart.getMonth()]} ${weekStart.getDate()}`;
        const endDate = new Date(weekEnd);
        endDate.setDate(endDate.getDate() - 1);
        const endLabel = `${monthAbbr[endDate.getMonth()]} ${endDate.getDate()}`;
        points.push({ label: `${startLabel}-${endLabel}`, revenue: weekRevenue });
      }
      return points;
    }

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const points = [];
    for (let m = 5; m >= 0; m--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const nextMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);
      const monthRevenue = filteredOrders
        .filter((o) => {
          const t = new Date(o.timestamp);
          return t >= monthDate && t < nextMonth;
        })
        .reduce((sum, o) => sum + o.total, 0);
      points.push({ label: monthNames[monthDate.getMonth()], revenue: monthRevenue });
    }
    return points;
  };

  const computeMetrics = (filteredOrders: typeof orders) => {
    const totalOrders = filteredOrders.length;
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const itemCounts: Record<string, { name: string; quantity: number; revenue: number }> = {};
    filteredOrders.forEach((order) => {
      order.items.forEach((item) => {
        if (!itemCounts[item.name]) {
          itemCounts[item.name] = { name: item.name, quantity: 0, revenue: 0 };
        }
        itemCounts[item.name].quantity += item.quantity;
        itemCounts[item.name].revenue += item.basePrice * item.quantity;
      });
    });

    const topSellingItems = Object.values(itemCounts)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
    const maxSellingQty = topSellingItems.length > 0 ? topSellingItems[0].quantity : 1;

    const topEarningItems = Object.values(itemCounts)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
    const maxEarningRev = topEarningItems.length > 0 ? topEarningItems[0].revenue : 1;

    const sourceData: Record<string, { count: number; revenue: number }> = {};
    filteredOrders.forEach((order) => {
      const src = order.source || "Unknown";
      if (!sourceData[src]) {
        sourceData[src] = { count: 0, revenue: 0 };
      }
      sourceData[src].count += 1;
      sourceData[src].revenue += order.total;
    });
    const bySource = Object.entries(sourceData)
      .map(([source, data]) => ({ source, count: data.count, revenue: data.revenue }))
      .sort((a, b) => b.count - a.count);

    const categoryItemMap: Record<string, Record<string, number>> = {};
    const categoryTotals: Record<string, { quantity: number; revenue: number }> = {};
    filteredOrders.forEach((order) => {
      order.items.forEach((item) => {
        const cat = getCategoryForItem(item.name, item.menuItemId);
        if (!categoryItemMap[cat]) categoryItemMap[cat] = {};
        if (!categoryTotals[cat]) categoryTotals[cat] = { quantity: 0, revenue: 0 };
        categoryItemMap[cat][item.name] = (categoryItemMap[cat][item.name] || 0) + item.quantity;
        categoryTotals[cat].quantity += item.quantity;
        categoryTotals[cat].revenue += item.basePrice * item.quantity;
      });
    });

    const byCategory = Object.entries(categoryItemMap)
      .map(([category, items]) => {
        const itemList = Object.entries(items)
          .map(([name, quantity]) => ({ name, quantity }))
          .sort((a, b) => b.quantity - a.quantity);
        const maxItemQty = itemList.length > 0 ? itemList[0].quantity : 1;
        return {
          category,
          totalQuantity: categoryTotals[category].quantity,
          totalRevenue: categoryTotals[category].revenue,
          items: itemList.map((i) => ({
            ...i,
            percentage: (i.quantity / maxItemQty) * 100,
          })),
        };
      })
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    return {
      totalOrders,
      totalRevenue,
      avgOrderValue,
      topSellingItems: topSellingItems.map((i) => ({
        ...i,
        percentage: (i.quantity / maxSellingQty) * 100,
      })),
      topEarningItems: topEarningItems.map((i) => ({
        ...i,
        percentage: (i.revenue / maxEarningRev) * 100,
      })),
      bySource,
      byCategory,
    };
  };

  const handleRefresh = useCallback(async () => {
    await new Promise((resolve) => setTimeout(resolve, 600));
  }, []);

  const ReportContent = ({ range }: { range: string }) => {
    const filtered = useMemo(() => filterOrders(range), [range, orders]);
    const metrics = useMemo(() => computeMetrics(filtered), [filtered]);
    const trendData = useMemo(() => getRevenueTrend(filtered, range), [filtered, range]);
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

    const toggleCategory = (cat: string) => {
      setExpandedCategories((prev) => {
        const next = new Set(prev);
        if (next.has(cat)) {
          next.delete(cat);
        } else {
          next.add(cat);
        }
        return next;
      });
    };

    return (
      <div className="space-y-6 animate-slide-up">
        {/* Metric cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Card className="rounded-2xl border-border/50 shadow-warm-sm hover:shadow-warm transition-shadow duration-200">
            <CardContent className="p-5">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4 text-primary" />
                </div>
                <span className="text-[0.6875rem] font-semibold text-muted-foreground uppercase tracking-wider">
                  Total Orders
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold tabular-nums tracking-tight">{metrics.totalOrders}</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-border/50 shadow-warm-sm hover:shadow-warm transition-shadow duration-200">
            <CardContent className="p-5">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-primary" />
                </div>
                <span className="text-[0.6875rem] font-semibold text-muted-foreground uppercase tracking-wider">
                  Revenue
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold tabular-nums tracking-tight">{formatPrice(metrics.totalRevenue, currency)}</p>
            </CardContent>
          </Card>
          <Card className="sm:col-span-2 lg:col-span-1 rounded-2xl border-border/50 shadow-warm-sm hover:shadow-warm transition-shadow duration-200">
            <CardContent className="p-5">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                <span className="text-[0.6875rem] font-semibold text-muted-foreground uppercase tracking-wider">
                  Avg. Order
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold tabular-nums tracking-tight">{formatPrice(metrics.avgOrderValue, currency)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue trend chart */}
        <Card className="rounded-2xl border-border/50 shadow-warm-sm">
          <CardHeader className="pb-3 px-5 pt-5">
            <CardTitle className="text-sm font-semibold flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <BarChart3 className="w-3.5 h-3.5 text-primary" />
              </div>
              Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 px-5 pb-5">
            {trendData.every((d) => d.revenue === 0) ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No revenue data yet</p>
            ) : (
              <div className="h-48 sm:h-56 -ml-2 sm:ml-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10 }}
                      className="fill-muted-foreground"
                      interval={range === "daily" ? 3 : range === "all" ? 0 : "preserveStartEnd"}
                      angle={range === "monthly" ? -20 : 0}
                      textAnchor={range === "monthly" ? "end" : "middle"}
                      height={range === "monthly" ? 45 : 30}
                    />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      className="fill-muted-foreground"
                      width={40}
                      tickFormatter={(v) => {
                        if (v >= 1000) return `${(v / 1000).toFixed(0)}k`;
                        return v.toString();
                      }}
                    />
                    <Tooltip
                      formatter={(value: number) => [formatPrice(value, currency), "Revenue"]}
                      contentStyle={{
                        backgroundColor: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: "0.75rem",
                        fontSize: "0.75rem",
                        boxShadow: "0 4px 12px -2px rgba(120, 80, 40, 0.08)",
                      }}
                      labelStyle={{ color: "var(--muted-foreground)" }}
                    />
                    <Bar
                      dataKey="revenue"
                      fill="var(--primary)"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Top selling items */}
          <Card className="rounded-2xl border-border/50 shadow-warm-sm">
            <CardHeader className="pb-3 px-5 pt-5">
              <CardTitle className="text-sm font-semibold flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Award className="w-3.5 h-3.5 text-primary" />
                </div>
                Top Selling Items
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 px-5 pb-5">
              {metrics.topSellingItems.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No data yet</p>
              ) : (
                <div className="space-y-3.5">
                  {metrics.topSellingItems.map((item, idx) => (
                    <div key={item.name} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xs font-bold text-muted-foreground w-5 text-right tabular-nums">
                            {idx + 1}
                          </span>
                          <span className="text-sm font-medium">{item.name}</span>
                        </div>
                        <span className="text-sm font-bold tabular-nums">
                          {item.quantity} sold
                        </span>
                      </div>
                      <div className="ml-7.5 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary/80 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top earning items */}
          <Card className="rounded-2xl border-border/50 shadow-warm-sm">
            <CardHeader className="pb-3 px-5 pt-5">
              <CardTitle className="text-sm font-semibold flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Trophy className="w-3.5 h-3.5 text-primary" />
                </div>
                Top Earning Items
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 px-5 pb-5">
              {metrics.topEarningItems.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No data yet</p>
              ) : (
                <div className="space-y-3.5">
                  {metrics.topEarningItems.map((item, idx) => (
                    <div key={item.name} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xs font-bold text-muted-foreground w-5 text-right tabular-nums">
                            {idx + 1}
                          </span>
                          <span className="text-sm font-medium">{item.name}</span>
                        </div>
                        <span className="text-sm font-bold tabular-nums text-primary">
                          {formatPrice(item.revenue, currency)}
                        </span>
                      </div>
                      <div className="ml-7.5 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary/80 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* By source */}
          <Card className="rounded-2xl border-border/50 shadow-warm-sm">
            <CardHeader className="pb-3 px-5 pt-5">
              <CardTitle className="text-sm font-semibold flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Tag className="w-3.5 h-3.5 text-primary" />
                </div>
                Orders By Source
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 px-5 pb-5">
              {metrics.bySource.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No data yet</p>
              ) : (
                <div className="space-y-3.5">
                  {metrics.bySource.map((item) => {
                    const pct = metrics.totalOrders > 0 ? (item.count / metrics.totalOrders) * 100 : 0;
                    return (
                      <div key={item.source} className="space-y-1.5">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm gap-0.5 sm:gap-0">
                          <span className="font-medium">{item.source}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground tabular-nums">
                              {item.count} orders ({pct.toFixed(0)}%)
                            </span>
                            <span className="text-xs font-bold text-primary tabular-nums">
                              {formatPrice(item.revenue, currency)}
                            </span>
                          </div>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary/80 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* By category — expandable */}
          <Card className="rounded-2xl border-border/50 shadow-warm-sm">
            <CardHeader className="pb-3 px-5 pt-5">
              <CardTitle className="text-sm font-semibold flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Layers className="w-3.5 h-3.5 text-primary" />
                </div>
                Orders By Category
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 px-5 pb-5">
              {metrics.byCategory.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No data yet</p>
              ) : (
                <div className="space-y-3">
                  {metrics.byCategory.map((cat) => {
                    const isExpanded = expandedCategories.has(cat.category);
                    const revPct = metrics.totalRevenue > 0 ? (cat.totalRevenue / metrics.totalRevenue) * 100 : 0;
                    return (
                      <div
                        key={cat.category}
                        className="rounded-xl border border-border/50 bg-muted/30 overflow-hidden"
                      >
                        <button
                          onClick={() => toggleCategory(cat.category)}
                          className="w-full p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between hover:bg-muted/50 transition-colors duration-150 text-left gap-1 sm:gap-0"
                        >
                          <div className="flex items-center gap-2">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                            )}
                            <p className="text-sm font-semibold">{cat.category}</p>
                          </div>
                          <div className="flex items-center gap-3 ml-6 sm:ml-0">
                            <span className="text-xs text-muted-foreground tabular-nums">
                              {cat.totalQuantity} sold
                            </span>
                            <span className="text-sm font-bold text-primary tabular-nums">
                              {formatPrice(cat.totalRevenue, currency)}
                            </span>
                          </div>
                        </button>

                        <div className="px-3.5 pb-2.5">
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary/50 rounded-full transition-all duration-500 ease-out"
                              style={{ width: `${revPct}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1 tabular-nums">
                            {revPct.toFixed(1)}% of revenue
                          </p>
                        </div>

                        {isExpanded && (
                          <div className="border-t border-border/50 px-3.5 py-3 space-y-2.5 bg-background/50">
                            {cat.items.map((item) => (
                              <div key={item.name} className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-foreground">{item.name}</span>
                                  <span className="font-medium tabular-nums">{item.quantity}</span>
                                </div>
                                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary/40 rounded-full transition-all duration-500 ease-out"
                                    style={{ width: `${item.percentage}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

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
      <h1 className="text-2xl font-bold tracking-tight mb-5">Reports</h1>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-5 w-full sm:w-auto rounded-xl">
          <TabsTrigger value="all" className="rounded-lg">All Time</TabsTrigger>
          <TabsTrigger value="monthly" className="rounded-lg">Monthly</TabsTrigger>
          <TabsTrigger value="weekly" className="rounded-lg">Weekly</TabsTrigger>
          <TabsTrigger value="daily" className="rounded-lg">Daily</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <ReportContent range="all" />
        </TabsContent>
        <TabsContent value="monthly">
          <ReportContent range="monthly" />
        </TabsContent>
        <TabsContent value="weekly">
          <ReportContent range="weekly" />
        </TabsContent>
        <TabsContent value="daily">
          <ReportContent range="daily" />
        </TabsContent>
      </Tabs>
    </div>
    </PullToRefresh>
  );
}
