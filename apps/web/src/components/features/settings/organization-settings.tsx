"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useOrganizationSettings,
  useUpdateOrganization,
  useUpdateBusinessSettings,
  useUpdateDocumentNumbering,
  useTeamMembers,
  useInviteTeamMember,
  useRemoveTeamMember,
} from "@/hooks/use-settings";
import {
  Building,
  Users,
  Settings,
  FileText,
  Plus,
  Trash2,
} from "lucide-react";

const organizationSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  mcNumber: z.string().min(1, "MC Number is required"),
  dotNumber: z.string().min(1, "DOT Number is required"),
  billingEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.object({
    street: z.string().min(1, "Street address is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    zip: z.string().min(1, "ZIP code is required"),
    country: z.string().min(1, "Country is required"),
  }),
});

const businessSettingsSchema = z.object({
  timezone: z.string().min(1, "Timezone is required"),
  currency: z.string().min(1, "Currency is required"),
  dateFormat: z.string().min(1, "Date format is required"),
  fuelSurchargeRate: z.number().min(0, "Fuel surcharge rate must be positive"),
  defaultLoadMargin: z.number().min(0, "Default load margin must be positive"),
  requireApprovalForLoads: z.boolean(),
  allowCarrierSelfDispatch: z.boolean(),
});

const documentNumberingSchema = z.object({
  loadNumberPrefix: z.string().min(1, "Load number prefix is required"),
  loadNumberStart: z.number().min(1, "Load number start must be positive"),
  invoiceNumberPrefix: z.string().min(1, "Invoice number prefix is required"),
  invoiceNumberStart: z
    .number()
    .min(1, "Invoice number start must be positive"),
  autoIncrement: z.boolean(),
});

const inviteTeamMemberSchema = z.object({
  email: z.string().email("Invalid email"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  roleIds: z.array(z.string()).min(1, "At least one role must be selected"),
});

const timezones = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Phoenix", label: "Arizona Time (MST)" },
  { value: "America/Anchorage", label: "Alaska Time (AKST)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HST)" },
];

const currencies = [
  { value: "USD", label: "US Dollar ($)" },
  { value: "CAD", label: "Canadian Dollar (C$)" },
  { value: "EUR", label: "Euro (€)" },
  { value: "GBP", label: "British Pound (£)" },
];

const dateFormats = [
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
];

const roles = [
  {
    id: "admin",
    name: "Administrator",
    description: "Full access to all features",
  },
  { id: "manager", name: "Manager", description: "Manage loads and carriers" },
  {
    id: "dispatcher",
    name: "Dispatcher",
    description: "Create and manage loads",
  },
  { id: "viewer", name: "Viewer", description: "View-only access" },
];

