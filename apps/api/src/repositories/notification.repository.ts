import { PrismaClient } from "@prisma/client";
import type {
  Notification,
  NotificationType,
  EntityType,
} from "@tms/shared-types";

const prisma = new PrismaClient();

export class NotificationRepository {
  async create(data: {
    organizationId: string;
    recipientId: string;
    type: NotificationType;
    title: string;
    message: string;
    entityType?: EntityType;
    entityId?: string;
  }): Promise<Notification> {
    return prisma.notification.create({
      data,
    });
  }

  async findMany(
    where: {
      organizationId: string;
      recipientId?: string;
      isRead?: boolean;
    },
    page: number = 1,
    limit: number = 50
  ): Promise<{ notifications: Notification[]; total: number }> {
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ]);

    return { notifications, total };
  }

  async findById(
    id: string,
    organizationId: string
  ): Promise<Notification | null> {
    return prisma.notification.findFirst({
      where: {
        id,
        organizationId,
      },
    });
  }

  async update(id: string, data: Partial<Notification>): Promise<Notification> {
    return prisma.notification.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, organizationId: string): Promise<void> {
    await prisma.notification.deleteMany({
      where: {
        id,
        organizationId,
      },
    });
  }

  async count(where: {
    organizationId: string;
    recipientId?: string;
    isRead?: boolean;
  }): Promise<number> {
    return prisma.notification.count({ where });
  }
}
