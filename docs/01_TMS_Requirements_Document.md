# Transportation Management System (TMS) - Complete Requirements Document

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technical Stack](#technical-stack)
3. [System Architecture](#system-architecture)
4. [Multi-Tenant Structure](#multi-tenant-structure)
5. [Functional Requirements](#functional-requirements)
6. [API Integrations](#api-integrations)
7. [Security Requirements](#security-requirements)
8. [Performance Requirements](#performance-requirements)
9. [Development Standards](#development-standards)

---

## 1. Project Overview

### Purpose
A comprehensive Transportation Management System (TMS) that enables freight brokers and logistics companies to manage their operations efficiently with multi-tenant architecture support.

### Core Features
- Multi-organization support with complete data isolation
- Load lifecycle management
- Carrier and driver management
- Real-time tracking and dispatch
- Automated invoicing and billing
- Comprehensive reporting
- Third-party integrations

### Target Users
- Freight brokers
- Logistics companies
- 3PL providers
- Transportation managers

---

## 2. Technical Stack

### Frontend
- **Framework:** Next.js 14+ (App Router)
- **UI Components:** shadcn/ui (fully integrated)
- **Styling:** Tailwind CSS
- **State Management:** Zustand / React Context
- **Forms:** React Hook Form + Zod validation
- **Data Fetching:** TanStack Query (React Query)
- **Charts:** Recharts
- **Icons:** Lucide React

### Backend
- **Runtime:** Node.js 20+
- **Framework:** Express.js / Fastify
- **ORM:** Prisma
- **Database:** PostgreSQL
- **Authentication:** JWT + Refresh Tokens
- **File Upload:** Multer + AWS S3
- **Email:** SendGrid
- **Queue:** Bull (Redis-based)
- **Caching:** Redis
- **API Documentation:** Swagger/OpenAPI

### Infrastructure
- **Hosting:** Railway
- **File Storage:** AWS S3
- **CDN:** CloudFront (for static assets)
- **Monitoring:** Sentry
- **Logging:** Winston + CloudWatch

---

## 3. System Architecture

### Architecture Pattern
- **Frontend:** Component-based architecture with atomic design
- **Backend:** Layered architecture (Controller → Service → Repository)
- **API:** RESTful with GraphQL for complex queries
- **Database:** Row-Level Security (RLS) for multi-tenancy

### Folder Structure
```
tms-platform/
├── apps/
│   ├── web/                    # Next.js frontend
│   │   ├── app/               # App router pages
│   │   ├── components/        # UI components
│   │   ├── hooks/            # Custom hooks
│   │   ├── lib/              # Utilities
│   │   └── styles/           # Global styles
│   └── api/                   # Node.js backend
│       ├── src/
│       │   ├── controllers/  # Route handlers
│       │   ├── services/     # Business logic
│       │   ├── repositories/ # Data access
│       │   ├── middleware/   # Express middleware
│       │   ├── utils/        # Utilities
│       │   └── types/        # TypeScript types
│       └── prisma/           # Database schema
├── packages/
│   ├── shared/               # Shared types/utils
│   └── config/               # Shared configs
└── docs/                     # Documentation
```

---

## 4. Multi-Tenant Structure

### Data Isolation Strategy
- **Database Level:** Separate schemas per organization
- **Application Level:** Tenant ID in every query
- **File Storage:** Separate S3 folders per organization
- **Caching:** Tenant-prefixed cache keys

### Tenant Identification
```typescript
interface TenantContext {
  organizationId: string;
  organizationSlug: string;
  settings: OrganizationSettings;
}
```

### Middleware Implementation
- Extract tenant from JWT token
- Validate tenant access
- Inject tenant context into requests
- Apply tenant filter to all queries

---

## 5. Functional Requirements

### 5.1 Authentication & Authorization

#### Multi-Factor Authentication
- Email/Password login
- 2FA with TOTP
- Password reset flow
- Session management

#### Role-Based Access Control (RBAC)
```typescript
enum Permission {
  // Load permissions
  LOAD_VIEW_ALL = 'load:view:all',
  LOAD_VIEW_OWN = 'load:view:own',
  LOAD_CREATE = 'load:create',
  LOAD_EDIT = 'load:edit',
  LOAD_DELETE = 'load:delete',
  
  // Carrier permissions
  CARRIER_VIEW = 'carrier:view',
  CARRIER_CREATE = 'carrier:create',
  CARRIER_EDIT = 'carrier:edit',
  CARRIER_DELETE = 'carrier:delete',
  
  // Invoice permissions
  INVOICE_VIEW = 'invoice:view',
  INVOICE_CREATE = 'invoice:create',
  INVOICE_SEND = 'invoice:send',
  INVOICE_VOID = 'invoice:void',
  
  // Report permissions
  REPORT_VIEW = 'report:view',
  REPORT_EXPORT = 'report:export',
  
  // Admin permissions
  USER_MANAGE = 'user:manage',
  SETTINGS_MANAGE = 'settings:manage',
}
```

### 5.2 Load Management

#### Load Entity
```typescript
interface Load {
  id: string;
  organizationId: string;
  loadNumber: string; // Auto-generated, same as RC# and BOL#
  status: LoadStatus;
  
  // Shipper info
  shipperId: string;
  shipperLocation: Location;
  pickupDate: Date;
  pickupTimeWindow: TimeWindow;
  
  // Consignee info
  consigneeId: string;
  consigneeLocation: Location;
  deliveryDate: Date;
  deliveryTimeWindow: TimeWindow;
  
  // Load details
  commodity: string;
  weight: number;
  pieces: number;
  dimensions: Dimensions;
  equipmentType: EquipmentType;
  
  // Rates
  customerRate: Money;
  carrierRate: Money;
  margin: Money;
  
  // Assignments
  carrierId?: string;
  driverId?: string;
  truckId?: string;
  
  // Documents
  documents: LoadDocument[];
  
  // Tracking
  currentLocation?: GPSLocation;
  eta?: Date;
  
  // Metadata
  notes: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}
```

#### Load Statuses
- `QUOTE` - Initial quote stage
- `BOOKED` - Load confirmed
- `DISPATCHED` - Assigned to carrier
- `IN_TRANSIT` - Picked up and moving
- `DELIVERED` - Delivered to consignee
- `POD_RECEIVED` - Proof of delivery received
- `INVOICED` - Invoice sent
- `PAID` - Payment received
- `CANCELLED` - Load cancelled

### 5.3 Document Management

#### Document Types
- Rate Confirmation (customizable template)
- Bill of Lading (customizable template)
- Proof of Delivery
- Carrier Packets
- Insurance Documents
- Invoices

#### Document Numbering
```typescript
interface DocumentNumbering {
  organizationId: string;
  documentType: 'RATE_CONFIRMATION' | 'BOL' | 'INVOICE';
  prefix?: string;
  startNumber: number;
  currentNumber: number;
  format: string; // e.g., "RC-{YYYY}-{NUMBER}"
}
```

### 5.4 Carrier Management

#### Carrier Entity
```typescript
interface Carrier {
  id: string;
  organizationId: string;
  
  // Basic info
  mcNumber: string;
  dotNumber: string;
  companyName: string;
  dba?: string;
  
  // Contact
  email: string;
  phone: string;
  fax?: string;
  address: Address;
  
  // Compliance
  authorityStatus: 'ACTIVE' | 'INACTIVE';
  insuranceExpiry: Date;
  insuranceCoverage: Money;
  safetyRating?: string;
  
  // Documents
  documents: CarrierDocument[];
  
  // Performance
  totalLoads: number;
  onTimePercentage: number;
  rating: number;
  
  // Financial
  paymentTerms: PaymentTerms;
  preferredPaymentMethod: PaymentMethod;
  w9OnFile: boolean;
}
```

#### Carrier Onboarding Flow
1. Initial data collection
2. FMCSA verification via Highway.com
3. Insurance verification
4. W9 collection
5. Contract execution
6. System access setup

### 5.5 Customer Management

#### Customer Entity
```typescript
interface Customer {
  id: string;
  organizationId: string;
  
  // Basic info
  companyName: string;
  industry: string;
  website?: string;
  
  // Billing
  billingAddress: Address;
  billingEmail: string;
  paymentTerms: 'NET15' | 'NET30' | 'NET45' | 'NET60';
  creditLimit: Money;
  creditUsed: Money;
  
  // Contacts
  contacts: CustomerContact[];
  
  // Preferences
  preferredCarriers: string[];
  lanePreferences: LanePreference[];
  equipmentPreferences: EquipmentType[];
  
  // Metrics
  totalRevenue: Money;
  totalLoads: number;
  averageMargin: number;
}
```

### 5.6 Invoicing & Billing

#### Invoice Generation
- Auto-generate from delivered loads
- Customizable invoice templates
- Batch invoicing capability
- Multiple invoice formats (PDF, Excel)

#### Invoice Entity
```typescript
interface Invoice {
  id: string;
  organizationId: string;
  invoiceNumber: string;
  customerId: string;
  
  // Dates
  invoiceDate: Date;
  dueDate: Date;
  
  // Line items
  lineItems: InvoiceLineItem[];
  
  // Totals
  subtotal: Money;
  tax: Money;
  total: Money;
  
  // Payment
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'VOID';
  paymentMethod?: PaymentMethod;
  paymentDate?: Date;
  
  // Delivery
  sentAt?: Date;
  sentTo?: string[];
  viewedAt?: Date;
}
```

### 5.7 Reporting & Analytics

#### Standard Reports
1. **Load Reports**
   - Load activity by date range
   - Load profitability analysis
   - Lane performance metrics
   
2. **Carrier Reports**
   - Carrier performance scorecard
   - On-time delivery rates
   - Cost per mile analysis
   
3. **Customer Reports**
   - Revenue by customer
   - Customer profitability
   - Credit utilization
   
4. **Financial Reports**
   - P&L statements
   - Accounts receivable aging
   - Cash flow analysis

#### Report Features
- Custom date ranges
- Multiple export formats (PDF, Excel, CSV)
- Scheduled reports via email
- Real-time dashboard widgets
- Drill-down capabilities

### 5.8 Dispatch Management

#### Dispatch Board Features
- Drag-and-drop load assignment
- Real-time status updates
- Color-coded priority levels
- Filter by date, status, carrier
- Map view integration

#### Driver Assignment
```typescript
interface DriverAssignment {
  loadId: string;
  carrierId: string;
  driverId: string;
  truckId: string;
  
  // Instructions
  pickupInstructions: string;
  deliveryInstructions: string;
  
  // Tracking
  trackingEnabled: boolean;
  trackingMethod: 'GPS' | 'TRUCKER_TOOLS' | 'MACROPOINT';
  
  // Communication
  driverPhone: string;
  dispatcherNotes: string;
}
```

---

## 6. API Integrations

### 6.1 Google Maps Integration
```typescript
interface MapsIntegration {
  // Autocomplete for addresses
  autocompleteAddress(input: string): Promise<AddressSuggestion[]>;
  
  // Calculate routes
  calculateRoute(origin: Location, destination: Location): Promise<Route>;
  
  // Get mileage
  getDistance(route: Route): number;
  
  // Geocoding
  geocodeAddress(address: string): Promise<Coordinates>;
}
```

### 6.2 Load Board Integrations

#### DAT Integration
- Post loads to DAT
- Search available trucks
- Get rate estimates
- Market conditions data

#### Truckstop Integration
- Load posting
- Carrier search
- Document exchange
- Credit checks

### 6.3 Tracking Integrations

#### Trucker Tools
- Real-time GPS tracking
- ETA updates
- Driver communication
- Automated check calls

#### MacroPoint / Project44
- Multi-modal tracking
- Predictive ETAs
- Exception management
- Visibility API

### 6.4 Compliance Integration

#### Highway.com
- Carrier authority verification
- Insurance monitoring
- Safety score tracking
- Automated alerts for expirations

### 6.5 Communication Integrations

#### SendGrid Email
```typescript
interface EmailService {
  // Transactional emails
  sendRateConfirmation(load: Load, carrier: Carrier): Promise<void>;
  sendInvoice(invoice: Invoice, recipients: string[]): Promise<void>;
  sendPODRequest(load: Load): Promise<void>;
  
  // Bulk emails
  sendNewsletterToCarriers(content: string, carriers: Carrier[]): Promise<void>;
  
  // Templates
  templates: {
    rateConfirmation: string;
    invoice: string;
    podRequest: string;
    welcomeEmail: string;
  };
}
```

---

## 7. Security Requirements

### Authentication Security
- JWT tokens with 15-minute expiry
- Refresh tokens with 7-day expiry
- Token rotation on refresh
- Secure HTTP-only cookies
- CSRF protection

### Data Security
- All API endpoints require authentication
- Row-level security in database
- Encrypted sensitive data at rest
- SSL/TLS for all communications
- Input validation and sanitization

### Compliance
- SOC 2 Type II compliance ready
- GDPR compliant data handling
- Regular security audits
- Penetration testing

---

## 8. Performance Requirements

### Response Times
- API responses: < 200ms (p95)
- Page loads: < 1s (p90)
- Search operations: < 500ms
- Report generation: < 5s

### Scalability
- Support 10,000+ concurrent users
- Handle 1M+ loads per organization
- 99.9% uptime SLA
- Horizontal scaling capability

### Optimization
- Database indexing strategy
- Redis caching for frequent queries
- CDN for static assets
- Lazy loading for large datasets
- Pagination for list views

---

## 9. Development Standards

### Code Quality
- TypeScript for type safety
- ESLint + Prettier configuration
- Pre-commit hooks with Husky
- Minimum 80% test coverage
- Code review required for PRs

### Testing Strategy
- Unit tests with Jest
- Integration tests for APIs
- E2E tests with Cypress
- Performance testing
- Security testing

### Documentation
- API documentation with Swagger
- Component documentation with Storybook
- README files for each module
- Inline code comments
- Architecture decision records (ADRs)

### CI/CD Pipeline
- Automated testing on PR
- Build verification
- Staging deployment
- Production deployment with approval
- Rollback capability