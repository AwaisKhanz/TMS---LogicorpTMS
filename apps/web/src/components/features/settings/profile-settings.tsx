"use client";

import React, { useState, useEffect } from "react";
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
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useProfile, useUpdateProfile } from "@/hooks/use-settings";
import { useAuth } from "@/contexts/auth-context";
import { apiClient } from "@/lib/api-client";
import { User, Mail, Upload } from "lucide-react";
import { toast } from "sonner";

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
  timezone: z.string().min(1, "Timezone is required"),
  language: z.string().min(1, "Language is required"),
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

const languages = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
];

export function ProfileSettings() {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarDialog, setShowAvatarDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: profile?.firstName || "",
      lastName: profile?.lastName || "",
      phone: profile?.phone || "",
      timezone: profile?.timezone || "America/New_York",
      language: profile?.language || "en",
    },
  });

  // Update form when profile data loads
  React.useEffect(() => {
    if (profile) {
      profileForm.reset({
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone || "",
        timezone: profile.timezone,
        language: profile.language,
      });
    }
  }, [profile, profileForm]);

  const onProfileSubmit = async (data: z.infer<typeof profileSchema>) => {
    console.log("Form submitted with data:", data);
    console.log("isEditing state:", isEditing);
    try {
      await updateProfile.mutateAsync(data);
      setIsEditing(false);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
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
    setShowAvatarDialog(true);
  };

  const handleConfirmUpload = async () => {
    if (!selectedFile || !user) return;

    setIsUploading(true);
    try {
      // Use the existing document upload API
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("entityType", "VIEWER");
      formData.append("entityId", user.id);
      formData.append("type", "AVATAR");
      formData.append("name", "avatar");

      // Upload file using the existing upload API
      const response = (await apiClient.post("/documents/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })) as { success: boolean; data?: { fileUrl: string } };

      if (response.success && response.data?.fileUrl) {
        // Use the existing profile update mechanism instead of direct API call
        await updateProfile.mutateAsync({
          firstName: profile?.firstName || "",
          lastName: profile?.lastName || "",
          phone: profile?.phone || "",
          timezone: profile?.timezone || "America/New_York",
          language: profile?.language || "en",
          avatar: response.data.fileUrl,
        });

        toast.success("Avatar updated successfully");
        // Close dialog and reset state
        setShowAvatarDialog(false);
        setSelectedFile(null);
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl(null);
        }
        // No need to reload - the profile update hook will refresh the data
      } else {
        throw new Error("Failed to upload avatar");
      }
    } catch (error) {
      console.error("Avatar upload error:", error);
      toast.error("Failed to upload avatar");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancelUpload = () => {
    setShowAvatarDialog(false);
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  // Cleanup object URL on component unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  if (profileLoading) {
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
      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Manage your personal information and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage
                src={user?.avatar || profile?.avatar || ""}
                alt="Profile"
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
              />
              <AvatarFallback className="text-lg">
                {user?.firstName?.[0] || profile?.firstName?.[0]}
                {user?.lastName?.[0] || profile?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <div>
                <label htmlFor="avatar-upload" className="cursor-pointer">
                  <Button variant="outline" size="sm" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Change Avatar
                    </span>
                  </Button>
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                JPG, PNG or GIF. Max size 5MB.
              </p>
            </div>
          </div>

          <Separator />

          {/* Profile Form */}
          <Form {...profileForm}>
            <form
              onSubmit={profileForm.handleSubmit(onProfileSubmit)}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={profileForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!isEditing} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!isEditing} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={profileForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={!isEditing}
                          placeholder="+1 (555) 123-4567"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Email
                  </label>
                  <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{user?.email}</span>
                    <span className="text-xs text-muted-foreground">
                      (Cannot be changed)
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={profileForm.control}
                  name="timezone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timezone</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          disabled={!isEditing}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {timezones.map((tz) => (
                            <option key={tz.value} value={tz.value}>
                              {tz.label}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          disabled={!isEditing}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {languages.map((lang) => (
                            <option key={lang.value} value={lang.value}>
                              {lang.label}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-2">
                {!isEditing ? (
                  <Button
                    type="button"
                    onClick={() => {
                      setIsEditing(true);
                    }}
                  >
                    Edit Profile
                  </Button>
                ) : (
                  <>
                    <Button type="submit" disabled={updateProfile.isPending}>
                      {updateProfile.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        profileForm.reset();
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

      {/* Avatar Upload Confirmation Dialog */}
      <Dialog open={showAvatarDialog} onOpenChange={setShowAvatarDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Avatar Upload</DialogTitle>
            <DialogDescription>
              Please review your new avatar before uploading. This will replace
              your current profile picture.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Current Avatar */}
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Current Avatar
              </p>
              <Avatar className="h-20 w-20 mx-auto">
                <AvatarImage
                  src={user?.avatar || profile?.avatar || ""}
                  alt="Current Profile"
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                />
                <AvatarFallback className="text-lg">
                  {user?.firstName?.[0] || profile?.firstName?.[0]}
                  {user?.lastName?.[0] || profile?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <div className="text-2xl text-muted-foreground">↓</div>
            </div>

            {/* New Avatar Preview */}
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                New Avatar
              </p>
              <Avatar className="h-20 w-20 mx-auto">
                <AvatarImage
                  src={previewUrl || ""}
                  alt="New Profile"
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                />
                <AvatarFallback className="text-lg">
                  {user?.firstName?.[0] || profile?.firstName?.[0]}
                  {user?.lastName?.[0] || profile?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* File Info */}
            {selectedFile && (
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm font-medium">File Details</p>
                <p className="text-xs text-muted-foreground">
                  Name: {selectedFile.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <p className="text-xs text-muted-foreground">
                  Type: {selectedFile.type}
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleCancelUpload}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmUpload} disabled={isUploading}>
              {isUploading ? "Uploading..." : "Upload Avatar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
