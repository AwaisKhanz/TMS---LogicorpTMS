import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerFiltersDto,
  CustomerContactData,
} from "../types/customer.types.js";
import { CustomerRepository } from "../repositories/customer.repository.js";
import { NotFoundError, ConflictError } from "../utils/errors.util.js";
import { NotificationService } from "./notification.service.js";
import { webSocketService } from "./websocket.service.js";
import { logger } from "../config/logger.js";

export class CustomerService {
  private customerRepo: CustomerRepository;
  private notificationService: NotificationService;

  constructor() {
    this.customerRepo = new CustomerRepository();
    this.notificationService = new NotificationService();
  }

  async getCustomers(organizationId: string, filters: CustomerFiltersDto) {
    const {
      page = 1,
      limit = 50,
      industry,
      isActive,
      paymentTerms,
      state,
      search,
    } = filters;

    const customerFilters = {
      industry,
      isActive,
      paymentTerms,
      state,
      search,
    };

    const { data: customers, total } = await this.customerRepo.findWithFilters(
      customerFilters,
      organizationId,
      page,
      limit
    );

    return {
      data: customers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getCustomersForUser(
    organizationId: string,
    userId: string,
    filters: CustomerFiltersDto
  ) {
    const {
      page = 1,
      limit = 50,
      industry,
      isActive,
      paymentTerms,
      state,
      search,
    } = filters;

    const customerFilters = {
      industry,
      isActive,
      paymentTerms,
      state,
      search,
    };

    // Get customers assigned to the user
    const { data: customers, total } =
      await this.customerRepo.findWithFiltersForUser(
        customerFilters,
        organizationId,
        userId,
        page,
        limit
      );

    return {
      data: customers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getCustomerById(id: string, organizationId: string) {
    const customer = await this.customerRepo.findByIdWithRelations(
      id,
      organizationId
    );

    if (!customer) {
      throw new NotFoundError("Customer");
    }

    return customer;
  }

  async createCustomer(
    data: CreateCustomerDto,
    organizationId: string,
    userId?: string
  ) {
    // Check if company name already exists
    const existingCustomer = await this.customerRepo.findByCompanyName(
      data.companyName,
      organizationId
    );

    if (existingCustomer) {
      throw new ConflictError("Customer with this company name already exists");
    }

    const customer = await this.customerRepo.createWithRelations(
      data,
      organizationId
    );

    // Send notification for customer creation
    if (userId) {
      try {
        await this.notificationService.create({
          recipientId: userId,
          type: "CUSTOMER_CREATED",
          title: "New Customer Added",
          message: `Customer ${customer.companyName} has been added to the system`,
          entityType: "CUSTOMER",
          entityId: customer.id,
          organizationId,
        });
        logger.info(`Customer creation notification sent for ${customer.id}`);
      } catch (error) {
        logger.error("Failed to send customer creation notification:", error);
        // Don't fail the customer creation if notification fails
      }
    }

    // Send WebSocket update
    try {
      webSocketService.sendCustomerUpdate(
        organizationId,
        customer.id,
        "created",
        {
          companyName: customer.companyName,
          industry: customer.industry,
        }
      );
    } catch (error) {
      logger.error("Failed to send WebSocket customer update:", error);
    }

    return customer;
  }

  async updateCustomer(
    id: string,
    data: UpdateCustomerDto,
    organizationId: string,
    userId?: string
  ) {
    const existingCustomer = await this.customerRepo.findById(
      id,
      organizationId
    );

    if (!existingCustomer) {
      throw new NotFoundError("Customer");
    }

    // Check if company name already exists (if updating company name)
    if (data.companyName && data.companyName !== existingCustomer.companyName) {
      const duplicateCustomer = await this.customerRepo.findByCompanyName(
        data.companyName,
        organizationId,
        id
      );

      if (duplicateCustomer) {
        throw new ConflictError(
          "Customer with this company name already exists"
        );
      }
    }

    const customer = await this.customerRepo.updateWithRelations(
      id,
      data,
      organizationId
    );

    if (!customer) {
      throw new NotFoundError("Customer");
    }

    // Send notification for customer update
    if (userId) {
      try {
        await this.notificationService.create({
          recipientId: userId,
          type: "CUSTOMER_UPDATED",
          title: "Customer Updated",
          message: `Customer ${customer.companyName} has been updated`,
          entityType: "CUSTOMER",
          entityId: customer.id,
          organizationId,
        });
        logger.info(`Customer update notification sent for ${customer.id}`);
      } catch (error) {
        logger.error("Failed to send customer update notification:", error);
        // Don't fail the customer update if notification fails
      }
    }

    // Send WebSocket update
    try {
      webSocketService.sendCustomerUpdate(
        organizationId,
        customer.id,
        "updated",
        {
          companyName: customer.companyName,
          industry: customer.industry,
          isActive: customer.isActive,
        }
      );
    } catch (error) {
      logger.error("Failed to send WebSocket customer update:", error);
    }

    return customer;
  }

  async deleteCustomer(id: string, organizationId: string) {
    const deleted = await this.customerRepo.softDelete(id, organizationId);

    if (!deleted) {
      throw new NotFoundError("Customer");
    }
  }

  async updateCustomerStats(customerId: string, organizationId: string) {
    await this.customerRepo.updateStats(customerId, organizationId);
  }

  async getCustomerStatistics(organizationId: string) {
    return this.customerRepo.getStatistics(organizationId);
  }

  async getTopCustomers(organizationId: string, limit = 10) {
    return this.customerRepo.getTopCustomers(organizationId, limit);
  }

  async addCustomerContact(
    customerId: string,
    contactData: CustomerContactData,
    organizationId: string
  ) {
    return this.customerRepo.addContact(
      customerId,
      contactData,
      organizationId
    );
  }

  async updateCustomerContact(
    contactId: string,
    contactData: Partial<CustomerContactData>,
    organizationId: string
  ) {
    return this.customerRepo.updateContact(
      contactId,
      contactData,
      organizationId
    );
  }

  async deleteCustomerContact(contactId: string, organizationId: string) {
    await this.customerRepo.deleteContact(contactId, organizationId);
  }

  // New methods for enhanced functionality
  async getCustomerPerformance(customerId: string, organizationId: string) {
    const customer = await this.customerRepo.findByIdWithRelations(
      customerId,
      organizationId
    );

    if (!customer) {
      throw new NotFoundError("Customer");
    }

    // Calculate performance metrics
    const performance = await this.customerRepo.getPerformanceMetrics(
      customerId,
      organizationId
    );

    return performance;
  }

  async getCustomerLoads(
    customerId: string,
    organizationId: string,
    page: number = 1,
    limit: number = 50
  ) {
    return this.customerRepo.getCustomerLoads(
      customerId,
      organizationId,
      page,
      limit
    );
  }

  async getCustomerInvoices(
    customerId: string,
    organizationId: string,
    page: number = 1,
    limit: number = 50
  ) {
    return this.customerRepo.getCustomerInvoices(
      customerId,
      organizationId,
      page,
      limit
    );
  }

  async validateCreditLimit(
    customerId: string,
    amount: number,
    organizationId: string
  ) {
    const customer = await this.customerRepo.findById(
      customerId,
      organizationId
    );

    if (!customer) {
      throw new NotFoundError("Customer");
    }

    const availableCredit =
      customer.creditLimit.toNumber() - customer.creditUsed.toNumber();

    if (amount > availableCredit) {
      throw new ConflictError(
        `Insufficient credit. Available: $${availableCredit.toLocaleString()}, Requested: $${amount.toLocaleString()}`
      );
    }

    return true;
  }

  async updateCreditUsed(
    customerId: string,
    amount: number,
    organizationId: string
  ) {
    await this.customerRepo.updateCreditUsed(
      customerId,
      amount,
      organizationId
    );
  }

  async exportCustomers(
    organizationId: string,
    filters: CustomerFiltersDto,
    format: string = "csv"
  ) {
    const customers = await this.customerRepo.exportCustomers(
      organizationId,
      filters
    );

    if (format === "csv") {
      return this.formatCustomersAsCsv(customers);
    }

    // For now, return CSV format
    return this.formatCustomersAsCsv(customers);
  }

  private formatCustomersAsCsv(customers: any[]): string {
    if (!customers || customers.length === 0) {
      return "No customers found";
    }

    const headers = [
      "Company Name",
      "DBA",
      "Industry",
      "Website",
      "EIN",
      "Billing Email",
      "Billing Phone",
      "Billing Address",
      "Credit Limit",
      "Credit Used",
      "Payment Terms",
      "Total Revenue",
      "Total Loads",
      "Average Margin",
      "Is Active",
      "Notes",
      "Created At",
      "Updated At",
    ];

    const rows = customers.map((customer) => [
      customer.companyName || "",
      customer.dba || "",
      customer.industry || "",
      customer.website || "",
      customer.ein || "",
      customer.billingEmail || "",
      customer.billingPhone || "",
      customer.billingAddress
        ? `${customer.billingAddress.street}, ${customer.billingAddress.city}, ${customer.billingAddress.state} ${customer.billingAddress.zip}`
        : "",
      customer.creditLimit?.toString() || "0",
      customer.creditUsed?.toString() || "0",
      customer.paymentTerms || "",
      customer.totalRevenue?.toString() || "0",
      customer.totalLoads?.toString() || "0",
      customer.averageMargin?.toString() || "0",
      customer.isActive ? "Yes" : "No",
      customer.notes || "",
      customer.createdAt
        ? new Date(customer.createdAt).toLocaleDateString()
        : "",
      customer.updatedAt
        ? new Date(customer.updatedAt).toLocaleDateString()
        : "",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");

    return csvContent;
  }

  async bulkUpdateCustomers(
    customerIds: string[],
    updates: Partial<UpdateCustomerDto>,
    organizationId: string,
    userId?: string
  ) {
    const results = await this.customerRepo.bulkUpdate(
      customerIds,
      updates,
      organizationId
    );

    // Send notifications for bulk updates
    if (userId && results.success > 0) {
      try {
        await this.notificationService.create({
          recipientId: userId,
          type: "CUSTOMER_UPDATED",
          title: "Bulk Customer Update",
          message: `${results.success} customers have been updated`,
          entityType: "CUSTOMER",
          entityId: undefined,
          organizationId,
        });
      } catch (error) {
        logger.error("Failed to send bulk update notification:", error);
      }
    }

    return results;
  }
}
