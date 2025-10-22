# TMS Storage Configuration Guide

## 🎯 Overview

The TMS application now supports **environment-based file storage**:

- **Development**: Local file storage (saves to `./uploads` directory)
- **Production**: AWS S3 storage (saves to your S3 bucket)

## 🔧 Environment Variables

### Development (.env.local)

```bash
# File Storage - LOCAL for development
STORAGE_TYPE=local
UPLOAD_DIR=./uploads
PUBLIC_URL=http://localhost:4000/uploads

# Other required variables
NODE_ENV=development
PORT=4000
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
# ... other variables
```

### Production (.env.production)

```bash
# File Storage - S3 for production
STORAGE_TYPE=s3
AWS_ACCESS_KEY_ID=your_actual_access_key
AWS_SECRET_ACCESS_KEY=your_actual_secret_key
AWS_S3_BUCKET=your_actual_bucket_name
AWS_S3_REGION=eu-north-1
AWS_S3_PUBLIC_URL=https://your-cloudfront-url.com  # Optional: CloudFront URL

# Other required variables
NODE_ENV=production
PORT=4000
DATABASE_URL=your_production_database_url
JWT_SECRET=your_production_jwt_secret
# ... other variables
```

## 🚀 How It Works

### Development Mode

- Files are stored in `./uploads` directory
- Files are served via Express static middleware at `/uploads/*`
- URLs: `http://localhost:4000/uploads/organization/entity/file.pdf`

### Production Mode

- Files are uploaded to your S3 bucket
- Files are served directly from S3
- URLs: `https://your-bucket.s3.region.amazonaws.com/organization/entity/file.pdf`

## 📁 File Organization

Files are organized by:

```
organizationId/entityType/entityId/timestamp-random-filename.ext
```

Example:

```
org123/LOAD/load456/1703123456789-abc123-rate-confirmation.pdf
```

## 🔍 Health Check

Check your storage configuration:

```bash
curl http://localhost:4000/api/v1/health/storage
```

Response:

```json
{
  "success": true,
  "data": {
    "storage": {
      "type": "local",
      "status": "healthy",
      "uploadDir": "./uploads",
      "publicUrl": "http://localhost:4000/uploads",
      "timestamp": "2025-01-21T17:10:29.797Z"
    }
  }
}
```

## 🧪 Testing

### Test Local Storage

1. Set `STORAGE_TYPE=local` in your `.env.local`
2. Start the server: `npm run dev`
3. Upload a file via API
4. Check `./uploads` directory
5. Access file via: `http://localhost:4000/uploads/...`

### Test S3 Storage

1. Set `STORAGE_TYPE=s3` in your `.env.local`
2. Add your AWS credentials
3. Start the server: `npm run dev`
4. Upload a file via API
5. Check your S3 bucket

## 🔄 Switching Between Storage Types

### Development → Production

1. Change `STORAGE_TYPE=s3`
2. Add AWS credentials
3. Deploy to production
4. Files will automatically use S3

### Production → Development

1. Change `STORAGE_TYPE=local`
2. Remove AWS credentials (optional)
3. Files will automatically use local storage

## 📝 File Upload API

### Upload Document

```bash
POST /api/v1/documents/upload
Content-Type: multipart/form-data

{
  "file": <file>,
  "entityType": "LOAD",
  "entityId": "load123",
  "type": "RATE_CONFIRMATION",
  "name": "Rate Confirmation"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "id": "doc123",
    "name": "Rate Confirmation",
    "fileUrl": "http://localhost:4000/uploads/org123/LOAD/load123/1703123456789-abc123-rate-confirmation.pdf",
    "fileSize": 1024000,
    "mimeType": "application/pdf",
    "uploadedAt": "2025-01-21T17:10:29.797Z"
  }
}
```

## 🛠️ Troubleshooting

### Local Storage Issues

- Check if `./uploads` directory exists
- Verify `PUBLIC_URL` is correct
- Check file permissions

### S3 Storage Issues

- Verify AWS credentials
- Check bucket permissions
- Verify bucket exists in correct region

### Common Errors

- `STORAGE_TYPE` not set → defaults to local
- AWS credentials missing → falls back to local
- Bucket doesn't exist → check bucket name and region

## 🎉 Benefits

✅ **Development**: Fast local file storage, no AWS costs
✅ **Production**: Scalable S3 storage, CDN-ready
✅ **Automatic**: No code changes needed when switching
✅ **Secure**: Proper file organization and access control
✅ **Flexible**: Easy to add other storage providers

## 📚 Next Steps

1. **Set up your environment variables**
2. **Test both local and S3 storage**
3. **Deploy to production with S3**
4. **Monitor file uploads and storage usage**

Your TMS application now has intelligent file storage that adapts to your environment! 🚀
