import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Handlebars from "handlebars";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class TemplateService {
  private templatesDir: string;

  constructor() {
    this.templatesDir = path.join(__dirname, "../templates");
  }

  private readTemplate(templateName: string, extension: string): string {
    const templatePath = path.join(
      this.templatesDir,
      `${templateName}.${extension}`
    );

    try {
      return fs.readFileSync(templatePath, "utf-8");
    } catch (error) {
      throw new Error(`Template not found: ${templateName}.${extension}`);
    }
  }

  private renderTemplate(
    template: string,
    variables: Record<string, any>
  ): string {
    try {
      const compiledTemplate = Handlebars.compile(template);
      return compiledTemplate(variables);
    } catch (error) {
      console.error("Template rendering error:", error);
      // Fallback to simple string replacement for basic templates
      let rendered = template;
      for (const [key, value] of Object.entries(variables)) {
        if (Array.isArray(value)) {
          const arrayHtml = value
            .map((item: any) => {
              if (typeof item === "object") {
                return `<div class="attachment-item">
                <div class="attachment-icon">📄</div>
                <div class="attachment-info">
                  <div class="attachment-name">${item.name}</div>
                  <div class="attachment-size">${item.size}</div>
                </div>
              </div>`;
              }
              return `<div>${item}</div>`;
            })
            .join("");
          const regex = new RegExp(`{{${key}}}`, "g");
          rendered = rendered.replace(regex, arrayHtml);
        } else {
          const regex = new RegExp(`{{${key}}}`, "g");
          rendered = rendered.replace(regex, String(value || ""));
        }
      }
      return rendered;
    }
  }

  getPasswordResetHtml(variables: {
    resetUrl: string;
    userName?: string;
  }): string {
    const template = this.readTemplate("password-reset", "html");
    const greeting = variables.userName
      ? `Hi ${variables.userName},`
      : "Hello,";

    return this.renderTemplate(template, {
      ...variables,
      greeting,
    });
  }

  getPasswordResetText(variables: {
    resetUrl: string;
    userName?: string;
  }): string {
    const template = this.readTemplate("password-reset", "txt");
    const greeting = variables.userName
      ? `Hi ${variables.userName},`
      : "Hello,";

    return this.renderTemplate(template, {
      ...variables,
      greeting,
    });
  }

  getWelcomeHtml(variables: {
    userName: string;
    organizationName: string;
    dashboardUrl: string;
  }): string {
    const template = this.readTemplate("welcome", "html");
    return this.renderTemplate(template, variables);
  }

  getWelcomeText(variables: {
    userName: string;
    organizationName: string;
    dashboardUrl: string;
  }): string {
    const template = this.readTemplate("welcome", "txt");
    return this.renderTemplate(template, variables);
  }

  getEmailVerificationHtml(variables: {
    verificationUrl: string;
    userName: string;
    supportUrl?: string;
    privacyUrl?: string;
    termsUrl?: string;
  }): string {
    const template = this.readTemplate("email-verification", "html");
    return this.renderTemplate(template, variables);
  }

  getEmailVerificationText(variables: {
    verificationUrl: string;
    userName: string;
  }): string {
    const template = this.readTemplate("email-verification", "txt");
    return this.renderTemplate(template, variables);
  }

  getLoadStatusUpdateHtml(variables: {
    userName: string;
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
    loadUrl: string;
    dashboardUrl: string;
    supportUrl: string;
    privacyUrl: string;
  }): string {
    const template = this.readTemplate("load-status-update", "html");
    return this.renderTemplate(template, variables);
  }

  getLoadStatusUpdateText(variables: {
    userName: string;
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
    loadUrl: string;
    dashboardUrl: string;
    supportUrl: string;
    privacyUrl: string;
  }): string {
    const template = this.readTemplate("load-status-update", "txt");
    return this.renderTemplate(template, variables);
  }

  getDocumentDeliveryHtml(variables: {
    userName: string;
    loadNumber: string;
    documentType: string;
    message?: string;
    generatedDate: string;
    expiryDate: string;
    referenceNumber?: string;
    attachments?: Array<{ name: string; size: string }>;
    downloadUrl: string;
    loadUrl: string;
    dashboardUrl: string;
    supportUrl: string;
  }): string {
    const template = this.readTemplate("document-delivery", "html");
    return this.renderTemplate(template, variables);
  }

  getDocumentDeliveryText(variables: {
    userName: string;
    loadNumber: string;
    documentType: string;
    message?: string;
    generatedDate: string;
    expiryDate: string;
    referenceNumber?: string;
    attachments?: Array<{ name: string; size: string }>;
    downloadUrl: string;
    loadUrl: string;
    dashboardUrl: string;
    supportUrl: string;
  }): string {
    const template = this.readTemplate("document-delivery", "txt");
    return this.renderTemplate(template, variables);
  }

  getNotificationHtml(variables: {
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
    dashboardUrl: string;
    notificationsUrl: string;
    supportUrl: string;
  }): string {
    const template = this.readTemplate("notification", "html");
    return this.renderTemplate(template, variables);
  }

  getNotificationText(variables: {
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
    dashboardUrl: string;
    notificationsUrl: string;
    supportUrl: string;
  }): string {
    const template = this.readTemplate("notification", "txt");
    return this.renderTemplate(template, variables);
  }

  getTeamInvitationHtml(variables: {
    userName: string;
    inviterName: string;
    organizationName: string;
    roles: string;
    invitationDate: string;
    email: string;
    acceptUrl: string;
    supportUrl?: string;
    privacyUrl?: string;
    termsUrl?: string;
  }): string {
    const template = this.readTemplate("team-invitation", "html");
    return this.renderTemplate(template, variables);
  }

  getTeamInvitationText(variables: {
    userName: string;
    inviterName: string;
    organizationName: string;
    roles: string;
    invitationDate: string;
    email: string;
    acceptUrl: string;
    supportUrl?: string;
    privacyUrl?: string;
    termsUrl?: string;
  }): string {
    const template = this.readTemplate("team-invitation", "txt");
    return this.renderTemplate(template, variables);
  }

  getPermissionChangeHtml(variables: {
    firstName: string;
    organizationName: string;
    addedPermissions: string[];
    removedPermissions: string[];
    roleChanges: string[];
    oldRoles: string[];
    newRoles: string[];
    date: string;
    dashboardUrl: string;
    supportUrl: string;
  }): string {
    const template = this.readTemplate("permission-change", "html");
    return this.renderTemplate(template, variables);
  }

  getPermissionChangeText(variables: {
    firstName: string;
    organizationName: string;
    addedPermissions: string[];
    removedPermissions: string[];
    roleChanges: string[];
    date: string;
    dashboardUrl: string;
  }): string {
    let text = `Hello ${variables.firstName},\n\n`;
    text += `Your account permissions have been updated in ${variables.organizationName}.\n\n`;

    if (variables.addedPermissions.length > 0) {
      text += `New permissions added:\n`;
      variables.addedPermissions.forEach((permission) => {
        text += `- ${permission}\n`;
      });
      text += `\n`;
    }

    if (variables.removedPermissions.length > 0) {
      text += `Permissions removed:\n`;
      variables.removedPermissions.forEach((permission) => {
        text += `- ${permission}\n`;
      });
      text += `\n`;
    }

    text += `To see your updated permissions, please refresh your browser or log out and log back in.\n\n`;
    text += `If you have any questions, please contact your administrator.\n\n`;
    text += `Best regards,\n${variables.organizationName} Team`;

    return text;
  }
}

export const templateService = new TemplateService();
