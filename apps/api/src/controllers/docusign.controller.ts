import { Request, Response } from 'express';
import { docusignService } from '../services/docusign.service.js';
import { DocumentGenerationService } from '../services/document-generation.service.js';
import { storageService } from '../services/storage.service.js';
import { auditService } from '../services/audit.service.js';
import { notificationService } from '../services/notification.service.js';
import prisma from '../config/database.js';

export const docusignController = {
  /**
   * Send rate confirmation for signature
   * POST /api/v1/loads/:id/send-for-signature
   */
  async sendForSignature(req: Request, res: Response) {
    try {
      const { id: loadId } = req.params;
      const userId = req.auth!.userId;
      const organizationId = req.auth!.organizationId;

      // Fetch load with related data
      const load = await prisma.load.findFirst({
        where: {
          id: loadId,
          organizationId,
        },
        include: {
          carrier: true,
          customer: true,
          creator: true,
        },
      });

      if (!load) {
        return res.status(404).json({
          success: false,
          message: 'Load not found',
        });
      }

      // Validate load has carrier assigned
      if (!load.carrier) {
        return res.status(400).json({
          success: false,
          message: 'Load must have a carrier assigned before sending for signature',
        });
      }

      // Validate load status (must be BOOKED or later)
      const validStatuses = ['BOOKED', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED'];
      if (!validStatuses.includes(load.status)) {
        return res.status(400).json({
          success: false,
          message: 'Load must be in BOOKED status or later to send for signature',
        });
      }

      // Check if already sent and pending/completed
      if (
        load.docusignEnvelopeId &&
        load.docusignStatus &&
        !['declined', 'voided'].includes(load.docusignStatus)
      ) {
        return res.status(400).json({
          success: false,
          message: `Rate confirmation already sent for signature (status: ${load.docusignStatus})`,
        });
      }

      // Generate rate confirmation PDF
      const documentService = new DocumentGenerationService();
      const rateConfirmationPdf = await documentService.generateRateConfirmation(
        loadId,
        organizationId,
        userId
      );

      // Get broker info (user who is sending)
      const brokerUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true, email: true },
      });

      const brokerName = brokerUser 
        ? `${brokerUser.firstName} ${brokerUser.lastName}`.trim() || brokerUser.email
        : req.auth!.email;

      // Send to DocuSign
      const envelope = await docusignService.createAndSendEnvelope({
        loadId: load.id,
        loadNumber: load.loadNumber,
        carrierEmail: load.carrier.email,
        carrierName: load.carrier.companyName,
        brokerEmail: req.auth!.email,
        brokerName: brokerName,
        rateConfirmationPdfBuffer: rateConfirmationPdf,
      });

      // Update load with envelope info
      await prisma.load.update({
        where: { id: loadId },
        data: {
          docusignEnvelopeId: envelope.envelopeId,
          docusignStatus: envelope.status,
          docusignSentAt: new Date(),
        },
      });

      // Create audit log
      await auditService.log({
        organizationId,
        userId,
        action: 'DOCUSIGN_ENVELOPE_SENT',
        entityType: 'LOAD',
        entityId: loadId,
        changes: {
          envelopeId: envelope.envelopeId,
          carrierEmail: load.carrier.email,
        },
      });

      // Send notification to user
      await notificationService.create({
        organizationId,
        recipientId: userId,
        type: 'LOAD_STATUS_CHANGE',
        title: 'Rate Confirmation Sent',
        message: `Rate confirmation for load ${load.loadNumber} has been sent to ${load.carrier.companyName} for signature`,
        entityType: 'LOAD',
        entityId: loadId,
      });

      return res.status(200).json({
        success: true,
        message: 'Rate confirmation sent for signature successfully',
        data: {
          envelopeId: envelope.envelopeId,
          status: envelope.status,
          sentTo: load.carrier.email,
        },
      });
    } catch (error: any) {
      console.error('Error sending rate confirmation for signature:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to send rate confirmation for signature',
      });
    }
  },

  /**
   * Get signature status for a load
   * GET /api/v1/loads/:id/signature-status
   */
  async getSignatureStatus(req: Request, res: Response) {
    try {
      const { id: loadId } = req.params;
      const organizationId = req.auth!.organizationId;

      const load = await prisma.load.findFirst({
        where: {
          id: loadId,
          organizationId,
        },
        select: {
          docusignEnvelopeId: true,
          docusignStatus: true,
          docusignSentAt: true,
          docusignCompletedAt: true,
          signedRateConfirmationUrl: true,
        },
      });

      if (!load) {
        return res.status(404).json({
          success: false,
          message: 'Load not found',
        });
      }

      if (!load.docusignEnvelopeId) {
        return res.status(200).json({
          success: true,
          data: {
            status: 'not_sent',
            message: 'Rate confirmation has not been sent for signature',
          },
        });
      }

      // Optionally fetch latest status from DocuSign
      let currentStatus = load.docusignStatus;
      if (load.docusignEnvelopeId && load.docusignStatus !== 'completed') {
        try {
          const envelopeStatus = await docusignService.getEnvelopeStatus(
            load.docusignEnvelopeId
          );
          currentStatus = envelopeStatus.status;

          // Update if status changed
          if (currentStatus !== load.docusignStatus) {
            await prisma.load.update({
              where: { id: loadId },
              data: { docusignStatus: currentStatus },
            });
          }
        } catch (error) {
          console.error('Error fetching envelope status from DocuSign:', error);
          // Continue with cached status
        }
      }

      return res.status(200).json({
        success: true,
        data: {
          envelopeId: load.docusignEnvelopeId,
          status: currentStatus,
          sentAt: load.docusignSentAt,
          completedAt: load.docusignCompletedAt,
          signedDocumentUrl: load.signedRateConfirmationUrl,
        },
      });
    } catch (error: any) {
      console.error('Error getting signature status:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to get signature status',
      });
    }
  },

  /**
   * DocuSign webhook handler
   * POST /api/v1/webhooks/docusign
   */
  async handleWebhook(req: Request, res: Response) {
    try {
      const payload = req.body || {};
      const rawBody = (req as any).rawBody;
      const signature = req.headers['x-docusign-signature-1'] as string;

      // Validate webhook signature (if configured)
      const isValid = docusignService.validateWebhookSignature(
        rawBody || JSON.stringify(payload), // Fallback to stringify if rawBody missing (e.g. tests)
        signature
      );

      if (!isValid) {
        console.error('Invalid DocuSign webhook signature');
        return res.status(401).json({
          success: false,
          message: 'Invalid webhook signature',
        });
      }

      // Extract envelope data
      const { event, data } = payload;
      const envelopeId = data?.envelopeSummary?.envelopeId || data?.envelopeId;
      const status = data?.envelopeSummary?.status || (event === 'envelope-completed' ? 'completed' : 'unknown');

      if (!envelopeId) {
        console.error('Invalid webhook payload: missing envelopeId', JSON.stringify(payload));
        return res.status(400).json({
          success: false,
          message: 'Invalid webhook payload: missing envelopeId',
        });
      }

      console.log(`DocuSign webhook received: ${event}, envelope: ${envelopeId}, status: ${status}`);

      console.log(`DocuSign webhook received: ${event}, envelope: ${envelopeId}, status: ${status}`);

      // Find load by envelope ID
      const load = await prisma.load.findFirst({
        where: {
          docusignEnvelopeId: envelopeId,
        },
        include: {
          carrier: true,
        },
      });

      if (!load) {
        console.warn(`Load not found for envelope ID: ${envelopeId}`);
        return res.status(200).json({
          success: true,
          message: 'Webhook received but load not found',
        });
      }

      // Update load status
      await prisma.load.update({
        where: { id: load.id },
        data: {
          docusignStatus: status,
        },
      });

      // Handle completed envelope
      if (status === 'completed') {
        await handleEnvelopeCompleted(load.id, envelopeId, load.organizationId);
      }

      // Handle declined envelope
      if (status === 'declined') {
        await notificationService.create({
          organizationId: load.organizationId,
          recipientId: load.createdBy,
          type: 'LOAD_STATUS_CHANGE',
          title: 'Rate Confirmation Declined',
          message: `Rate confirmation for load ${load.loadNumber} was declined by ${load.carrier?.companyName}`,
          entityType: 'LOAD',
          entityId: load.id,
        });
      }

      // Process webhook
      await docusignService.handleWebhook(payload);

      return res.status(200).json({
        success: true,
        message: 'Webhook processed successfully',
      });
    } catch (error: any) {
      console.error('Error processing DocuSign webhook:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to process webhook',
      });
    }
  },
};

