import sgMail from "@sendgrid/mail";
import { config } from "../config/env.js";
import { logger } from "../config/logger.js";
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
 * Document Delivery Service using SendGrid
 * Handles sending documents via email
 */
export class DocumentDeliveryService {
  private isConfigured: boolean;

  constructor() {
    // Check if SendGrid is configured
    this.isConfigured = !!config.email.sendgridApiKey;

    if (this.isConfigured) {
      sgMail.setApiKey(config.email.sendgridApiKey!);
      logger.info("SendGrid document delivery service initialized");
    } else {
      logger.warn(
        "SendGrid API key not configured. Document delivery will be logged only."
      );
    }
  }

  /**
   * Send a single document to recipients
   */
  async sendDocument(
    data: DocumentDeliveryData
  ): Promise<{ sent: boolean; message: string }> {
    try {
      if (!this.isConfigured) {
        logger.info(
          `Document delivery would be sent to ${data.recipients.map((r) => r.email).join(", ")}:`
        );
        logger.info(`Document: ${data.document.name}`);
        logger.info(`Organization: ${data.organizationName}`);

        return {
          sent: false,
          message:
            "SendGrid not configured. Delivery logged only. Configure SENDGRID_API_KEY to enable email delivery.",
        };
      }

      const htmlContent = this.generateDocumentEmailHTML(data);
      const textContent = this.generateDocumentEmailText(data);

      const msg = {
        to: data.recipients.map((r) => r.email),
        from: {
          email: config.email.fromEmail,
          name: data.organizationName,
        },
        subject: data.subject || `Document: ${data.document.name}`,
        text: textContent,
        html: htmlContent,
        attachments: [
          {
            content: await this.getDocumentContent(data.document.fileUrl),
            filename: data.document.name,
            type: data.document.mimeType,
            disposition: "attachment",
          },
        ],
      };

      await sgMail.send(msg);

      logger.info(
        `Document delivered: ${data.document.name} to ${data.recipients.map((r) => r.email).join(", ")}`
      );

      return {
        sent: true,
        message: `Document sent successfully to ${data.recipients.length} recipient(s)`,
      };
    } catch (error) {
      logger.error("Failed to send document:", error);
      throw new Error("Failed to send document");
    }
  }

  /**
   * Send multiple documents to recipients
   */
  async sendMultipleDocuments(
    documents: Document[],
    recipients: DocumentRecipient[],
    organizationName: string,
    subject?: string,
    message?: string
  ): Promise<{ sent: boolean; message: string }> {
    try {
      if (!this.isConfigured) {
        logger.info(
          `Multiple documents delivery would be sent to ${recipients.map((r) => r.email).join(", ")}:`
        );
        logger.info(`Documents: ${documents.map((d) => d.name).join(", ")}`);
        logger.info(`Organization: ${organizationName}`);

        return {
          sent: false,
          message:
            "SendGrid not configured. Delivery logged only. Configure SENDGRID_API_KEY to enable email delivery.",
        };
      }

      const htmlContent = this.generateMultipleDocumentsEmailHTML(
        documents,
        recipients,
        organizationName,
        message
      );
      const textContent = this.generateMultipleDocumentsEmailText(
        documents,
        recipients,
        organizationName,
        message
      );

      const attachments = await Promise.all(
        documents.map(async (doc) => ({
          content: await this.getDocumentContent(doc.fileUrl),
          filename: doc.name,
          type: doc.mimeType,
          disposition: "attachment",
        }))
      );

      const msg = {
        to: recipients.map((r) => r.email),
        from: {
          email: config.email.fromEmail,
          name: organizationName,
        },
        subject:
          subject || `Documents: ${documents.map((d) => d.name).join(", ")}`,
        text: textContent,
        html: htmlContent,
        attachments,
      };

      await sgMail.send(msg);

      logger.info(
        `Multiple documents delivered: ${documents.map((d) => d.name).join(", ")} to ${recipients.map((r) => r.email).join(", ")}`
      );

      return {
        sent: true,
        message: `${documents.length} document(s) sent successfully to ${recipients.length} recipient(s)`,
      };
    } catch (error) {
      logger.error("Failed to send multiple documents:", error);
      throw new Error("Failed to send documents");
    }
  }

  /**
   * Send rate confirmation to carrier
   */
  async sendRateConfirmation(
    document: Document,
    carrierEmail: string,
    carrierName: string,
    loadNumber: string,
    organizationName: string
  ): Promise<{ sent: boolean; message: string }> {
    const data: DocumentDeliveryData = {
      document,
      recipients: [{ email: carrierEmail, name: carrierName }],
      subject: `Rate Confirmation - Load ${loadNumber}`,
      message: `Please find attached the rate confirmation for Load ${loadNumber}. Please review and confirm acceptance.`,
      loadNumber,
      organizationName,
    };

    return this.sendDocument(data);
  }

  /**
   * Send BOL to carrier
   */
  async sendBOL(
    document: Document,
    carrierEmail: string,
    carrierName: string,
    loadNumber: string,
    organizationName: string
  ): Promise<{ sent: boolean; message: string }> {
    const data: DocumentDeliveryData = {
      document,
      recipients: [{ email: carrierEmail, name: carrierName }],
      subject: `Bill of Lading - Load ${loadNumber}`,
      message: `Please find attached the Bill of Lading for Load ${loadNumber}. Please print and have the driver sign before pickup.`,
      loadNumber,
      organizationName,
    };

    return this.sendDocument(data);
  }

