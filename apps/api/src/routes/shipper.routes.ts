import { Router } from "express";
import { ShipperController } from "../controllers/shipper.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validate-request.middleware.js";
import {
  createShipperSchema,
  updateShipperSchema,
} from "../controllers/shipper.controller.js";
import { requireEmailVerification } from "../middleware/email-verification.middleware.js";
import { validateTenant } from "../middleware/tenant.middleware.js";
import { authorize } from "../middleware/authorization.middleware.js";
import { PERMISSIONS } from "@tms/shared-types";

const router: Router = Router();
const shipperController = new ShipperController();

// Apply authentication middleware to all routes
router.use(authenticate);
router.use(validateTenant);
router.use(requireEmailVerification);
// Shipper routes
router.get(
  "/",
  authorize(PERMISSIONS.SHIPPER_VIEW),
  shipperController.getShippers.bind(shipperController)
);
router.get(
  "/statistics",
  authorize(PERMISSIONS.SHIPPER_VIEW),
  shipperController.getShipperStatistics.bind(shipperController)
);
router.get(
  "/search",
  authorize(PERMISSIONS.SHIPPER_VIEW),
  shipperController.searchShippers.bind(shipperController)
);
router.get(
  "/export",
  authorize(PERMISSIONS.SHIPPER_VIEW),
  shipperController.exportShippers.bind(shipperController)
);
router.get(
  "/:id",
  authorize(PERMISSIONS.SHIPPER_VIEW),
  shipperController.getShipperById.bind(shipperController)
);

router.post(
  "/",
  authorize(PERMISSIONS.SHIPPER_CREATE),
  validateRequest({ body: createShipperSchema }),
  shipperController.createShipper.bind(shipperController)
);

router.put(
  "/:id",
  authorize(PERMISSIONS.SHIPPER_EDIT),
  validateRequest({ body: updateShipperSchema }),
  shipperController.updateShipper.bind(shipperController)
);

router.delete(
  "/:id",
  authorize(PERMISSIONS.SHIPPER_DELETE),
  shipperController.deleteShipper.bind(shipperController)
);

// Bulk operations
router.post(
  "/bulk/update",
  authorize(PERMISSIONS.SHIPPER_EDIT),
  shipperController.bulkUpdate.bind(shipperController)
);
router.post(
  "/bulk/delete",
  authorize(PERMISSIONS.SHIPPER_DELETE),
  shipperController.bulkDelete.bind(shipperController)
);

export default router;
