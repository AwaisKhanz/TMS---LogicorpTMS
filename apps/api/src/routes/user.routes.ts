import { Router } from "express";
import {
  UserController,
  createUserSchema,
  updateUserSchema,
} from "../controllers/user.controller.js";
import { validateRequest } from "../middleware/validation.middleware.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validateTenant } from "../middleware/tenant.middleware.js";
import { requireEmailVerification } from "../middleware/email-verification.middleware.js";
import { authorize } from "../middleware/authorization.middleware.js";
import { PERMISSIONS } from "@tms/shared-types";

const router: Router = Router();
const userController = new UserController();

// All user routes require authentication, tenant validation, and email verification
router.use(authenticate);
router.use(validateTenant);
router.use(requireEmailVerification);

// User routes
router.get("/", authorize(PERMISSIONS.USER_VIEW), userController.getUsers);
router.get(
  "/:id",
  authorize(PERMISSIONS.USER_VIEW),
  userController.getUserById
);
router.post(
  "/",
  authorize(PERMISSIONS.USER_CREATE),
  validateRequest(createUserSchema),
  userController.createUser
);
router.put(
  "/:id",
  authorize(PERMISSIONS.USER_EDIT),
  validateRequest(updateUserSchema),
  userController.updateUser
);
router.delete(
  "/:id",
  authorize(PERMISSIONS.USER_DELETE),
  userController.deleteUser
);

export default router;
