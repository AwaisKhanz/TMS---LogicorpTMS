"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Truck,
  Users,
  Building2,
  Bell,
  Settings,
  HelpCircle,
  LogOut,
  Package,
  MapPin,
  Receipt,
} from "lucide-react";
import { Logo } from "@/components/common/logo";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/auth-context";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { PERMISSIONS, type Permission } from "@tms/shared-types";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  permission?: Permission;
}

const mainNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Loads",
    href: "/loads",
    icon: Truck,
    permission: PERMISSIONS.LOAD_VIEW_ALL, // Can view loads with either view:all or view:own
  },
  {
    title: "Carriers",
    href: "/carriers",
    icon: Users,
    permission: PERMISSIONS.CARRIER_VIEW,
  },
  {
    title: "Customers",
    href: "/customers",
    icon: Building2,
    permission: PERMISSIONS.CUSTOMER_VIEW,
  },
  {
    title: "Shippers",
    href: "/shippers",
    icon: Package,
    permission: PERMISSIONS.CUSTOMER_VIEW, // Using customer permissions for now
  },
  {
    title: "Consignees",
    href: "/consignees",
    icon: MapPin,
    permission: PERMISSIONS.CUSTOMER_VIEW, // Using customer permissions for now
  },
  {
    title: "Invoices",
    href: "/invoices",
    icon: Receipt,
    permission: PERMISSIONS.INVOICE_VIEW,
  },
  {
    title: "Notifications",
    href: "/notifications",
    icon: Bell,
  },
  {
    title: "Team",
    href: "/team",
    icon: Users,
    permission: PERMISSIONS.USER_VIEW,
  },
];

const bottomNavItems: NavItem[] = [
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    permission: PERMISSIONS.SETTINGS_VIEW,
  },
  {
    title: "Help & Support",
    href: "/help",
    icon: HelpCircle,
  },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();

  // Professional expand button state
  const [showExpandButton, setShowExpandButton] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Professional hover handlers
  const handleMouseEnter = () => {
    if (isCollapsed) {
      setShowExpandButton(true);
    }
  };

  const handleMouseLeave = () => {
    setShowExpandButton(false);
  };

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = pathname === item.href;
    const Icon = item.icon;

    const linkContent = (
      <Link
        href={item.href}
        className={cn(
          "flex items-center rounded-lg text-sm transition-all duration-200 group",
          "hover:bg-accent/80 hover:text-accent-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          isCollapsed
            ? "justify-center px-3 py-3 w-full" // Centered for collapsed state
            : "gap-3 px-3 py-2.5", // Normal spacing for expanded state
          isActive
            ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Icon
          className={cn(
            "h-4 w-4 flex-shrink-0 transition-colors",
            isActive
              ? "text-primary-foreground"
              : "text-muted-foreground group-hover:text-foreground"
          )}
        />
        {!isCollapsed && (
          <span className="truncate font-medium">{item.title}</span>
        )}
        {!isCollapsed && item.badge && (
          <span className="ml-auto rounded-full bg-primary/10 text-primary px-2 py-1 text-xs font-medium">
            {item.badge}
          </span>
        )}
      </Link>
    );

    // If item has permission requirement, wrap with PermissionGuard
    if (item.permission) {
      const guardedContent = (
        <PermissionGuard permission={item.permission}>
          {isCollapsed ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                <TooltipContent side="right">{item.title}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            linkContent
          )}
        </PermissionGuard>
      );
      return guardedContent;
    }

    // No permission required, render normally
    if (isCollapsed) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
            <TooltipContent side="right">{item.title}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return linkContent;
  };

  return (
    <div
      ref={sidebarRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "relative flex h-full flex-col border-r bg-card/95 backdrop-blur-sm transition-all duration-300 shadow-lg",
        // Mobile responsive widths
        isCollapsed ? "w-16 md:w-16" : "w-72 md:w-64"
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          {!isCollapsed && <Logo size="sm" showText={true} href="/" />}
          {isCollapsed && <Logo size="sm" showText={false} href="/" />}
        </div>

        {/* Toggle Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className={cn(
            "h-8 w-8 p-0 transition-all duration-200 hover:bg-accent/50",
            isCollapsed
              ? "opacity-0 pointer-events-none" // Hide when collapsed
              : "ml-0"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        <div className={cn("space-y-1", isCollapsed ? "p-2" : "p-4")}>
          {/* Main Navigation */}
          <div className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 py-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Main
                </p>
              </div>
            )}
            <div className="space-y-1">
              {mainNavItems.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </div>
          </div>

          <Separator className="my-4 bg-border/50" />

          {/* Bottom Navigation */}
          <div className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 py-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Account
                </p>
              </div>
            )}
            <div className="space-y-1">
              {bottomNavItems.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* User Section */}
      <div
        className={cn(
          "border-t border-border/50 bg-card/30 backdrop-blur-sm",
          isCollapsed ? "p-2" : "p-4"
        )}
      >
        {isCollapsed ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 w-full p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex justify-center transition-all duration-200"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="right"
                className="bg-popover/95 backdrop-blur-sm"
              >
                Sign Out
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200 h-10"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            <span className="font-medium">Sign Out</span>
          </Button>
        )}
      </div>

      {/* Professional expand button - appears on hover when collapsed */}
      {isCollapsed && showExpandButton && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-50 hidden md:block">
          <Button
            variant="default"
            size="sm"
            onClick={onToggle}
            className="h-9 w-9 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 bg-primary hover:bg-primary/90 border-2 border-background"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
