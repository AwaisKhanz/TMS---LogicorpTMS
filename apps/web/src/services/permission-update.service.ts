import { toast } from "sonner";

export class PermissionUpdateService {
  /**
   * Handles permission change notifications from the backend
   * This should be called when receiving real-time notifications
   */
  static handlePermissionChange(notification: {
    type: string;
    title: string;
    message: string;
    addedPermissions?: string[];
    removedPermissions?: string[];
  }) {
    if (notification.type === "PERMISSION_CHANGED") {
      // Show notification to user
      toast.info(notification.title, {
        description: notification.message,
        duration: 10000, // Show for 10 seconds
        action: {
          label: "Refresh Page",
          onClick: () => window.location.reload(),
        },
      });

      // Force page refresh to get updated permissions
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  }

  /**
   * Refreshes user permissions by reloading the page
   * This will get updated permissions from the server
   */
  static async refreshUserPermissions() {
    try {
      // Show success message
      toast.success("Permissions updated successfully!");

      // Reload the page to get updated permissions
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Failed to refresh permissions:", error);
      toast.error(
        "Failed to refresh permissions. Please log out and log back in."
      );
    }
  }

  /**
   * Checks if user has a specific permission
   * This is a utility method for components to check permissions
   */
  static hasPermission(userPermissions: string[], permission: string): boolean {
    return userPermissions.includes(permission);
  }

  /**
   * Checks if user has any of the specified permissions
   */
  static hasAnyPermission(
    userPermissions: string[],
    permissions: string[]
  ): boolean {
    return permissions.some((permission) =>
      userPermissions.includes(permission)
    );
  }

  /**
   * Checks if user has all of the specified permissions
   */
  static hasAllPermissions(
    userPermissions: string[],
    permissions: string[]
  ): boolean {
    return permissions.every((permission) =>
      userPermissions.includes(permission)
    );
  }

  /**
   * Gets permission display name for UI
   */
  static getPermissionDisplayName(permission: string): string {
    const permissionMap: Record<string, string> = {
      "consignee:view": "View Consignees",
      "consignee:create": "Create Consignees",
      "consignee:edit": "Edit Consignees",
      "consignee:delete": "Delete Consignees",
      "shipper:view": "View Shippers",
      "shipper:create": "Create Shippers",
      "shipper:edit": "Edit Shippers",
      "shipper:delete": "Delete Shippers",
      "load:view:all": "View All Loads",
      "load:view:own": "View Own Loads",
      "load:create": "Create Loads",
      "load:edit": "Edit Loads",
      "load:delete": "Delete Loads",
      "carrier:view": "View Carriers",
      "carrier:create": "Create Carriers",
      "carrier:edit": "Edit Carriers",
      "carrier:delete": "Delete Carriers",
      "customer:view": "View Customers",
      "customer:create": "Create Customers",
      "customer:edit": "Edit Customers",
      "customer:delete": "Delete Customers",
      "user:view": "View Users",
      "user:create": "Create Users",
      "user:edit": "Edit Users",
      "user:delete": "Delete Users",
      "settings:view": "View Settings",
      "settings:edit": "Edit Settings",
    };

    return permissionMap[permission] || permission;
  }

  /**
   * Formats permission changes for display
   */
  static formatPermissionChanges(changes: {
    addedPermissions: string[];
    removedPermissions: string[];
  }): string {
    let message = "Your permissions have been updated:\n\n";

    if (changes.addedPermissions.length > 0) {
      message += "✅ New permissions:\n";
      changes.addedPermissions.forEach((permission) => {
        message += `• ${this.getPermissionDisplayName(permission)}\n`;
      });
      message += "\n";
    }

    if (changes.removedPermissions.length > 0) {
      message += "❌ Removed permissions:\n";
      changes.removedPermissions.forEach((permission) => {
        message += `• ${this.getPermissionDisplayName(permission)}\n`;
      });
      message += "\n";
    }

    message += "Please refresh the page to see the updated permissions.";
    return message;
  }
}

export const permissionUpdateService = new PermissionUpdateService();
