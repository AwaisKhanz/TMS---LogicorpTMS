# TMS API Documentation

## Base URL
```
Production: https://api.tms-platform.com/v1
Development: http://localhost:4000/api/v1
```

## Authentication
All API requests require authentication using JWT tokens in the Authorization header:
```
Authorization: Bearer <access_token>
```

## Common Headers
```
Content-Type: application/json
X-Organization-ID: <organization_id> (automatically extracted from JWT)
```

## Response Format
All responses follow this structure:
```json
{
  "success": true|false,
  "data": {} | [],
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

## Authentication Endpoints

### Register Organization
```http
POST /auth/register
```

**Request Body:**
```json
{
  "email": "admin@company.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "organizationName": "ABC Logistics",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_123",
      "email": "admin@company.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "organization": {
      "id": "org_123",
      "name": "ABC Logistics",
      "slug": "abc-logistics"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "expiresIn": 900
    }
  }
}
```

### Login
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "admin@company.com",
  "password": "SecurePassword123!"
}
```

**Response:** Same as register

### Refresh Token
```http
POST /auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Logout
```http
POST /auth/logout
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

## Load Management Endpoints

### List Loads
```http
GET /loads
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)
- `status` (string): Filter by status (BOOKED, DISPATCHED, etc.)
- `customerId` (string): Filter by customer
- `carrierId` (string): Filter by carrier
- `pickupDateFrom` (date): Filter pickups from date
- `pickupDateTo` (date): Filter pickups to date
- `search` (string): Search in load number, commodity, locations
- `sort` (string): Sort field (pickupDate, createdAt, loadNumber)
- `order` (string): Sort order (asc, desc)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "load_123",
      "loadNumber": "LD-2025-00001",
      "status": "BOOKED",
      "customer": {
        "id": "cust_123",
        "companyName": "XYZ Corp"
      },
      "carrier": {
        "id": "carr_123",
        "companyName": "Fast Freight"
      },
      "shipper": {
        "name": "Warehouse A",
        "address": {
          "street": "123 Main St",
          "city": "Dallas",
          "state": "TX",
          "zip": "75001"
        }
      },
      "consignee": {
        "name": "Distribution Center",
        "address": {
          "street": "456 Oak Ave",
          "city": "Houston",
          "state": "TX",
          "zip": "77001"
        }
      },
      "pickupDate": "2025-01-25T14:00:00Z",
      "deliveryDate": "2025-01-26T10:00:00Z",
      "commodity": "Electronics",
      "weight": 25000,
      "customerRate": 2500.00,
      "carrierRate": 2000.00,
      "margin": 500.00
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### Get Load Details
```http
GET /loads/{loadId}
```

### Create Load
```http
POST /loads
```

**Request Body:**
```json
{
  "customerId": "cust_123",
  "referenceNumber": "PO12345",
  "shipper": {
    "name": "Warehouse A",
    "address": {
      "street": "123 Main St",
      "city": "Dallas",
      "state": "TX",
      "zip": "75001"
    },
    "phone": "+1234567890",
    "email": "warehouse@example.com",
    "pickupDate": "2025-01-25",
    "pickupWindow": {
      "start": "14:00",
      "end": "18:00"
    }
  },
  "consignee": {
    "name": "Distribution Center",
    "address": {
      "street": "456 Oak Ave",
      "city": "Houston",
      "state": "TX",
      "zip": "77001"
    },
    "phone": "+0987654321",
    "email": "dc@example.com",
    "deliveryDate": "2025-01-26",
    "deliveryWindow": {
      "start": "08:00",
      "end": "12:00"
    }
  },
  "commodity": "Electronics",
  "weight": 25000,
  "pieces": 10,
  "dimensions": {
    "length": 48,
    "width": 40,
    "height": 48
  },
  "equipmentType": "DRY_VAN",
  "customerRate": 2500.00,
  "notes": {
    "pickup": "Call 30 minutes before arrival",
    "delivery": "Dock #5",
    "internal": "Priority customer"
  },
  "postToLoadBoards": true
}
```

### Update Load
```http
PUT /loads/{loadId}
```

### Update Load Status
```http
PATCH /loads/{loadId}/status
```

**Request Body:**
```json
{
  "status": "IN_TRANSIT",
  "notes": "Picked up on time"
}
```

### Delete Load
```http
DELETE /loads/{loadId}
```

### Assign Carrier
```http
POST /loads/{loadId}/assign-carrier
```

**Request Body:**
```json
{
  "carrierId": "carr_123",
  "carrierRate": 2000.00,
  "dispatchNotes": "Driver John Doe - Truck #1234"
}
```

---

## Carrier Management Endpoints

### List Carriers
```http
GET /carriers
```

**Query Parameters:**
- `page`, `limit`: Pagination
- `search`: Search in company name, MC#
- `status`: ACTIVE, INACTIVE
- `approved`: true, false
- `equipmentType`: Filter by equipment

### Get Carrier Details
```http
GET /carriers/{carrierId}
```

### Create Carrier
```http
POST /carriers
```

**Request Body:**
```json
{
  "mcNumber": "123456",
  "dotNumber": "789012",
  "companyName": "Fast Freight LLC",
  "dba": "Fast Freight",
  "email": "dispatch@fastfreight.com",
  "phone": "+1234567890",
  "address": {
    "street": "789 Transport Way",
    "city": "Chicago",
    "state": "IL",
    "zip": "60601"
  },
  "contactName": "John Smith",
  "contactPhone": "+1234567890",
  "contactEmail": "john@fastfreight.com",
  "paymentTerms": "NET30",
  "equipment": ["DRY_VAN", "REEFER"],
  "preferredLanes": [
    {
      "origin": { "city": "Chicago", "state": "IL" },
      "destination": { "city": "Dallas", "state": "TX" }
    }
  ]
}
```

### Update Carrier
```http
PUT /carriers/{carrierId}
```

### Approve Carrier
```http
POST /carriers/{carrierId}/approve
```

### Upload Carrier Document
```http
POST /carriers/{carrierId}/documents
```

**Request:** Multipart form data
- `file`: Document file (PDF, JPG, PNG)
- `type`: Document type (W9, INSURANCE, AUTHORITY, CONTRACT)
- `expiresAt`: Expiration date (optional)

---

## Customer Management Endpoints

### List Customers
```http
GET /customers
```

### Get Customer Details
```http
GET /customers/{customerId}
```

### Create Customer
```http
POST /customers
```

**Request Body:**
```json
{
  "companyName": "XYZ Corporation",
  "industry": "Manufacturing",
  "website": "https://xyzcorp.com",
  "billingAddress": {
    "street": "100 Business Blvd",
    "city": "New York",
    "state": "NY",
    "zip": "10001"
  },
  "billingEmail": "billing@xyzcorp.com",
  "billingPhone": "+1234567890",
  "creditLimit": 50000.00,
  "paymentTerms": "NET30",
  "contacts": [
    {
      "name": "Jane Doe",
      "title": "Logistics Manager",
      "email": "jane@xyzcorp.com",
      "phone": "+1234567890",
      "isPrimary": true
    }
  ]
}
```

### Update Customer
```http
PUT /customers/{customerId}
```

### Get Customer Credit Status
```http
GET /customers/{customerId}/credit
```

**Response:**
```json
{
  "success": true,
  "data": {
    "creditLimit": 50000.00,
    "creditUsed": 15000.00,
    "creditAvailable": 35000.00,
    "overdueAmount": 0.00,
    "paymentHistory": {
      "onTime": 45,
      "late": 2,
      "averageDaysToPay": 28
    }
  }
}
```

---

## Invoice Management Endpoints

### List Invoices
```http
GET /invoices
```

**Query Parameters:**
- `page`, `limit`: Pagination
- `status`: DRAFT, SENT, PAID, OVERDUE, VOID
- `customerId`: Filter by customer
- `dueDateFrom`, `dueDateTo`: Filter by due date range
- `search`: Search invoice number

### Get Invoice Details
```http
GET /invoices/{invoiceId}
```

### Create Invoice
```http
POST /invoices
```

**Request Body:**
```json
{
  "customerId": "cust_123",
  "lineItems": [
    {
      "loadId": "load_123",
      "description": "Transport: Dallas to Houston",
      "rate": 2500.00,
      "quantity": 1,
      "amount": 2500.00
    }
  ],
  "notes": "Thank you for your business",
  "terms": "Payment due within 30 days"
}
```

### Send Invoice
```http
POST /invoices/{invoiceId}/send
```

**Request Body:**
```json
{
  "recipients": ["billing@customer.com", "accounts@customer.com"],
  "cc": ["sales@ourcompany.com"],
  "message": "Please find attached invoice for recent shipments."
}
```

### Record Payment
```http
POST /invoices/{invoiceId}/payment
```

**Request Body:**
```json
{
  "amount": 2500.00,
  "paymentDate": "2025-02-15",
  "paymentMethod": "CHECK",
  "reference": "CHECK #1234"
}
```

### Void Invoice
```http
POST /invoices/{invoiceId}/void
```

**Request Body:**
```json
{
  "reason": "Duplicate invoice"
}
```

---

## Document Management Endpoints

### Upload Document
```http
POST /documents
```

**Request:** Multipart form data
- `file`: Document file
- `entityType`: LOAD, CARRIER, CUSTOMER
- `entityId`: ID of the related entity
- `type`: Document type
- `expiresAt`: Expiration date (optional)

### Get Document
```http
GET /documents/{documentId}
```

### Delete Document
```http
DELETE /documents/{documentId}
```

### Generate Rate Confirmation
```http
POST /loads/{loadId}/documents/rate-confirmation
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "doc_123",
    "type": "RATE_CONFIRMATION",
    "name": "RC-LD-2025-00001.pdf",
    "url": "https://s3.amazonaws.com/...",
    "createdAt": "2025-01-25T10:00:00Z"
  }
}
```

### Generate BOL
```http
POST /loads/{loadId}/documents/bol
```

---

## Reporting Endpoints

### Load Report
```http
GET /reports/loads
```

**Query Parameters:**
- `dateFrom`, `dateTo`: Date range
- `groupBy`: day, week, month
- `customerId`: Filter by customer
- `carrierId`: Filter by carrier

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalLoads": 150,
      "totalRevenue": 375000.00,
      "totalCost": 300000.00,
      "totalMargin": 75000.00,
      "averageMarginPercent": 20
    },
    "byStatus": {
      "BOOKED": 20,
      "IN_TRANSIT": 15,
      "DELIVERED": 100,
      "INVOICED": 15
    },
    "byPeriod": [
      {
        "period": "2025-01",
        "loads": 50,
        "revenue": 125000.00,
        "margin": 25000.00
      }
    ]
  }
}
```

