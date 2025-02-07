const prometheus = require("prom-client");
const StatsD = require("hot-shots");
const { User, Description, ErrorLog } = require("../models");

class MonitoringService {
  constructor() {
    // Initialize Prometheus metrics
    this.metrics = {
      descriptionsGenerated: new prometheus.Counter({
        name: "descriptions_generated_total",
        help: "Total number of descriptions generated",
        labelNames: ["tier", "status"],
      }),

      responseTime: new prometheus.Histogram({
        name: "api_response_time_seconds",
        help: "API response time in seconds",
        labelNames: ["endpoint", "method"],
        buckets: [0.1, 0.5, 1, 2, 5],
      }),

      activeUsers: new prometheus.Gauge({
        name: "active_users",
        help: "Number of currently active users",
        labelNames: ["tier"],
      }),

      errorRate: new prometheus.Counter({
        name: "error_rate_total",
        help: "Total number of errors",
        labelNames: ["type", "severity"],
      }),
    };

    // Initialize StatsD client
    this.stats = new StatsD({
      prefix: "copygenie.",
    });

    // Start collecting default metrics
    prometheus.collectDefaultMetrics();
  }

  async trackAPIRequest(endpoint, method, startTime) {
    const duration = process.hrtime(startTime);
    const responseTimeInSeconds = duration[0] + duration[1] / 1e9;

    this.metrics.responseTime.observe(
      { endpoint, method },
      responseTimeInSeconds
    );

    this.stats.timing(
      `api.${endpoint}.${method}.response_time`,
      responseTimeInSeconds * 1000
    );
  }

  async trackDescription(userId, status) {
    const user = await User.findById(userId);

    this.metrics.descriptionsGenerated.inc({
      tier: user.tier,
      status,
    });

    this.stats.increment("descriptions.generated", {
      tier: user.tier,
      status,
    });
  }

  async trackError(error) {
    this.metrics.errorRate.inc({
      type: error.type,
      severity: error.severity,
    });

    this.stats.increment("errors", {
      type: error.type,
      severity: error.severity,
    });
  }

  async generateDailyMetrics() {
    const today = new Date();
    const yesterday = new Date(today.setDate(today.getDate() - 1));

    const metrics = {
      descriptions: await this.getDescriptionMetrics(yesterday),
      users: await this.getUserMetrics(yesterday),
      errors: await this.getErrorMetrics(yesterday),
      performance: await this.getPerformanceMetrics(yesterday),
    };

    await this.storeMetrics(metrics);
    await this.alertOnThresholds(metrics);
  }

  async getDescriptionMetrics(date) {
    return {
      total: await Description.countDocuments({
        createdAt: { $gte: date },
      }),
      byTier: await Description.aggregate([
        {
          $match: {
            createdAt: { $gte: date },
          },
        },
        {
          $group: {
            _id: "$userTier",
            count: { $sum: 1 },
          },
        },
      ]),
    };
  }

  async getUserMetrics(date) {
    return {
      active: await User.countDocuments({
        lastActive: { $gte: date },
      }),
      new: await User.countDocuments({
        createdAt: { $gte: date },
      }),
      byTier: await User.aggregate([
        {
          $group: {
            _id: "$tier",
            count: { $sum: 1 },
          },
        },
      ]),
    };
  }

  async getErrorMetrics(date) {
    return {
      total: await ErrorLog.countDocuments({
        timestamp: { $gte: date },
      }),
      byType: await ErrorLog.aggregate([
        {
          $match: {
            timestamp: { $gte: date },
          },
        },
        {
          $group: {
            _id: "$type",
            count: { $sum: 1 },
          },
        },
      ]),
    };
  }

  async alertOnThresholds(metrics) {
    // Check error rate threshold
    if (metrics.errors.total > 100) {
      await this.sendAlert("High error rate detected", metrics.errors);
    }

    // Check performance threshold
    if (metrics.performance.averageResponseTime > 2000) {
      await this.sendAlert("High response time detected", metrics.performance);
    }
  }
}

module.exports = new MonitoringService();
