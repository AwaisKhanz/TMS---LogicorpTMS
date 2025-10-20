import { Request, Response, NextFunction } from "express";
import { UserService } from "../services/user.service.js";
import { z } from "zod";
import type { CreateUserDto, UpdateUserDto } from "../types/user.types.js";

const userService = new UserService();

// Validation schemas
export const createUserSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
  roleIds: z.array(z.string()).optional(),
}) satisfies z.ZodType<CreateUserDto>;

export const updateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
}) satisfies z.ZodType<UpdateUserDto>;

export class UserController {
  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const users = await userService.getUsers(req.auth.organizationId);

      res.status(200).json({
        success: true,
        data: users,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { id } = req.params;
      const user = await userService.getUserById(id, req.auth.organizationId);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const user = await userService.createUser(
        req.body,
        req.auth.organizationId
      );

      res.status(201).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { id } = req.params;
      const user = await userService.updateUser(
        id,
        req.body,
        req.auth.organizationId
      );

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { id } = req.params;
      await userService.deleteUser(id, req.auth.organizationId);

      res.status(200).json({
        success: true,
        data: {
          message: "User deleted successfully",
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
