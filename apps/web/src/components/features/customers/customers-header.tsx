"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Plus,
  Upload,
  Building2,
  DollarSign,
  Users,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { CanCreate } from "@/components/auth/can";
import { useCustomerStatistics } from "@/hooks/use-customer";

export function CustomersHeader() {
  const { data: statsData, isLoading } = useCustomerStatistics();
  const stats = statsData?.data;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Customer Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your customer relationships and accounts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="hidden sm:flex">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <CanCreate resource="customer">
            <Button asChild variant="default">
              <Link href="/customers/new">
                <Plus className="h-4 w-4 mr-2" />
                Add Customer
              </Link>
            </Button>
          </CanCreate>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Customers
                </p>
                <p className="text-2xl font-bold">
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    stats?.total?.toLocaleString() || "0"
                  )}
                </p>
              </div>
              <Building2 className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Active Customers
                </p>
                <p className="text-2xl font-bold">
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    stats?.active?.toLocaleString() || "0"
                  )}
                </p>
              </div>
              <Users className="h-8 w-8 text-success/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Revenue
                </p>
                <p className="text-2xl font-bold">
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    formatCurrency(stats?.totalRevenue || 0)
                  )}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-warning/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-cyan-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Avg Revenue
                </p>
                <p className="text-2xl font-bold">
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    formatCurrency(stats?.avgRevenuePerCustomer || 0)
                  )}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-info/60" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
