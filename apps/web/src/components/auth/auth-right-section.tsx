import {
  Package,
  Users,
  TruckIcon,
  Shield,
  BarChart3,
  Clock,
} from "lucide-react";

export function AuthRightSection() {
  return (
    <div className="hidden lg:flex flex-1 items-center justify-center p-12 relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-chart-1/80 dark:from-primary/80 dark:via-primary/70 dark:to-chart-1/60">
      {/* Animated Background Patterns */}
      <div className="absolute inset-0">
        {/* Animated Circles - Using theme colors */}
        <div className="absolute top-20 left-20 h-72 w-72 rounded-full bg-primary-foreground/10 dark:bg-primary-foreground/5 blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 h-96 w-96 rounded-full bg-chart-2/20 dark:bg-chart-2/10 blur-3xl animate-pulse delay-700" />
        <div className="absolute top-1/2 left-1/2 h-80 w-80 rounded-full bg-primary-foreground/5 dark:bg-primary-foreground/3 blur-3xl animate-pulse delay-1000" />

        {/* Diagonal Lines Pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 60px,
              hsl(var(--primary-foreground)) 60px,
              hsl(var(--primary-foreground)) 61px
            )`,
          }}
        />

        {/* Dots Pattern */}
        <div
          className="absolute inset-0 opacity-[0.015] dark:opacity-[0.01]"
          style={{
            backgroundImage: `radial-gradient(circle, hsl(var(--primary-foreground)) 1.5px, transparent 1.5px)`,
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      {/* Content Container */}
      <div className="relative z-10 max-w-xl text-primary-foreground space-y-10">
        {/* Logo & Brand */}
        <div className="space-y-6">
          <div className="space-y-3">
            <h2 className="text-5xl font-bold tracking-tight">
              <span className="text-primary-foreground drop-shadow-lg">
                Logicorp
              </span>
              <span className="text-primary-foreground/90 drop-shadow-lg">
                TMS
              </span>
            </h2>
            <div className="h-1 w-24 bg-gradient-to-r from-primary-foreground via-primary-foreground/60 to-transparent rounded-full shadow-lg" />
            <p className="text-xl text-primary-foreground/90 font-light tracking-wide">
              Transportation Management System
            </p>
          </div>
        </div>

        {/* Value Proposition */}
        <div className="space-y-4">
          <p className="text-lg text-primary-foreground/80 leading-relaxed">
            Streamline your freight operations with our comprehensive TMS
            platform. Manage loads, carriers, and customers with powerful tools
            designed for modern logistics.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-2 gap-4 pt-4">
          <div className="group bg-primary-foreground/10 backdrop-blur-md rounded-xl p-5 border border-primary-foreground/10 hover:bg-primary-foreground/15 hover:border-primary-foreground/20 transition-all duration-300">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary-foreground/20 to-primary-foreground/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Package className="h-6 w-6 text-primary-foreground" />
            </div>
            <h3 className="font-semibold text-base mb-1 text-primary-foreground">
              Load Management
            </h3>
            <p className="text-sm text-primary-foreground/70">
              Track shipments in real-time
            </p>
          </div>

          <div className="group bg-primary-foreground/10 backdrop-blur-md rounded-xl p-5 border border-primary-foreground/10 hover:bg-primary-foreground/15 hover:border-primary-foreground/20 transition-all duration-300">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary-foreground/20 to-primary-foreground/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Users className="h-6 w-6 text-primary-foreground" />
            </div>
            <h3 className="font-semibold text-base mb-1 text-primary-foreground">
              Carrier Network
            </h3>
            <p className="text-sm text-primary-foreground/70">
              Build trusted partnerships
            </p>
          </div>

          <div className="group bg-primary-foreground/10 backdrop-blur-md rounded-xl p-5 border border-primary-foreground/10 hover:bg-primary-foreground/15 hover:border-primary-foreground/20 transition-all duration-300">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary-foreground/20 to-primary-foreground/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <h3 className="font-semibold text-base mb-1 text-primary-foreground">
              Secure Platform
            </h3>
            <p className="text-sm text-primary-foreground/70">
              Multi-tenant isolation
            </p>
          </div>

          <div className="group bg-primary-foreground/10 backdrop-blur-md rounded-xl p-5 border border-primary-foreground/10 hover:bg-primary-foreground/15 hover:border-primary-foreground/20 transition-all duration-300">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary-foreground/20 to-primary-foreground/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <BarChart3 className="h-6 w-6 text-primary-foreground" />
            </div>
            <h3 className="font-semibold text-base mb-1 text-primary-foreground">
              Analytics
            </h3>
            <p className="text-sm text-primary-foreground/70">
              Data-driven insights
            </p>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center gap-6 pt-6 border-t border-primary-foreground/10">
          <div className="flex items-center gap-3 group">
            <div className="h-14 w-14 rounded-xl bg-primary-foreground/10 backdrop-blur-md flex items-center justify-center border border-primary-foreground/20 group-hover:scale-105 transition-transform">
              <TruckIcon className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <div className="text-2xl font-bold text-primary-foreground">
                10K+
              </div>
              <div className="text-sm text-primary-foreground/70">
                Loads Delivered
              </div>
            </div>
          </div>

          <div className="h-12 w-px bg-primary-foreground/20" />

          <div className="flex items-center gap-3 group">
            <div className="h-14 w-14 rounded-xl bg-primary-foreground/10 backdrop-blur-md flex items-center justify-center border border-primary-foreground/20 group-hover:scale-105 transition-transform">
              <Clock className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <div className="text-2xl font-bold text-primary-foreground">
                99.9%
              </div>
              <div className="text-sm text-primary-foreground/70">Uptime</div>
            </div>
          </div>
        </div>

        {/* Trust Badge */}
        <div className="pt-4">
          <div className="inline-flex items-center gap-2 bg-primary-foreground/10 backdrop-blur-md px-5 py-2.5 rounded-full border border-primary-foreground/20 hover:bg-primary-foreground/15 transition-colors">
            <Shield className="h-4 w-4 text-primary-foreground" />
            <span className="text-sm font-medium text-primary-foreground">
              Enterprise-Grade Security
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
