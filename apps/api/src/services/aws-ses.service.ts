import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { config } from "../config/env.js";
import { logger } from "../config/logger.js";

/**
 * AWS SES Email Service - Simplified for Notifications
 * Handles email notifications using AWS SES for the simplified notification system
 */
export class AWSSESService {
  private client!: SESClient;
  private isConfigured: boolean;

  constructor() {
    this.isConfigured = !!(
      config.aws.accessKeyId &&
      config.aws.secretAccessKey &&
      config.aws.region
    );

    if (this.isConfigured) {
      this.client = new SESClient({
        region: config.aws.region,
        credentials: {
          accessKeyId: config.aws.accessKeyId!,
          secretAccessKey: config.aws.secretAccessKey!,
        },
      });
      logger.info("AWS SES service initialized for notifications");
    } else {
      logger.warn(
        "AWS SES not configured. Email notifications will be logged only. Configure AWS credentials to enable email delivery."
      );
    }
  }

  /**
   * Send notification email - Core method for simplified notification system
   */
  async sendEmail(
    to: string,
    subject: string,
    htmlBody: string,
    textBody?: string
  ): Promise<{ sent: boolean; messageId?: string; error?: string }> {
    if (!this.isConfigured) {
      logger.info(`Notification email would be sent to ${to}:`);
      logger.info(`Subject: ${subject}`);
      logger.info(`Body: ${textBody || htmlBody.substring(0, 200)}...`);

      return {
        sent: false,
        error: "AWS SES not configured. Email logged only.",
      };
    }

    try {
      const command = new SendEmailCommand({
        Source: `${config.aws.ses.fromName} <${config.aws.ses.fromEmail}>`,
        Destination: {
          ToAddresses: [to],
        },
        Message: {
          Subject: {
            Data: subject,
            Charset: "UTF-8",
          },
          Body: {
            Html: {
              Data: htmlBody,
              Charset: "UTF-8",
            },
            Text: textBody
              ? {
                  Data: textBody,
                  Charset: "UTF-8",
                }
              : undefined,
          },
        },
        ConfigurationSetName: config.aws.ses.configurationSet,
      });

      const result = await this.client.send(command);

      logger.info(
        `Notification email sent successfully to ${to}, MessageId: ${result.MessageId}`
      );

      return {
        sent: true,
        messageId: result.MessageId || undefined,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error(`Failed to send notification email to ${to}:`, error);

      return {
        sent: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Check if SES is properly configured for notifications
   */
  get isReady(): boolean {
    return this.isConfigured;
  }

  /**
   * Get configuration status for notifications
   */
  getConfigurationStatus(): {
    configured: boolean;
    region?: string;
    fromEmail?: string;
    fromName?: string;
  } {
    return {
      configured: this.isConfigured,
      region: this.isConfigured ? config.aws.region : undefined,
      fromEmail: this.isConfigured ? config.aws.ses.fromEmail : undefined,
      fromName: this.isConfigured ? config.aws.ses.fromName : undefined,
    };
  }
}

// Export singleton instance for notification system
export const awsSESService = new AWSSESService();
