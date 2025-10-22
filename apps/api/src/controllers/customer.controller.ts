import { Request, Response, NextFunction } from "express";
import { CustomerService } from "../services/customer.service.js";
import { z } from "zod";
import type {
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerFiltersDto,
} from "../types/customer.types.js";

const customerService = new CustomerService();

// Validation schemas
const addressSchema = z.object({
  street: z.string(),
  city: z.string(),
  state: z.string(),
  zip: z.string(),
  country: z.string().optional(),
});

export const createCustomerSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  dba: z.string().optional(),
  ein: z.string().optional(),
  billingAddress: addressSchema,
  billingEmail: z.string().email("Invalid email"),
  billingPhone: z.string().min(1, "Billing phone is required"),
  paymentTerms: z.string().optional(),
  creditLimit: z.number().optional(),
  industry: z.string().optional(),
  isActive: z.boolean().optional(),
}) satisfies z.ZodType<CreateCustomerDto>;

export const updateCustomerSchema = z.object({
  companyName: z.string().min(1).optional(),
  dba: z.string().optional(),
  ein: z.string().optional(),
  billingAddress: addressSchema.optional(),
  billingEmail: z.string().email().optional(),
  billingPhone: z.string().optional(),
  paymentTerms: z.string().optional(),
  creditLimit: z.number().optional(),
  industry: z.string().optional(),
  isActive: z.boolean().optional(),
}) satisfies z.ZodType<UpdateCustomerDto>;

export class CustomerController {
  async getCustomers(req: Request, res: Response, next: NextFunction) {
    try {
      const filters: CustomerFiltersDto = {
        industry: req.query.industry as string,
        isActive:
          req.query.isActive === "true"
            ? true
            : req.query.isActive === "false"
              ? false
              : undefined,
        paymentTerms: req.query.paymentTerms as string,
        state: req.query.state as string,
        search: req.query.search as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 50,
      };

      const result = await customerService.getCustomers(
        req.auth!.organizationId,
        filters
      );

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCustomerById(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { id } = req.params;
      const customer = await customerService.getCustomerById(
        id,
        req.auth.organizationId
      );

      res.status(200).json({
        success: true,
        data: customer,
      });
    } catch (error) {
      next(error);
    }
  }

  async createCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const customer = await customerService.createCustomer(
        req.body,
        req.auth.organizationId
      );

      res.status(201).json({
        success: true,
        data: customer,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { id } = req.params;
      const customer = await customerService.updateCustomer(
        id,
        req.body,
        req.auth.organizationId
      );

      res.status(200).json({
        success: true,
        data: customer,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { id } = req.params;
      await customerService.deleteCustomer(id, req.auth.organizationId);

      res.status(200).json({
        success: true,
        data: {
          message: "Customer deleted successfully",
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getCustomerStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const stats = await customerService.getCustomerStatistics(
        req.auth.organizationId
      );

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  async getTopCustomers(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const limit = parseInt(req.query.limit as string) || 10;
      const customers = await customerService.getTopCustomers(
        req.auth.organizationId,
        limit
      );

      res.status(200).json({
        success: true,
        data: customers,
      });
    } catch (error) {
      next(error);
    }
  }

  async addCustomerContact(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { id } = req.params;
      const contact = await customerService.addCustomerContact(
        id,
        req.body,
        req.auth.organizationId
      );

      res.status(201).json({
        success: true,
        data: contact,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCustomerContact(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { contactId } = req.params;
      const contact = await customerService.updateCustomerContact(
        contactId,
        req.body,
        req.auth.organizationId
      );

      res.status(200).json({
        success: true,
        data: contact,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteCustomerContact(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { contactId } = req.params;
      await customerService.deleteCustomerContact(
        contactId,
        req.auth.organizationId
      );

      res.status(200).json({
        success: true,
        data: {
          message: "Contact deleted successfully",
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
