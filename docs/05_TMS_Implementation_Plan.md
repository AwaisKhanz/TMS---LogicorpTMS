# TMS Implementation Plan

## Project Phases Overview

### Phase 1: Foundation (Week 1-2)
- Project setup and configuration
- Authentication system
- Multi-tenant architecture
- Base UI components

### Phase 2: Core Features (Week 3-6)
- Load management
- Carrier management
- Customer management
- Document handling

### Phase 3: Advanced Features (Week 7-9)
- Dispatch board
- Invoice system
- Reporting module
- Email notifications

### Phase 4: Integrations (Week 10-12)
- Third-party API integrations
- Real-time tracking
- Load board connections

### Phase 5: Polish & Launch (Week 13-14)
- Performance optimization
- Security audit
- Testing & QA
- Deployment

---

## Detailed Implementation Steps

### Phase 1: Foundation Setup

#### 1.1 Project Initialization
```bash
# Create monorepo structure
npx create-turbo@latest tms-platform
cd tms-platform

# Install core dependencies
npm install -w web next@latest react react-dom
npm install -w api express prisma @prisma/client
npm install -D typescript @types/node

# Setup environment files
cp .env.example .env.local
```

#### 1.2 Configure Next.js with shadcn/ui
```bash
# In apps/web directory
npx shadcn-ui@latest init

# Configure shadcn with these options:
# - TypeScript: Yes
# - Style: Default
# - Base color: Slate
# - CSS variables: Yes
# - Tailwind config: app/globals.css
# - Components: @/components
# - Utils: @/lib/utils
# - React Server Components: Yes
# - Write to components.json: Yes

# Install all shadcn components we'll need
npx shadcn-ui@latest add alert badge button calendar card checkbox command dialog dropdown-menu form input label navigation-menu popover radio-group scroll-area select separator sheet skeleton switch table tabs textarea toast toggle tooltip
```

#### 1.3 Setup Tailwind Configuration
```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
```

#### 1.4 Setup Prisma and Database
```bash
# Initialize Prisma
cd apps/api
npx prisma init

# Create initial schema (copy from Database Design Document)
# Then generate client
npx prisma generate

# Create initial migration
npx prisma migrate dev --name init
```

#### 1.5 Authentication System

##### Backend Auth Setup
```typescript
// apps/api/src/services/auth.service.ts
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

export class AuthService {
  async register(data: RegisterDto) {
    // Check if user exists
    const exists = await prisma.user.findUnique({
      where: { email: data.email }
    });
    
    if (exists) {
      throw new AppError('User already exists', 400);
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);
    
    // Create organization and user in transaction
    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: data.organizationName,
          slug: this.generateSlug(data.organizationName),
        }
      });
      
      const user = await tx.user.create({
        data: {
          organizationId: org.id,
          email: data.email,
          passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
        }
      });
      
      // Assign admin role
      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: 'admin-role-id',
        }
      });
      
      return { user, organization: org };
    });
    
    // Generate tokens
    const tokens = this.generateTokens(result.user, result.organization);
    
    return { ...result, ...tokens };
  }
  
  generateTokens(user: User, organization: Organization) {
    const payload = {
      sub: user.id,
      org: organization.id,
      email: user.email,
    };
    
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '15m',
    });
    
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: '7d',
    });
    
    return { accessToken, refreshToken };
  }
}
```

##### Frontend Auth Setup
```typescript
// apps/web/lib/auth.ts
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const res = await fetch(`${process.env.API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials),
        });
        
        const user = await res.json();
        
        if (res.ok && user) {
          return user;
        }
        return null;
      }
    })
  ],
  // ... rest of config
};
```

---

### Phase 2: Core Features Implementation

#### 2.1 Load Management Module

##### Step 1: Create Load List Page
```typescript
// apps/web/app/(dashboard)/loads/page.tsx
import { LoadsDataTable } from '@/components/features/loads/loads-data-table';
import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function LoadsPage() {
  const loads = await getLoads();
  
  return (
    <div className="space-y-6">
      <PageHeader
        title="Loads"
        description="Manage your shipments and loads"
        action={
          <Button asChild>
            <Link href="/loads/new">Create Load</Link>
          </Button>
        }
      />
      <LoadsDataTable data={loads} />
    </div>
  );
}
```

##### Step 2: Create Load Form
```typescript
// apps/web/components/features/loads/load-form.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loadSchema } from "@/lib/validations/load";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function LoadForm() {
  const form = useForm({
    resolver: zodResolver(loadSchema),
    defaultValues: {
      commodity: "",
      weight: 0,
      equipmentType: "DRY_VAN",
      customerRate: 0,
      carrierRate: 0,
    }
  });
  
  const onSubmit = async (data) => {
    try {
      await createLoad(data);
      toast.success("Load created successfully");
      router.push("/loads");
    } catch (error) {
      toast.error("Failed to create load");
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Shipper Section */}
        <Card>
          <CardHeader>
            <CardTitle>Shipper Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="shipperName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shipper Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Add more shipper fields */}
          </CardContent>
        </Card>
        
        {/* Submit Button */}
        <Button type="submit" size="lg">
          Create Load
        </Button>
      </form>
    </Form>
  );
}
```

##### Step 3: Create API Endpoints
```typescript
// apps/api/src/routes/load.routes.ts
import { Router } from 'express';
import { LoadController } from '../controllers/load.controller';
import { authenticate, authorize, validateTenant } from '../middleware';
import { validateRequest } from '../middleware/validation';
import { createLoadSchema, updateLoadSchema } from '../validations/load';