### Revenue Report
```http
GET /reports/revenue
```

### Carrier Performance Report
```http
GET /reports/carrier-performance
```

**Query Parameters:**
- `carrierId`: Specific carrier or all
- `dateFrom`, `dateTo`: Date range

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "carrier": {
        "id": "carr_123",
        "companyName": "Fast Freight"
      },
      "metrics": {
        "totalLoads": 50,
        "onTimePickup": 96,
        "onTimeDelivery": 94,
        "claimsRatio": 0.02,
        "averageRate": 2.15,
        "totalRevenue": 107500.00
      }
    }
  ]
}
```

### Export Report
```http
POST /reports/export
```

**Request Body:**
```json
{
  "reportType": "LOADS",
  "format": "EXCEL",
  "dateFrom": "2025-01-01",
  "dateTo": "2025-01-31",
  "filters": {
    "status": ["DELIVERED", "INVOICED"]
  }
}
```

---

## User Management Endpoints

### List Users
```http
GET /users
```

### Get User Details
```http
GET /users/{userId}
```

### Create User
```http
POST /users
```

**Request Body:**
```json
{
  "email": "dispatcher@company.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "+1234567890",
  "roleIds": ["dispatcher"],
  "permissions": {
    "loads": ["view", "create", "edit"],
    "carriers": ["view"],
    "invoices": ["view"]
  }
}
```

### Update User
```http
PUT /users/{userId}
```

### Deactivate User
```http
POST /users/{userId}/deactivate
```

### Update User Permissions
```http
PUT /users/{userId}/permissions
```

**Request Body:**
```json
{
  "permissions": {
    "loads": ["view", "create", "edit", "delete"],
    "carriers": ["view", "create"],
    "invoices": ["view", "create"]
  }
}
```

---

## Organization Settings Endpoints

### Get Organization Settings
```http
GET /organization/settings
```

**Response:**
```json
{
  "success": true,
  "data": {
    "general": {
      "name": "ABC Logistics",
      "logo": "https://...",
      "website": "https://abclogistics.com",
      "timezone": "America/Chicago"
    },
    "documentNumbering": {
      "loadPrefix": "LD",
      "loadStartNumber": 1000,
      "invoicePrefix": "INV",
      "invoiceStartNumber": 5000
    },
    "emailTemplates": {
      "rateConfirmation": "...",
      "invoice": "...",
      "podRequest": "..."
    },
    "integrations": {
      "dat": {
        "enabled": true,
        "autoPost": true
      },
      "truckerTools": {
        "enabled": true
      }
    }
  }
}
```

### Update Organization Settings
```http
PUT /organization/settings
```

### Get Document Templates
```http
GET /organization/templates
```

### Update Document Template
```http
PUT /organization/templates/{templateType}
```

**Request Body:**
```json
{
  "templateType": "RATE_CONFIRMATION",
  "fields": [
    { "key": "loadNumber", "label": "Load #", "required": true },
    { "key": "customerRate", "label": "Rate", "required": true },
    { "key": "commodity", "label": "Commodity", "required": true }
  ],
  "template": "<html>{{loadNumber}}...</html>"
}
```

---

## Integration Endpoints

### Load Board Integration

#### Post to DAT
```http
POST /integrations/dat/post-load
```

**Request Body:**
```json
{
  "loadId": "load_123"
}
```

#### Search DAT Trucks
```http
GET /integrations/dat/search-trucks
```

**Query Parameters:**
- `origin`: Origin city/state
- `destination`: Destination city/state
- `equipmentType`: Equipment type
- `date`: Pickup date

### Tracking Integration

#### Setup Tracking
```http
POST /integrations/tracking/setup
```

**Request Body:**
```json
{
  "loadId": "load_123",
  "method": "TRUCKER_TOOLS",
  "driverPhone": "+1234567890"
}
```

#### Get Tracking Updates
```http
GET /integrations/tracking/updates/{loadId}
```

### Compliance Integration

#### Verify Carrier
```http
GET /integrations/highway/verify-carrier/{mcNumber}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "mcNumber": "123456",
    "companyName": "Fast Freight LLC",
    "authorityStatus": "ACTIVE",
    "insurance": {
      "liability": 1000000,
      "cargo": 100000,
      "expiryDate": "2025-12-31"
    },
    "safety": {
      "rating": "SATISFACTORY",
      "outOfService": 0.05
    }
  }
}
```

---

## Webhooks

### Webhook Events
The system can send webhooks for the following events:
- `load.created`
- `load.status_changed`
- `load.carrier_assigned`
- `carrier.document_expiring`
- `invoice.paid`
- `invoice.overdue`

### Webhook Payload Format
```json
{
  "event": "load.status_changed",
  "timestamp": "2025-01-25T15:30:00Z",
  "data": {
    "loadId": "load_123",
    "previousStatus": "BOOKED",
    "newStatus": "IN_TRANSIT",
    "changedBy": "user_123"
  }
}
```

### Configure Webhooks
```http
POST /webhooks
```

**Request Body:**
```json
{
  "url": "https://yourapp.com/webhooks/tms",
  "events": ["load.created", "load.status_changed"],
  "secret": "webhook_secret_key"
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `AUTH_INVALID_CREDENTIALS` | Invalid email or password |
| `AUTH_TOKEN_EXPIRED` | JWT token has expired |
| `AUTH_UNAUTHORIZED` | Not authorized for this resource |
| `VALIDATION_ERROR` | Request validation failed |
| `RESOURCE_NOT_FOUND` | Requested resource not found |
| `DUPLICATE_RESOURCE` | Resource already exists |
| `ORGANIZATION_LIMIT_REACHED` | Organization plan limit reached |
| `INTEGRATION_ERROR` | Third-party integration failed |
| `INTERNAL_ERROR` | Internal server error |

---

## Rate Limiting

API requests are rate limited per organization:
- **Standard endpoints**: 1000 requests per hour
- **Report endpoints**: 100 requests per hour
- **Integration endpoints**: 500 requests per hour

Rate limit headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 1612137600
```

---

## OpenAPI Specification

The complete OpenAPI 3.0 specification is available at:
```
GET /api-docs/openapi.json
```

Interactive API documentation (Swagger UI) is available at:
```
GET /api-docs
```