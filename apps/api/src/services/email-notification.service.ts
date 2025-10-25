import { logger } from "../config/logger.js";
import { SMTPService } from "./smtp.service.js";

interface DocumentExpirationData {
  id: string;
  name: string;
  type: string;
  expiresAt: Date;
  entityType: string;
  entityId: string;
  daysUntilExpiry: number;
  alertLevel: "URGENT" | "WARNING";
}

interface EmailRecipient {
  email: string;
  name?: string;
}

/**
 * Email Notification Service using SMTP
 * Handles all email notifications in the system
 */
export class EmailNotificationService {
  private smtpService: SMTPService;

  constructor() {
    this.smtpService = new SMTPService();
  }

  /**
   * Send document expiration notifications
   */
  async sendDocumentExpirationNotifications(
    organizationName: string,
    organizationEmail: string,
    urgentDocuments: DocumentExpirationData[],
    warningDocuments: DocumentExpirationData[]
  ): Promise<{ sent: boolean; message: string }> {
    try {
      const htmlContent = this.generateExpirationEmailHTML(
        organizationName,
        urgentDocuments,
        warningDocuments
      );

      const textContent = this.generateExpirationEmailText(
        organizationName,
        urgentDocuments,
        warningDocuments
      );

      const result = await this.smtpService.sendEmail(
        organizationEmail,
        `⚠️ Document Expiration Alert - ${urgentDocuments.length} Urgent, ${warningDocuments.length} Warning`,
        htmlContent,
        textContent
      );

      if (result.sent) {
        logger.info(
          `Document expiration email sent to ${organizationEmail} for ${organizationName}`
        );
        return {
          sent: true,
          message: `Email sent successfully to ${organizationEmail}`,
        };
      } else {
        logger.warn(
          `Failed to send email to ${organizationEmail}: ${result.error}`
        );
        return {
          sent: false,
          message: result.error || "Failed to send email",
        };
      }
    } catch (error) {
      logger.error("Failed to send document expiration email:", error);
      throw new Error("Failed to send email notification");
    }
  }

  /**
   * Send single document expiration alert
   */
  async sendSingleDocumentExpiration(
    recipient: EmailRecipient,
    organizationName: string,
    document: DocumentExpirationData
  ): Promise<void> {
    const result = await this.smtpService.sendEmail(
      recipient.email,
      `🔔 Document Expiring Soon: ${document.name}`,
      this.generateSingleDocumentEmailHTML(
        organizationName,
        document,
        recipient.name
      ),
      this.generateSingleDocumentEmailText(organizationName, document)
    );

    if (result.sent) {
      logger.info(
        `Single document expiration email sent to ${recipient.email}`
      );
    } else {
      logger.warn(
        `Failed to send single document email to ${recipient.email}: ${result.error}`
      );
    }
  }

