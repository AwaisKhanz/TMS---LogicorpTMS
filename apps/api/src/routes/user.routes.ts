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

const router = Router();
const userController = new UserController();

// All user routes require authentication, tenant validation, and email verification
router.use(authenticate);
router.use(validateTenant);
router.use(requireEmailVerification);

// User routes
router.get("/", userController.getUsers);
router.get("/:id", userController.getUserById);
router.post("/", validateRequest(createUserSchema), userController.createUser);
router.put(
  "/:id",
  validateRequest(updateUserSchema),
  userController.updateUser
);
router.delete("/:id", userController.deleteUser);

export default router;
