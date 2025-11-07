import { Router } from "express";
import { authorize } from "../middleware/authorization.middleware.js";
import { PERMISSIONS } from "@tms/shared-types";
import { invoiceController } from "../controllers/invoice.controller.js";
import { requireEmailVerification } from "../middleware/email-verification.middleware.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validateTenant } from "../middleware/tenant.middleware.js";

const router: Router = Router();
// All load routes require authentication, tenant validation, and email verification
router.use(authenticate);
router.use(validateTenant);
router.use(requireEmailVerification);

// List invoices (accounting only)
router.get(
  "/",
  authorize(PERMISSIONS.INVOICE_VIEW),
  invoiceController.list.bind(invoiceController)
);

// Get invoice statistics
router.get(
  "/statistics",
  authorize(PERMISSIONS.INVOICE_VIEW),
  invoiceController.getStatistics.bind(invoiceController)
);

// Get invoice by id
router.get(
  "/:id",
  authorize(PERMISSIONS.INVOICE_VIEW),
  invoiceController.getById.bind(invoiceController)
);

// Add payment to invoice (accounting edit)
router.post(
  "/:id/payments",
  authorize(PERMISSIONS.INVOICE_EDIT),
  invoiceController.addPayment.bind(invoiceController)
);

// Export invoice to PDF
router.post(
  "/:id/export",
  authorize(PERMISSIONS.INVOICE_VIEW),
  invoiceController.exportPdf.bind(invoiceController)
);

export default router;
