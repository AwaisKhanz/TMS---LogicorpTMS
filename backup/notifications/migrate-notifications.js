// Migration script to simplify notification data
// This script migrates existing notifications to the new simplified schema

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function migrateNotifications() {
  console.log("Starting notification migration...");

  try {
    // Get all existing notifications
    const existingNotifications = await prisma.notification.findMany({
      include: {
        deliveries: true,
        recipient: true,
        organization: true,
      },
    });

    console.log(`Found ${existingNotifications.length} existing notifications`);

    // For each notification, create a simplified version
    for (const notification of existingNotifications) {
      // Skip if no recipient (broadcast notifications)
      if (!notification.recipientId) {
        console.log(`Skipping notification ${notification.id} - no recipient`);
        continue;
      }

      // Map old status to new isRead field
      const isRead = notification.readAt !== null;

      // Create new simplified notification
      await prisma.notification.create({
        data: {
          id: notification.id, // Keep same ID
          organizationId: notification.organizationId,
          recipientId: notification.recipientId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          entityType: notification.entityType,
          entityId: notification.entityId,
          isRead: isRead,
          readAt: notification.readAt,
          createdAt: notification.createdAt,
        },
      });

      console.log(`Migrated notification ${notification.id}`);
    }

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateNotifications()
  .then(() => {
    console.log("Migration script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration script failed:", error);
    process.exit(1);
  });