const router = Router();
const loadController = new LoadController();

router.use(authenticate, validateTenant);

router.get('/', authorize(['LOAD_VIEW']), loadController.getLoads);
router.get('/:id', authorize(['LOAD_VIEW']), loadController.getLoad);
router.post('/', authorize(['LOAD_CREATE']), validateRequest(createLoadSchema), loadController.createLoad);
router.put('/:id', authorize(['LOAD_EDIT']), validateRequest(updateLoadSchema), loadController.updateLoad);
router.delete('/:id', authorize(['LOAD_DELETE']), loadController.deleteLoad);

export default router;
```

#### 2.2 Document Management System

##### Step 1: File Upload Service
```typescript
// apps/api/src/services/file-upload.service.ts
import multer from 'multer';
import multerS3 from 'multer-s3';
import { S3Client } from '@aws-sdk/client-s3';
import path from 'path';
import fs from 'fs/promises';

export class FileUploadService {
  private s3Client: S3Client;
  private storage: multer.StorageEngine;
  
  constructor() {
    if (process.env.NODE_ENV === 'production') {
      this.s3Client = new S3Client({
        region: process.env.AWS_S3_REGION,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      });
      
      this.storage = multerS3({
        s3: this.s3Client,
        bucket: process.env.AWS_S3_BUCKET,
        key: (req, file, cb) => {
          const orgId = req.auth.organizationId;
          const key = `${orgId}/${Date.now()}-${file.originalname}`;
          cb(null, key);
        },
      });
    } else {
      // Local storage for development
      this.storage = multer.diskStorage({
        destination: async (req, file, cb) => {
          const uploadDir = path.join(process.cwd(), 'uploads', req.auth.organizationId);
          await fs.mkdir(uploadDir, { recursive: true });
          cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
          cb(null, `${Date.now()}-${file.originalname}`);
        },
      });
    }
  }
  
  getUploadMiddleware() {
    return multer({
      storage: this.storage,
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: (req, file, cb) => {
        const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type'));
        }
      },
    });
  }
}
```

##### Step 2: Document Templates
```typescript
// apps/api/src/services/document-template.service.ts
import PDFDocument from 'pdfkit';
import Handlebars from 'handlebars';

export class DocumentTemplateService {
  async generateRateConfirmation(load: Load, template: string) {
    // Compile template
    const compiledTemplate = Handlebars.compile(template);
    const html = compiledTemplate({
      load,
      loadNumber: load.loadNumber,
      shipper: load.shipperAddress,
      consignee: load.consigneeAddress,
      rate: load.customerRate,
      // ... more data
    });
    
    // Generate PDF
    const doc = new PDFDocument();
    // ... PDF generation logic
    
    return doc;
  }
  
  async generateBOL(load: Load, template: string) {
    // Similar to rate confirmation
  }
}
```

---

### Phase 3: Advanced Features

#### 3.1 Dispatch Board Implementation

##### Real-time Updates with Socket.io
```typescript
// apps/api/src/services/socket.service.ts
import { Server } from 'socket.io';
import { Server as HTTPServer } from 'http';

export class SocketService {
  private io: Server;
  
