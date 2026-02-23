/*
 * Design: Swiss Utility — Functional Minimalism
 * Layout: Fixed left sidebar on desktop, bottom tab bar on mobile
 * Teal accent for active nav items, charcoal for inactive
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
  Teal: { lightOklch: "oklch(0.55 0.15 170)", darkOklch: "oklch(0.65 0.15 170)" },
  Blue: { lightOklch: "oklch(0.55 0.18 260)", darkOklch: "oklch(0.65 0.18 260)" },
  Violet: { lightOklch: "oklch(0.50 0.20 290)", darkOklch: "oklch(0.60 0.20 290)" },
  Rose: { lightOklch: "oklch(0.55 0.22 15)", darkOklch: "oklch(0.65 0.20 15)" },
  Orange: { lightOklch: "oklch(0.58 0.20 50)", darkOklch: "oklch(0.68 0.18 50)" },
  Amber: { lightOklch: "oklch(0.60 0.18 75)", darkOklch: "oklch(0.70 0.16 75)" },
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
    const colorName = settings.accentColor || "Teal";
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
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-56 border-r border-border bg-card fixed inset-y-0 left-0 z-30">
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <UtensilsCrossed className="w-4.5 h-4.5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-base tracking-tight">Order Taker</span>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-150",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <item.icon className="w-4.5 h-4.5" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content area */}
      <main className="flex-1 lg:ml-56 pb-20 lg:pb-0">
        <div className="p-4 lg:p-6 max-w-6xl mx-auto">{children}</div>
      </main>

      {/* Mobile bottom tab bar */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-card border-t border-border z-30 safe-area-bottom">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const isActive = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <div
                  className={cn(
                    "flex flex-col items-center gap-1 px-3 py-1.5 rounded-md transition-colors duration-150",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
