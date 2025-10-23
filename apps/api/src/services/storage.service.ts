import AWS from "aws-sdk";
import fs from "fs/promises";
import path from "path";
import { config } from "../config/env.js";
import { logger } from "../config/logger.js";
import type {
  UploadResult,
  StorageService,
  FileInput,
  StorageOptions,
} from "../types/storage.types.js";

class LocalStorageService implements StorageService {
  private uploadDir: string;
  private publicUrl: string;

  constructor() {
    this.uploadDir = config.storage.local.uploadDir;
    this.publicUrl = config.storage.local.publicUrl;
    this.ensureUploadDir();
  }

  private async ensureUploadDir(): Promise<void> {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
      logger.info(`Local storage directory ensured: ${this.uploadDir}`);
    } catch (error) {
      logger.error("Failed to create upload directory:", error);
      throw new Error("Failed to initialize local storage");
    }
  }

  async upload(
    file: FileInput,
    key: string,
    _options?: StorageOptions
  ): Promise<UploadResult> {
    try {
      const filePath = path.join(this.uploadDir, key);
      const dir = path.dirname(filePath);

      // Ensure directory exists
      await fs.mkdir(dir, { recursive: true });

      // Write file to disk
      await fs.writeFile(filePath, file.buffer);

      const url = `${this.publicUrl}/${key}`;

      logger.info(`File uploaded locally: ${key} -> ${filePath}`);

      return {
        url,
        key,
        size: file.size,
        mimetype: file.mimetype,
      };
    } catch (error) {
      logger.error("Local upload failed:", error);
      throw new Error("Failed to upload file locally");
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const filePath = path.join(this.uploadDir, key);
      await fs.unlink(filePath);
      logger.info(`File deleted locally: ${key}`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        logger.error("Local delete failed:", error);
        throw new Error("Failed to delete file locally");
      }
      // File doesn't exist, that's okay
    }
  }

  getUrl(key: string): string {
    return `${this.publicUrl}/${key}`;
  }

  getSignedUrl(key: string, _expiresIn: number = 3600): string {
    // For local storage, just return the regular URL
    return this.getUrl(key);
  }

  async exists(key: string): Promise<boolean> {
    try {
      const filePath = path.join(this.uploadDir, key);
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

class S3StorageService implements StorageService {
  private s3: AWS.S3;
  private bucket: string;
  private publicUrl?: string;

  constructor() {
    if (!config.storage.s3.bucket) {
      throw new Error("S3 bucket name is required");
    }

    this.s3 = new AWS.S3({
      accessKeyId: config.storage.s3.accessKeyId,
      secretAccessKey: config.storage.s3.secretAccessKey,
      region: config.storage.s3.region,
    });
    this.bucket = config.storage.s3.bucket;
    this.publicUrl = config.storage.s3.publicUrl;
  }

  async upload(
    file: FileInput,
    key: string,
    options?: StorageOptions
  ): Promise<UploadResult> {
    try {
      const uploadParams: AWS.S3.PutObjectRequest = {
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: options?.contentType || file.mimetype,
        Metadata: options?.metadata || {},
        // Remove ACL - use signed URLs instead for security
      };

      const result = await this.s3.upload(uploadParams).promise();

      const url =
        this.publicUrl ||
        result.Location ||
        `https://${this.bucket}.s3.${config.storage.s3.region}.amazonaws.com/${key}`;

      logger.info(`File uploaded to S3: ${key} -> ${url}`);

      return {
        url,
        key,
        size: file.size,
        mimetype: file.mimetype,
        etag: result.ETag,
      };
    } catch (error) {
      logger.error("S3 upload failed:", error);
      throw new Error("Failed to upload file to S3");
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.s3
        .deleteObject({
          Bucket: this.bucket,
          Key: key,
        })
        .promise();
      logger.info(`File deleted from S3: ${key}`);
    } catch (error) {
      logger.error("S3 delete failed:", error);
      throw new Error("Failed to delete file from S3");
    }
  }

  getUrl(key: string): string {
    if (this.publicUrl) {
      return `${this.publicUrl}/${key}`;
    }
    return `https://${this.bucket}.s3.${config.storage.s3.region}.amazonaws.com/${key}`;
  }

  getSignedUrl(key: string, expiresIn: number = 3600): string {
    try {
      // Ensure the key is properly formatted
      const cleanKey = key.startsWith("/") ? key.substring(1) : key;

      const signedUrl = this.s3.getSignedUrl("getObject", {
        Bucket: this.bucket,
        Key: cleanKey,
        Expires: expiresIn,
      });

      return signedUrl;
    } catch (error) {
      throw new Error(
        `Failed to generate signed URL: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.s3
        .headObject({
          Bucket: this.bucket,
          Key: key,
        })
        .promise();
      return true;
    } catch (error) {
      if ((error as AWS.AWSError).statusCode === 404) {
        return false;
      }
      throw error;
    }
  }
}

// Factory function to create the appropriate storage service
export function createStorageService(): StorageService {
  const storageType = config.storage.type;

  switch (storageType) {
    case "local":
      return new LocalStorageService();
    case "s3":
      return new S3StorageService();
    default:
      logger.warn(
        `Unknown storage type: ${storageType}, falling back to local`
      );
      return new LocalStorageService();
  }
}

// Singleton instance
export const storageService = createStorageService();

// Helper function to generate unique file keys
export function generateFileKey(
  organizationId: string,
  entityType: string,
  entityId: string,
  originalName: string
): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = path.extname(originalName);
  const baseName = path.basename(originalName, extension);

  return `${organizationId}/${entityType}/${entityId}/${timestamp}-${random}-${baseName}${extension}`;
}

// Helper function to get file extension from mimetype
export function getFileExtension(mimetype: string): string {
  const mimeToExt: Record<string, string> = {
    "application/pdf": ".pdf",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "application/msword": ".doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      ".docx",
  };

  return mimeToExt[mimetype] || "";
}
