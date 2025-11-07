# TMS Environment Configuration Guide

## Overview

This guide provides detailed instructions for setting up and configuring the TMS platform across different environments (development, staging, production).

---

## Environment Files Structure

```
tms-platform/
├── .env.example          # Example configuration (commit to repo)
├── .env.local            # Local development (gitignored)
├── .env.staging          # Staging environment (gitignored)
├── .env.production       # Production environment (gitignored)
├── apps/
│   ├── web/
│   │   └── .env.local    # Frontend-specific env
│   └── api/
│       └── .env.local    # Backend-specific env
└── packages/
    └── database/
        └── .env          # Database migrations env
```

---

## Complete Environment Variables

### 1. Core Configuration

```bash
# Application
NODE_ENV=development|staging|production
APP_NAME="TMS Platform"
APP_URL=http://localhost:3000
API_URL=http://localhost:4000
PORT=4000

# Frontend URLs
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

**Important:** You must obtain a Google Maps API key from Google Cloud Console and enable the following APIs:
- Maps JavaScript API
- Places API
- Geocoding API (optional, for reverse geocoding)

See the Google Maps API Setup section below for detailed instructions.

### 2. Database Configuration

```bash
# PostgreSQL
DATABASE_URL="postgresql://username:password@localhost:5432/tms_dev?schema=public"
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis
REDIS_URL="redis://localhost:6379"
REDIS_PASSWORD=""
REDIS_TLS=false
```

### 3. Authentication & Security

```bash
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-minimum-32-chars
JWT_REFRESH_SECRET=your-refresh-token-secret-minimum-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Encryption
ENCRYPTION_KEY=your-32-character-encryption-key

# Session
SESSION_SECRET=your-session-secret-minimum-32-chars
SESSION_NAME=tms_session
SESSION_SECURE=true # Set to false for local development

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
```

### 4. File Storage

```bash
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET=tms-dev-bucket-123456789012
AWS_S3_REGION=us-east-1
AWS_S3_ENDPOINT=https://s3.amazonaws.com # Optional for S3-compatible services

# Local Storage (Development)
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760 # 10MB in bytes
```

### 5. Email Configuration

```bash
# SendGrid
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME="TMS Platform"

# Email Templates IDs (from SendGrid)
SENDGRID_TEMPLATE_WELCOME=d-xxxxxxxxxxxxx
SENDGRID_TEMPLATE_RATE_CONFIRMATION=d-xxxxxxxxxxxxx
SENDGRID_TEMPLATE_INVOICE=d-xxxxxxxxxxxxx
SENDGRID_TEMPLATE_PASSWORD_RESET=d-xxxxxxxxxxxxx
```

### 6. Third-Party Integrations

```bash
# Google Maps
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# DAT Integration
DAT_API_URL=https://api.dat.com/v1
DAT_CLIENT_ID=your_dat_client_id
DAT_CLIENT_SECRET=your_dat_client_secret

# Truckstop Integration
TRUCKSTOP_API_URL=https://api.truckstop.com/v1
TRUCKSTOP_API_KEY=your_truckstop_api_key
TRUCKSTOP_API_SECRET=your_truckstop_secret

# Trucker Tools
TRUCKER_TOOLS_API_URL=https://api.truckertools.com/v1
TRUCKER_TOOLS_API_KEY=your_trucker_tools_key
TRUCKER_TOOLS_WEBHOOK_SECRET=your_webhook_secret

# MacroPoint
MACROPOINT_API_URL=https://api.macropoint.com/v1
MACROPOINT_CLIENT_ID=your_macropoint_client_id
MACROPOINT_CLIENT_SECRET=your_macropoint_secret

# Highway.com
HIGHWAY_API_URL=https://api.highway.com/v1
HIGHWAY_API_KEY=your_highway_api_key
```

### 7. Monitoring & Logging

```bash
# Sentry
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
SENTRY_ENVIRONMENT=development
SENTRY_TRACES_SAMPLE_RATE=0.1

# Logging
LOG_LEVEL=debug|info|warn|error
LOG_FORMAT=json|pretty
LOG_TO_FILE=true
LOG_DIR=./logs

