import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

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
    variables: Record<string, string>
  ): string {
    let rendered = template;

    // Replace {{variable}} with actual values
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, "g");
      rendered = rendered.replace(regex, value);
    }

    return rendered;
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
}

export const templateService = new TemplateService();
