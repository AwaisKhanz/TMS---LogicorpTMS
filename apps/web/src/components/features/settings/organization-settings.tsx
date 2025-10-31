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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useOrganizationSettings,
  useUpdateOrganization,
  useUpdateDocumentTerms,
} from "@/hooks/use-settings";
import { Building, Upload } from "lucide-react";
import { CanEdit } from "@/components/auth/can";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import Image from "next/image";

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

const documentTermsSchema = z.object({
  bolTerms: z.string().optional(),
  rateConfirmationTerms: z.string().optional(),
  invoiceTerms: z.string().optional(),
});

function DocumentTermsForm({ organization }: { organization: any }) {
  const updateDocumentTerms = useUpdateDocumentTerms();
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<z.infer<typeof documentTermsSchema>>({
    resolver: zodResolver(documentTermsSchema),
    defaultValues: {
      bolTerms: organization?.documentTerms?.bolTerms || "",
      rateConfirmationTerms: organization?.documentTerms?.rateConfirmationTerms || "",
      invoiceTerms: organization?.documentTerms?.invoiceTerms || "",
    },
  });

  React.useEffect(() => {
    if (organization) {
      form.reset({
        bolTerms: organization.documentTerms?.bolTerms || "",
        rateConfirmationTerms: organization.documentTerms?.rateConfirmationTerms || "",
        invoiceTerms: organization.documentTerms?.invoiceTerms || "",
      });
    }
  }, [organization, form]);

  const onSubmit = async (data: z.infer<typeof documentTermsSchema>) => {
    if (!isEditing) return;
    try {
      await updateDocumentTerms.mutateAsync(data);
      setIsEditing(false);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Tabs defaultValue="bol" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="bol">BOL Terms</TabsTrigger>
            <TabsTrigger value="rc">Rate Confirmation</TabsTrigger>
            <TabsTrigger value="invoice">Invoice Terms</TabsTrigger>
          </TabsList>

          <TabsContent value="bol" className="space-y-2">
            <FormField
              control={form.control}
              name="bolTerms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>BOL Terms & Conditions</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      disabled={!isEditing}
                      placeholder="Enter terms and conditions for Bill of Lading documents..."
                      className="min-h-[200px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="rc" className="space-y-2">
            <FormField
              control={form.control}
              name="rateConfirmationTerms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rate Confirmation Terms & Conditions</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      disabled={!isEditing}
                      placeholder="Enter terms and conditions for Rate Confirmation documents..."
                      className="min-h-[200px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="invoice" className="space-y-2">
            <FormField
              control={form.control}
              name="invoiceTerms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invoice Terms & Conditions</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      disabled={!isEditing}
                      placeholder="Enter terms and conditions for Invoice documents..."
                      className="min-h-[200px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
        </Tabs>

        <div className="flex gap-2">
          {!isEditing ? (
            <CanEdit resource="settings">
              <Button type="button" onClick={() => setIsEditing(true)}>
                Edit Terms
              </Button>
            </CanEdit>
          ) : (
            <>
              <Button
                type="submit"
                disabled={updateDocumentTerms.isPending}
              >
                {updateDocumentTerms.isPending ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  form.reset();
                }}
              >
                Cancel
              </Button>
            </>
          )}
        </div>
      </form>
    </Form>
  );
}