  initialize(httpServer: HTTPServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.CLIENT_URL,
        credentials: true,
      },
    });
    
    this.io.use(async (socket, next) => {
      // Authenticate socket connection
      const token = socket.handshake.auth.token;
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.data.userId = decoded.sub;
        socket.data.organizationId = decoded.org;
        next();
      } catch (err) {
        next(new Error('Authentication error'));
      }
    });
    
    this.io.on('connection', (socket) => {
      // Join organization room
      socket.join(`org:${socket.data.organizationId}`);
      
      // Handle events
      socket.on('load:update', async (data) => {
        // Broadcast to organization
        this.io.to(`org:${socket.data.organizationId}`).emit('load:updated', data);
      });
    });
  }
  
  emitToOrganization(orgId: string, event: string, data: any) {
    this.io.to(`org:${orgId}`).emit(event, data);
  }
}
```

##### Dispatch Board UI
```typescript
// apps/web/components/features/dispatch/dispatch-board.tsx
"use client";

import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useSocket } from '@/hooks/use-socket';
import { Card } from '@/components/ui/card';

const statusColumns = [
  { id: 'BOOKED', title: 'Booked' },
  { id: 'DISPATCHED', title: 'Dispatched' },
  { id: 'IN_TRANSIT', title: 'In Transit' },
  { id: 'DELIVERED', title: 'Delivered' },
];

