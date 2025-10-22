# Load Management API Documentation

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Load Endpoints](#load-endpoints)
4. [Document Endpoints](#document-endpoints)
5. [Response Formats](#response-formats)
6. [Error Codes](#error-codes)

---

## Overview

The Load Management API provides comprehensive CRUD operations for managing transportation loads, including status workflow management, carrier assignment, document handling, and analytics.

**Base URL:** `/api/v1/loads`

**All endpoints require:**
- ✅ Authentication (JWT cookie)
- ✅ Email verification
- ✅ Multi-tenant validation (organizationId from JWT)

---

## Authentication

All requests must include an HTTP-only cookie containing the JWT token. The token is automatically sent by the browser after login.

**Headers:**
```
Cookie: token=<jwt_token>; refreshToken=<refresh_token>
```

---

## Load Endpoints

### 1. List Loads

Retrieve a paginated list of loads with filtering options.

**Endpoint:** `GET /api/v1/loads`

**Query Parameters:**
```typescript
{
  status?: string;           // Filter by status (QUOTE, BOOKED, etc.)
  customerId?: string;       // Filter by customer ID
  carrierId?: string;        // Filter by carrier ID
  pickupDateFrom?: string;   // Filter by pickup date (ISO 8601)
  pickupDateTo?: string;     // Filter by pickup date (ISO 8601)
  search?: string;           // Search in load#, commodity, names
  page?: number;             // Page number (default: 1)
  limit?: number;            // Items per page (default: 50, max: 100)
}
```

**Response:**
```typescript
{
  success: true,
  data: Load[],
  pagination: {
    page: number,
    limit: number,
    total: number,
    pages: number
  }
}
```

**Example:**
```bash
GET /api/v1/loads?status=IN_TRANSIT&page=1&limit=20
```

---

### 2. Get Load Details

Retrieve a single load with full relations.

**Endpoint:** `GET /api/v1/loads/:id`

**Parameters:**
- `id` (string) - Load ID

**Response:**
```typescript
{
  success: true,
  data: {
    id: string,
    loadNumber: string,
    status: LoadStatus,
    customer: { id, companyName },
    carrier: { id, companyName, mcNumber } | null,
    shipperAddress: Address,
    consigneeAddress: Address,
    pickupDate: string,
    deliveryDate: string,
    commodity: string,
    weight: number,
    equipmentType: EquipmentType,
    customerRate: number,
    carrierRate: number | null,
    margin: number | null,
    creator: { id, firstName, lastName },
    assignee: { id, firstName, lastName } | null,
    events: LoadEvent[],
    // ... all other fields
  }
}
```

---

### 3. Create Load

Create a new load with auto-generated load number.

**Endpoint:** `POST /api/v1/loads`

**Request Body:**
```typescript
{
  customerId: string;          // Required
  carrierId?: string;          // Optional
  
  // Shipper
  shipperName: string;         // Required
  shipperAddress: {
    street: string,
    city: string,
    state: string,
    zip: string,
    country?: string,
    lat?: number,
    lng?: number
  };
  shipperPhone: string;
  shipperEmail?: string;
  pickupDate: string;          // ISO 8601
  pickupStart: string;         // "HH:MM" format
  pickupEnd: string;           // "HH:MM" format
  pickupNotes?: string;
  
  // Consignee
  consigneeName: string;       // Required
  consigneeAddress: Address;
  consigneePhone: string;
  consigneeEmail?: string;
  deliveryDate: string;        // ISO 8601
  deliveryStart: string;
  deliveryEnd: string;
  deliveryNotes?: string;
  
  // Load Details
  commodity: string;           // Required
  weight: number;              // In pounds
  pieces?: number;
  dimensions?: {
    length: number,
    width: number,
    height: number
  };
  equipmentType: EquipmentType;  // Required
  loadType?: LoadType;
  
  // Rates
  customerRate: number;        // Required
  carrierRate?: number;
  accessorials?: Accessorial[];
  
  // Instructions
  internalNotes?: string;
  referenceNumber?: string;
  assignedTo?: string;         // User ID
}
```

**Response:**
```typescript
{
  success: true,
  data: Load  // Complete load object
}
```

**Validation:**
- Customer must exist
- Pickup date must be before delivery date
- Rates must be non-negative
- Equipment type must be valid enum
- Load number is auto-generated with format: `{PREFIX}{NUMBER}` (e.g., LD0001)

---

### 4. Update Load

Update an existing load.

**Endpoint:** `PUT /api/v1/loads/:id`

**Parameters:**
- `id` (string) - Load ID

**Request Body:** Partial<CreateLoadInput>

All fields from create are optional. Margin is auto-recalculated if rates change.

**Response:**
```typescript
{
  success: true,
  data: Load
}
```

---

### 5. Update Load Status

Change load status with workflow validation.

**Endpoint:** `PATCH /api/v1/loads/:id/status`

**Parameters:**
- `id` (string) - Load ID

**Request Body:**
```typescript
{
  status: LoadStatus  // One of: QUOTE, BOOKED, DISPATCHED, etc.
}
```

**Status Workflow Rules:**
- QUOTE → BOOKED, CANCELLED
- BOOKED → DISPATCHED, CANCELLED, QUOTE
- DISPATCHED → IN_TRANSIT, CANCELLED, BOOKED
- IN_TRANSIT → DELIVERED, CANCELLED
- DELIVERED → POD_RECEIVED
- POD_RECEIVED → INVOICED
- INVOICED → PAID
- PAID, CANCELLED → No transitions allowed

**Auto-Actions:**
- BOOKED → Generates Rate Confirmation (if carrier assigned)
- DISPATCHED → Generates BOL (if carrier assigned)
- Status timestamps are auto-updated

**Response:**
```typescript
{
  success: true,
  data: Load
}
```

---

### 6. Delete Load

Soft delete a load (sets deletedAt timestamp).

**Endpoint:** `DELETE /api/v1/loads/:id`

**Parameters:**
- `id` (string) - Load ID

**Response:**
```typescript
{
  success: true,
  data: {
    message: "Load deleted successfully"
  }
}
```

---

### 7. Get Load Events

Retrieve timeline/history of load events.

**Endpoint:** `GET /api/v1/loads/:id/events`

**Parameters:**
- `id` (string) - Load ID

**Response:**
```typescript
{
  success: true,
  data: [
    {
      id: string,
      loadId: string,
      eventType: string,  // LOAD_CREATED, STATUS_CHANGE, etc.
      eventData: object,
      createdAt: string,
      createdBy: string
    }
  ]
}
```

**Event Types:**
- `LOAD_CREATED` - Load creation
- `LOAD_UPDATED` - Load modification
- `STATUS_CHANGE` - Status transition
- `CARRIER_ASSIGNED` - Carrier assignment
- `LOAD_DUPLICATED` - Load duplication
- `DOCUMENT_UPLOADED` - Document upload

---

### 8. Get Load Documents

Retrieve all documents associated with a load.

**Endpoint:** `GET /api/v1/loads/:id/documents`

**Parameters:**
- `id` (string) - Load ID

**Response:**
```typescript
{
  success: true,
  data: [
    {
      id: string,
      entityType: "LOAD",
      entityId: string,
      type: DocumentType,
      name: string,
      fileUrl: string,
      fileSize: number,
      mimeType: string,
      uploadedAt: string,
      uploadedBy: string
    }
  ]
}
```

---

### 9. Assign Carrier

Assign a carrier to a load with validation.

**Endpoint:** `POST /api/v1/loads/:id/assign`

**Parameters:**
- `id` (string) - Load ID

**Request Body:**
```typescript
{
  carrierId: string,  // Required
  notes?: string      // Optional assignment notes
}
```

**Validations:**
- Carrier must exist in organization
- Carrier must be active
- Carrier must be approved
- Carrier insurance must not be expired

**Response:**
```typescript
{
  success: true,
  data: Load  // Updated load with carrier
}
```

---

### 10. Duplicate Load

Create a duplicate of an existing load.

**Endpoint:** `POST /api/v1/loads/:id/duplicate`

**Parameters:**
- `id` (string) - Load ID to duplicate

**Behavior:**
- Generates new load number
- Resets status to QUOTE
- Clears all status timestamps
- Copies all other data
- Does NOT copy documents
- Creates LOAD_DUPLICATED event

**Response:**
```typescript
{
  success: true,
  data: Load  // New duplicated load
}
```

---

### 11. Bulk Delete Loads

Delete multiple loads in one operation.

**Endpoint:** `POST /api/v1/loads/bulk-delete`

**Request Body:**
```typescript
{
  loadIds: string[]  // Array of load IDs
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    successful: string[],      // IDs of successfully deleted loads
    failed: [                  // Failed deletions with errors
      {
        id: string,
        error: string
      }
    ]
  }
}
```

---

### 12. Bulk Update Status

Update status of multiple loads in one operation.

**Endpoint:** `POST /api/v1/loads/bulk-status`

**Request Body:**
```typescript
{
  loadIds: string[],   // Array of load IDs
  status: LoadStatus   // Target status
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    successful: string[],
    failed: [
      {
        id: string,
        error: string
      }
    ]
  }
}
```

---

### 13. Export Loads

Export loads to CSV or Excel format.

**Endpoint:** `GET /api/v1/loads/export`

**Query Parameters:**
```typescript
{
  format?: string;       // "csv" or "excel" (default: "csv")
  status?: string;
  customerId?: string;
  carrierId?: string;
  pickupDateFrom?: string;
  pickupDateTo?: string;
  search?: string;
}
```

**Response:**
- Content-Type: `text/csv` or `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- File download with appropriate headers

**Columns Exported:**
- Load Number, Status, Customer, Carrier
- Shipper City/State, Consignee City/State
- Pickup Date, Delivery Date
- Commodity, Weight, Equipment Type
- Customer Rate, Carrier Rate, Margin

---

### 14. Get Load Statistics

Get load counts and totals grouped by status.

**Endpoint:** `GET /api/v1/loads/statistics`

**Response:**
```typescript
{
  success: true,
  data: {
    [status: string]: {
      count: number,
      revenue: number,
      cost: number,
      margin: number
    }
  }
}
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "QUOTE": {
      "count": 15,
      "revenue": 45000,
      "cost": 0,
      "margin": 0
    },
    "IN_TRANSIT": {
      "count": 8,
      "revenue": 24000,
      "cost": 21000,
      "margin": 3000
    }
  }
}
```

---

### 15. Get Dashboard Statistics

Get comprehensive dashboard metrics.

**Endpoint:** `GET /api/v1/loads/dashboard-stats`

**Response:**
```typescript
{
  success: true,
  data: {
    totalLoads: number,           // All-time total
    activeLoads: number,          // IN_TRANSIT count
    todayPickups: number,         // Pickups scheduled today
    todayDeliveries: number,      // Deliveries scheduled today
    weekRevenue: number,          // This week's revenue
    weekMargin: number,           // This week's margin
    monthRevenue: number,         // This month's revenue
    monthMargin: number,          // This month's margin
    statusDistribution: {         // Count by status
      [status: string]: number
    }
  }
}
```

---

## Document Endpoints

### Upload Document

Upload a document for a load.

**Endpoint:** `POST /api/v1/documents/upload`

**Request:**
- Content-Type: `multipart/form-data`
- Form fields:
  - `file` (File) - Document file
  - `entityType` (string) - "LOAD"
  - `entityId` (string) - Load ID
  - `type` (DocumentType) - Document category
  - `name` (string) - Document name

**Validation:**
- Max file size: 10MB
- Allowed types: PDF, JPG, PNG, DOC, DOCX

**Response:**
```typescript
{
  success: true,
  data: Document
}
```

---

### Get Entity Documents

Retrieve all documents for an entity.

**Endpoint:** `GET /api/v1/documents/:entityType/:entityId`

**Parameters:**
- `entityType` (string) - "LOAD", "CARRIER", "CUSTOMER", etc.
- `entityId` (string) - Entity ID

**Response:**
```typescript
{
  success: true,
  data: Document[]
}
```

---

### Delete Document

Delete a document.

**Endpoint:** `DELETE /api/v1/documents/:id`

**Parameters:**
- `id` (string) - Document ID

**Response:**
```typescript
{
  success: true,
  data: {
    message: "Document deleted successfully"
  }
}
```

---

### Generate Document

Generate a document from a template.

**Endpoint:** `POST /api/v1/documents/generate`

**Request Body:**
```typescript
{
  loadId: string,
  documentType: "RATE_CONFIRMATION" | "BOL"
}
```

**Response:**
```typescript
{
  success: true,
  data: Document
}
```

---

## Response Formats

### Success Response
```typescript
{
  success: true,
  data: T,           // Response data
  pagination?: {     // If paginated
    page: number,
    limit: number,
    total: number,
    pages: number
  }
}
```

### Error Response
```typescript
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: object
  }
}
```

---

## Error Codes

### Load Management Errors

| Code | Status | Description |
|------|--------|-------------|
| `LOAD_NOT_FOUND` | 404 | Load does not exist or access denied |
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `INVALID_STATUS_TRANSITION` | 400 | Cannot transition from current status to target status |
| `CARRIER_NOT_ACTIVE` | 400 | Selected carrier is not active |
| `CARRIER_NOT_APPROVED` | 400 | Selected carrier is not approved |
| `CARRIER_INSURANCE_EXPIRED` | 400 | Carrier insurance has expired |
| `INVALID_DATE_RANGE` | 400 | Pickup date must be before delivery date |
| `DUPLICATE_LOAD_NUMBER` | 409 | Load number already exists |

### Document Errors

| Code | Status | Description |
|------|--------|-------------|
| `DOCUMENT_NOT_FOUND` | 404 | Document does not exist |
| `INVALID_FILE_TYPE` | 400 | File type not allowed |
| `FILE_TOO_LARGE` | 400 | File exceeds 10MB limit |
| `UPLOAD_FAILED` | 500 | File upload failed |

### Authentication Errors

| Code | Status | Description |
|------|--------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `EMAIL_NOT_VERIFIED` | 403 | Email verification required |
| `FORBIDDEN` | 403 | Insufficient permissions |

---

## Data Models

### LoadStatus Enum
```typescript
enum LoadStatus {
  QUOTE = "QUOTE",
  BOOKED = "BOOKED",
  DISPATCHED = "DISPATCHED",
  IN_TRANSIT = "IN_TRANSIT",
  DELIVERED = "DELIVERED",
  POD_RECEIVED = "POD_RECEIVED",
  INVOICED = "INVOICED",
  PAID = "PAID",
  CANCELLED = "CANCELLED"
}
```

### EquipmentType Enum
```typescript
enum EquipmentType {
  DRY_VAN = "DRY_VAN",
  REEFER = "REEFER",
  FLATBED = "FLATBED",
  STEP_DECK = "STEP_DECK",
  RGN = "RGN",
  POWER_ONLY = "POWER_ONLY",
  HOTSHOT = "HOTSHOT",
  BOX_TRUCK = "BOX_TRUCK",
  STRAIGHT_TRUCK = "STRAIGHT_TRUCK",
  OTHER = "OTHER"
}
```

### LoadType Enum
```typescript
enum LoadType {
  FULL_TRUCK = "FULL_TRUCK",
  LTL = "LTL",
  PARTIAL = "PARTIAL",
  EXPEDITED = "EXPEDITED"
}
```

### DocumentType Enum
```typescript
enum DocumentType {
  RATE_CONFIRMATION = "RATE_CONFIRMATION",
  BOL = "BOL",
  POD = "POD",
  INVOICE = "INVOICE",
  W9 = "W9",
  INSURANCE = "INSURANCE",
  AUTHORITY = "AUTHORITY",
  CONTRACT = "CONTRACT",
  OTHER = "OTHER"
}
```

---

## Rate Limiting

- **Standard endpoints:** 100 requests per 15 minutes per IP
- **Upload endpoints:** 20 requests per 15 minutes per IP
- **Export endpoints:** 10 requests per 15 minutes per IP

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

---

## Webhooks (Future)

Coming soon: Webhooks for load status changes and document uploads.

---

## Support

For API support, contact: support@tms.com

**Last Updated:** October 21, 2025  
**API Version:** v1

