import type { PrismaClient } from "@tms/database";
import prisma from "../config/database.js";

export abstract class BaseRepository<T> {
  protected prisma: PrismaClient;
  protected abstract modelName: string;

  constructor() {
    this.prisma = prisma;
  }

  async findById(id: string, organizationId: string): Promise<T | null> {
    const model = this.getModel();
    return model.findFirst({
      where: {
        id,
        organizationId,
      },
    }) as Promise<T | null>;
  }

  async findMany(
    where: Record<string, unknown>,
    organizationId: string
  ): Promise<T[]> {
    const model = this.getModel();
    return model.findMany({
      where: {
        ...where,
        organizationId,
      },
    }) as Promise<T[]>;
  }

  async create(data: Record<string, unknown>): Promise<T> {
    const model = this.getModel();
    return model.create({
      data,
    }) as Promise<T>;
  }

  async update(
    id: string,
    data: Partial<T> | Record<string, unknown>,
    organizationId: string
  ): Promise<T> {
    const model = this.getModel();
    return model.update({
      where: {
        id,
        organizationId,
      },
      data,
    }) as Promise<T>;
  }

  async delete(id: string, organizationId: string): Promise<T> {
    const model = this.getModel();
    return model.delete({
      where: {
        id,
        organizationId,
      },
    }) as Promise<T>;
  }

  async count(
    where: Record<string, unknown>,
    organizationId: string
  ): Promise<number> {
    const model = this.getModel();
    return model.count({
      where: {
        ...where,
        organizationId,
      },
    });
  }

  protected getModel() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.prisma as any)[this.modelName.toLowerCase()];
  }
}
