import docusign from 'docusign-esign';
import { config } from '../config/env.js';
import crypto from 'crypto';
import prisma from '../config/database.js';
import { storageService } from './storage.service.js';

const SCOPES = ['signature', 'impersonation'];
const TOKEN_EXPIRATION_BUFFER = 10 * 60 * 1000; // 10 minutes before expiry

interface AccessTokenCache {
  token: string;
  expiresAt: number;
}

class DocuSignService {
  private apiClient: docusign.ApiClient;
  private accessTokenCache: AccessTokenCache | null = null;

  constructor() {
    this.apiClient = new docusign.ApiClient();
    this.apiClient.setOAuthBasePath(config.docusign.oauthBasePath);
  }

  /**
   * Get a valid access token (cached or new)
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (
      this.accessTokenCache &&
      Date.now() < this.accessTokenCache.expiresAt - TOKEN_EXPIRATION_BUFFER
    ) {
      return this.accessTokenCache.token;
    }

    // Request new token using JWT
    try {
      // Ensure private key is properly formatted
      const privateKeyBytes = Buffer.from(config.docusign.privateKey);
      
      const results = await this.apiClient.requestJWTUserToken(
        config.docusign.integrationKey,
        config.docusign.userId,
        SCOPES,
        privateKeyBytes,
        3600 // 1 hour expiration
      );

      const accessToken = results.body.access_token;
      const expiresIn = results.body.expires_in;

      // Cache the token
      this.accessTokenCache = {
        token: accessToken,
        expiresAt: Date.now() + expiresIn * 1000,
      };

      // Set default header for API client
      this.apiClient.addDefaultHeader('Authorization', `Bearer ${accessToken}`);

      return accessToken;
    } catch (error: any) {
      console.error('DocuSign JWT authentication failed:', error);
      throw new Error(
        `Failed to authenticate with DocuSign: ${error.message}`
      );
    }
  }

  /**
   * Get user info and account details
   */
  private async getUserInfo(): Promise<{
    accountId: string;
    basePath: string;
  }> {
    const accessToken = await this.getAccessToken();
    this.apiClient.setOAuthBasePath(config.docusign.oauthBasePath);

    try {
      const userInfo = await this.apiClient.getUserInfo(accessToken);

      // Get the default account
      const accounts = userInfo.accounts || [];
      if (accounts.length === 0) {
        throw new Error('No DocuSign accounts found for this user');
      }

      const account = accounts.find((acc: any) => acc.isDefault === 'true') || accounts[0];

      return {
        accountId: account.accountId!,
        basePath: account.baseUri + '/restapi',
      };
    } catch (error: any) {
      console.error('Failed to get DocuSign user info:', error);
      throw new Error(`Failed to get user info: ${error.message}`);
    }
  }

  /**
   * Create signature tabs with consistent positioning
   */
  private createSignatureTabs(): docusign.Tabs {
    return {
      signHereTabs: [
        {
          anchorString: '/sig1/',
          anchorUnits: 'pixels',
          anchorXOffset: '0',
          anchorYOffset: '0',
          // Fallback to absolute positioning if anchor not found
          pageNumber: '1',
          xPosition: '100',
          yPosition: '600',
          tabLabel: 'Carrier Signature',
          name: 'Carrier Signature',
        },
      ],
      dateSignedTabs: [
        {
          anchorString: '/date1/',
          anchorUnits: 'pixels',
          anchorXOffset: '0',
          anchorYOffset: '0',
          // Fallback
          pageNumber: '1',
          xPosition: '100',
          yPosition: '650',
          tabLabel: 'Date Signed',
          name: 'Date Signed',
        },
      ],
    };
  }

  /**
   * Create and send envelope for rate confirmation signing
   */
  async createAndSendEnvelope(params: {
    loadId: string;
    loadNumber: string;
    carrierEmail: string;
    carrierName: string;
    brokerEmail: string;
    brokerName: string;
    rateConfirmationPdfBuffer: Buffer;
  }): Promise<{ envelopeId: string; status: string; uri: string }> {
    const {
      loadId,
      loadNumber,
      carrierEmail,
      carrierName,
      brokerEmail,
      brokerName,
      rateConfirmationPdfBuffer,
    } = params;

    // Get access token and account info
    await this.getAccessToken();
    const { accountId, basePath } = await this.getUserInfo();
    this.apiClient.setBasePath(basePath);

    // Convert PDF to base64
    const documentBase64 = rateConfirmationPdfBuffer.toString('base64');

    // Create envelope definition
    const envelopeDefinition: docusign.EnvelopeDefinition = {
      emailSubject: `Rate Confirmation for Load ${loadNumber} - Please Sign`,
      emailBlurb: `Please review and sign the rate confirmation for load ${loadNumber}.`,
      status: 'sent', // Send immediately
      documents: [
        {
          documentBase64,
          name: `Rate_Confirmation_${loadNumber}.pdf`,
          fileExtension: 'pdf',
          documentId: '1',
        },
      ],
      recipients: {
        signers: [
          {
            email: carrierEmail,
            name: carrierName,
            recipientId: '1',
            routingOrder: '1',
            tabs: this.createSignatureTabs(),
          },
        ],
        carbonCopies: [
          {
            email: brokerEmail,
            name: brokerName,
            recipientId: '2',
            routingOrder: '2',
          },
        ],
      },
      customFields: {
        textCustomFields: [
          {
            name: 'loadId',
            value: loadId,
            required: 'false',
          },
          {
            name: 'loadNumber',
            value: loadNumber,
            required: 'false',
          },
        ],
      },
    };

    // Create envelope
    try {
      const envelopesApi = new docusign.EnvelopesApi(this.apiClient);
      const results = await envelopesApi.createEnvelope(accountId, {
        envelopeDefinition,
      });

      return {
        envelopeId: results.envelopeId!,
        status: results.status!,
        uri: results.uri!,
      };
    } catch (error: any) {
      console.error('Failed to create DocuSign envelope:', error);
      throw new Error(`Failed to create envelope: ${error.message}`);
    }
  }

