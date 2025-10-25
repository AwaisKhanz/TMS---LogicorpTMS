import { Router } from "express";
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import twoFactorRoutes from "./two-factor.routes.js";
import loadRoutes from "./load.routes.js";
import carrierRoutes from "./carrier.routes.js";
import customerRoutes from "./customer.routes.js";
import shipperRoutes from "./shipper.routes.js";
import consigneeRoutes from "./consignee.routes.js";
import documentRoutes from "./document.routes.js";
import documentTemplateRoutes from "./document-template.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import settingsRoutes from "./settings.routes.js";
import notificationRoutes from "./notification.routes.js";

const router: Router = Router();

// API routes
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/two-factor", twoFactorRoutes);
router.use("/loads", loadRoutes);
router.use("/carriers", carrierRoutes);
router.use("/customers", customerRoutes);
router.use("/shippers", shipperRoutes);
router.use("/consignees", consigneeRoutes);
router.use("/documents", documentRoutes);
router.use("/document-templates", documentTemplateRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/settings", settingsRoutes);
router.use("/notifications", notificationRoutes);

// Health check
router.get("/health", (_req, res) => {
  res.json({
    success: true,
    data: {
      status: "healthy",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    },
  });
});

export default router;