# Monitoring
ENABLE_METRICS=true
METRICS_PORT=9090
```

### 8. Queue Configuration

```bash
# Bull Queue (Redis-based)
QUEUE_REDIS_URL=redis://localhost:6379
QUEUE_REDIS_PASSWORD=""
QUEUE_PREFIX=tms
QUEUE_REMOVE_ON_COMPLETE=100
QUEUE_REMOVE_ON_FAIL=500
```

### 9. Rate Limiting

```bash
# API Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=3600000 # 1 hour
RATE_LIMIT_MAX_REQUESTS=1000
RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS=false
```

### 10. Feature Flags

```bash
# Feature Toggles
FEATURE_LOAD_BOARD_INTEGRATION=true
FEATURE_REAL_TIME_TRACKING=true
FEATURE_ADVANCED_REPORTING=false
FEATURE_MOBILE_APP=false
```

---

## Environment-Specific Configurations

### Development Environment (.env.local)

```bash
# Development Overrides
NODE_ENV=development
APP_URL=http://localhost:3000
API_URL=http://localhost:4000
DATABASE_URL="postgresql://postgres:password@localhost:5432/tms_dev"
REDIS_URL="redis://localhost:6379"

# Disable security features for development
SESSION_SECURE=false
CORS_ORIGIN=*

# Development Email (use Mailtrap or similar)
SENDGRID_API_KEY=use_mailtrap_instead
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USER=your_mailtrap_user
MAIL_PASS=your_mailtrap_pass

# Local file storage
USE_LOCAL_STORAGE=true
UPLOAD_DIR=./uploads

# Development logging
LOG_LEVEL=debug
LOG_FORMAT=pretty
```

### Staging Environment (.env.staging)

```bash
# Staging Configuration
NODE_ENV=staging
APP_URL=https://staging.tms-platform.com
API_URL=https://api-staging.tms-platform.com
DATABASE_URL="postgresql://staging_user:staging_pass@staging-db.amazonaws.com:5432/tms_staging"

# Staging S3 Bucket
AWS_S3_BUCKET=tms-staging-bucket

# Reduced rate limits for testing
RATE_LIMIT_MAX_REQUESTS=100

# Staging monitoring
SENTRY_ENVIRONMENT=staging
LOG_LEVEL=info
```

### Production Environment (.env.production)

```bash
# Production Configuration
NODE_ENV=production
APP_URL=https://app.tms-platform.com
API_URL=https://api.tms-platform.com
DATABASE_URL="postgresql://prod_user:prod_pass@prod-db.amazonaws.com:5432/tms_production"

# Production S3 Bucket
AWS_S3_BUCKET=tms-production-bucket

# Production security
SESSION_SECURE=true
CORS_ORIGIN=https://app.tms-platform.com

# Production monitoring
SENTRY_ENVIRONMENT=production
LOG_LEVEL=warn
SENTRY_TRACES_SAMPLE_RATE=0.01
```

---

## Setup Instructions

### 1. Initial Setup

```bash
# Clone repository
git clone https://github.com/your-org/tms-platform.git
cd tms-platform

# Copy example environment file
cp .env.example .env.local

# Install dependencies
npm install

# Setup database
npm run db:setup
```

### 2. Database Setup

```bash
# Create database
createdb tms_dev

# Run migrations
npm run db:migrate

# Seed database (development only)
npm run db:seed
```

### 3. Redis Setup

```bash
# Install Redis (macOS)
brew install redis
brew services start redis

# Install Redis (Ubuntu)
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
```

### 4. AWS S3 Setup

1. Create S3 bucket in AWS Console
2. Create IAM user with S3 access
3. Generate access keys
4. Update environment variables

**S3 Bucket Policy:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::tms-dev-bucket-123456789012/public/*"
    }
  ]
}
```

**CORS Configuration:**

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["http://localhost:3000"],
    "ExposeHeaders": ["ETag"]
  }
]
```

### 5. SendGrid Setup

1. Create SendGrid account
2. Verify sender domain
3. Create API key with full access
4. Create email templates
5. Update template IDs in environment

### 6. Google Maps API Setup

The TMS platform uses Google Places Autocomplete for address input fields. Follow these steps to set up:

#### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable billing (Google provides $200 free credit monthly)

#### Step 2: Enable Required APIs

Enable the following APIs in your Google Cloud project:

1. **Maps JavaScript API** - Required for loading Google Maps
2. **Places API** - Required for address autocomplete functionality
3. **Geocoding API** (Optional) - For reverse geocoding and coordinate conversion

To enable:
- Go to "APIs & Services" > "Library"
- Search for each API and click "Enable"

#### Step 3: Create API Key

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the generated API key

#### Step 4: Restrict API Key (Recommended for Production)

**Application Restrictions:**
- For development: Add HTTP referrer `http://localhost:3000/*`
- For production: Add your domain `https://yourdomain.com/*`

**API Restrictions:**
- Restrict to: Maps JavaScript API, Places API
- This prevents unauthorized use of your API key

#### Step 5: Add API Key to Environment

Add the API key to your `.env.local` file:

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

