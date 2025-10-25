import { logger } from "../config/logger.js";
import { SMTPService } from "./smtp.service.js";
import type { Document } from "@tms/shared-types";

interface DocumentRecipient {
  email: string;
  name?: string;
}

interface DocumentDeliveryData {
  document: Document;
  recipients: DocumentRecipient[];
  subject?: string;
  message?: string;
  loadNumber?: string;
  organizationName: string;
}

/**
 * Document Delivery Service using SMTP
 * Handles sending documents via email
 */
export class DocumentDeliveryService {
  private smtpService: SMTPService;

  constructor() {
    this.smtpService = new SMTPService();
  }

  /**
   * Send document to multiple recipients
   */
  async sendDocumentToRecipients(
    data: DocumentDeliveryData
  ): Promise<{ sent: boolean; message: string }> {
    try {
      const {
        document,
        recipients,
        subject,
        message,
        loadNumber,
        organizationName,
      } = data;

      const emailSubject = subject || `Document: ${document.name}`;
      const emailMessage =
        message || `Please find attached document: ${document.name}`;

      const htmlContent = this.generateDocumentEmailHTML({
        document,
        message: emailMessage,
        loadNumber,
        organizationName,
      });

      const textContent = this.generateDocumentEmailText({
        document,
        message: emailMessage,
        loadNumber,
        organizationName,
      });

      // Send to each recipient
      const results = await Promise.allSettled(
        recipients.map(async (recipient) => {
          const result = await this.smtpService.sendEmail(
            recipient.email,
            emailSubject,
            htmlContent,
            textContent
          );

          if (result.sent) {
            logger.info(
              `Document sent to ${recipient.email}: ${document.name}`
            );
            return { recipient: recipient.email, success: true };
          } else {
            logger.warn(
              `Failed to send document to ${recipient.email}: ${result.error}`
            );
            return {
              recipient: recipient.email,
              success: false,
              error: result.error,
            };
          }
        })
      );

      const successful = results.filter(
        (r) => r.status === "fulfilled" && r.value.success
      ).length;
      const failed = results.length - successful;

      if (successful > 0) {
        logger.info(
          `Document delivery completed: ${successful} successful, ${failed} failed`
        );
        return {
          sent: true,
          message: `Document sent to ${successful} recipient(s), ${failed} failed`,
        };
      } else {
        return {
          sent: false,
          message: "Failed to send document to any recipients",
        };
      }
    } catch (error) {
      logger.error("Failed to send document:", error);
      return {
        sent: false,
        message: "Failed to send document",
      };
    }
  }

  /**
   * Send single document to one recipient
   */
  async sendSingleDocument(
    recipient: DocumentRecipient,
    document: Document,
    organizationName: string,
    subject?: string,
    message?: string
  ): Promise<{ sent: boolean; message: string }> {
    try {
      const emailSubject = subject || `Document: ${document.name}`;
      const emailMessage =
        message || `Please find attached document: ${document.name}`;

      const htmlContent = this.generateDocumentEmailHTML({
        document,
        message: emailMessage,
        organizationName,
      });

      const textContent = this.generateDocumentEmailText({
        document,
        message: emailMessage,
        organizationName,
      });

      const result = await this.smtpService.sendEmail(
        recipient.email,
        emailSubject,
        htmlContent,
        textContent
      );

      if (result.sent) {
        logger.info(`Document sent to ${recipient.email}: ${document.name}`);
        return {
          sent: true,
          message: `Document sent successfully to ${recipient.email}`,
        };
      } else {
        logger.warn(
          `Failed to send document to ${recipient.email}: ${result.error}`
        );
        return {
          sent: false,
          message: result.error || "Failed to send document",
        };
      }
    } catch (error) {
      logger.error("Failed to send single document:", error);
      return {
        sent: false,
        message: "Failed to send document",
      };
    }
  }

