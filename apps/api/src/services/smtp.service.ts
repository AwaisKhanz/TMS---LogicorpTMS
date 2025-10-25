import nodemailer from "nodemailer";
import { config } from "../config/env.js";
import { logger } from "../config/logger.js";

/**
 * SMTP Email Service
 * Handles email notifications using SMTP (Gmail, Outlook, etc.)
 */
export class SMTPService {
  private transporter!: nodemailer.Transporter;
  private isConfigured: boolean;

  constructor() {
    this.isConfigured = !!(
      config.smtp.host &&
      config.smtp.port &&
      config.smtp.user &&
      config.smtp.pass
    );

    if (this.isConfigured) {
      this.transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.secure, // true for 465, false for other ports
        auth: {
          user: config.smtp.user,
          pass: config.smtp.pass,
        },
        tls: {
          rejectUnauthorized: false, // For self-signed certificates
        },
      });

      // Verify connection configuration
      this.transporter.verify((error) => {
        if (error) {
          logger.error("SMTP connection failed:", error);
        } else {
          logger.info("SMTP service initialized successfully");
        }
      });
    } else {
      logger.warn("SMTP not configured. Email functionality will be disabled.");
    }
  }

  /**
   * Send email via SMTP
   */
  async sendEmail(
    to: string,
    subject: string,
    htmlBody: string,
    textBody?: string
  ): Promise<{ sent: boolean; messageId?: string; error?: string }> {
    if (!this.isConfigured) {
      logger.info(`Email would be sent to ${to}:`);
      logger.info(`Subject: ${subject}`);
      logger.info(`Body: ${textBody || htmlBody.substring(0, 200)}...`);

      return {
        sent: false,
        error: "SMTP not configured. Email logged only.",
      };
    }

    try {
      const mailOptions = {
        from: `${config.smtp.fromName} <${config.smtp.fromEmail}>`,
        to: to,
        subject: subject,
        html: htmlBody,
        text: textBody || htmlBody,
      };

      const result = await this.transporter.sendMail(mailOptions);

      logger.info(
        `Email sent successfully to ${to}, MessageId: ${result.messageId}`
      );

      return {
        sent: true,
        messageId: result.messageId,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error(`Failed to send email to ${to}:`, error);

      return {
        sent: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Send email with attachments
   */
  async sendEmailWithAttachments(
    to: string,
    subject: string,
    htmlBody: string,
    attachments: Array<{
      filename: string;
      content: Buffer | string;
      contentType?: string;
    }>,
    textBody?: string
  ): Promise<{ sent: boolean; messageId?: string; error?: string }> {
    if (!this.isConfigured) {
      logger.info(`Email with attachments would be sent to ${to}:`);
      logger.info(`Subject: ${subject}`);
      logger.info(
        `Attachments: ${attachments.map((a) => a.filename).join(", ")}`
      );

      return {
        sent: false,
        error: "SMTP not configured. Email logged only.",
      };
    }

    try {
      const mailOptions = {
        from: `${config.smtp.fromName} <${config.smtp.fromEmail}>`,
        to: to,
        subject: subject,
        html: htmlBody,
        text: textBody || htmlBody,
        attachments: attachments,
      };

      const result = await this.transporter.sendMail(mailOptions);

      logger.info(
        `Email with attachments sent successfully to ${to}, MessageId: ${result.messageId}`
      );

      return {
        sent: true,
        messageId: result.messageId,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error(`Failed to send email with attachments to ${to}:`, error);

      return {
        sent: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Check if SMTP is properly configured
   */
  get isReady(): boolean {
    return this.isConfigured;
  }

  /**
   * Test SMTP connection
   */
  async testConnection(): Promise<boolean> {
    if (!this.isConfigured) {
      return false;
    }

    try {
      await this.transporter.verify();
      logger.info("SMTP connection test successful");
      return true;
    } catch (error) {
      logger.error("SMTP connection test failed:", error);
      return false;
    }
  }
}

export const smtpService = new SMTPService();
