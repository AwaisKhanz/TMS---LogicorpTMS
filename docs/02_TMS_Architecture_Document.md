# TMS Technical Architecture Document

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Principles](#architecture-principles)
3. [High-Level Architecture](#high-level-architecture)
4. [Frontend Architecture](#frontend-architecture)
5. [Backend Architecture](#backend-architecture)
6. [Database Architecture](#database-architecture)
7. [Integration Architecture](#integration-architecture)
8. [Security Architecture](#security-architecture)
9. [Deployment Architecture](#deployment-architecture)
10. [Monitoring & Observability](#monitoring--observability)

---

## 1. System Overview

The TMS platform is designed as a modern, cloud-native, multi-tenant SaaS application built on microservices principles while maintaining monolithic simplicity for initial deployment.

### Key Architectural Decisions
- **Multi-tenant**: Schema-based isolation with RLS
- **API-First**: All features exposed via REST/GraphQL APIs
- **Event-Driven**: Async processing for heavy operations
- **Cloud-Native**: Containerized, horizontally scalable
- **Security-First**: Zero-trust architecture

---

## 2. Architecture Principles

### Design Principles
1. **Separation of Concerns**: Clear boundaries between layers
2. **DRY (Don't Repeat Yourself)**: Shared libraries and components
3. **SOLID Principles**: Clean, maintainable code
4. **12-Factor App**: Cloud-ready application
5. **Domain-Driven Design**: Business logic organized by domains

### Technical Principles
- **Stateless Services**: No server-side sessions
- **Idempotent Operations**: Safe retries
- **Eventual Consistency**: For non-critical operations
- **Fail-Fast**: Quick failure detection
- **Circuit Breakers**: Prevent cascade failures

---

## 3. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         External Users                           │
└─────────────────┬───────────────────────────┬───────────────────┘
                  │                           │
                  ▼                           ▼
         ┌────────────────┐          ┌────────────────┐
         │   Web Client   │          │  Mobile Client │
         │   (Next.js)    │          │    (Future)    │
         └────────┬───────┘          └────────┬───────┘
                  │                           │
                  ▼                           ▼
         ┌────────────────────────────────────────────┐
         │          API Gateway (Express)             │
         │        Rate Limiting | Auth | CORS         │
         └────────────────────┬───────────────────────┘
                              │
         ┌────────────────────┼───────────────────────┐
         │                    │                       │
         ▼                    ▼                       ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Core API      │  │  Integration    │  │  Notification   │
│   Service       │  │    Service      │  │    Service      │
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘
         │                    │                     │
         └────────────────────┼─────────────────────┘
                              │
                              ▼
                 ┌────────────────────────┐
                 │   PostgreSQL (RLS)     │
                 │   Multi-tenant DB      │
                 └────────────────────────┘
                              │
         ┌────────────────────┼───────────────────────┐
         │                    │                       │
         ▼                    ▼                       ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Redis Cache   │  │    AWS S3       │  │ External APIs   │
│                 │  │  File Storage   │  │ (DAT, etc.)    │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

---

## 4. Frontend Architecture

### Technology Stack
- **Framework**: Next.js 14 (App Router)
- **UI Library**: shadcn/ui
- **State Management**: Zustand + React Query
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form + Zod
- **Build**: Turbo

### Component Architecture

```
components/
├── ui/                    # shadcn/ui components
│   ├── button.tsx
│   ├── dialog.tsx
│   └── ...
├── common/               # Shared components
│   ├── Layout/
│   ├── Header/
│   └── Footer/
├── features/             # Feature-specific components
│   ├── loads/
│   │   ├── LoadList/
│   │   ├── LoadForm/
│   │   └── LoadDetails/
│   ├── carriers/
│   └── invoices/
└── hooks/                # Custom React hooks
    ├── useAuth.ts
    ├── useOrganization.ts
    └── usePermissions.ts
```

### State Management Pattern

```typescript
// Global State (Zustand)
interface AppState {
  user: User | null;
  organization: Organization | null;
  theme: Theme;
  setUser: (user: User | null) => void;
  setOrganization: (org: Organization | null) => void;
}

// Server State (React Query)
const useLoads = (filters?: LoadFilters) => {
  return useQuery({
    queryKey: ['loads', filters],
    queryFn: () => loadService.getLoads(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
```

### Routing Structure

```
app/
├── (auth)/
│   ├── login/
│   ├── register/
│   └── forgot-password/
├── (dashboard)/
│   ├── layout.tsx        # Protected layout
│   ├── page.tsx          # Dashboard
│   ├── loads/
│   │   ├── page.tsx      # Load list
│   │   ├── new/page.tsx  # Create load
│   │   └── [id]/page.tsx # Load details
│   ├── carriers/
│   ├── customers/
│   ├── invoices/
│   └── settings/
└── api/                  # API routes (if needed)
```

### Performance Optimizations
- Code splitting by route
- Lazy loading for heavy components
- Image optimization with next/image
- Prefetching for anticipated navigation
- Service Worker for offline capability

---

## 5. Backend Architecture

### Layered Architecture

```
src/
├── controllers/          # HTTP request handlers
│   ├── auth.controller.ts
│   ├── load.controller.ts
│   └── carrier.controller.ts
├── services/            # Business logic
│   ├── auth.service.ts
│   ├── load.service.ts
│   └── integration.service.ts
├── repositories/        # Data access layer
│   ├── base.repository.ts
│   ├── load.repository.ts
│   └── carrier.repository.ts
├── middleware/         # Express middleware
│   ├── auth.middleware.ts
│   ├── tenant.middleware.ts
│   └── error.middleware.ts
├── utils/             # Utility functions
├── types/             # TypeScript types
└── config/            # Configuration
```

### Service Layer Pattern

```typescript
// Service Example
export class LoadService {
  constructor(
    private loadRepo: LoadRepository,
    private carrierService: CarrierService,
    private integrationService: IntegrationService,
    private emailService: EmailService
  ) {}

  async createLoad(data: CreateLoadDto, userId: string, orgId: string) {
    // Business logic validation
    await this.validateLoadData(data);
    
    // Generate load number
    const loadNumber = await this.generateLoadNumber(orgId);
    
    // Create load
    const load = await this.loadRepo.create({
      ...data,
      loadNumber,
      organizationId: orgId,
      createdBy: userId,
    });
    
    // Post to load boards if requested
    if (data.postToLoadBoards) {
      await this.integrationService.postToLoadBoards(load);
    }
    
    // Send confirmation email
    await this.emailService.sendLoadConfirmation(load);
    
    return load;
  }
}
```

### Repository Pattern

```typescript
// Base Repository
export abstract class BaseRepository<T> {
  constructor(protected prisma: PrismaClient) {}
  
  async findById(id: string, orgId: string): Promise<T | null> {
    return this.prisma[this.model].findFirst({
      where: { id, organizationId: orgId }
    });
  }
  
  async create(data: Partial<T>): Promise<T> {
    return this.prisma[this.model].create({ data });
  }
  
  // ... other CRUD operations
}

// Load Repository
export class LoadRepository extends BaseRepository<Load> {
  model = 'load';
  
  async findByStatus(status: LoadStatus, orgId: string) {
    return this.prisma.load.findMany({
      where: { status, organizationId: orgId },
      include: { carrier: true, customer: true }
    });
  }
}
```

### API Design

```typescript
// RESTful Routes
router.get('/api/v1/loads', auth, tenant, loadController.getLoads);
router.get('/api/v1/loads/:id', auth, tenant, loadController.getLoad);
router.post('/api/v1/loads', auth, tenant, validate(createLoadSchema), loadController.createLoad);
router.put('/api/v1/loads/:id', auth, tenant, validate(updateLoadSchema), loadController.updateLoad);
router.delete('/api/v1/loads/:id', auth, tenant, loadController.deleteLoad);

// GraphQL Schema
type Load {
  id: ID!
  loadNumber: String!
  status: LoadStatus!
  customer: Customer!
  carrier: Carrier
  shipper: Location!
  consignee: Location!
  rate: Money!
  documents: [Document!]!
}
```

### Background Jobs

```typescript
// Bull Queue Configuration
const loadQueue = new Bull('load-processing', {
  redis: redisConfig,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: false,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

// Job Processors
loadQueue.process('update-tracking', async (job) => {
  const { loadId } = job.data;
  const trackingData = await trackingService.getUpdate(loadId);
  await loadService.updateTracking(loadId, trackingData);
});
```

---

## 6. Database Architecture

### Multi-Tenant Strategy

```sql
-- Organization Schema
CREATE SCHEMA IF NOT EXISTS org_${organizationId};

-- Enable Row Level Security
ALTER TABLE loads ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY tenant_isolation ON loads
  FOR ALL
  USING (organization_id = current_setting('app.current_organization')::uuid);
```

### Database Schema Design

```prisma
// Prisma Schema
model Organization {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  settings    Json
  createdAt   DateTime @default(now())
  
  users       User[]
  loads       Load[]
  carriers    Carrier[]
  customers   Customer[]
}

model Load {
  id              String       @id @default(cuid())
  organizationId  String
  loadNumber      String
  status          LoadStatus   @default(QUOTE)
  
  // Relationships
  organization    Organization @relation(fields: [organizationId])
  customer        Customer     @relation(fields: [customerId])
  carrier         Carrier?     @relation(fields: [carrierId])
  
  // Shipper/Consignee
  shipperAddress  Json
  consigneeAddress Json
  
  // Dates
  pickupDate      DateTime
  deliveryDate    DateTime
  
  // Rates
  customerRate    Decimal      @db.Money
  carrierRate     Decimal?     @db.Money
  
  // Tracking
  currentLocation Json?
  eta             DateTime?
  
  // Audit
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  createdBy       String
  
  @@unique([organizationId, loadNumber])
  @@index([organizationId, status])
  @@index([organizationId, pickupDate])
}
```

### Database Optimization

#### Indexing Strategy
```sql
-- Performance indexes
CREATE INDEX idx_loads_org_status ON loads(organization_id, status);
CREATE INDEX idx_loads_org_dates ON loads(organization_id, pickup_date, delivery_date);
CREATE INDEX idx_carriers_org_mc ON carriers(organization_id, mc_number);
CREATE INDEX idx_invoices_org_status ON invoices(organization_id, status);

-- Full-text search
CREATE INDEX idx_loads_search ON loads USING gin(to_tsvector('english', 
  commodity || ' ' || shipper_address || ' ' || consignee_address));
```

#### Partitioning Strategy
```sql
-- Partition large tables by date
CREATE TABLE loads_2025 PARTITION OF loads
  FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
```

---

## 7. Integration Architecture

### Integration Service Pattern

```typescript
interface IntegrationService {
  name: string;
  authenticate(): Promise<void>;
  testConnection(): Promise<boolean>;
}

class DATIntegration implements IntegrationService {
  name = 'DAT';
  
  async authenticate() {
    const token = await this.getOAuthToken();
    this.client.setAuth(token);
  }
  
  async postLoad(load: Load) {
    const datLoad = this.transformToDATFormat(load);
    return this.client.post('/loads', datLoad);
  }
}
```

### API Gateway Pattern

```typescript
class IntegrationGateway {
  private integrations: Map<string, IntegrationService>;
  
  async postToAllLoadBoards(load: Load) {
    const results = await Promise.allSettled([
      this.integrations.get('DAT').postLoad(load),
      this.integrations.get('Truckstop').postLoad(load),
    ]);
    
    return this.processResults(results);
  }
}
```

### Webhook Handler

```typescript
// Webhook receiver for tracking updates
router.post('/webhooks/macropoint', 
  validateWebhookSignature,
  async (req, res) => {
    const event = req.body;
    
    await trackingQueue.add('process-tracking-update', {
      provider: 'macropoint',
      event,
    });
    
    res.status(200).send({ received: true });
  }
);
```

---

## 8. Security Architecture

### Authentication Flow

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌──────────┐
│ Client  │────▶│   API   │────▶│  Auth   │────▶│ Database │
│         │◀────│ Gateway │◀────│ Service │◀────│          │
└─────────┘     └─────────┘     └─────────┘     └──────────┘
    │                                   │
    │  1. Login Request                 │ 3. Validate Credentials
    │                                   │
    │  2. JWT + Refresh Token          │ 4. Generate Tokens
    ▼                                   ▼
```

### JWT Token Structure

```typescript
interface JWTPayload {
  sub: string;          // User ID
  org: string;          // Organization ID
  role: string;         // User role
  permissions: string[]; // Granted permissions
  iat: number;
  exp: number;
}
```

### Security Middleware Stack

```typescript
app.use(helmet()); // Security headers
app.use(cors(corsOptions)); // CORS
app.use(rateLimiter); // Rate limiting
app.use(authentication); // JWT validation
app.use(tenantIsolation); // Multi-tenant
app.use(authorization); // Permission check
app.use(auditLogger); // Audit trail
```

---

## 9. Deployment Architecture

### Container Structure

```dockerfile
# Dockerfile for API
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Railway Deployment

```yaml
# railway.toml
[build]
builder = "NIXPACKS"
buildCommand = "npm run build"

[deploy]
startCommand = "npm run start"
healthcheckPath = "/health"
healthcheckTimeout = 30

[service]
internalPort = 3000
```

### Environment Configuration

```bash
# Production Environment Variables
NODE_ENV=production
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
AWS_S3_BUCKET=tms-production
SENDGRID_API_KEY=...
JWT_SECRET=...
```

---

## 10. Monitoring & Observability

### Logging Strategy

```typescript
// Structured logging with Winston
const logger = winston.createLogger({
  format: winston.format.json(),
  defaultMeta: { service: 'tms-api' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});
```

### Metrics Collection

```typescript
// Prometheus metrics
const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
});
```

### Health Checks

```typescript
router.get('/health', (req, res) => {
  const health = {
    uptime: process.uptime(),
    status: 'OK',
    timestamp: Date.now(),
    checks: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      s3: await checkS3(),
    },
  };
  
  res.status(200).json(health);
});
```

### Error Tracking

```typescript
// Sentry configuration
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
  ],
  tracesSampleRate: 0.1,
});
```