  /**
   * Send invoice to customer
   */
  async sendInvoice(
    document: Document,
    customerEmail: string,
    customerName: string,
    loadNumber: string,
    organizationName: string
  ): Promise<{ sent: boolean; message: string }> {
    const data: DocumentDeliveryData = {
      document,
      recipients: [{ email: customerEmail, name: customerName }],
      subject: `Invoice - Load ${loadNumber}`,
      message: `Please find attached the invoice for Load ${loadNumber}. Payment is due within 30 days.`,
      loadNumber,
      organizationName,
    };

    return this.sendDocument(data);
  }

  /**
   * Send POD to customer
   */
  async sendPOD(
    document: Document,
    recipients: Array<{ email: string; name?: string }>,
    subject?: string,
    message?: string,
    organizationName: string = "TMS"
  ): Promise<{ sent: boolean; message: string }> {
    const data: DocumentDeliveryData = {
      document,
      recipients,
      subject: subject || `Proof of Delivery - ${document.name}`,
      message:
        message || `Please find attached the Proof of Delivery document.`,
      organizationName,
    };

    return this.sendDocument(data);
  }

  /**
   * Get document content from URL
   */
  private async getDocumentContent(fileUrl: string): Promise<string> {
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch document: ${response.statusText}`);
      }
      const buffer = await response.arrayBuffer();
      return Buffer.from(buffer).toString("base64");
    } catch (error) {
      logger.error("Failed to get document content:", error);
      throw new Error("Failed to retrieve document content");
    }
  }

  /**
   * Generate HTML email for single document
   */
  private generateDocumentEmailHTML(data: DocumentDeliveryData): string {
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
    <p>${data.organizationName}</p>
  </div>

  <div class="content">
    <p>Hello,</p>
    <p>Please find attached the requested document.</p>

    <div class="document-info">
      <h3>Document Details</h3>
      <p><strong>Name:</strong> ${data.document.name}</p>
      <p><strong>Type:</strong> ${data.document.type}</p>
      <p><strong>Size:</strong> ${(data.document.fileSize / 1024).toFixed(1)} KB</p>
      ${data.loadNumber ? `<p><strong>Load Number:</strong> ${data.loadNumber}</p>` : ""}
    </div>

    ${data.message ? `<p><strong>Message:</strong> ${data.message}</p>` : ""}
    
    <p>Please download and review the attached document.</p>
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
   * Generate plain text email for single document
   */
  private generateDocumentEmailText(data: DocumentDeliveryData): string {
    let text = `DOCUMENT DELIVERY\n`;
    text += `Organization: ${data.organizationName}\n`;
    text += `Generated: ${new Date().toLocaleString()}\n\n`;

    text += `Document Details:\n`;
    text += `- Name: ${data.document.name}\n`;
    text += `- Type: ${data.document.type}\n`;
    text += `- Size: ${(data.document.fileSize / 1024).toFixed(1)} KB\n`;
    if (data.loadNumber) {
      text += `- Load Number: ${data.loadNumber}\n`;
    }
    text += `\n`;

    if (data.message) {
      text += `Message: ${data.message}\n\n`;
    }

    text += `Please download and review the attached document.\n\n`;
    text += `This document was sent from your Transportation Management System.\n`;

    return text;
  }

  /**
   * Generate HTML email for multiple documents
   */
  private generateMultipleDocumentsEmailHTML(
    documents: Document[],
    _recipients: DocumentRecipient[],
    organizationName: string,
    message?: string
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
    .document-list {
      background-color: white;
      padding: 15px;
      border-radius: 5px;
      margin: 20px 0;
    }
    .document-item {
      padding: 10px 0;
      border-bottom: 1px solid #eee;
    }
    .document-item:last-child {
      border-bottom: none;
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
    <h1>📄 Multiple Documents Delivery</h1>
    <p>${organizationName}</p>
  </div>

  <div class="content">
    <p>Hello,</p>
    <p>Please find attached the requested documents.</p>

    <div class="document-list">
      <h3>Documents (${documents.length})</h3>
      ${documents
        .map(
          (doc) => `
        <div class="document-item">
          <strong>${doc.name}</strong><br/>
          <small>Type: ${doc.type} | Size: ${(doc.fileSize / 1024).toFixed(1)} KB</small>
        </div>
      `
        )
        .join("")}
    </div>

    ${message ? `<p><strong>Message:</strong> ${message}</p>` : ""}
    
    <p>Please download and review the attached documents.</p>
  </div>

  <div class="footer">
    <p>These documents were sent from your Transportation Management System.</p>
    <p>Generated on: ${new Date().toLocaleString()}</p>
  </div>
</body>
</html>
    `;
  }

  /**
   * Generate plain text email for multiple documents
   */
  private generateMultipleDocumentsEmailText(
    documents: Document[],
    _recipients: DocumentRecipient[],
    organizationName: string,
    message?: string
  ): string {
    let text = `MULTIPLE DOCUMENTS DELIVERY\n`;
    text += `Organization: ${organizationName}\n`;
    text += `Generated: ${new Date().toLocaleString()}\n\n`;

    text += `Documents (${documents.length}):\n`;
    text += `===========================================\n\n`;
    documents.forEach((doc, index) => {
      text += `${index + 1}. ${doc.name}\n`;
      text += `   Type: ${doc.type}\n`;
      text += `   Size: ${(doc.fileSize / 1024).toFixed(1)} KB\n\n`;
    });

    if (message) {
      text += `Message: ${message}\n\n`;
    }

    text += `Please download and review the attached documents.\n\n`;
    text += `These documents were sent from your Transportation Management System.\n`;

    return text;
  }
}
