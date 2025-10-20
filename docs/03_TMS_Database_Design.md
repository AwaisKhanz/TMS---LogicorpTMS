# TMS Database Design Document

## Table of Contents
1. [Database Overview](#database-overview)
2. [Multi-Tenant Architecture](#multi-tenant-architecture)
3. [Schema Design](#schema-design)
4. [Indexes & Performance](#indexes--performance)
5. [Data Types & Constraints](#data-types--constraints)
6. [Migrations Strategy](#migrations-strategy)
7. [Backup & Recovery](#backup--recovery)
8. [Query Patterns](#query-patterns)

---

## 1. Database Overview

### Technology Choice
- **Database**: PostgreSQL 15+
- **ORM**: Prisma
- **Migration Tool**: Prisma Migrate
- **Connection Pooling**: PgBouncer
- **Monitoring**: pg_stat_statements

### Design Principles
- Normalized to 3NF where appropriate
- Denormalized for performance where needed
- Row-Level Security (RLS) for multi-tenancy
- Audit trails for compliance
- Soft deletes for data recovery

---

## 2. Multi-Tenant Architecture

### Tenant Isolation Strategy

```sql
-- Enable RLS on all tenant tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE loads ENABLE ROW LEVEL SECURITY;
ALTER TABLE carriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY tenant_isolation_policy ON loads
  FOR ALL
  USING (organization_id = current_setting('app.current_tenant')::uuid);

-- Function to set current tenant
CREATE OR REPLACE FUNCTION set_current_tenant(tenant_id uuid)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_tenant', tenant_id::text, true);
END;
$$ LANGUAGE plpgsql;
```

### Tenant Context Management

```typescript
// Prisma middleware for tenant isolation
prisma.$use(async (params, next) => {
  if (params.model && tenantModels.includes(params.model)) {
    if (params.action === 'create') {
      params.args.data.organizationId = getCurrentTenantId();
    } else if (['findMany', 'findFirst', 'findUnique'].includes(params.action)) {
      params.args.where = {
        ...params.args.where,
        organizationId: getCurrentTenantId(),
      };
    }
  }
  return next(params);
});
```

---

## 3. Schema Design

### Complete Prisma Schema

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==================== ORGANIZATIONS ====================
model Organization {
  id                String   @id @default(cuid())
  name              String
  slug              String   @unique
  logo              String?
  website           String?
  
  // Settings
  settings          Json     @default("{}")
  documentNumbering Json     @default("{}")
  
  // Billing
  billingEmail      String?
  plan              String   @default("trial")
  planExpiresAt     DateTime?
  
  // Status
  isActive          Boolean  @default(true)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  // Relations
  users             User[]
  loads             Load[]
  carriers          Carrier[]
  customers         Customer[]
  invoices          Invoice[]
  documents         Document[]
  auditLogs         AuditLog[]
}

// ==================== USERS & AUTH ====================
model User {
  id               String    @id @default(cuid())
  organizationId   String
  email            String    @unique
  passwordHash     String
  
  // Profile
  firstName        String
  lastName         String
  phone            String?
  avatar           String?
  
  // Auth
  emailVerified    Boolean   @default(false)
  emailVerifiedAt  DateTime?
  twoFactorEnabled Boolean   @default(false)
  twoFactorSecret  String?
  
  // Status
  isActive         Boolean   @default(true)
  lastLoginAt      DateTime?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
  
  // Relations
  organization     Organization @relation(fields: [organizationId], references: [id])
  roles            UserRole[]
  sessions         Session[]
  auditLogs        AuditLog[]
  createdLoads     Load[]       @relation("CreatedLoads")
  assignedLoads    Load[]       @relation("AssignedLoads")
  
  @@index([organizationId])
  @@index([email])
}

model Role {
  id          String       @id @default(cuid())
  name        String       @unique
  description String?
  permissions Permission[]
  users       UserRole[]
  isSystem    Boolean      @default(false)
}

model Permission {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  resource    String
  action      String
  roles       Role[]
  
  @@unique([resource, action])
}

model UserRole {
  userId  String
  roleId  String
  user    User   @relation(fields: [userId], references: [id])
  role    Role   @relation(fields: [roleId], references: [id])
  
  @@id([userId, roleId])
}

model Session {
  id           String   @id @default(cuid())
  userId       String
  token        String   @unique
  refreshToken String   @unique
  userAgent    String?
  ipAddress    String?
  expiresAt    DateTime
  createdAt    DateTime @default(now())
  
  user         User     @relation(fields: [userId], references: [id])
  
  @@index([token])
  @@index([refreshToken])
}

// ==================== LOADS ====================
model Load {
  id              String      @id @default(cuid())
  organizationId  String
  loadNumber      String
  referenceNumber String?
  status          LoadStatus  @default(QUOTE)
  
  // Customer & Carrier
  customerId      String
  carrierId       String?
  
  // Locations
  shipperName     String
  shipperAddress  Json        // { street, city, state, zip, country, lat, lng }
  shipperPhone    String
  shipperEmail    String?
  pickupDate      DateTime
  pickupStart     String      // "08:00"
  pickupEnd       String      // "17:00"
  
  consigneeName   String
  consigneeAddress Json       // { street, city, state, zip, country, lat, lng }
  consigneePhone  String
  consigneeEmail  String?
  deliveryDate    DateTime
  deliveryStart   String      // "08:00"
  deliveryEnd     String      // "17:00"
  
  // Load Details
  commodity       String
  weight          Int         // in lbs
  pieces          Int?
  dimensions      Json?       // { length, width, height }
  equipmentType   EquipmentType
  loadType        LoadType    @default(FULL_TRUCK)
  
  // Rates & Costs
  customerRate    Decimal     @db.Money
  carrierRate     Decimal?    @db.Money
  margin          Decimal?    @db.Money
  
  // Additional Costs
  accessorials    Json        @default("[]") // [{ type, amount, description }]
  
  // Tracking
  currentLocation Json?       // { lat, lng, address, timestamp }
  eta             DateTime?
  trackingMethod  String?     // "TRUCKER_TOOLS", "MACROPOINT", etc.
  
  // Instructions
  pickupNotes     String?
  deliveryNotes   String?
  internalNotes   String?
  
  // Status Timestamps
  bookedAt        DateTime?
  dispatchedAt    DateTime?
  pickedUpAt      DateTime?
  deliveredAt     DateTime?
  invoicedAt      DateTime?
  paidAt          DateTime?
  
  // Metadata
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  createdBy       String
  assignedTo      String?
  deletedAt       DateTime?   // Soft delete
  
  // Relations
  organization    Organization @relation(fields: [organizationId], references: [id])
  customer        Customer     @relation(fields: [customerId], references: [id])
  carrier         Carrier?     @relation(fields: [carrierId], references: [id])
  creator         User         @relation("CreatedLoads", fields: [createdBy], references: [id])
  assignee        User?        @relation("AssignedLoads", fields: [assignedTo], references: [id])
  documents       Document[]
  events          LoadEvent[]
  invoice         InvoiceLineItem?
  
  @@unique([organizationId, loadNumber])
  @@index([organizationId, status])
  @@index([organizationId, pickupDate])
  @@index([organizationId, customerId])
  @@index([organizationId, carrierId])
}

model LoadEvent {
  id             String   @id @default(cuid())
  loadId         String
  eventType      String   // "STATUS_CHANGE", "LOCATION_UPDATE", etc.
  eventData      Json
  createdAt      DateTime @default(now())
  createdBy      String?
  
  load           Load     @relation(fields: [loadId], references: [id])
}

// ==================== CARRIERS ====================
model Carrier {
  id              String    @id @default(cuid())
  organizationId  String
  
  // Identification
  mcNumber        String
  dotNumber       String?
  scac            String?
  
  // Company Info
  companyName     String
  dba             String?
  ein             String?
  
  // Contact
  email           String
  phone           String
  fax             String?
  address         Json      // { street, city, state, zip, country }
  
  // Primary Contact
  contactName     String
  contactPhone    String
  contactEmail    String
  
  // Compliance
  authorityStatus String    @default("ACTIVE")
  insuranceExpiry DateTime?
  insuranceAmount Decimal?  @db.Money
  cargoInsurance  Decimal?  @db.Money
  liabilityInsurance Decimal? @db.Money
  
  // Safety
  safetyRating    String?
  csa             Json?     // CSA scores
  
  // Financial
  paymentTerms    String    @default("NET30")
  paymentMethod   String    @default("CHECK")
  w9OnFile        Boolean   @default(false)
  factoring       Boolean   @default(false)
  factoringCompany String?
  
  // Performance
  totalLoads      Int       @default(0)
  onTimeDelivery  Float     @default(100)
  rating          Float     @default(5)
  
  // Preferences
  preferredLanes  Json      @default("[]")
  equipment       String[]  @default([])
  
  // Status
  isActive        Boolean   @default(true)
  isApproved      Boolean   @default(false)
  approvedAt      DateTime?
  approvedBy      String?
  notes           String?
  
  // Metadata
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  deletedAt       DateTime? // Soft delete
  
  // Relations
  organization    Organization @relation(fields: [organizationId], references: [id])
  loads           Load[]
  documents       Document[]
  contacts        CarrierContact[]
  
  @@unique([organizationId, mcNumber])
  @@index([organizationId, isActive])
  @@index([organizationId, companyName])
}

model CarrierContact {
  id         String   @id @default(cuid())
  carrierId  String
  name       String
  title      String?
  email      String
  phone      String
  isPrimary  Boolean  @default(false)
  
  carrier    Carrier  @relation(fields: [carrierId], references: [id])
  
  @@index([carrierId])
}

// ==================== CUSTOMERS ====================
model Customer {
  id              String    @id @default(cuid())
  organizationId  String
  
  // Company Info
  companyName     String
  dba             String?
  industry        String?
  website         String?
  ein             String?
  
  // Billing
  billingAddress  Json      // { street, city, state, zip, country }
  billingEmail    String
  billingPhone    String
  
  // Credit
  creditLimit     Decimal   @default(0) @db.Money
  creditUsed      Decimal   @default(0) @db.Money
  paymentTerms    String    @default("NET30")
  
  // Stats
  totalRevenue    Decimal   @default(0) @db.Money
  totalLoads      Int       @default(0)
  averageMargin   Float     @default(0)
  
  // Preferences
  preferredCarriers Json    @default("[]")
  equipmentTypes    String[] @default([])
  
  // Status
  isActive        Boolean   @default(true)
  notes           String?
  
  // Metadata
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  deletedAt       DateTime? // Soft delete
  
  // Relations
  organization    Organization @relation(fields: [organizationId], references: [id])
  loads           Load[]
  invoices        Invoice[]
  contacts        CustomerContact[]
  documents       Document[]
  
  @@unique([organizationId, companyName])
  @@index([organizationId, isActive])
}

model CustomerContact {
  id         String   @id @default(cuid())
  customerId String
  name       String
  title      String?
  email      String
  phone      String
  isPrimary  Boolean  @default(false)
  
  customer   Customer @relation(fields: [customerId], references: [id])
  
  @@index([customerId])
}

// ==================== INVOICES ====================
model Invoice {
  id              String    @id @default(cuid())
  organizationId  String
  invoiceNumber   String
  customerId      String
  
  // Dates
  invoiceDate     DateTime  @default(now())
  dueDate         DateTime
  
  // Amounts
  subtotal        Decimal   @db.Money
  tax             Decimal   @default(0) @db.Money
  discount        Decimal   @default(0) @db.Money
  total           Decimal   @db.Money
  
  // Payment
  status          InvoiceStatus @default(DRAFT)
  paidAmount      Decimal   @default(0) @db.Money
  paymentMethod   String?
  paymentDate     DateTime?
  paymentReference String?
  
  // Email Tracking
  sentAt          DateTime?
  sentTo          String[]  @default([])
  viewedAt        DateTime?
  remindersSent   Int       @default(0)
  lastReminderAt  DateTime?
  
  // Metadata
  notes           String?
  terms           String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  createdBy       String
  
  // Relations
  organization    Organization @relation(fields: [organizationId], references: [id])
  customer        Customer     @relation(fields: [customerId], references: [id])
  lineItems       InvoiceLineItem[]
  
  @@unique([organizationId, invoiceNumber])
  @@index([organizationId, status])
  @@index([organizationId, customerId])
}

model InvoiceLineItem {
  id          String   @id @default(cuid())
  invoiceId   String
  loadId      String?  @unique
  description String
  quantity    Int      @default(1)
  rate        Decimal  @db.Money
  amount      Decimal  @db.Money
  
  invoice     Invoice  @relation(fields: [invoiceId], references: [id])
  load        Load?    @relation(fields: [loadId], references: [id])
  
  @@index([invoiceId])
}

// ==================== DOCUMENTS ====================
model Document {
  id              String       @id @default(cuid())
  organizationId  String
  
  // Reference
  entityType      EntityType   // "LOAD", "CARRIER", "CUSTOMER", etc.
  entityId        String
  
  // Document Info
  type            DocumentType // "RATE_CONFIRMATION", "BOL", "POD", etc.
  name            String
  fileUrl         String
  fileSize        Int
  mimeType        String
  
  // Metadata
  uploadedAt      DateTime     @default(now())
  uploadedBy      String
  expiresAt       DateTime?
  
  // Relations
  organization    Organization @relation(fields: [organizationId], references: [id])
  load            Load?        @relation(fields: [entityId], references: [id])
  carrier         Carrier?     @relation(fields: [entityId], references: [id])
  customer        Customer?    @relation(fields: [entityId], references: [id])
  
  @@index([organizationId, entityType, entityId])
}

// ==================== AUDIT LOGS ====================
model AuditLog {
  id              String   @id @default(cuid())
  organizationId  String
  userId          String
  action          String   // "CREATE", "UPDATE", "DELETE", "VIEW"
  entityType      String   // "LOAD", "CARRIER", etc.
  entityId        String
  changes         Json?    // Before/after values
  ipAddress       String?
  userAgent       String?
  createdAt       DateTime @default(now())
  
  organization    Organization @relation(fields: [organizationId], references: [id])
  user            User         @relation(fields: [userId], references: [id])
  
  @@index([organizationId, entityType, entityId])
  @@index([organizationId, userId])
  @@index([createdAt])
}

// ==================== ENUMS ====================
enum LoadStatus {
  QUOTE
  BOOKED
  DISPATCHED
  IN_TRANSIT
  DELIVERED
  POD_RECEIVED
  INVOICED
  PAID
  CANCELLED
}

enum LoadType {
  FULL_TRUCK
  LTL
  PARTIAL
  EXPEDITED
}

enum EquipmentType {
  DRY_VAN
  REEFER
  FLATBED
  STEP_DECK
  RGN
  POWER_ONLY
  HOTSHOT
  BOX_TRUCK
  STRAIGHT_TRUCK
  OTHER
}

enum InvoiceStatus {
  DRAFT
  SENT
  VIEWED
  PAID
  PARTIAL
  OVERDUE
  VOID
}

enum EntityType {
  LOAD
  CARRIER
  CUSTOMER
  INVOICE
  USER
}

enum DocumentType {
  RATE_CONFIRMATION
  BOL
  POD
  INVOICE
  W9
  INSURANCE
  AUTHORITY
  CONTRACT
  OTHER
}
```

---

## 4. Indexes & Performance

### Critical Indexes

```sql
-- Tenant isolation indexes
CREATE INDEX idx_all_tables_org_id ON ALL TABLES (organization_id);

-- Load performance indexes
CREATE INDEX idx_loads_status_date ON loads(organization_id, status, pickup_date);
CREATE INDEX idx_loads_customer ON loads(organization_id, customer_id);
CREATE INDEX idx_loads_carrier ON loads(organization_id, carrier_id);
CREATE INDEX idx_loads_number ON loads(organization_id, load_number);

-- Search indexes
CREATE INDEX idx_loads_search ON loads USING gin(
  to_tsvector('english', 
    load_number || ' ' || 
    reference_number || ' ' || 
    commodity || ' ' || 
    shipper_name || ' ' || 
    consignee_name
  )
);

-- Carrier indexes
CREATE INDEX idx_carriers_mc ON carriers(organization_id, mc_number);
CREATE INDEX idx_carriers_active ON carriers(organization_id, is_active);

-- Invoice indexes
CREATE INDEX idx_invoices_status ON invoices(organization_id, status);
CREATE INDEX idx_invoices_due ON invoices(organization_id, due_date) WHERE status != 'PAID';

-- Audit log indexes
CREATE INDEX idx_audit_entity ON audit_logs(organization_id, entity_type, entity_id);
CREATE INDEX idx_audit_user ON audit_logs(organization_id, user_id);
CREATE INDEX idx_audit_date ON audit_logs(created_at);
```

### Query Optimization

```sql
-- Analyze query performance
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Materialized view for dashboard stats
CREATE MATERIALIZED VIEW load_stats AS
SELECT 
  organization_id,
  DATE_TRUNC('day', pickup_date) as date,
  status,
  COUNT(*) as count,
  SUM(customer_rate) as revenue,
  SUM(customer_rate - carrier_rate) as margin
FROM loads
GROUP BY organization_id, date, status;

-- Refresh strategy
CREATE INDEX idx_load_stats ON load_stats(organization_id, date);
REFRESH MATERIALIZED VIEW CONCURRENTLY load_stats;
```

---

## 5. Data Types & Constraints

### Custom Types and Domains

```sql
-- Money type with precision
CREATE DOMAIN money_amount AS NUMERIC(12,2) CHECK (VALUE >= 0);

-- Phone number validation
CREATE DOMAIN phone_number AS VARCHAR(20) 
  CHECK (VALUE ~ '^\+?[1-9]\d{1,14}$');

-- Email validation
CREATE DOMAIN email_address AS VARCHAR(255) 
  CHECK (VALUE ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$');

-- Load number format
CREATE DOMAIN load_number AS VARCHAR(20) 
  CHECK (VALUE ~ '^[A-Z0-9-]+$');
```

### Check Constraints

```sql
-- Load date constraints
ALTER TABLE loads ADD CONSTRAINT check_dates 
  CHECK (pickup_date <= delivery_date);

-- Rate constraints
ALTER TABLE loads ADD CONSTRAINT check_rates 
  CHECK (customer_rate >= 0 AND carrier_rate >= 0);

-- Invoice constraints
ALTER TABLE invoices ADD CONSTRAINT check_amounts 
  CHECK (total = subtotal + tax - discount);
```

---

## 6. Migrations Strategy

### Migration Patterns

```typescript
// Prisma migration example
// prisma/migrations/20250120_add_tracking/migration.sql

-- Add tracking fields to loads
ALTER TABLE loads ADD COLUMN current_location JSONB;
ALTER TABLE loads ADD COLUMN eta TIMESTAMP;
ALTER TABLE loads ADD COLUMN tracking_method VARCHAR(50);

-- Create tracking history table
CREATE TABLE load_tracking_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  load_id UUID REFERENCES loads(id),
  location JSONB NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  source VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tracking_history ON load_tracking_history(load_id, timestamp);
```

### Zero-Downtime Migrations

```typescript
// Step 1: Add new column with default
ALTER TABLE loads ADD COLUMN new_field VARCHAR(255) DEFAULT 'default_value';

// Step 2: Backfill data in batches
UPDATE loads SET new_field = calculated_value 
WHERE id IN (SELECT id FROM loads WHERE new_field = 'default_value' LIMIT 1000);

// Step 3: Add constraints after backfill
ALTER TABLE loads ALTER COLUMN new_field SET NOT NULL;
ALTER TABLE loads ALTER COLUMN new_field DROP DEFAULT;
```

---

## 7. Backup & Recovery

### Backup Strategy

```bash
# Daily backups with pg_dump
pg_dump -h localhost -U postgres -d tms_production \
  --format=custom \
  --verbose \
  --file="backup_$(date +%Y%m%d_%H%M%S).dump"

# Point-in-time recovery setup
archive_mode = on
archive_command = 'cp %p /backup/archive/%f'
wal_level = replica
```

### Restore Procedures

```bash
# Restore from backup
pg_restore -h localhost -U postgres -d tms_restore \
  --verbose \
  --clean \
  --if-exists \
  backup_20250120_120000.dump

# Restore specific table
pg_restore -h localhost -U postgres -d tms_production \
  --table=loads \
  --data-only \
  backup_20250120_120000.dump
```

---

## 8. Query Patterns

### Common Query Examples

```typescript
// Get active loads for organization
const activeLoads = await prisma.load.findMany({
  where: {
    organizationId,
    status: {
      in: ['BOOKED', 'DISPATCHED', 'IN_TRANSIT']
    },
    deletedAt: null
  },
  include: {
    customer: true,
    carrier: true
  }
});

// Dashboard statistics
const stats = await prisma.$queryRaw`
  SELECT 
    COUNT(*) FILTER (WHERE status = 'IN_TRANSIT') as active_loads,
    COUNT(*) FILTER (WHERE pickup_date = CURRENT_DATE) as todays_pickups,
    COUNT(*) FILTER (WHERE delivery_date = CURRENT_DATE) as todays_deliveries,
    SUM(customer_rate - carrier_rate) FILTER (WHERE status = 'DELIVERED' 
      AND delivered_at >= CURRENT_DATE - INTERVAL '30 days') as monthly_margin
  FROM loads
  WHERE organization_id = ${organizationId}::uuid
`;

// Search loads with full-text search
const searchResults = await prisma.$queryRaw`
  SELECT * FROM loads
  WHERE organization_id = ${organizationId}::uuid
    AND to_tsvector('english', load_number || ' ' || commodity) 
        @@ plainto_tsquery('english', ${searchTerm})
  ORDER BY pickup_date DESC
  LIMIT 20
`;
```

### Performance Monitoring Queries

```sql
-- Slow query analysis
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
WHERE mean_time > 100
ORDER BY mean_time DESC
LIMIT 20;

-- Table size monitoring
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Index usage statistics
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```