  /**
   * Generate HTML email for batch document expirations
   */
  private generateExpirationEmailHTML(
    organizationName: string,
    urgentDocuments: DocumentExpirationData[],
    warningDocuments: DocumentExpirationData[]
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #0066cc;
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 5px 5px 0 0;
    }
    .content {
      background-color: #f9f9f9;
      padding: 20px;
      border: 1px solid #ddd;
    }
    .section {
      margin-bottom: 30px;
    }
    .urgent {
      background-color: #fff3cd;
      border-left: 4px solid #dc3545;
      padding: 15px;
      margin-bottom: 15px;
    }
    .warning {
      background-color: #d1ecf1;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin-bottom: 15px;
    }
    .document-item {
      margin-bottom: 10px;
      padding: 10px;
      background-color: white;
      border-radius: 3px;
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 3px;
      font-size: 12px;
      font-weight: bold;
    }
    .badge-urgent {
      background-color: #dc3545;
      color: white;
    }
    .badge-warning {
      background-color: #ffc107;
      color: #333;
    }
    .footer {
      text-align: center;
      padding: 20px;
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>⚠️ Document Expiration Alert</h1>
    <p>${organizationName}</p>
  </div>

  <div class="content">
    ${
      urgentDocuments.length > 0
        ? `
    <div class="section urgent">
      <h2 style="color: #dc3545; margin-top: 0;">🚨 Urgent - Expiring Within 7 Days (${urgentDocuments.length})</h2>
      ${urgentDocuments
        .map(
          (doc) => `
        <div class="document-item">
          <strong>${doc.name}</strong>
          <span class="badge badge-urgent">${doc.type}</span>
          <br/>
          <small>Entity: ${doc.entityType} | Expires: ${new Date(doc.expiresAt).toLocaleDateString()}</small>
          <br/>
          <small style="color: #dc3545;"><strong>${doc.daysUntilExpiry} day(s) remaining</strong></small>
        </div>
      `
        )
        .join("")}
    </div>
    `
        : ""
    }

    ${
      warningDocuments.length > 0
        ? `
    <div class="section warning">
      <h2 style="color: #ffc107; margin-top: 0;">⚠️ Warning - Expiring Within 30 Days (${warningDocuments.length})</h2>
      ${warningDocuments
        .map(
          (doc) => `
        <div class="document-item">
          <strong>${doc.name}</strong>
          <span class="badge badge-warning">${doc.type}</span>
          <br/>
          <small>Entity: ${doc.entityType} | Expires: ${new Date(doc.expiresAt).toLocaleDateString()}</small>
          <br/>
          <small style="color: #856404;"><strong>${doc.daysUntilExpiry} day(s) remaining</strong></small>
        </div>
      `
        )
        .join("")}
    </div>
    `
        : ""
    }

    <p><strong>Action Required:</strong> Please review and update these documents to maintain compliance.</p>
    <p>Log in to your TMS account to upload new documents or manage expirations.</p>
  </div>

  <div class="footer">
    <p>This is an automated notification from your Transportation Management System.</p>
    <p>Generated on: ${new Date().toLocaleString()}</p>
  </div>
</body>
</html>
    `;
  }

  /**
   * Generate plain text email for batch document expirations
   */
  private generateExpirationEmailText(
    organizationName: string,
    urgentDocuments: DocumentExpirationData[],
    warningDocuments: DocumentExpirationData[]
  ): string {
    let text = `DOCUMENT EXPIRATION ALERT\n`;
    text += `Organization: ${organizationName}\n`;
    text += `Generated: ${new Date().toLocaleString()}\n\n`;

    if (urgentDocuments.length > 0) {
      text += `URGENT - EXPIRING WITHIN 7 DAYS (${urgentDocuments.length})\n`;
      text += `===========================================\n\n`;
      urgentDocuments.forEach((doc) => {
        text += `- ${doc.name} (${doc.type})\n`;
        text += `  Entity: ${doc.entityType}\n`;
        text += `  Expires: ${new Date(doc.expiresAt).toLocaleDateString()}\n`;
        text += `  ${doc.daysUntilExpiry} day(s) remaining\n\n`;
      });
    }

    if (warningDocuments.length > 0) {
      text += `WARNING - EXPIRING WITHIN 30 DAYS (${warningDocuments.length})\n`;
      text += `============================================\n\n`;
      warningDocuments.forEach((doc) => {
        text += `- ${doc.name} (${doc.type})\n`;
        text += `  Entity: ${doc.entityType}\n`;
        text += `  Expires: ${new Date(doc.expiresAt).toLocaleDateString()}\n`;
        text += `  ${doc.daysUntilExpiry} day(s) remaining\n\n`;
      });
    }

    text += `ACTION REQUIRED: Please review and update these documents to maintain compliance.\n`;
    text += `Log in to your TMS account to upload new documents or manage expirations.\n\n`;
    text += `This is an automated notification from your Transportation Management System.\n`;

    return text;
  }

  /**
   * Generate HTML for single document expiration
   */
  private generateSingleDocumentEmailHTML(
    organizationName: string,
    document: DocumentExpirationData,
    recipientName?: string
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: ${document.alertLevel === "URGENT" ? "#dc3545" : "#ffc107"};
      color: ${document.alertLevel === "URGENT" ? "white" : "#333"};
      padding: 20px;
      text-align: center;
      border-radius: 5px 5px 0 0;
    }
    .content {
      background-color: #f9f9f9;
      padding: 20px;
      border: 1px solid #ddd;
    }
    .document-details {
      background-color: white;
      padding: 15px;
      border-radius: 5px;
      margin: 20px 0;
    }
    .detail-row {
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }
    .detail-label {
      font-weight: bold;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${document.alertLevel === "URGENT" ? "🚨" : "⚠️"} Document Expiring Soon</h1>
  </div>

  <div class="content">
    ${recipientName ? `<p>Hello ${recipientName},</p>` : ""}
    <p>This is a notification from <strong>${organizationName}</strong> regarding an expiring document.</p>

    <div class="document-details">
      <div class="detail-row">
        <span class="detail-label">Document Name:</span> ${document.name}
      </div>
      <div class="detail-row">
        <span class="detail-label">Document Type:</span> ${document.type}
      </div>
      <div class="detail-row">
        <span class="detail-label">Entity Type:</span> ${document.entityType}
      </div>
      <div class="detail-row">
        <span class="detail-label">Expiration Date:</span> ${new Date(document.expiresAt).toLocaleDateString()}
      </div>
      <div class="detail-row" style="border-bottom: none;">
        <span class="detail-label">Days Remaining:</span>
        <span style="color: ${document.alertLevel === "URGENT" ? "#dc3545" : "#ffc107"}; font-weight: bold;">
          ${document.daysUntilExpiry} day(s)
        </span>
      </div>
    </div>

    <p><strong>Action Required:</strong> Please upload a new version of this document to maintain compliance.</p>
    <p>Log in to your TMS account to manage your documents.</p>
  </div>

  <div style="text-align: center; padding: 20px; font-size: 12px; color: #666;">
    <p>This is an automated notification from your Transportation Management System.</p>
    <p>Generated on: ${new Date().toLocaleString()}</p>
  </div>
</body>
</html>
    `;
  }

  /**
   * Generate plain text for single document expiration
   */
  private generateSingleDocumentEmailText(
    organizationName: string,
    document: DocumentExpirationData
  ): string {
    return `
DOCUMENT EXPIRING SOON
${document.alertLevel === "URGENT" ? "URGENT" : "WARNING"} ALERT

Organization: ${organizationName}

Document Details:
- Name: ${document.name}
- Type: ${document.type}
- Entity: ${document.entityType}
- Expiration Date: ${new Date(document.expiresAt).toLocaleDateString()}
- Days Remaining: ${document.daysUntilExpiry}

ACTION REQUIRED: Please upload a new version of this document to maintain compliance.
Log in to your TMS account to manage your documents.

This is an automated notification from your Transportation Management System.
Generated on: ${new Date().toLocaleString()}
    `.trim();
  }
}

export type { DocumentExpirationData, EmailRecipient };