/**
 * Handle completed envelope - download and store signed document
 */
async function handleEnvelopeCompleted(
  loadId: string,
  envelopeId: string,
  organizationId: string
) {
  try {
    // Download signed document from DocuSign
    const signedPdf = await docusignService.downloadCompletedDocument(envelopeId);

    // Get load number for filename
    const load = await prisma.load.findUnique({
      where: { id: loadId },
      select: { loadNumber: true, createdBy: true },
    });

    if (!load) {
      throw new Error('Load not found');
    }

    // Store signed document
    const filename = `rate-confirmation-signed-${load.loadNumber}-${Date.now()}.pdf`;
    const filePath = `signed-documents/${organizationId}/${loadId}/${filename}`;

    const uploadResult = await storageService.upload(
      {
        buffer: signedPdf,
        size: signedPdf.length,
        mimetype: 'application/pdf',
        originalname: filename,
        fieldname: 'file',
        encoding: '7bit',
      },
      filePath
    );

    const fileUrl = uploadResult.url;

    // Update load with signed document URL and completion time
    await prisma.load.update({
      where: { id: loadId },
      data: {
        docusignStatus: 'completed',
        docusignCompletedAt: new Date(),
        signedRateConfirmationUrl: fileUrl,
      },
    });

    // Create audit log
    await auditService.log({
      organizationId,
      userId: load.createdBy,
      action: 'DOCUSIGN_ENVELOPE_COMPLETED',
      entityType: 'LOAD',
      entityId: loadId,
      changes: {
        envelopeId,
        signedDocumentUrl: fileUrl,
      },
    });

    // Send notification
    await notificationService.create({
      organizationId,
      recipientId: load.createdBy,
      type: 'DOCUMENT_GENERATED',
      title: 'Rate Confirmation Signed',
      message: `Rate confirmation for load ${load.loadNumber} has been signed and is now available`,
      entityType: 'LOAD',
      entityId: loadId,
    });

    console.log(`Signed document stored for load ${loadId}: ${fileUrl}`);
  } catch (error) {
    console.error('Error handling completed envelope:', error);
    throw error;
  }
}
