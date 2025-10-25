import { Request, Response, NextFunction } from "express";
import { SettingsService } from "../services/settings.service";
import type {
  UpdateProfileRequest,
  ChangePasswordRequest,
  UpdateOrganizationRequest,
  UpdateBusinessSettingsRequest,
  UpdateDocumentNumberingRequest,
  InviteTeamMemberRequest,
  UpdateTeamMemberRequest,
  EnableTwoFactorRequest,
  DisableTwoFactorRequest,
} from "@tms/shared-types";

export class SettingsController {
  private settingsService: SettingsService;

  constructor() {
    this.settingsService = new SettingsService();
  }

  // ==================== PROFILE SETTINGS ====================

  getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const profile = await this.settingsService.getProfile(
        req.auth.userId,
        req.auth.organizationId
      );

      res.json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const updateData = req.body as UpdateProfileRequest;
      const profile = await this.settingsService.updateProfile(
        req.auth.userId,
        req.auth.organizationId,
        updateData
      );

      res.json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  };

  // ==================== SECURITY SETTINGS ====================

  getSecuritySettings = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const settings = await this.settingsService.getSecuritySettings(
        req.auth.userId,
        req.auth.organizationId
      );

      res.json({
        success: true,
        data: settings,
      });
    } catch (error) {
      next(error);
    }
  };

  changePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const changeData = req.body as ChangePasswordRequest;
      await this.settingsService.changePassword(
        req.auth.userId,
        req.auth.organizationId,
        changeData
      );

      res.json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  setupTwoFactor = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const setup = await this.settingsService.setupTwoFactor(
        req.auth.userId,
        req.auth.organizationId
      );

      res.json({
        success: true,
        data: setup,
      });
    } catch (error) {
      next(error);
    }
  };

  enableTwoFactor = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const enableData = req.body as EnableTwoFactorRequest;
      const result = await this.settingsService.enableTwoFactor(
        req.auth.userId,
        req.auth.organizationId,
        enableData
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  disableTwoFactor = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const disableData = req.body as DisableTwoFactorRequest;
      await this.settingsService.disableTwoFactor(
        req.auth.userId,
        req.auth.organizationId,
        disableData
      );

      res.json({
        success: true,
        message: "Two-factor authentication disabled",
      });
    } catch (error) {
      next(error);
    }
  };

  getActiveSessions = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const sessions = await this.settingsService.getActiveSessions(
        req.auth.userId
      );

      res.json({
        success: true,
        data: sessions,
      });
    } catch (error) {
      next(error);
    }
  };

  terminateSession = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { sessionId } = req.params;
      await this.settingsService.terminateSession(req.auth.userId, sessionId);

      res.json({
        success: true,
        message: "Session terminated successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  terminateAllSessions = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      await this.settingsService.terminateAllSessions(req.auth.userId);

      res.json({
        success: true,
        message: "All other sessions terminated successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  // ==================== ORGANIZATION SETTINGS ====================

  getOrganizationSettings = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const settings = await this.settingsService.getOrganizationSettings(
        req.auth.organizationId
      );

      res.json({
        success: true,
        data: settings,
      });
    } catch (error) {
      next(error);
    }
  };

  updateOrganization = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const updateData = req.body as UpdateOrganizationRequest;
      const organization = await this.settingsService.updateOrganization(
        req.auth.organizationId,
        updateData
      );

      res.json({
        success: true,
        data: organization,
      });
    } catch (error) {
      next(error);
    }
  };

  updateBusinessSettings = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const updateData = req.body as UpdateBusinessSettingsRequest;
      const settings = await this.settingsService.updateBusinessSettings(
        req.auth.organizationId,
        updateData
      );

      res.json({
        success: true,
        data: settings,
      });
    } catch (error) {
      next(error);
    }
  };

  updateDocumentNumbering = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const updateData = req.body as UpdateDocumentNumberingRequest;
      const settings = await this.settingsService.updateDocumentNumbering(
        req.auth.organizationId,
        updateData
      );

      res.json({
        success: true,
        data: settings,
      });
    } catch (error) {
      next(error);
    }
  };

  // ==================== TEAM MANAGEMENT ====================

  getTeamMembers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const members = await this.settingsService.getTeamMembers(
        req.auth.organizationId
      );

      res.json({
        success: true,
        data: members,
      });
    } catch (error) {
      next(error);
    }
  };

  inviteTeamMember = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const inviteData = req.body as InviteTeamMemberRequest;
      const member = await this.settingsService.inviteTeamMember(
        req.auth.organizationId,
        req.auth.userId,
        inviteData
      );

      res.status(201).json({
        success: true,
        data: member,
      });
    } catch (error) {
      next(error);
    }
  };

  updateTeamMember = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { memberId } = req.params;
      const updateData = req.body as UpdateTeamMemberRequest;
      const member = await this.settingsService.updateTeamMember(
        req.auth.organizationId,
        memberId,
        updateData
      );

      res.json({
        success: true,
        data: member,
      });
    } catch (error) {
      next(error);
    }
  };

  removeTeamMember = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { memberId } = req.params;
      await this.settingsService.removeTeamMember(
        req.auth.organizationId,
        memberId
      );

      res.json({
        success: true,
        message: "Team member removed successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  getMemberCustomers = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { memberId } = req.params;
      const customers = await this.settingsService.getMemberCustomers(
        req.auth.organizationId,
        memberId
      );

      res.json({
        success: true,
        data: customers,
      });
    } catch (error) {
      next(error);
    }
  };

  assignCustomers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { memberId } = req.params;
      const { customerIds } = req.body;

      await this.settingsService.assignCustomers(
        req.auth.organizationId,
        memberId,
        customerIds
      );

      res.json({
        success: true,
        message: "Customers assigned successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  removeCustomerAssignment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { memberId, customerId } = req.params;

      await this.settingsService.removeCustomerAssignment(
        req.auth.organizationId,
        memberId,
        customerId
      );

      res.json({
        success: true,
        message: "Customer assignment removed successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  // ==================== BILLING SETTINGS ====================

  getBillingSettings = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const settings = await this.settingsService.getBillingSettings(
        req.auth.organizationId
      );

      res.json({
        success: true,
        data: settings,
      });
    } catch (error) {
      next(error);
    }
  };

  getBillingHistory = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const history = await this.settingsService.getBillingHistory(
        req.auth.organizationId
      );

      res.json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  };
}
