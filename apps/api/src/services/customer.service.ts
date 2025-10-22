import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerFiltersDto,
  CustomerContactData,
} from "../types/customer.types.js";
import { CustomerRepository } from "../repositories/customer.repository.js";
import { NotFoundError, ConflictError } from "../utils/errors.util.js";

export class CustomerService {
  private customerRepo: CustomerRepository;

  constructor() {
    this.customerRepo = new CustomerRepository();
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

  async createCustomer(data: CreateCustomerDto, organizationId: string) {
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

    return customer;
  }

  async updateCustomer(
    id: string,
    data: UpdateCustomerDto,
    organizationId: string
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
}