  /**
   * Get envelope status
   */
  async getEnvelopeStatus(
    envelopeId: string
  ): Promise<{ status: string; completedDateTime?: string }> {
    await this.getAccessToken();
    const { accountId, basePath } = await this.getUserInfo();
    this.apiClient.setBasePath(basePath);

    try {
      const envelopesApi = new docusign.EnvelopesApi(this.apiClient);
      const envelope = await envelopesApi.getEnvelope(accountId, envelopeId);

      return {
        status: envelope.status!,
        completedDateTime: envelope.completedDateTime,
      };
    } catch (error: any) {
      console.error('Failed to get envelope status:', error);
      throw new Error(`Failed to get envelope status: ${error.message}`);
    }
  }

  /**
   * Download completed envelope documents
   */
  async downloadCompletedDocument(
    envelopeId: string
  ): Promise<Buffer> {
    await this.getAccessToken();
    const { accountId, basePath } = await this.getUserInfo();
    this.apiClient.setBasePath(basePath);

    try {
      const envelopesApi = new docusign.EnvelopesApi(this.apiClient);
      
      // Download combined PDF with certificate
      const document = await envelopesApi.getDocument(
        accountId,
        envelopeId,
        'combined', // Get all documents as one PDF
        { certificate: 'true' } // Include certificate of completion
      );

      // Convert to Buffer
      return Buffer.from(document as any);
    } catch (error: any) {
      console.error('Failed to download envelope document:', error);
      throw new Error(`Failed to download document: ${error.message}`);
    }
  }

  /**
   * Validate webhook signature (if HMAC is configured)
   */
  validateWebhookSignature(
    payload: string | Buffer,
    signature: string
  ): boolean {
    if (!config.docusign.webhookSecret) {
      // If no secret configured, skip validation (not recommended for production)
      console.warn('DocuSign webhook secret not configured - skipping signature validation');
      return true;
    }

    const hmac = crypto.createHmac('sha256', config.docusign.webhookSecret);
    hmac.update(payload);
    const expectedSignature = hmac.digest('base64');

    return signature === expectedSignature;
  }

  /**
   * Handle webhook events
   */
  async handleWebhook(payload: any): Promise<void> {
    const event = payload.event;
    const envelopeId = payload.data?.envelopeSummary?.envelopeId || payload.data?.envelopeId;

    console.log(`Received DocuSign webhook: ${event} for envelope ${envelopeId}`);

    if (!envelopeId) {
      console.warn('No envelope ID found in webhook payload');
      return;
    }

    // Find load by envelope ID
    const load = await prisma.load.findFirst({
      where: { docusignEnvelopeId: envelopeId },
    });

    if (!load) {
      console.warn(`No load found for envelope ID: ${envelopeId}`);
      return;
    }

    // Update status based on event
    let status = load.docusignStatus;
    
    if (event === 'envelope-completed') {
      status = 'completed';
      
      try {
        // Download signed document
        const pdfBuffer = await this.downloadCompletedDocument(envelopeId);
        
        // Upload to storage
        const fileName = `signed_rate_confirmation_${load.loadNumber}.pdf`;
        const uploadResult = await storageService.upload({
          buffer: pdfBuffer,
          originalname: fileName,
          mimetype: 'application/pdf',
          fieldname: 'file',
          encoding: '7bit',
          size: pdfBuffer.length
        }, 'documents'); // Upload to 'documents' folder/bucket

        // Update load with signed document URL and completion time
        await prisma.load.update({
          where: { id: load.id },
          data: {
            docusignStatus: 'completed',
            docusignCompletedAt: new Date(),
            signedRateConfirmationUrl: uploadResult.url,
          },
        });

        console.log(`Successfully processed completed envelope for load ${load.loadNumber}`);
      } catch (error) {
        console.error(`Failed to process completed envelope for load ${load.loadNumber}:`, error);
        // Don't throw here to avoid failing the webhook response, but log the error
      }
    } else if (event === 'envelope-declined') {
      status = 'declined';
      await prisma.load.update({
        where: { id: load.id },
        data: { docusignStatus: 'declined' },
      });
    } else if (event === 'envelope-voided') {
      status = 'voided';
      await prisma.load.update({
        where: { id: load.id },
        data: { docusignStatus: 'voided' },
      });
    } else if (event === 'envelope-sent' || event === 'envelope-delivered') {
      // Update status if it's just a status change
      status = event === 'envelope-sent' ? 'sent' : 'delivered';
      await prisma.load.update({
        where: { id: load.id },
        data: { docusignStatus: status },
      });
    }
  }
}

// Export singleton instance
export const docusignService = new DocuSignService();
