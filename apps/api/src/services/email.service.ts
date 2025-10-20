import sgMail from "@sendgrid/mail";
import { logger } from "../config/logger.js";
import { config } from "../config/env.js";
import { templateService } from "./template.service.js";

export class EmailService {
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    if (!config.email.sendgridApiKey) {
      logger.warn(
        "SENDGRID_API_KEY not found. Email service will be disabled."
      );
      return;
    }

    sgMail.setApiKey(config.email.sendgridApiKey);
    this.isInitialized = true;
    logger.info("SendGrid email service initialized");
  }

  private async sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string
  ) {
    if (!this.isInitialized) {
      logger.warn("Email service not initialized. Skipping email send.");
      return;
    }

    try {
      const msg = {
        to,
        from: {
          email: config.email.fromEmail,
          name: "LogicorpTMS",
        },
        subject,
        text,
        html,
      };

      await sgMail.send(msg);
      logger.info(`Email sent successfully to ${to}`);
    } catch (error) {
      logger.error("Failed to send email:", error);
      throw new Error("Failed to send email");
    }
  }

  async sendPasswordResetEmail(
    email: string,
    resetToken: string,
    userName?: string
  ) {
    const resetUrl = `${config.email.frontendUrl}/reset-password?token=${resetToken}`;

    const subject = "Reset Your LogicorpTMS Password";

    const html = templateService.getPasswordResetHtml({ resetUrl, userName });
    const text = templateService.getPasswordResetText({ resetUrl, userName });

    await this.sendEmail(email, subject, html, text);
  }

  async sendWelcomeEmail(
    email: string,
    userName: string,
    organizationName: string
  ) {
    const subject = "Welcome to LogicorpTMS!";

    const dashboardUrl = `${config.email.frontendUrl}/login`;
    const html = templateService.getWelcomeHtml({
      userName,
      organizationName,
      dashboardUrl,
    });
    const text = templateService.getWelcomeText({
      userName,
      organizationName,
      dashboardUrl,
    });

    await this.sendEmail(email, subject, html, text);
  }

  async sendEmailVerification(
    email: string,
    verificationToken: string,
    userName: string
  ) {
    const verificationUrl = `${config.email.frontendUrl}/verify-email?token=${verificationToken}`;
    const subject = "Verify Your LogicorpTMS Email Address";

    const html = templateService.getEmailVerificationHtml({
      verificationUrl,
      userName,
    });
    const text = templateService.getEmailVerificationText({
      verificationUrl,
      userName,
    });

    await this.sendEmail(email, subject, html, text);
  }
}

export const emailService = new EmailService();