**Important Notes:**
- The API key is exposed in the browser (NEXT_PUBLIC_ prefix)
- Always use API restrictions to limit usage
- Monitor usage in Google Cloud Console
- Set up billing alerts to avoid unexpected charges

**API Key Restrictions:**

- HTTP referrers: `localhost:3000/*`, `*.yourdomain.com/*`
- API restrictions: Maps JavaScript API, Places API, Distance Matrix API

---

## Environment Validation

### Validation Script

Create `scripts/validate-env.js`:

```javascript
const required = {
  common: ["NODE_ENV", "DATABASE_URL", "JWT_SECRET", "JWT_REFRESH_SECRET"],
  development: ["UPLOAD_DIR"],
  production: [
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "AWS_S3_BUCKET",
    "SENDGRID_API_KEY",
    "SENTRY_DSN",
  ],
};

function validateEnv() {
  const env = process.env.NODE_ENV || "development";
  const missing = [];

  // Check common variables
  required.common.forEach((key) => {
    if (!process.env[key]) missing.push(key);
  });

  // Check environment-specific variables
  if (required[env]) {
    required[env].forEach((key) => {
      if (!process.env[key]) missing.push(key);
    });
  }

  if (missing.length > 0) {
    console.error("Missing required environment variables:");
    missing.forEach((key) => console.error(`  - ${key}`));
    process.exit(1);
  }

  console.log("✅ Environment variables validated successfully");
}

validateEnv();
```

### Pre-start Validation

Add to `package.json`:

```json
{
  "scripts": {
    "prestart": "node scripts/validate-env.js",
    "predev": "node scripts/validate-env.js"
  }
}
```

---

## Security Best Practices

### 1. Secret Management

- **Never commit secrets** to version control
- Use **strong, unique secrets** for each environment
- **Rotate secrets** regularly (every 90 days)
- Use **secret management services** in production (AWS Secrets Manager, HashiCorp Vault)

### 2. Environment Variable Security

```bash
# Generate secure secrets
openssl rand -base64 32  # For JWT_SECRET
openssl rand -hex 32     # For ENCRYPTION_KEY
```

### 3. Access Control

- Limit access to production environment files
- Use IAM roles for AWS services
- Implement least privilege principle
- Audit environment variable access

### 4. Encryption

- Encrypt sensitive environment variables at rest
- Use TLS for all external connections
- Encrypt database connections in production

---

## Troubleshooting

### Common Issues

1. **Database Connection Error**

   ```
   Error: ECONNREFUSED 127.0.0.1:5432
   ```

   - Check PostgreSQL is running
   - Verify DATABASE_URL format
   - Check firewall settings

2. **Redis Connection Error**

   ```
   Error: Redis connection to localhost:6379 failed
   ```

   - Check Redis is running
   - Verify REDIS_URL
   - Check Redis password if set

3. **S3 Upload Error**

   ```
   Error: Access Denied
   ```

   - Verify AWS credentials
   - Check S3 bucket permissions
   - Ensure bucket exists in correct region

4. **Email Sending Error**
   ```
   Error: Unauthorized
   ```

   - Verify SendGrid API key
   - Check sender domain verification
   - Ensure API key has correct permissions

### Debug Mode

Enable detailed logging:

```bash
# Debug specific modules
DEBUG=tms:* npm run dev

# Debug everything
DEBUG=* npm run dev

# Debug database queries
DATABASE_LOG=true npm run dev
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] All environment variables configured
- [ ] Secrets stored securely
- [ ] Database migrations run
- [ ] Redis connection verified
- [ ] S3 bucket created and configured
- [ ] Email templates created
- [ ] API keys obtained and restricted
- [ ] SSL certificates configured
- [ ] Domain DNS configured
- [ ] Monitoring setup (Sentry)

### Post-Deployment

- [ ] Health check endpoint responding
- [ ] Database connection working
- [ ] File uploads working
- [ ] Email sending working
- [ ] Third-party integrations connected
- [ ] Error tracking active
- [ ] Performance monitoring active
- [ ] Backup system configured
- [ ] Log aggregation working

---

## Railway-Specific Configuration

### Railway Variables

Set in Railway dashboard:

```bash
# Automatic Variables (provided by Railway)
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
PORT=${{PORT}}

# Custom Variables
NODE_ENV=production
JWT_SECRET=${{secret}}
# ... other variables
```

### Railway Plugins

1. **PostgreSQL** - Automatic DATABASE_URL
2. **Redis** - Automatic REDIS_URL
3. **Sentry** - Error tracking

### Health Check

Ensure health endpoint for Railway:

```typescript
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});
```
