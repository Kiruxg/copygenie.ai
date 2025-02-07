const nodemailer = require("nodemailer");
const Email = require("email-templates");

class NotificationService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      // email configuration
    });

    this.email = new Email({
      transport: this.transporter,
      send: true,
      preview: false,
    });
  }

  async sendUsageLimitWarning(user) {
    await this.email.send({
      template: "usage-warning",
      message: {
        to: user.email,
      },
      locals: {
        name: user.name,
        usagePercent: (user.currentUsage / user.limit) * 100,
        remainingDescriptions: user.limit - user.currentUsage,
      },
    });
  }

  async sendGenerationComplete(user, descriptionId) {
    await this.email.send({
      template: "generation-complete",
      message: {
        to: user.email,
      },
      locals: {
        name: user.name,
        descriptionUrl: `${process.env.APP_URL}/descriptions/${descriptionId}`,
      },
    });
  }

  async sendMonthlyReport(user, stats) {
    await this.email.send({
      template: "monthly-report",
      message: {
        to: user.email,
      },
      locals: {
        name: user.name,
        stats: {
          descriptionsGenerated: stats.total,
          topPerforming: stats.topDescriptions,
          usageOverview: stats.usage,
        },
      },
    });
  }

  async sendUpgradeReminder(user) {
    if (user.tier === "free" && user.currentUsage >= user.limit * 0.8) {
      await this.email.send({
        template: "upgrade-reminder",
        message: {
          to: user.email,
        },
        locals: {
          name: user.name,
          currentUsage: user.currentUsage,
          limit: user.limit,
        },
      });
    }
  }
}