export function OrganizationSettings() {
  const { data: organization, isLoading } = useOrganizationSettings();
  const { data: teamMembers } = useTeamMembers();
  const updateOrganization = useUpdateOrganization();
  const updateBusinessSettings = useUpdateBusinessSettings();
  const updateDocumentNumbering = useUpdateDocumentNumbering();
  const inviteTeamMember = useInviteTeamMember();
  const removeTeamMember = useRemoveTeamMember();

  const [isEditingOrg, setIsEditingOrg] = useState(false);
  const [isEditingBusiness, setIsEditingBusiness] = useState(false);
  const [isEditingNumbering, setIsEditingNumbering] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

  const organizationForm = useForm<z.infer<typeof organizationSchema>>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: organization?.name || "",
      website: organization?.website || "",
      mcNumber: organization?.mcNumber || "",
      dotNumber: organization?.dotNumber || "",
      billingEmail: organization?.billingEmail || "",
      address: {
        street: organization?.address?.street || "",
        city: organization?.address?.city || "",
        state: organization?.address?.state || "",
        zip: organization?.address?.zip || "",
        country: organization?.address?.country || "US",
      },
    },
  });

  const businessForm = useForm<z.infer<typeof businessSettingsSchema>>({
    resolver: zodResolver(businessSettingsSchema),
    defaultValues: {
      timezone: organization?.businessSettings?.timezone || "America/New_York",
      currency: organization?.businessSettings?.currency || "USD",
      dateFormat: organization?.businessSettings?.dateFormat || "MM/DD/YYYY",
      fuelSurchargeRate: organization?.businessSettings?.fuelSurchargeRate || 0,
      defaultLoadMargin: organization?.businessSettings?.defaultLoadMargin || 0,
      requireApprovalForLoads:
        organization?.businessSettings?.requireApprovalForLoads || false,
      allowCarrierSelfDispatch:
        organization?.businessSettings?.allowCarrierSelfDispatch || false,
    },
  });

  const numberingForm = useForm<z.infer<typeof documentNumberingSchema>>({
    resolver: zodResolver(documentNumberingSchema),
    defaultValues: {
      loadNumberPrefix:
        organization?.documentNumbering?.loadNumberPrefix || "LD",
      loadNumberStart: organization?.documentNumbering?.loadNumberStart || 1000,
      invoiceNumberPrefix:
        organization?.documentNumbering?.invoiceNumberPrefix || "INV",
      invoiceNumberStart:
        organization?.documentNumbering?.invoiceNumberStart || 1000,
      autoIncrement: organization?.documentNumbering?.autoIncrement || true,
    },
  });

  const inviteForm = useForm<z.infer<typeof inviteTeamMemberSchema>>({
    resolver: zodResolver(inviteTeamMemberSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      roleIds: [],
    },
  });

  // Update forms when organization data loads
  React.useEffect(() => {
    if (organization) {
      organizationForm.reset({
        name: organization.name,
        website: organization.website || "",
        mcNumber: organization.mcNumber,
        dotNumber: organization.dotNumber,
        billingEmail: organization.billingEmail || "",
        address: organization.address,
      });
      businessForm.reset({
        timezone: organization.businessSettings.timezone,
        currency: organization.businessSettings.currency,
        dateFormat: organization.businessSettings.dateFormat,
        fuelSurchargeRate: organization.businessSettings.fuelSurchargeRate,
        defaultLoadMargin: organization.businessSettings.defaultLoadMargin,
        requireApprovalForLoads:
          organization.businessSettings.requireApprovalForLoads,
        allowCarrierSelfDispatch:
          organization.businessSettings.allowCarrierSelfDispatch,
      });
      numberingForm.reset({
        loadNumberPrefix: organization.documentNumbering.loadNumberPrefix,
        loadNumberStart: organization.documentNumbering.loadNumberStart,
        invoiceNumberPrefix: organization.documentNumbering.invoiceNumberPrefix,
        invoiceNumberStart: organization.documentNumbering.invoiceNumberStart,
        autoIncrement: organization.documentNumbering.autoIncrement,
      });
    }
  }, [organization, organizationForm, businessForm, numberingForm]);

  const onOrganizationSubmit = async (
    data: z.infer<typeof organizationSchema>
  ) => {
    try {
      await updateOrganization.mutateAsync(data);
      setIsEditingOrg(false);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const onBusinessSubmit = async (
    data: z.infer<typeof businessSettingsSchema>
  ) => {
    try {
      await updateBusinessSettings.mutateAsync(data);
      setIsEditingBusiness(false);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const onNumberingSubmit = async (
    data: z.infer<typeof documentNumberingSchema>
  ) => {
    try {
      await updateDocumentNumbering.mutateAsync(data);
      setIsEditingNumbering(false);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const onInviteSubmit = async (
    data: z.infer<typeof inviteTeamMemberSchema>
  ) => {
    try {
      await inviteTeamMember.mutateAsync(data);
      setIsInviteDialogOpen(false);
      inviteForm.reset();
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (confirm("Are you sure you want to remove this team member?")) {
      try {
        await removeTeamMember.mutateAsync(memberId);
      } catch (error) {
        // Error is handled by the hook
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Organization Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Organization Information
          </CardTitle>
          <CardDescription>
            Manage your organization details and contact information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...organizationForm}>
            <form
              onSubmit={organizationForm.handleSubmit(onOrganizationSubmit)}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={organizationForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Name</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!isEditingOrg} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={organizationForm.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={!isEditingOrg}
                          placeholder="https://example.com"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={organizationForm.control}
                  name="mcNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>MC Number</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={!isEditingOrg}
                          placeholder="MC-123456"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={organizationForm.control}
                  name="dotNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>DOT Number</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={!isEditingOrg}
                          placeholder="DOT-123456"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={organizationForm.control}
                name="billingEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Billing Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={!isEditingOrg}
                        placeholder="billing@company.com"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Address</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={organizationForm.control}
                    name="address.street"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Street Address</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={!isEditingOrg} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={organizationForm.control}
                    name="address.city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={!isEditingOrg} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={organizationForm.control}
                    name="address.state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={!isEditingOrg} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={organizationForm.control}
                    name="address.zip"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP Code</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={!isEditingOrg} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={organizationForm.control}
                    name="address.country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={!isEditingOrg} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                {!isEditingOrg ? (
                  <Button type="button" onClick={() => setIsEditingOrg(true)}>
                    Edit Organization
                  </Button>
                ) : (
                  <>
                    <Button
                      type="submit"
                      disabled={updateOrganization.isPending}
                    >
                      {updateOrganization.isPending
                        ? "Saving..."
                        : "Save Changes"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditingOrg(false);
                        organizationForm.reset();
                      }}
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Business Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Business Settings
          </CardTitle>
          <CardDescription>
            Configure your business preferences and defaults
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...businessForm}>
            <form
              onSubmit={businessForm.handleSubmit(onBusinessSubmit)}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={businessForm.control}
                  name="timezone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timezone</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={!isEditingBusiness}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select timezone" />
                          </SelectTrigger>
                          <SelectContent>
                            {timezones.map((tz) => (
                              <SelectItem key={tz.value} value={tz.value}>
                                {tz.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={businessForm.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={!isEditingBusiness}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                          <SelectContent>
                            {currencies.map((currency) => (
                              <SelectItem
                                key={currency.value}
                                value={currency.value}
                              >
                                {currency.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={businessForm.control}
                  name="dateFormat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date Format</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={!isEditingBusiness}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select date format" />
                          </SelectTrigger>
                          <SelectContent>
                            {dateFormats.map((format) => (
                              <SelectItem
                                key={format.value}
                                value={format.value}
                              >
                                {format.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={businessForm.control}
                  name="fuelSurchargeRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fuel Surcharge Rate (%)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          disabled={!isEditingBusiness}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={businessForm.control}
                  name="defaultLoadMargin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Load Margin (%)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          disabled={!isEditingBusiness}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <FormField
                  control={businessForm.control}
                  name="requireApprovalForLoads"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <FormLabel>Require Approval for Loads</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          All loads must be approved before dispatch
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!isEditingBusiness}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={businessForm.control}
                  name="allowCarrierSelfDispatch"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <FormLabel>Allow Carrier Self-Dispatch</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Allow carriers to self-dispatch loads
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!isEditingBusiness}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-2">
                {!isEditingBusiness ? (
                  <Button
                    type="button"
                    onClick={() => setIsEditingBusiness(true)}
                  >
                    Edit Business Settings
                  </Button>
                ) : (
                  <>
                    <Button
                      type="submit"
                      disabled={updateBusinessSettings.isPending}
                    >
                      {updateBusinessSettings.isPending
                        ? "Saving..."
                        : "Save Changes"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditingBusiness(false);
                        businessForm.reset();
                      }}
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Document Numbering */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Numbering
          </CardTitle>
          <CardDescription>
            Configure how load and invoice numbers are generated
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...numberingForm}>
            <form
              onSubmit={numberingForm.handleSubmit(onNumberingSubmit)}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Load Numbers</h4>
                  <FormField
                    control={numberingForm.control}
                    name="loadNumberPrefix"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Load Number Prefix</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled={!isEditingNumbering}
                            placeholder="LD"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={numberingForm.control}
                    name="loadNumberStart"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Starting Number</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            disabled={!isEditingNumbering}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Invoice Numbers</h4>
                  <FormField
                    control={numberingForm.control}
                    name="invoiceNumberPrefix"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invoice Number Prefix</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled={!isEditingNumbering}
                            placeholder="INV"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={numberingForm.control}
                    name="invoiceNumberStart"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Starting Number</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            disabled={!isEditingNumbering}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={numberingForm.control}
                name="autoIncrement"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>Auto-increment Numbers</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Automatically increment document numbers
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!isEditingNumbering}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex gap-2">
                {!isEditingNumbering ? (
                  <Button
                    type="button"
                    onClick={() => setIsEditingNumbering(true)}
                  >
                    Edit Document Numbering
                  </Button>
                ) : (
                  <>
                    <Button
                      type="submit"
                      disabled={updateDocumentNumbering.isPending}
                    >
                      {updateDocumentNumbering.isPending
                        ? "Saving..."
                        : "Save Changes"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditingNumbering(false);
                        numberingForm.reset();
                      }}
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Team Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members
          </CardTitle>
          <CardDescription>
            Manage your team members and their permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {teamMembers?.length || 0} team members
              </p>
              <Dialog
                open={isInviteDialogOpen}
                onOpenChange={setIsInviteDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Invite Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite Team Member</DialogTitle>
                    <DialogDescription>
                      Send an invitation to a new team member
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...inviteForm}>
                    <form
                      onSubmit={inviteForm.handleSubmit(onInviteSubmit)}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={inviteForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={inviteForm.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={inviteForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={inviteForm.control}
                        name="roleIds"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Roles</FormLabel>
                            <FormControl>
                              <div className="space-y-2">
                                {roles.map((role) => (
                                  <div
                                    key={role.id}
                                    className="flex items-center space-x-2"
                                  >
                                    <input
                                      type="checkbox"
                                      id={role.id}
                                      value={role.id}
                                      checked={field.value.includes(role.id)}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        if (e.target.checked) {
                                          field.onChange([
                                            ...field.value,
                                            value,
                                          ]);
                                        } else {
                                          field.onChange(
                                            field.value.filter(
                                              (id) => id !== value
                                            )
                                          );
                                        }
                                      }}
                                      className="rounded border-gray-300"
                                    />
                                    <label
                                      htmlFor={role.id}
                                      className="text-sm"
                                    >
                                      <div className="font-medium">
                                        {role.name}
                                      </div>
                                      <div className="text-muted-foreground">
                                        {role.description}
                                      </div>
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <DialogFooter>
                        <Button
                          type="submit"
                          disabled={inviteTeamMember.isPending}
                        >
                          {inviteTeamMember.isPending
                            ? "Sending..."
                            : "Send Invitation"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            {teamMembers && teamMembers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {member.firstName[0]}
                              {member.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {member.firstName} {member.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {member.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {member.roles.map((role) => (
                            <Badge key={role} variant="secondary">
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={member.isActive ? "default" : "secondary"}
                        >
                          {member.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {member.lastLogin ? (
                          <span className="text-sm text-muted-foreground">
                            {new Date(member.lastLogin).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Never
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(member.id)}
                          disabled={removeTeamMember.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No team members yet</p>
                <p className="text-sm">
                  Invite your first team member to get started
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
