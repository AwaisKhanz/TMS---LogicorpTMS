# Google Places API Integration - Implementation Summary

## Overview

The TMS platform now uses Google Places Autocomplete API for all address input fields, providing a professional and user-friendly address selection experience. Users can now search for addresses using Google's autocomplete, and all address components (street, city, state, ZIP, country) are automatically populated.

## Components Created

### 1. `GoogleMapsLoader` (`apps/web/src/components/ui/google-maps-loader.tsx`)
- Loads Google Maps JavaScript API with Places library
- Handles loading states and errors
- Must wrap any component that uses Google Places features

### 2. `AddressAutocomplete` (`apps/web/src/components/ui/address-autocomplete.tsx`)
- Core autocomplete input component
- Uses `use-places-autocomplete` hook for autocomplete functionality
- Parses Google Places API responses into structured address components
- Provides coordinates and place ID for future map integration
- Features:
  - Real-time address suggestions
  - Address component parsing (street, city, state, ZIP, country)
  - Coordinate extraction (lat/lng)
  - Place ID for future reference
  - Country restriction support
  - Error handling and loading states

### 3. `AddressFormFields` (`apps/web/src/components/ui/address-form-fields.tsx`)
- Reusable form component that integrates with react-hook-form
- Combines AddressAutocomplete with standard form fields
- Automatically populates all address fields when a place is selected
- Supports nested field paths (e.g., `address.street`)
- Features:
  - Street address with autocomplete
  - City, State, ZIP fields (auto-populated)
  - Optional country field
  - State dropdown with US states
  - Country dropdown with all countries
  - Full react-hook-form integration

## Forms Updated

All address input forms have been updated to use the new Google Places integration:

1. **Shipper Form** (`apps/web/src/components/features/shippers/shipper-form.tsx`)
   - Fields: streetAddress, city, state, zipCode, country
   - Country restriction: US

2. **Consignee Form** (`apps/web/src/components/features/consignees/consignee-form.tsx`)
   - Fields: streetAddress, city, state, zipCode, country
   - Country restriction: US

3. **Carrier Form** (`apps/web/src/components/features/carriers/carrier-form.tsx`)
   - Fields: street, city, state, zip
   - No country field

4. **Customer Form** (`apps/web/src/components/features/customers/customer-form.tsx`)
   - Fields: billingStreet, billingCity, billingState, billingZip
   - No country field

5. **Organization Settings** (`apps/web/src/components/features/settings/organization-settings.tsx`)
   - Fields: address.street, address.city, address.state, address.zip, address.country
   - Nested field paths supported

## Usage Example

```tsx
import { GoogleMapsLoader } from "@/components/ui/google-maps-loader";
import { AddressFormFields } from "@/components/ui/address-form-fields";
import { useForm } from "react-hook-form";

function MyForm() {
  const form = useForm();

  return (
    <GoogleMapsLoader>
      <Form {...form}>
        <form>
          <AddressFormFields
            control={form.control}
            setValue={form.setValue}
            streetFieldName="street"
            cityFieldName="city"
            stateFieldName="state"
            zipFieldName="zip"
            countryFieldName="country" // optional
            countryRestriction="us" // optional
          />
        </form>
      </Form>
    </GoogleMapsLoader>
  );
}
```

## Environment Setup

1. **Get Google Maps API Key:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a project and enable billing
   - Enable: Maps JavaScript API, Places API
   - Create an API key
   - Restrict the key to your domains

2. **Add to `.env.local`:**
   ```bash
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
   ```

3. **Restart development server** after adding the key

## Features

✅ **Address Autocomplete** - Type to search for addresses
✅ **Auto-population** - All address fields filled automatically
✅ **Address Parsing** - Extracts street, city, state, ZIP, country
✅ **Coordinates** - Includes lat/lng for map integration
✅ **Place ID** - Google Place ID for future reference
✅ **Country Restriction** - Limit searches to specific countries
✅ **Error Handling** - Graceful error messages
✅ **Loading States** - Visual feedback during API calls
✅ **Form Integration** - Works seamlessly with react-hook-form
✅ **Nested Fields** - Supports nested field paths

## Future Enhancements

The implementation is designed to support future map features:
- Place coordinates are extracted and stored
- Place IDs are available for reference
- Address components are structured for easy mapping

## Dependencies Added

- `@react-google-maps/api` - Google Maps React integration
- `use-places-autocomplete` - React hook for Places Autocomplete

## Notes

- The API key is exposed in the browser (NEXT_PUBLIC_ prefix)
- Always use API restrictions in Google Cloud Console
- Monitor usage to avoid unexpected charges
- Google provides $200 free credit monthly