export function OrganizationSettings() {
  const { data: organization, isLoading } = useOrganizationSettings();
  const updateOrganization = useUpdateOrganization();

  const [isEditingOrg, setIsEditingOrg] = useState(false);
  const [showLogoDialog, setShowLogoDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Cleanup object URL on component unmount
  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

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
    }
  }, [organization, organizationForm]);

  const onOrganizationSubmit = async (
    data: z.infer<typeof organizationSchema>
  ) => {
    console.log("Organization form submitted with data:", data);
    console.log("isEditingOrg state:", isEditingOrg);

    // Only submit if we're actually in editing mode
    if (!isEditingOrg) {
      console.log(
        "Organization form submission prevented - not in editing mode"
      );
      return;
    }

    try {
      await updateOrganization.mutateAsync(data);
      setIsEditingOrg(false);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      toast.error("Image size must be less than 5MB");
      return;
    }

    // Set selected file and create preview
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setShowLogoDialog(true);
  };

  const handleConfirmLogoUpload = async () => {
    if (!selectedFile || !organization) return;

    setIsUploading(true);
    try {
      // Use the existing document upload API
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("entityType", "ORGANIZATION");
      formData.append("entityId", organization.id);
      formData.append("type", "AVATAR");
      formData.append("name", "logo");

      // Upload file using the existing upload API
      const response = (await apiClient.post("/documents/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })) as { success: boolean; data?: { fileUrl: string } };

      if (response.success && response.data?.fileUrl) {
        // Update organization with the new logo URL
        await updateOrganization.mutateAsync({
          ...organization,
          logo: response.data.fileUrl,
        });

        toast.success("Logo updated successfully");
        // Close dialog and reset state
        setShowLogoDialog(false);
        setSelectedFile(null);
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl(null);
        }
      } else {
        throw new Error("Failed to upload logo");
      }
    } catch (error) {
      console.error("Logo upload error:", error);
      toast.error("Failed to upload logo");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancelLogoUpload = () => {
    setShowLogoDialog(false);
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-muted rounded"></div>
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
        <CardContent className="space-y-6">
          {/* Logo Section */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage
                src={organization?.logo || ""}
                alt="Organization Logo"
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
              />
              <AvatarFallback className="text-lg">
                <Building className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <CanEdit resource="settings">
                <div>
                  <label htmlFor="logo-upload" className="cursor-pointer">
                    <Button variant="outline" size="sm" asChild>
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        Change Logo
                      </span>
                    </Button>
                  </label>
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </div>
              </CanEdit>
              <p className="text-sm text-muted-foreground">
                JPG, PNG or GIF. Max size 5MB.
              </p>
            </div>
          </div>

          <Form {...organizationForm}>
            <form
              onSubmit={(e) => {
                console.log(
                  "Organization form onSubmit triggered, isEditingOrg:",
                  isEditingOrg
                );
                if (!isEditingOrg) {
                  console.log(
                    "Preventing organization form submission - not in editing mode"
                  );
                  e.preventDefault();
                  return;
                }
                organizationForm.handleSubmit(onOrganizationSubmit)(e);
              }}
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
                  <CanEdit resource="settings">
                    <Button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log(
                          "Edit Organization button clicked, setting isEditingOrg to true"
                        );
                        setIsEditingOrg(true);
                      }}
                    >
                      Edit Organization
                    </Button>
                  </CanEdit>
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

      {/* Document Terms & Conditions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Document Terms & Conditions
          </CardTitle>
          <CardDescription>
            Configure terms and conditions that will appear at the end of generated documents (BOL, Rate Confirmation, Invoice)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentTermsForm organization={organization} />
        </CardContent>
      </Card>

      {/* Business Settings - Hidden for now */}
      {/* <Card>
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
              onSubmit={(e) => {
                console.log(
                  "Business form onSubmit triggered, isEditingBusiness:",
                  isEditingBusiness
                );
                if (!isEditingBusiness) {
                  console.log(
                    "Preventing business form submission - not in editing mode"
                  );
                  e.preventDefault();
                  return;
                }
                businessForm.handleSubmit(onBusinessSubmit)(e);
              }}
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
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log(
                        "Edit Business Settings button clicked, setting isEditingBusiness to true"
                      );
                      setIsEditingBusiness(true);
                    }}
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
      </Card> */}

      {/* Document Numbering - Hidden for now */}
      {/* <Card>
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
      </Card> */}

      {/* Team Management - Moved to dedicated /team page */}

      {/* Logo Upload Confirmation Dialog */}
      <Dialog open={showLogoDialog} onOpenChange={setShowLogoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Logo Upload</DialogTitle>
            <DialogDescription>
              Are you sure you want to upload this image as your organization
              logo?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {previewUrl && (
              <div className="flex justify-center">
                <Image
                  src={previewUrl}
                  alt="Logo preview"
                  width={192}
                  height={192}
                  className="max-w-48 max-h-48 object-contain rounded-lg border"
                />
              </div>
            )}
            <div className="text-sm text-muted-foreground">
              <p>File: {selectedFile?.name}</p>
              <p>
                Size:{" "}
                {selectedFile
                  ? (selectedFile.size / 1024 / 1024).toFixed(2) + " MB"
                  : "N/A"}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancelLogoUpload}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmLogoUpload} disabled={isUploading}>
              {isUploading ? "Uploading..." : "Upload Logo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
