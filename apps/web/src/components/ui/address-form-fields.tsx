"use client";

import { useState } from "react";
import {
  Control,
  FieldPath,
  FieldValues,
  UseFormSetValue,
} from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { AddressAutocomplete, AddressComponents } from "./address-autocomplete";
import { US_STATES } from "@tms/shared-constants";
import { Edit2, X } from "lucide-react";
import { CountrySelect } from "./country-select";

interface AddressFormFieldsProps<T extends FieldValues> {
  control: Control<T>;
  setValue: UseFormSetValue<T>;
  streetFieldName: FieldPath<T>;
  cityFieldName: FieldPath<T>;
  stateFieldName: FieldPath<T>;
  zipFieldName: FieldPath<T>;
  countryFieldName?: FieldPath<T>;
  formattedAddressFieldName?: FieldPath<T>;
  latitudeFieldName?: FieldPath<T>;
  longitudeFieldName?: FieldPath<T>;
  placeIdFieldName?: FieldPath<T>;
  disabled?: boolean;
  showCountry?: boolean;
  countryRestriction?: string; // ISO 3166-1 Alpha-2 country code (optional - if not provided, global)
  streetLabel?: string;
  cityLabel?: string;
  stateLabel?: string;
  zipLabel?: string;
  countryLabel?: string;
  className?: string;
}

export function AddressFormFields<T extends FieldValues>({
  control,
  setValue,
  streetFieldName,
  cityFieldName,
  stateFieldName,
  zipFieldName,
  countryFieldName,
  formattedAddressFieldName,
  latitudeFieldName,
  longitudeFieldName,
  placeIdFieldName,
  disabled = false,
  showCountry = true,
  countryRestriction,
  streetLabel = "Street Address",
  cityLabel = "City",
  stateLabel = "State/Province",
  zipLabel = "ZIP/Postal Code",
  countryLabel = "Country",
  className,
}: AddressFormFieldsProps<T>) {
  const [isEditing, setIsEditing] = useState(false);
  const [hasAutoFilled, setHasAutoFilled] = useState(false);

  // Handle address selection and update all fields
  const handleAddressSelect = (components: AddressComponents) => {
    console.log("🔧 Setting form values:", {
      street: components.street,
      city: components.city,
      state: components.state,
      zip: components.zip,
      country: components.country,
      formattedAddress: components.formattedAddress,
      coordinates: components.coordinates,
      placeId: components.placeId,
      fullComponents: components,
    });

    // Use formatted address if street is empty, otherwise use street
    const streetValue = components.street || components.formattedAddress || "";

    setValue(streetFieldName, streetValue as any, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue(cityFieldName, components.city as any, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue(stateFieldName, components.state as any, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue(zipFieldName, components.zip as any, {
      shouldValidate: true,
      shouldDirty: true,
    });

    if (countryFieldName && components.country) {
      // Ensure country code is uppercase to match our COUNTRIES list
      const countryCode = components.country.toUpperCase();
      console.log("🌍 Setting country:", countryCode);
      setValue(countryFieldName, countryCode as any, { shouldValidate: true });
    }

    // Set additional address metadata if field names are provided
    if (formattedAddressFieldName && components.formattedAddress) {
      setValue(formattedAddressFieldName, components.formattedAddress as any, {
        shouldValidate: false,
      });
    }

    if (latitudeFieldName && components.coordinates?.lat) {
      setValue(latitudeFieldName, components.coordinates.lat as any, {
        shouldValidate: false,
      });
    }

    if (longitudeFieldName && components.coordinates?.lng) {
      setValue(longitudeFieldName, components.coordinates.lng as any, {
        shouldValidate: false,
      });
    }

    if (placeIdFieldName && components.placeId) {
      setValue(placeIdFieldName, components.placeId as any, {
        shouldValidate: false,
      });
    }

    setHasAutoFilled(true);
    setIsEditing(false); // Auto-fill makes fields read-only
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  return (
    <div className={className}>
      {/* Street Address with Autocomplete */}
      <FormField
        control={control}
        name={streetFieldName}
        render={({ field, fieldState }) => (
          <FormItem className="md:col-span-2">
            <FormLabel>{streetLabel} *</FormLabel>
            <FormControl>
              <AddressAutocomplete
                value={field.value ?? ""}
                onChange={(address, components) => {
                  // Allow empty string to clear the field
                  if (address !== undefined && address !== field.value) {
                    field.onChange(address);
                  }
                  // If components are provided, handle the full address selection
                  if (components) {
                    handleAddressSelect(components);
                  }
                }}
                onSelect={handleAddressSelect}
                placeholder="Search for an address anywhere in the world..."
                disabled={disabled}
                error={!!fieldState.error}
                countryRestriction={countryRestriction}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Edit Toggle Button */}
      {hasAutoFilled && !disabled && (
        <div className="flex items-center gap-2 mt-4">
          {!isEditing ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleEditToggle}
              className="h-8 text-xs"
            >
              <Edit2 className="h-3 w-3 mr-1" />
              Edit Address Fields
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCancelEdit}
                className="h-8 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Cancel
              </Button>
              <span className="text-xs text-muted-foreground">
                Fields are now editable
              </span>
            </div>
          )}
        </div>
      )}

      {/* City, State, ZIP Grid */}
      <div className="grid gap-4 my-4 md:grid-cols-3">
        <FormField
          control={control}
          name={cityFieldName}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{cityLabel} *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter city"
                  {...field}
                  disabled={disabled || (hasAutoFilled && !isEditing)}
                  readOnly={hasAutoFilled && !isEditing}
                  className={hasAutoFilled && !isEditing ? "bg-muted" : ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={stateFieldName}
          render={({ field }) => {
            const fieldValue = field.value || "";
            const isUSState =
              fieldValue && US_STATES.some((s) => s.value === fieldValue);

            return (
              <FormItem>
                <FormLabel>{stateLabel} *</FormLabel>
                {isUSState && !isEditing && hasAutoFilled ? (
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={disabled || (hasAutoFilled && !isEditing)}
                    >
                      <SelectTrigger
                        className={
                          hasAutoFilled && !isEditing ? "bg-muted" : ""
                        }
                      >
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {US_STATES.map((state) => (
                          <SelectItem key={state.value} value={state.value}>
                            {state.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                ) : (
                  <FormControl>
                    <Input
                      placeholder="Enter state/province"
                      {...field}
                      disabled={disabled || (hasAutoFilled && !isEditing)}
                      readOnly={hasAutoFilled && !isEditing}
                      className={hasAutoFilled && !isEditing ? "bg-muted" : ""}
                    />
                  </FormControl>
                )}
                <FormMessage />
              </FormItem>
            );
          }}
        />

        <FormField
          control={control}
          name={zipFieldName}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{zipLabel} *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter ZIP/postal code"
                  value={field.value ?? ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Update field value and trigger validation immediately
                    setValue(zipFieldName, value as any, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                  onBlur={field.onBlur}
                  disabled={disabled || (hasAutoFilled && !isEditing)}
                  readOnly={hasAutoFilled && !isEditing}
                  className={hasAutoFilled && !isEditing ? "bg-muted" : ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Country Field (if enabled) */}
      {showCountry && countryFieldName && (
        <FormField
          control={control}
          name={countryFieldName}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{countryLabel} *</FormLabel>
              <FormControl>
                <CountrySelect
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={disabled || (hasAutoFilled && !isEditing)}
                  placeholder="Select country"
                  className={hasAutoFilled && !isEditing ? "bg-muted" : ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
}
