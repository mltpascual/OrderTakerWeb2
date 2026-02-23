/*
 * Design: Warm Craft — Premium Food-Tech Aesthetic
 * Layout: Floating sidebar on desktop, elevated bottom bar on mobile
 * Amber-orange accent, Plus Jakarta Sans, warm shadows
 */
import { type ReactNode, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  Plus,
  ClipboardList,
  UtensilsCrossed,
  BarChart3,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings } from "@/hooks/useSettings";
import { useTheme } from "@/contexts/ThemeContext";

interface MainLayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: "/", label: "New Order", icon: Plus },
  { path: "/pipeline", label: "Pipeline", icon: ClipboardList },
  { path: "/menu", label: "Menu", icon: UtensilsCrossed },
  { path: "/reports", label: "Reports", icon: BarChart3 },
  { path: "/settings", label: "Settings", icon: Settings },
];

// Accent color presets — must match SettingsPage.tsx
const ACCENT_PRESETS: Record<string, { lightOklch: string; darkOklch: string }> = {
  Amber: { lightOklch: "oklch(0.62 0.17 52)", darkOklch: "oklch(0.72 0.16 52)" },
  Teal: { lightOklch: "oklch(0.55 0.15 170)", darkOklch: "oklch(0.65 0.15 170)" },
  Blue: { lightOklch: "oklch(0.55 0.18 260)", darkOklch: "oklch(0.65 0.18 260)" },
  Violet: { lightOklch: "oklch(0.50 0.20 290)", darkOklch: "oklch(0.60 0.20 290)" },
  Rose: { lightOklch: "oklch(0.55 0.22 15)", darkOklch: "oklch(0.65 0.20 15)" },
  Orange: { lightOklch: "oklch(0.58 0.20 50)", darkOklch: "oklch(0.68 0.18 50)" },
  Emerald: { lightOklch: "oklch(0.55 0.15 155)", darkOklch: "oklch(0.65 0.15 155)" },
  Indigo: { lightOklch: "oklch(0.50 0.20 275)", darkOklch: "oklch(0.60 0.20 275)" },
  Pink: { lightOklch: "oklch(0.55 0.22 350)", darkOklch: "oklch(0.65 0.20 350)" },
  Slate: { lightOklch: "oklch(0.45 0.02 260)", darkOklch: "oklch(0.60 0.02 260)" },
};

export default function MainLayout({ children }: MainLayoutProps) {
  const [location] = useLocation();
  const { settings } = useSettings();
  const { theme } = useTheme();

  // Apply accent color from settings on mount and when theme/settings change
  useEffect(() => {
    const colorName = settings.accentColor || "Amber";
    const preset = ACCENT_PRESETS[colorName];
    if (!preset) return;

    const isDark = theme === "dark";
    const oklch = isDark ? preset.darkOklch : preset.lightOklch;
    const root = document.documentElement;
    root.style.setProperty("--primary", oklch);
    root.style.setProperty("--ring", oklch);
    root.style.setProperty("--sidebar-primary", oklch);
    root.style.setProperty("--sidebar-ring", oklch);
  }, [settings.accentColor, theme]);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Desktop floating sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-[15rem] fixed inset-y-3 left-3 z-30 rounded-2xl bg-card shadow-warm-lg border border-border/60 overflow-hidden">
        {/* Logo area */}
        <div className="p-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <UtensilsCrossed className="w-[1.125rem] h-[1.125rem] text-primary" />
            </div>
            <div>
              <span className="font-bold text-[0.9375rem] tracking-tight text-foreground">Order Taker</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-0.5">
          {navItems.map((item) => {
            const isActive = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[0.8125rem] font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-warm-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <item.icon className={cn("w-[1.125rem] h-[1.125rem]", isActive && "text-primary-foreground")} />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="p-4 mt-auto">
          <div className="rounded-xl bg-muted/60 px-3.5 py-3">
            <p className="text-[0.6875rem] font-medium text-muted-foreground">Order Taker</p>
            <p className="text-[0.625rem] text-muted-foreground/70 mt-0.5">v2.0 — Warm Craft</p>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 lg:ml-[16.5rem] pb-24 lg:pb-0">
        <div className="p-4 lg:p-8 max-w-6xl mx-auto animate-fade-in">{children}</div>
      </main>

      {/* Mobile floating bottom tab bar */}
      <nav className="lg:hidden fixed bottom-3 inset-x-3 bg-card/95 backdrop-blur-lg border border-border/60 z-30 rounded-2xl shadow-warm-lg safe-area-bottom">
        <div className="flex items-center justify-around h-[4.25rem]">
          {navItems.map((item) => {
            const isActive = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <div
                  className={cn(
                    "flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 relative",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground active:scale-95"
                  )}
                >
                  <div className={cn(
                    "p-1.5 rounded-xl transition-all duration-200",
                    isActive && "bg-primary/10"
                  )}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="text-[0.625rem] font-semibold">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
