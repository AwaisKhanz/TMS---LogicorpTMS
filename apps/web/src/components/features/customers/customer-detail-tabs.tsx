"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Building2,
  Users,
  Package,
  FileText,
  TrendingUp,
  File,
  Activity,
  MapPin,
  Mail,
  Phone,
  Loader2,
} from "lucide-react";
import type { Customer } from "@tms/shared-types";
import { useCustomerContacts } from "@/hooks/use-customer";
import { CustomerContacts } from "./customer-contacts";
import { CustomerLoads } from "./customer-loads";
import { CustomerInvoices } from "./customer-invoices";
import { CustomerPerformance } from "./customer-performance";
import { CustomerActions } from "./customer-actions";

interface CustomerDetailTabsProps {
  customer: Customer;
}

export function CustomerDetailTabs({ customer }: CustomerDetailTabsProps) {
  const [activeTab, setActiveTab] = useState("overview");

  const { isLoading: contactsLoading } = useCustomerContacts(customer.id);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  const getCreditStatusColor = (percentage: number) => {
    if (percentage >= 90) return "destructive";
    if (percentage >= 75) return "warning";
    return "success";
  };

  const getCreditStatusText = (percentage: number) => {
    if (percentage >= 90) return "Critical";
    if (percentage >= 75) return "Warning";
    return "Good";
  };

  const creditPercentage =
    customer.creditLimit > 0
      ? (customer.creditUsed / customer.creditLimit) * 100
      : 0;

  return (
    <div className="space-y-6">
      {/* Customer Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">{customer.companyName}</h1>
                  <Badge variant={customer.isActive ? "default" : "secondary"}>
                    {customer.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                {customer.dba && (
                  <p className="text-muted-foreground">DBA: {customer.dba}</p>
                )}
                {customer.industry && (
                  <p className="text-sm text-muted-foreground">
                    {customer.industry}
                  </p>
                )}
              </div>
            </div>
            <CustomerActions customer={customer} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Contact Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`mailto:${customer.billingEmail}`}
                  className="text-primary hover:underline"
                >
                  {customer.billingEmail}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`tel:${customer.billingPhone}`}
                  className="text-primary hover:underline"
                >
                  {customer.billingPhone}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {customer.billingAddress.city},{" "}
                  {customer.billingAddress.state}
                </span>
              </div>
            </div>

            {/* Financial Info */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Credit Limit
                </span>
                <span className="font-medium">
                  {formatCurrency(customer.creditLimit)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Credit Used
                </span>
                <span className="font-medium">
                  {formatCurrency(customer.creditUsed)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Available</span>
                <span className="font-medium">
                  {formatCurrency(customer.creditLimit - customer.creditUsed)}
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Credit Status
                  </span>
                  <Badge variant={getCreditStatusColor(creditPercentage)}>
                    {getCreditStatusText(creditPercentage)}
                  </Badge>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      creditPercentage >= 90
                        ? "bg-destructive"
                        : creditPercentage >= 75
                          ? "bg-warning"
                          : "bg-success"
                    }`}
                    style={{ width: `${Math.min(creditPercentage, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Revenue
                </span>
                <span className="font-medium text-success">
                  {formatCurrency(customer.totalRevenue)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Loads
                </span>
                <span className="font-medium">{customer.totalLoads}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Avg Margin
                </span>
                <span className="font-medium">
                  {customer.averageMargin.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Payment Terms
                </span>
                <span className="font-medium">{customer.paymentTerms}</span>
              </div>
            </div>

            {/* Metadata */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="text-sm">
                  {formatDate(customer.createdAt)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Last Updated
                </span>
                <span className="text-sm">
                  {formatDate(customer.updatedAt)}
                </span>
              </div>
              {customer.website && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Website</span>
                  <a
                    href={customer.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    Visit Site
                  </a>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="contacts" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Contacts
          </TabsTrigger>
          <TabsTrigger value="loads" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Loads
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Invoices
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <File className="h-4 w-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Activity
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Company Information */}
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Company Name</p>
                  <p className="font-medium">{customer.companyName}</p>
                </div>
                {customer.dba && (
                  <div>
                    <p className="text-sm text-muted-foreground">DBA</p>
                    <p className="font-medium">{customer.dba}</p>
                  </div>
                )}
                {customer.industry && (
                  <div>
                    <p className="text-sm text-muted-foreground">Industry</p>
                    <p className="font-medium">{customer.industry}</p>
                  </div>
                )}
                {customer.website && (
                  <div>
                    <p className="text-sm text-muted-foreground">Website</p>
                    <a
                      href={customer.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {customer.website}
                    </a>
                  </div>
                )}
                {customer.ein && (
                  <div>
                    <p className="text-sm text-muted-foreground">EIN</p>
                    <p className="font-medium">{customer.ein}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Billing Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Billing Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-medium">
                    {customer.billingAddress.street}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {customer.billingAddress.city},{" "}
                    {customer.billingAddress.state}{" "}
                    {customer.billingAddress.zip}
                  </p>
                  {customer.billingAddress.country && (
                    <p className="text-sm text-muted-foreground">
                      {customer.billingAddress.country}
                    </p>
                  )}
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`mailto:${customer.billingEmail}`}
                      className="text-primary hover:underline"
                    >
                      {customer.billingEmail}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`tel:${customer.billingPhone}`}
                      className="text-primary hover:underline"
                    >
                      {customer.billingPhone}
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Information */}
            <Card>
              <CardHeader>
                <CardTitle>Financial Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Credit Limit
                    </p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(customer.creditLimit)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Payment Terms
                    </p>
                    <p className="font-medium">{customer.paymentTerms}</p>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Revenue
                    </p>
                    <p className="text-2xl font-bold text-success">
                      {formatCurrency(customer.totalRevenue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Loads</p>
                    <p className="text-2xl font-bold">{customer.totalLoads}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Equipment Preferences */}
            <Card>
              <CardHeader>
                <CardTitle>Equipment Preferences</CardTitle>
              </CardHeader>
              <CardContent>
                {customer.equipmentTypes &&
                customer.equipmentTypes.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {customer.equipmentTypes.map((equipment) => (
                      <Badge key={equipment} variant="secondary">
                        {equipment.replace(/_/g, " ")}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No equipment preferences set
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Notes */}
          {customer.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{customer.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts">
          {contactsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading contacts...</span>
            </div>
          ) : (
            <CustomerContacts customerId={customer.id} />
          )}
        </TabsContent>

        {/* Loads Tab */}
        <TabsContent value="loads">
          <CustomerLoads customerId={customer.id} />
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices">
          <CustomerInvoices customerId={customer.id} />
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance">
          <CustomerPerformance customerId={customer.id} />
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Customer Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Document management coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Activity tracking coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
