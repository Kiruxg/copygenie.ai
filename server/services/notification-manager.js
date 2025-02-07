const { WebSocket } = require("ws");
const { User, Notification } = require("../models");

class NotificationManager {
  constructor() {
    this.connections = new Map(); // userId -> WebSocket
    this.notificationTypes = {
      success: {
        duration: 3000,
        icon: "✅",
      },
      error: {
        duration: 5000,
        icon: "❌",
      },
      warning: {
        duration: 4000,
        icon: "⚠️",
      },
      info: {
        duration: 3000,
        icon: "ℹ️",
      },
      limit: {
        duration: 4000,
        icon: "📊",
      },
    };
  }

  async sendNotification(userId, notification) {
    const formattedNotification = this.formatNotification(notification);

    // Store notification in database
    await Notification.create({
      userId,
      ...formattedNotification,
      timestamp: new Date(),
    });

    // Send real-time notification if user is connected
    if (this.connections.has(userId)) {
      this.connections.get(userId).send(JSON.stringify(formattedNotification));
    }
  }

  formatNotification(notification) {
    const type = notification.type || "info";
    const typeConfig = this.notificationTypes[type];

    return {
      id: this.generateNotificationId(),
      ...notification,
      ...typeConfig,
      timestamp: new Date(),
    };
  }

  async sendUsageLimitNotification(userId, usage) {
    const user = await User.findById(userId);
    const limit =
      user.tier === "free" ? 5 : user.tier === "pro" ? 50 : Infinity;
    const remaining = limit - usage;

    if (remaining <= 2) {
      await this.sendNotification(userId, {
        type: "limit",
        title: "Usage Limit Alert",
        message: `You have ${remaining} descriptions remaining this month.`,
        action: {
          text: "Upgrade Now",
          url: "/upgrade",
        },
      });
    }
  }

  async sendSuccessNotification(userId, message) {
    await this.sendNotification(userId, {
      type: "success",
      title: "Success",
      message,
    });
  }

  async sendErrorNotification(userId, error) {
    await this.sendNotification(userId, {
      type: "error",
      title: "Error",
      message: error.message,
      errorId: error.id,
    });
  }

  handleWebSocketConnection(userId, socket) {
    this.connections.set(userId, socket);

    socket.on("close", () => {
      this.connections.delete(userId);
    });
  }
}

module.exports = new NotificationManager();
