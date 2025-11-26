import { Router } from 'express';
import { docusignController } from '../controllers/docusign.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router: Router = Router();

// Send rate confirmation for signature (authenticated)
router.post(
  '/loads/:id/send-for-signature',
  authenticate,
  docusignController.sendForSignature
);

// Get signature status (authenticated)
router.get(
  '/loads/:id/signature-status',
  authenticate,
  docusignController.getSignatureStatus
);

// DocuSign webhook (no authentication - validated by signature)
router.post('/webhooks/docusign', docusignController.handleWebhook);

export default router;
