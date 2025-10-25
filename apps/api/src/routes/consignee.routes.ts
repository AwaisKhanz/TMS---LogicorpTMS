import { Router } from "express";
import { ConsigneeController } from "../controllers/consignee.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validate-request.middleware.js";
import {
  createConsigneeSchema,
  updateConsigneeSchema,
} from "../controllers/consignee.controller.js";
import { validateTenant } from "../middleware/tenant.middleware.js";
import { requireEmailVerification } from "../middleware/email-verification.middleware.js";
import { authorize } from "../middleware/authorization.middleware.js";
import { PERMISSIONS } from "@tms/shared-types";

const router: Router = Router();
const consigneeController = new ConsigneeController();

// Apply authentication middleware to all routes
router.use(authenticate);
router.use(validateTenant);
router.use(requireEmailVerification);

// Consignee routes
router.get(
  "/",
  authorize(PERMISSIONS.CONSIGNEE_VIEW),
  consigneeController.getConsignees.bind(consigneeController)
);
router.get(
  "/statistics",
  authorize(PERMISSIONS.CONSIGNEE_VIEW),
  consigneeController.getConsigneeStatistics.bind(consigneeController)
);
router.get(
  "/search",
  authorize(PERMISSIONS.CONSIGNEE_VIEW),
  consigneeController.searchConsignees.bind(consigneeController)
);
router.get(
  "/export",
  authorize(PERMISSIONS.CONSIGNEE_VIEW),
  consigneeController.exportConsignees.bind(consigneeController)
);
router.get(
  "/:id",
  authorize(PERMISSIONS.CONSIGNEE_VIEW),
  consigneeController.getConsigneeById.bind(consigneeController)
);

router.post(
  "/",
  authorize(PERMISSIONS.CONSIGNEE_CREATE),
  validateRequest({ body: createConsigneeSchema }),
  consigneeController.createConsignee.bind(consigneeController)
);

router.put(
  "/:id",
  authorize(PERMISSIONS.CONSIGNEE_EDIT),
  validateRequest({ body: updateConsigneeSchema }),
  consigneeController.updateConsignee.bind(consigneeController)
);

router.delete(
  "/:id",
  authorize(PERMISSIONS.CONSIGNEE_DELETE),
  consigneeController.deleteConsignee.bind(consigneeController)
);

// Bulk operations
router.post(
  "/bulk/update",
  authorize(PERMISSIONS.CONSIGNEE_EDIT),
  consigneeController.bulkUpdate.bind(consigneeController)
);
router.post(
  "/bulk/delete",
  authorize(PERMISSIONS.CONSIGNEE_DELETE),
  consigneeController.bulkDelete.bind(consigneeController)
);

export default router;
