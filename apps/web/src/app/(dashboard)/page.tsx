import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-8 space-y-8">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Welcome back, {session.user?.name?.split(" ")[0]}! 👋
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's what's happening with your transportation operations today.
            </p>
          </div>
          <Badge className="bg-success text-success-foreground shadow-sm">
            Phase 1 Complete
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="pb-2">
              <CardDescription>Organization</CardDescription>
              <CardTitle className="text-2xl">
                {session.organizationName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Active and ready</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-chart-1">
            <CardHeader className="pb-2">
              <CardDescription>Active Loads</CardDescription>
              <CardTitle className="text-2xl">0</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-success">Ready to create loads</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-chart-2">
            <CardHeader className="pb-2">
              <CardDescription>Total Carriers</CardDescription>
              <CardTitle className="text-2xl">0</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">No carriers yet</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-chart-3">
            <CardHeader className="pb-2">
              <CardDescription>Revenue (MTD)</CardDescription>
              <CardTitle className="text-2xl">$0.00</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Feature Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-xl">🚛</span>
                </div>
                <CardTitle>Load Management</CardTitle>
              </div>
              <CardDescription>Create and manage shipments</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Create First Load</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-chart-2/10 flex items-center justify-center">
                  <span className="text-xl">👥</span>
                </div>
                <CardTitle>Carrier Network</CardTitle>
              </div>
              <CardDescription>Build your carrier database</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Add Carriers
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-chart-3/10 flex items-center justify-center">
                  <span className="text-xl">🏢</span>
                </div>
                <CardTitle>Customer Base</CardTitle>
              </div>
              <CardDescription>Manage your customers</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Add Customers
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Status Banner */}
        <Card className="bg-gradient-to-r from-primary/10 via-chart-1/10 to-chart-2/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">🎉</span>
              Phase 1 Complete - Foundation Ready!
            </CardTitle>
            <CardDescription className="text-base">
              Your TMS platform is fully set up with:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="bg-success/10 text-success border-success/20"
                >
                  ✓
                </Badge>
                <span className="text-sm">Multi-tenant architecture</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="bg-success/10 text-success border-success/20"
                >
                  ✓
                </Badge>
                <span className="text-sm">Authentication system</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="bg-success/10 text-success border-success/20"
                >
                  ✓
                </Badge>
                <span className="text-sm">Modern UI components</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="bg-success/10 text-success border-success/20"
                >
                  ✓
                </Badge>
                <span className="text-sm">Database schema</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="bg-success/10 text-success border-success/20"
                >
                  ✓
                </Badge>
                <span className="text-sm">API endpoints</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="bg-success/10 text-success border-success/20"
                >
                  ✓
                </Badge>
                <span className="text-sm">Type-safe TypeScript</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
