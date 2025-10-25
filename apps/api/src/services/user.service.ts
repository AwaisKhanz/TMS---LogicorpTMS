import type { User } from "@prisma/client";
import { UserRepository } from "../repositories/user.repository.js";
import { hashPassword } from "../utils/hash.util.js";
import { NotFoundError, ConflictError } from "../utils/errors.util.js";
import type { CreateUserDto, UpdateUserDto } from "../types/user.types.js";
import prisma from "../config/database.js";

export class UserService {
  private userRepo: UserRepository;

  constructor() {
    this.userRepo = new UserRepository();
  }

  async getUsers(
    organizationId: string
  ): Promise<Omit<User, "passwordHash">[]> {
    const users = await this.userRepo.findMany({}, organizationId);

    return users.map(({ passwordHash, ...user }) => user);
  }

  async getUserById(
    id: string,
    organizationId: string
  ): Promise<Omit<User, "passwordHash">> {
    const user = await this.userRepo.findByIdWithRelations(id, organizationId);

    if (!user) {
      throw new NotFoundError("User");
    }

    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async createUser(
    data: CreateUserDto,
    organizationId: string
  ): Promise<Omit<User, "passwordHash">> {
    // Check if user with email already exists
    const existingUser = await this.userRepo.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictError("User with this email already exists");
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Create user
    const user = await this.userRepo.create({
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      organizationId,
      emailVerified: false,
      isActive: true,
    });

    // Assign roles if roleIds provided
    if (data.roleIds && data.roleIds.length > 0) {
      await prisma.userRole.createMany({
        data: data.roleIds.map((roleId) => ({
          userId: user.id,
          roleId,
        })),
      });
    }

    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateUser(
    id: string,
    data: UpdateUserDto,
    organizationId: string
  ): Promise<Omit<User, "passwordHash">> {
    // Check if user exists
    const existingUser = await this.userRepo.findById(id, organizationId);
    if (!existingUser) {
      throw new NotFoundError("User");
    }

    // Update user
    const user = await this.userRepo.update(id, data, organizationId);

    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async deleteUser(id: string, organizationId: string): Promise<void> {
    // Check if user exists
    const existingUser = await this.userRepo.findById(id, organizationId);
    if (!existingUser) {
      throw new NotFoundError("User");
    }

    // Soft delete by deactivating user
    await this.userRepo.update(id, { isActive: false }, organizationId);
  }

  async assignCustomers(
    userId: string,
    customerIds: string[],
    organizationId: string
  ): Promise<void> {
    // Check if user exists
    const user = await this.userRepo.findById(userId, organizationId);
    if (!user) {
      throw new NotFoundError("User");
    }

    // Verify all customers exist and belong to the organization
    const customers = await prisma.customer.findMany({
      where: {
        id: { in: customerIds },
        organizationId,
        deletedAt: null,
      },
    });

    if (customers.length !== customerIds.length) {
      throw new NotFoundError("One or more customers not found");
    }

    // Use repository method
    await this.userRepo.assignCustomers(userId, customerIds);
  }

  async getUserCustomers(
    userId: string,
    organizationId: string
  ): Promise<any[]> {
    // Check if user exists
    const user = await this.userRepo.findById(userId, organizationId);
    if (!user) {
      throw new NotFoundError("User");
    }

    // Use repository method
    return await this.userRepo.getUserCustomers(userId);
  }

  async removeCustomerAssignment(
    userId: string,
    customerId: string,
    organizationId: string
  ): Promise<void> {
    // Check if user exists
    const user = await this.userRepo.findById(userId, organizationId);
    if (!user) {
      throw new NotFoundError("User");
    }

    // Use repository method
    await this.userRepo.removeCustomerAssignment(userId, customerId);
  }
}
