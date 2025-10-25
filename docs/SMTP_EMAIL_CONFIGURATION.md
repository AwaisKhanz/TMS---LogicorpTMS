# SMTP Email Configuration Guide

## Overview

The TMS backend has been updated to use SMTP for email delivery instead of AWS SES. This change provides more flexibility in choosing email providers and reduces dependency on AWS services.

## Changes Made

### 1. New SMTP Service

- Created `src/services/smtp.service.ts` - A comprehensive SMTP email service
- Supports multiple SMTP providers (Gmail, Outlook, Yahoo, custom servers)
- Includes email with attachments functionality
- Connection verification and error handling

### 2. Updated Services

- **EmailService**: Now uses SMTP instead of AWS SES
- **NotificationService**: Updated to use SMTP for email notifications
- **DocumentDeliveryService**: Updated to use SMTP for document delivery
- **EmailNotificationService**: Updated to use SMTP for all email notifications

### 3. Environment Configuration

- Added SMTP configuration section to `src/config/env.ts`
- Removed AWS SES dependencies from `package.json`
- Deleted `aws-ses.service.ts` file

## SMTP Configuration

### Environment Variables

Add the following environment variables to your `.env` file:

```bash
# SMTP Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM_EMAIL="your-email@gmail.com"
SMTP_FROM_NAME="LogicorpTMS"
```

### Popular SMTP Providers

#### Gmail

```bash
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"  # Use App Password, not regular password
```

**Note**: For Gmail, you need to:

1. Enable 2-Factor Authentication
2. Generate an App Password
3. Use the App Password in `SMTP_PASS`

#### Outlook/Hotmail

```bash
SMTP_HOST="smtp-mail.outlook.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@outlook.com"
SMTP_PASS="your-password"
```

#### Yahoo

```bash
SMTP_HOST="smtp.mail.yahoo.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@yahoo.com"
SMTP_PASS="your-app-password"  # Use App Password
```

#### Custom SMTP Server

```bash
SMTP_HOST="your-smtp-server.com"
SMTP_PORT="587"  # or 465 for SSL
SMTP_SECURE="false"  # true for 465, false for other ports
SMTP_USER="your-username"
SMTP_PASS="your-password"
```

## Features

### SMTP Service Features

- **Email sending**: Basic HTML and text emails
- **Attachments**: Support for email attachments
- **Connection verification**: Test SMTP connection
- **Error handling**: Comprehensive error logging
- **Multiple providers**: Support for various SMTP providers

### Email Templates

The system continues to use the existing email templates for:

- Password reset emails
- Welcome emails
- Email verification
- Document delivery
- Notification emails

## Migration Steps

1. **Install dependencies** (if not already installed):

   ```bash
   npm install nodemailer @types/nodemailer
   ```

2. **Configure environment variables**:
   - Add SMTP configuration to your `.env` file
   - Remove AWS SES environment variables (optional)

3. **Test the configuration**:

   ```typescript
   import { smtpService } from "./services/smtp.service.js";

   // Test connection
   const isConnected = await smtpService.testConnection();
   console.log("SMTP Connection:", isConnected);
   ```

## Benefits of SMTP over AWS SES

1. **Cost-effective**: No AWS charges for email sending
2. **Flexibility**: Use any SMTP provider
3. **Simplicity**: Easier configuration and setup
4. **Reliability**: Direct SMTP connection without AWS dependencies
5. **Control**: Full control over email delivery settings

## Troubleshooting

### Common Issues

1. **Authentication failed**:
   - Check username and password
   - For Gmail/Yahoo, ensure you're using App Password
   - Verify 2FA is enabled for Gmail

2. **Connection timeout**:
   - Check SMTP host and port
   - Verify firewall settings
   - Try different ports (587, 465, 25)

3. **SSL/TLS errors**:
   - Set `SMTP_SECURE="true"` for port 465
   - Set `SMTP_SECURE="false"` for port 587
   - Check certificate validity

### Testing SMTP Connection

```typescript
import { smtpService } from "./services/smtp.service.js";

async function testSMTP() {
  try {
    const isReady = smtpService.isReady;
    console.log("SMTP configured:", isReady);

    if (isReady) {
      const isConnected = await smtpService.testConnection();
      console.log("SMTP connection test:", isConnected);
    }
  } catch (error) {
    console.error("SMTP test failed:", error);
  }
}
```

## Security Considerations

1. **Use App Passwords**: For Gmail and Yahoo, always use App Passwords
2. **Environment Variables**: Never commit SMTP credentials to version control
3. **TLS/SSL**: Always use secure connections (port 587 with STARTTLS or port 465 with SSL)
4. **Rate Limiting**: Be aware of SMTP provider rate limits

## Support

For issues with SMTP configuration or email delivery, check:

1. SMTP provider documentation
2. Network connectivity
3. Authentication credentials
4. Firewall settings
5. Application logs for detailed error messages
