import { logger } from "../config/logger.js";
import { config } from "../config/env.js";
import { templateService } from "./template.service.js";
import { SMTPService } from "./smtp.service.js";

export class EmailService {
  private smtpService: SMTPService;

  constructor() {
    this.smtpService = new SMTPService();
  }

  private async sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string
  ) {
    try {
      const result = await this.smtpService.sendEmail(
        to,
        subject,
        html,
        text || html
      );

      if (result.sent) {
        logger.info(`Email sent successfully to ${to}`);
      } else {
        logger.warn(`Failed to send email to ${to}: ${result.error}`);
      }
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
      supportUrl: `${config.email.frontendUrl}/support`,
      privacyUrl: `${config.email.frontendUrl}/privacy`,
      termsUrl: `${config.email.frontendUrl}/terms`,
    });
    const text = templateService.getEmailVerificationText({
      verificationUrl,
      userName,
    });

    await this.sendEmail(email, subject, html, text);
  }

  async sendLoadStatusUpdate(
    email: string,
    userName: string,
    loadData: {
      loadNumber: string;
      status: string;
      message?: string;
      commodity: string;
      weight: string;
      pickupDate: string;
      deliveryDate: string;
      customerRate: string;
      trackingNumber?: string;
      carrierName?: string;
      currentLocation?: string;
      eta?: string;
      loadId: string;
    }
  ) {
    const subject = `Load Status Update: ${loadData.loadNumber} - ${loadData.status}`;
    const loadUrl = `${config.email.frontendUrl}/loads/${loadData.loadId}`;

    const html = templateService.getLoadStatusUpdateHtml({
      userName,
      loadNumber: loadData.loadNumber,
      status: loadData.status,
      message: loadData.message,
      commodity: loadData.commodity,
      weight: loadData.weight,
      pickupDate: loadData.pickupDate,
      deliveryDate: loadData.deliveryDate,
      customerRate: loadData.customerRate,
      trackingNumber: loadData.trackingNumber,
      carrierName: loadData.carrierName,
      currentLocation: loadData.currentLocation,
      eta: loadData.eta,
      loadUrl,
      dashboardUrl: `${config.email.frontendUrl}/dashboard`,
      supportUrl: `${config.email.frontendUrl}/support`,
      privacyUrl: `${config.email.frontendUrl}/privacy`,
    });

    const text = templateService.getLoadStatusUpdateText({
      userName,
      loadNumber: loadData.loadNumber,
      status: loadData.status,
      message: loadData.message,
      commodity: loadData.commodity,
      weight: loadData.weight,
      pickupDate: loadData.pickupDate,
      deliveryDate: loadData.deliveryDate,
      customerRate: loadData.customerRate,
      trackingNumber: loadData.trackingNumber,
      carrierName: loadData.carrierName,
      currentLocation: loadData.currentLocation,
      eta: loadData.eta,
      loadUrl,
      dashboardUrl: `${config.email.frontendUrl}/dashboard`,
      supportUrl: `${config.email.frontendUrl}/support`,
      privacyUrl: `${config.email.frontendUrl}/privacy`,
    });

    await this.sendEmail(email, subject, html, text);
  }

  async sendDocumentDelivery(
    email: string,
    userName: string,
    documentData: {
      loadNumber: string;
      documentType: string;
      message?: string;
      generatedDate: string;
      expiryDate: string;
      referenceNumber?: string;
      attachments?: Array<{ name: string; size: string }>;
      downloadUrl: string;
      loadId: string;
    }
  ) {
    const subject = `${documentData.documentType} Ready: ${documentData.loadNumber}`;
    const loadUrl = `${config.email.frontendUrl}/loads/${documentData.loadId}`;

    const html = templateService.getDocumentDeliveryHtml({
      userName,
      loadNumber: documentData.loadNumber,
      documentType: documentData.documentType,
      message: documentData.message,
      generatedDate: documentData.generatedDate,
      expiryDate: documentData.expiryDate,
      referenceNumber: documentData.referenceNumber,
      attachments: documentData.attachments,
      downloadUrl: documentData.downloadUrl,
      loadUrl,
      dashboardUrl: `${config.email.frontendUrl}/dashboard`,
      supportUrl: `${config.email.frontendUrl}/support`,
    });

    const text = templateService.getDocumentDeliveryText({
      userName,
      loadNumber: documentData.loadNumber,
      documentType: documentData.documentType,
      message: documentData.message,
      generatedDate: documentData.generatedDate,
      expiryDate: documentData.expiryDate,
      referenceNumber: documentData.referenceNumber,
      attachments: documentData.attachments,
      downloadUrl: documentData.downloadUrl,
      loadUrl,
      dashboardUrl: `${config.email.frontendUrl}/dashboard`,
      supportUrl: `${config.email.frontendUrl}/support`,
    });

    await this.sendEmail(email, subject, html, text);
  }

  async sendNotification(
    email: string,
    notificationData: {
      title: string;
      userName: string;
      message: string;
      type: string;
      priority: string;
      date: string;
      entityType?: string;
      entityId?: string;
      content?: string;
      actionRequired?: string;
      actionUrl?: string;
      actionText?: string;
    }
  ) {
    const subject = `${notificationData.title} - LogicorpTMS`;

    const html = templateService.getNotificationHtml({
      title: notificationData.title,
      userName: notificationData.userName,
      message: notificationData.message,
      type: notificationData.type,
      priority: notificationData.priority,
      date: notificationData.date,
      entityType: notificationData.entityType,
      entityId: notificationData.entityId,
      content: notificationData.content,
      actionRequired: notificationData.actionRequired,
      actionUrl: notificationData.actionUrl,
      actionText: notificationData.actionText,
      dashboardUrl: `${config.email.frontendUrl}/dashboard`,
      notificationsUrl: `${config.email.frontendUrl}/notifications`,
      supportUrl: `${config.email.frontendUrl}/support`,
    });

    const text = templateService.getNotificationText({
      title: notificationData.title,
      userName: notificationData.userName,
      message: notificationData.message,
      type: notificationData.type,
      priority: notificationData.priority,
      date: notificationData.date,
      entityType: notificationData.entityType,
      entityId: notificationData.entityId,
      content: notificationData.content,
      actionRequired: notificationData.actionRequired,
      actionUrl: notificationData.actionUrl,
      actionText: notificationData.actionText,
      dashboardUrl: `${config.email.frontendUrl}/dashboard`,
      notificationsUrl: `${config.email.frontendUrl}/notifications`,
      supportUrl: `${config.email.frontendUrl}/support`,
    });

    await this.sendEmail(email, subject, html, text);
  }

  async sendTeamInvitation(
    email: string,
    invitationData: {
      userName: string;
      inviterName: string;
      organizationName: string;
      roles: string[];
      invitationToken: string;
    }
  ) {
    const acceptUrl = `${config.email.frontendUrl}/accept-invitation?token=${invitationData.invitationToken}`;
    const subject = `You're invited to join ${invitationData.organizationName} on LogicorpTMS`;

    const html = templateService.getTeamInvitationHtml({
      userName: invitationData.userName,
      inviterName: invitationData.inviterName,
      organizationName: invitationData.organizationName,
      roles: invitationData.roles.join(", "),
      invitationDate: new Date().toLocaleDateString(),
      email,
      acceptUrl,
      supportUrl: `${config.email.frontendUrl}/support`,
      privacyUrl: `${config.email.frontendUrl}/privacy`,
      termsUrl: `${config.email.frontendUrl}/terms`,
    });

    const text = templateService.getTeamInvitationText({
      userName: invitationData.userName,
      inviterName: invitationData.inviterName,
      organizationName: invitationData.organizationName,
      roles: invitationData.roles.join(", "),
      invitationDate: new Date().toLocaleDateString(),
      email,
      acceptUrl,
      supportUrl: `${config.email.frontendUrl}/support`,
      privacyUrl: `${config.email.frontendUrl}/privacy`,
      termsUrl: `${config.email.frontendUrl}/terms`,
    });

    await this.sendEmail(email, subject, html, text);
  }

  async sendPermissionChangeNotification(
    email: string,
    firstName: string,
    organizationName: string,
    changes: {
      addedPermissions: string[];
      removedPermissions: string[];
      roleChanges: string[];
    }
  ) {
    const subject = `Your permissions have been updated - ${organizationName}`;

    const html = templateService.getPermissionChangeHtml({
      firstName,
      organizationName,
      addedPermissions: changes.addedPermissions,
      removedPermissions: changes.removedPermissions,
      roleChanges: changes.roleChanges,
      oldRoles: changes.roleChanges.slice(
        0,
        Math.floor(changes.roleChanges.length / 2)
      ),
      newRoles: changes.roleChanges.slice(
        Math.floor(changes.roleChanges.length / 2)
      ),
      date: new Date().toLocaleDateString(),
      dashboardUrl: `${config.email.frontendUrl}/dashboard`,
      supportUrl: `${config.email.frontendUrl}/support`,
    });

    const text = templateService.getPermissionChangeText({
      firstName,
      organizationName,
      addedPermissions: changes.addedPermissions,
      removedPermissions: changes.removedPermissions,
      roleChanges: changes.roleChanges,
      date: new Date().toLocaleDateString(),
      dashboardUrl: `${config.email.frontendUrl}/dashboard`,
    });

    await this.sendEmail(email, subject, html, text);
  }
}

export const emailService = new EmailService();