export function DispatchBoard({ loads }) {
  const socket = useSocket();
  const [boardLoads, setBoardLoads] = useState(loads);
  
  useEffect(() => {
    socket.on('load:updated', (updatedLoad) => {
      setBoardLoads(prev => 
        prev.map(load => load.id === updatedLoad.id ? updatedLoad : load)
      );
    });
    
    return () => {
      socket.off('load:updated');
    };
  }, [socket]);
  
  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    
    const { draggableId, destination } = result;
    const newStatus = destination.droppableId;
    
    // Update local state immediately
    setBoardLoads(prev => 
      prev.map(load => 
        load.id === draggableId 
          ? { ...load, status: newStatus }
          : load
      )
    );
    
    // Update on server
    await updateLoadStatus(draggableId, newStatus);
  };
  
  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-4 gap-4">
        {statusColumns.map(column => (
          <div key={column.id} className="space-y-2">
            <h3 className="font-semibold">{column.title}</h3>
            <Droppable droppableId={column.id}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="space-y-2 min-h-[500px] p-2 bg-gray-50 rounded-lg"
                >
                  {boardLoads
                    .filter(load => load.status === column.id)
                    .map((load, index) => (
                      <Draggable key={load.id} draggableId={load.id} index={index}>
                        {(provided) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="p-3"
                          >
                            <div className="text-sm font-medium">{load.loadNumber}</div>
                            <div className="text-xs text-gray-500">
                              {load.shipperAddress.city} → {load.consigneeAddress.city}
                            </div>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}
```

#### 3.2 Invoice System

##### Invoice Generation
```typescript
// apps/api/src/services/invoice.service.ts
export class InvoiceService {
  async createInvoice(customerId: string, lineItems: InvoiceLineItem[], orgId: string) {
    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber(orgId);
    
    // Calculate totals
    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const tax = subtotal * 0.1; // Example tax rate
    const total = subtotal + tax;
    
    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        organizationId: orgId,
        invoiceNumber,
        customerId,
        subtotal,
        tax,
        total,
        dueDate: addDays(new Date(), 30), // NET30
        lineItems: {
          create: lineItems,
        },
      },
      include: {
        customer: true,
        lineItems: {
          include: { load: true },
        },
      },
    });
    
    // Generate PDF
    const pdf = await this.generateInvoicePDF(invoice);
    
    // Send email
    await this.emailService.sendInvoice(invoice, pdf);
    
    return invoice;
  }
  
  async generateInvoicePDF(invoice: Invoice) {
    const doc = new PDFDocument();
    
    // Header
    doc.fontSize(20).text('INVOICE', 50, 50);
    doc.fontSize(12).text(`Invoice #: ${invoice.invoiceNumber}`, 50, 80);
    doc.text(`Date: ${format(invoice.invoiceDate, 'MM/dd/yyyy')}`, 50, 100);
    
    // Customer info
    doc.text(`Bill To:`, 50, 130);
    doc.text(invoice.customer.companyName, 50, 150);
    // ... more invoice details
    
    return doc;
  }
}
```

---

### Phase 4: Third-Party Integrations

#### 4.1 Google Maps Integration
```typescript
// apps/api/src/services/integrations/google-maps.service.ts
import { Client } from '@googlemaps/google-maps-services-js';

export class GoogleMapsService {
  private client: Client;
  
  constructor() {
    this.client = new Client({});
  }
  
  async getDistance(origin: string, destination: string) {
    const response = await this.client.distancematrix({
      params: {
        origins: [origin],
        destinations: [destination],
        key: process.env.GOOGLE_MAPS_API_KEY,
        units: 'imperial',
      },
    });
    
    return response.data.rows[0].elements[0].distance;
  }
  
  async autocompleteAddress(input: string) {
    const response = await this.client.placeAutocomplete({
      params: {
        input,
        key: process.env.GOOGLE_MAPS_API_KEY,
        types: 'address',
        components: { country: 'us' },
      },
    });
    
    return response.data.predictions;
  }
  
  async geocode(address: string) {
    const response = await this.client.geocode({
      params: {
        address,
        key: process.env.GOOGLE_MAPS_API_KEY,
      },
    });
    
    const location = response.data.results[0].geometry.location;
    return { lat: location.lat, lng: location.lng };
  }
}
```

#### 4.2 DAT Integration
```typescript
// apps/api/src/services/integrations/dat.service.ts
export class DATIntegration {
  private apiUrl = 'https://api.dat.com/v1';
  private token: string;
  
  async authenticate() {
    const response = await fetch(`${this.apiUrl}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.DAT_CLIENT_ID,
        client_secret: process.env.DAT_CLIENT_SECRET,
        grant_type: 'client_credentials',
      }),
    });
    
    const data = await response.json();
    this.token = data.access_token;
  }
  
  async postLoad(load: Load) {
    const payload = {
      origin: {
        city: load.shipperAddress.city,
        state: load.shipperAddress.state,
        zip: load.shipperAddress.zip,
      },
      destination: {
        city: load.consigneeAddress.city,
        state: load.consigneeAddress.state,
        zip: load.consigneeAddress.zip,
      },
      equipment: this.mapEquipmentType(load.equipmentType),
      weight: load.weight,
      rate: load.carrierRate,
      commodity: load.commodity,
      pickupDate: load.pickupDate,
    };
    
    const response = await fetch(`${this.apiUrl}/loads`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    return response.json();
  }
}
```

#### 4.3 Tracking Integration
```typescript
// apps/api/src/services/integrations/tracking.service.ts
export class TrackingService {
  async setupTracking(load: Load, method: 'TRUCKER_TOOLS' | 'MACROPOINT') {
    switch (method) {
      case 'TRUCKER_TOOLS':
        return this.truckerToolsService.createTracking({
          loadId: load.id,
          driverPhone: load.carrier.contactPhone,
          pickupDate: load.pickupDate,
          deliveryDate: load.deliveryDate,
        });
        
      case 'MACROPOINT':
        return this.macropointService.createTracking({
          orderId: load.loadNumber,
          carrier: {
            name: load.carrier.companyName,
            mcNumber: load.carrier.mcNumber,
          },
          stops: [
            {
              type: 'pickup',
              location: load.shipperAddress,
              appointmentTime: load.pickupDate,
            },
            {
              type: 'delivery',
              location: load.consigneeAddress,
              appointmentTime: load.deliveryDate,
            },
          ],
        });
    }
  }
  
  async handleTrackingUpdate(provider: string, data: any) {
    // Process tracking update
    const update = this.parseTrackingData(provider, data);
    
    // Update load
    await prisma.load.update({
      where: { id: update.loadId },
      data: {
        currentLocation: update.location,
        eta: update.eta,
      },
    });
    
    // Emit real-time update
    this.socketService.emitToOrganization(
      update.organizationId,
      'tracking:update',
      update
    );
  }
}
```

---

### Phase 5: Testing & Deployment

#### 5.1 Testing Strategy

##### Unit Tests
```typescript
// apps/api/src/services/__tests__/load.service.test.ts
describe('LoadService', () => {
  let loadService: LoadService;
  let prisma: PrismaClient;
  
  beforeEach(() => {
    prisma = new PrismaClient();
    loadService = new LoadService(prisma);
  });
  
  describe('create', () => {
    it('should create a load with valid data', async () => {
      const loadData = {
        customerId: 'customer-1',
        commodity: 'Steel Beams',
        weight: 45000,
        // ... other fields
      };
      
      const load = await loadService.create(loadData, 'org-1', 'user-1');
      
      expect(load).toBeDefined();
      expect(load.loadNumber).toMatch(/^[A-Z0-9-]+$/);
      expect(load.organizationId).toBe('org-1');
    });
    
    it('should enforce organization isolation', async () => {
      // Create load in org-1
      const load = await loadService.create(data, 'org-1', 'user-1');
      
      // Try to access from org-2
      await expect(
        loadService.findById(load.id, 'org-2')
      ).rejects.toThrow('Load not found');
    });
  });
});
```

##### Integration Tests
```typescript
// apps/api/src/__tests__/loads.integration.test.ts
describe('Loads API', () => {
  let app: Application;
  let token: string;
  
  beforeAll(async () => {
    app = createApp();
    token = await getTestToken();
  });
  
  describe('POST /api/loads', () => {
    it('should create a load', async () => {
      const response = await request(app)
        .post('/api/loads')
        .set('Authorization', `Bearer ${token}`)
        .send({
          customerId: 'test-customer',
          commodity: 'Test Commodity',
          // ... other fields
        });
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.loadNumber).toBeDefined();
    });
  });
});
```

#### 5.2 Deployment Configuration

##### Railway Configuration
```toml
# railway.toml
[build]
builder = "NIXPACKS"
buildCommand = "npm run build"
watchPatterns = ["apps/**", "packages/**"]

[deploy]
numReplicas = 2
startCommand = "npm run start"
healthcheckPath = "/api/health"
healthcheckTimeout = 30
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3

[[services]]
name = "web"
internalPort = 3000
environmentVariables = ["NEXT_PUBLIC_API_URL"]

[[services]]
name = "api"
internalPort = 4000
environmentVariables = ["DATABASE_URL", "REDIS_URL", "JWT_SECRET"]
```

##### Environment Setup
```bash
# Production environment variables
DATABASE_URL=${{RAILWAY.DATABASE_URL}}
REDIS_URL=${{RAILWAY.REDIS_URL}}
NODE_ENV=production

# Secrets (set in Railway dashboard)
JWT_SECRET=
JWT_REFRESH_SECRET=
SENDGRID_API_KEY=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=tms-production
AWS_S3_REGION=us-east-1

# API Keys
GOOGLE_MAPS_API_KEY=
DAT_CLIENT_ID=
DAT_CLIENT_SECRET=
TRUCKER_TOOLS_API_KEY=
MACROPOINT_API_KEY=
HIGHWAY_API_KEY=
```

---

## Development Workflow

### Daily Development Process
1. **Morning Standup** - Review tasks for the day
2. **Feature Branch** - Create feature branch from develop
3. **Implementation** - Follow the Cursor Rules document
4. **Testing** - Write tests alongside code
5. **Code Review** - Submit PR for review
6. **Merge** - Merge to develop after approval

### Git Workflow
```bash
# Start new feature
git checkout develop
git pull origin develop
git checkout -b feature/load-management

# Make changes and commit
git add .
git commit -m "feat(loads): implement load creation form"

# Push and create PR
git push origin feature/load-management
```

### Code Review Checklist
- [ ] TypeScript types are properly defined
- [ ] Multi-tenant isolation is enforced
- [ ] All user inputs are validated
- [ ] Error handling is implemented
- [ ] Tests are written and passing
- [ ] No console.logs in code
- [ ] shadcn/ui components used where applicable
- [ ] API responses follow standard format
- [ ] Database queries are optimized
- [ ] Security best practices followed

---

## Milestone Tracking

### Week 1-2: Foundation ✓
- [x] Project setup
- [x] Authentication system
- [x] Multi-tenant architecture
- [x] Base UI components

### Week 3-4: Load Management
- [ ] Load CRUD operations
- [ ] Document generation
- [ ] Search and filtering
- [ ] Bulk operations

### Week 5-6: Carrier & Customer
- [ ] Carrier management
- [ ] Customer management
- [ ] Contact management
- [ ] Credit tracking

### Week 7-8: Dispatch & Tracking
- [ ] Dispatch board
- [ ] Real-time updates
- [ ] GPS tracking
- [ ] Status management

### Week 9: Invoicing
- [ ] Invoice generation
- [ ] Payment tracking
- [ ] Email delivery
- [ ] Reminders

### Week 10-11: Integrations
- [ ] Google Maps
- [ ] DAT/Truckstop
- [ ] Tracking providers
- [ ] Compliance checks

### Week 12: Reporting
- [ ] Standard reports
- [ ] Custom reports
- [ ] Export functionality
- [ ] Dashboard widgets

### Week 13-14: Polish
- [ ] Performance optimization
- [ ] Security audit
- [ ] User testing
- [ ] Documentation
- [ ] Deployment