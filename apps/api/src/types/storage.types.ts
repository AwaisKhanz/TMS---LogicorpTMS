/**
 * Storage-related type definitions
 */

export interface UploadResult {
  url: string;
  key: string;
  size: number;
  mimetype: string;
  etag?: string;
}

export interface StorageOptions {
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface StorageService {
  upload(
    file: FileInput,
    key: string,
    options?: StorageOptions
  ): Promise<UploadResult>;
  delete(key: string): Promise<void>;
  getUrl(key: string): string;
  exists(key: string): Promise<boolean>;
}

/**
 * File input interface for storage operations
 * Compatible with both uploaded files and generated files
 */
export interface FileInput {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  stream?: NodeJS.ReadableStream | null;
  destination?: string;
  filename?: string;
  path?: string;
}

/**
 * Local storage configuration
 */
export interface LocalStorageConfig {
  uploadDir: string;
  publicUrl: string;
}

/**
 * S3 storage configuration
 */
export interface S3StorageConfig {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucket: string;
  publicUrl?: string;
}

/**
 * Storage configuration
 */
export interface StorageConfig {
  type: "local" | "s3";
  local: LocalStorageConfig;
  s3: S3StorageConfig;
}

/**
 * File metadata for storage operations
 */
export interface FileMetadata {
  entityType: string;
  entityId: string;
  uploadedBy: string;
  generated?: string;
  [key: string]: string | undefined;
}

/**
 * Storage health check response
 */
export interface StorageHealthResponse {
  storage: {
    type: string;
    status: string;
    timestamp: string;
    uploadDir?: string;
    publicUrl?: string;
    bucket?: string;
    region?: string;
  };
}