  /**
   * Generate HTML email content for document delivery
   */
  private generateDocumentEmailHTML(data: {
    document: Document;
    message: string;
    loadNumber?: string;
    organizationName: string;
  }): string {
    const { document, message, loadNumber, organizationName } = data;

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
    .document-info {
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
    <h1>📄 Document Delivery</h1>
    <p>${organizationName}</p>
  </div>

  <div class="content">
    <p>${message}</p>

    <div class="document-info">
      <div class="detail-row">
        <span class="detail-label">Document Name:</span> ${document.name}
      </div>
      <div class="detail-row">
        <span class="detail-label">Document Type:</span> ${document.type}
      </div>
      <div class="detail-row">
        <span class="detail-label">Entity Type:</span> ${document.entityType}
      </div>
      ${
        loadNumber
          ? `
      <div class="detail-row">
        <span class="detail-label">Load Number:</span> ${loadNumber}
      </div>
      `
          : ""
      }
      <div class="detail-row" style="border-bottom: none;">
        <span class="detail-label">Uploaded:</span> ${new Date(document.uploadedAt).toLocaleString()}
      </div>
    </div>

    <p><strong>Note:</strong> This document has been shared with you through the Transportation Management System.</p>
  </div>

  <div class="footer">
    <p>This document was sent from your Transportation Management System.</p>
    <p>Generated on: ${new Date().toLocaleString()}</p>
  </div>
</body>
</html>
    `;
  }

  /**
   * Generate plain text email content for document delivery
   */
  private generateDocumentEmailText(data: {
    document: Document;
    message: string;
    loadNumber?: string;
    organizationName: string;
  }): string {
    const { document, message, loadNumber, organizationName } = data;

    let text = `DOCUMENT DELIVERY\n`;
    text += `Organization: ${organizationName}\n\n`;
    text += `${message}\n\n`;
    text += `Document Details:\n`;
    text += `- Name: ${document.name}\n`;
    text += `- Type: ${document.type}\n`;
    text += `- Entity: ${document.entityType}\n`;
    if (loadNumber) {
      text += `- Load Number: ${loadNumber}\n`;
    }
    text += `- Uploaded: ${new Date(document.uploadedAt).toLocaleString()}\n\n`;
    text += `Note: This document has been shared with you through the Transportation Management System.\n\n`;
    text += `This document was sent from your Transportation Management System.\n`;
    text += `Generated on: ${new Date().toLocaleString()}`;

    return text;
  }

  /**
   * Send a single document (alias for sendDocumentToRecipients)
   */
  async sendDocument(
    data: DocumentDeliveryData
  ): Promise<{ sent: boolean; message: string }> {
    return this.sendDocumentToRecipients(data);
  }

  /**
   * Send multiple documents
   */
  async sendMultipleDocuments(
    documents: Document[],
    recipients: DocumentRecipient[],
    subject?: string,
    message?: string,
    organizationName?: string
  ): Promise<{ sent: boolean; message: string }> {
    try {
      // For now, send each document separately
      // TODO: Implement batch sending
      const results = [];
      for (const document of documents) {
        const result = await this.sendDocumentToRecipients({
          document,
          recipients,
          subject,
          message,
          organizationName: organizationName || "TMS System",
        });
        results.push(result);
      }

      const allSent = results.every((r) => r.sent);
      return {
        sent: allSent,
        message: allSent
          ? "All documents sent successfully"
          : "Some documents failed to send",
      };
    } catch (error) {
      logger.error("Failed to send multiple documents:", error);
      return {
        sent: false,
        message: "Failed to send documents",
      };
    }
  }

  /**
   * Send rate confirmation document
   */
  async sendRateConfirmation(
    document: Document,
    carrierEmail: string,
    carrierName: string,
    loadNumber: string,
    organizationName: string
  ): Promise<{ sent: boolean; message: string }> {
    return this.sendDocumentToRecipients({
      document,
      recipients: [{ email: carrierEmail, name: carrierName }],
      subject: `Rate Confirmation - Load ${loadNumber}`,
      message: `Please find attached rate confirmation document for load ${loadNumber}.`,
      loadNumber,
      organizationName,
    });
  }

  /**
   * Send BOL (Bill of Lading) document
   */
  async sendBOL(
    document: Document,
    carrierEmail: string,
    carrierName: string,
    loadNumber: string,
    organizationName: string
  ): Promise<{ sent: boolean; message: string }> {
    return this.sendDocumentToRecipients({
      document,
      recipients: [{ email: carrierEmail, name: carrierName }],
      subject: `Bill of Lading - Load ${loadNumber}`,
      message: `Please find attached Bill of Lading document for load ${loadNumber}.`,
      loadNumber,
      organizationName,
    });
  }

  /**
   * Send invoice document
   */
  async sendInvoice(
    document: Document,
    customerEmail: string,
    customerName: string,
    loadNumber: string,
    organizationName: string
  ): Promise<{ sent: boolean; message: string }> {
    return this.sendDocumentToRecipients({
      document,
      recipients: [{ email: customerEmail, name: customerName }],
      subject: `Invoice - Load ${loadNumber}`,
      message: `Please find attached invoice document for load ${loadNumber}.`,
      loadNumber,
      organizationName,
    });
  }
}

export type { DocumentRecipient, DocumentDeliveryData };
