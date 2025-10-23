import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../../.env") });

export const config = {
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "4000", 10),
  apiUrl: process.env.API_URL || "http://localhost:4000",

  database: {
    url: process.env.DATABASE_URL || "",
  },

  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379",
    password: process.env.REDIS_PASSWORD,
  },

  jwt: {
    secret:
      process.env.JWT_SECRET || "your-super-secret-jwt-key-minimum-32-chars",
    refreshSecret:
      process.env.JWT_REFRESH_SECRET ||
      "your-refresh-token-secret-minimum-32-chars",
    expiresIn: process.env.JWT_EXPIRES_IN || "24h",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },

  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  },

  upload: {
    dir: process.env.UPLOAD_DIR || "./uploads",
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || "10485760", 10), // 10MB
  },

  storage: {
    type: process.env.STORAGE_TYPE || "local", // "local" or "s3"
    local: {
      uploadDir: process.env.UPLOAD_DIR || "./uploads",
      publicUrl: process.env.PUBLIC_URL || "http://localhost:4000/uploads",
    },
    s3: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_S3_REGION,
      bucket: process.env.AWS_S3_BUCKET,
      publicUrl: process.env.AWS_S3_PUBLIC_URL, // Optional: CloudFront URL
    },
  },

  logging: {
    level: process.env.LOG_LEVEL || "debug",
    format: process.env.LOG_FORMAT || "pretty",
  },

  aws: {
    region: process.env.AWS_REGION || "us-east-1",
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    ses: {
      fromEmail: process.env.AWS_SES_FROM_EMAIL || "noreply@logicorptms.com",
      fromName: process.env.AWS_SES_FROM_NAME || "LogicorpTMS",
      configurationSet: process.env.AWS_SES_CONFIGURATION_SET,
    },
    sns: {
      smsType: process.env.AWS_SNS_SMS_TYPE || "Transactional", // or 'Promotional'
    },
  },

  // Legacy email config (deprecated - use AWS SES instead)
  email: {
    sendgridApiKey: process.env.SENDGRID_API_KEY, // DEPRECATED - will be removed
    fromEmail: process.env.FROM_EMAIL || "noreply@logicorptms.com",
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
  },
};

// Validate required environment variables
const requiredEnvVars = ["DATABASE_URL"];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.warn(`Warning: Required environment variable ${envVar} is not set`);
  }
}
