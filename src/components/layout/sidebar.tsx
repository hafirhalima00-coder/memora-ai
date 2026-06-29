"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import {
  Brain,
  LayoutDashboard,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Timeline,
  Share2,
  BarChart3,
  Menu,
  X,
  ChevronLeft,
  History,
  Settings,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/memories", label: "Memories", icon: FileText },
  { href: "/conflicts", label: "Conflicts", icon: AlertTriangle },
  { href: "/verification", label: "Verification", icon: CheckCircle2 },
  { href: "/timeline", label: "Timeline", icon: Timeline },
  { href: "/graph", label: "Memory Graph", icon: Share2 },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

const secondaryNavItems = [
  { href: "/audit", label: "Audit Log", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-3 z-50 md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full flex-col border-r border-zinc-200 bg-white transition-all duration-300 dark:border-zinc-800 dark:bg-zinc-950",
          collapsed ? "w-16" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className={cn(
          "flex h-16 items-center border-b border-zinc-200 px-4 dark:border-zinc-800",
          collapsed ? "justify-center" : "justify-between"
        )}>
          <Link href="/" className={cn("flex items-center gap-2", collapsed && "justify-center")}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600">
              <Brain className="h-5 w-5 text-white" />
            </div>
            {!collapsed && (
              <div>
                <span className="font-bold text-zinc-900 dark:text-zinc-50">
                  Memora AI
                </span>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-tight">
                  A memory that knows it might be wrong
                </p>
              </div>
            )}
          </Link>
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(true)}
              className="hidden md:flex h-6 w-6 rounded-full"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
                  collapsed && "justify-center px-2"
                )}
              >
                <Icon className={cn("h-5 w-5 flex-shrink-0", isActive ? "text-violet-600 dark:text-violet-400" : "")} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Secondary Navigation */}
        <div className="px-3 pb-2">
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-2 space-y-1">
            {secondaryNavItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300"
                      : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-300",
                    collapsed && "justify-center px-2"
                  )}
                >
                  <Icon className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-violet-600 dark:text-violet-400" : "")} />
                  {!collapsed && <span className="text-xs">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Bottom section */}
        <div className={cn(
          "border-t border-zinc-200 p-3 dark:border-zinc-800",
          collapsed && "flex justify-center"
        )}>
          {!collapsed && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400 dark:text-zinc-500">
                v1.0.0
              </span>
              <ThemeToggle />
            </div>
          )}
          {collapsed && <ThemeToggle />}
        </div>
      </aside>

      {/* Expand button when collapsed */}
      {collapsed && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(false)}
          className="fixed left-[60px] top-[60px] z-50 hidden h-6 w-6 rounded-full border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900 md:flex"
          aria-label="Expand sidebar"
        >
          <ChevronLeft className="h-3 w-3 rotate-180" />
        </Button>
      )}
    </>
  );
}
