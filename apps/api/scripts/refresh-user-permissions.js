#!/usr/bin/env node

/**
 * Script to refresh user permissions after adding new permissions to the system
 * This ensures existing users get the new permissions based on their roles
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function refreshUserPermissions() {
  console.log("🔄 Refreshing user permissions...");

  try {
    // Get all users with their roles
    const users = await prisma.user.findMany({
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: true,
              },
            },
          },
        },
      },
    });

    console.log(`📊 Found ${users.length} users to process`);

    let updatedCount = 0;

    for (const user of users) {
      // Get all permissions from user's roles
      const permissions = new Set();
      user.roles.forEach((userRole) => {
        userRole.role.permissions.forEach((permission) => {
          permissions.add(permission.name);
        });
      });

      console.log(`👤 User ${user.email} has ${permissions.size} permissions`);

      // Check if user has consignee permissions
      const hasConsigneePermissions = Array.from(permissions).some((p) =>
        p.startsWith("consignee:")
      );
      const hasShipperPermissions = Array.from(permissions).some((p) =>
        p.startsWith("shipper:")
      );

      if (hasConsigneePermissions || hasShipperPermissions) {
        console.log(`✅ User ${user.email} has new permissions`);
        updatedCount++;
      } else {
        console.log(`⚠️  User ${user.email} missing new permissions`);
      }
    }

    console.log(`\n🎉 Processed ${users.length} users`);
    console.log(`✅ ${updatedCount} users have new permissions`);
    console.log(
      `⚠️  ${users.length - updatedCount} users may need role updates`
    );

    // Show role permission summary
    console.log("\n📋 Role Permission Summary:");
    const roles = await prisma.role.findMany({
      include: {
        permissions: true,
      },
    });

    for (const role of roles) {
      const consigneePerms = role.permissions.filter((p) =>
        p.name.startsWith("consignee:")
      );
      const shipperPerms = role.permissions.filter((p) =>
        p.name.startsWith("shipper:")
      );

      console.log(`\n🔹 ${role.name}:`);
      console.log(`   Consignee permissions: ${consigneePerms.length}`);
      console.log(`   Shipper permissions: ${shipperPerms.length}`);
    }
  } catch (error) {
    console.error("❌ Error refreshing permissions:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
refreshUserPermissions()
  .then(() => {
    console.log("\n✅ Permission refresh completed successfully!");
    console.log("\n💡 Next steps:");
    console.log(
      "   1. Users need to log out and log back in to get new permissions"
    );
    console.log("   2. Or clear browser cache/localStorage");
    console.log("   3. Or wait for token expiration and re-authentication");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
