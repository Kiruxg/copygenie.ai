class MonitoringService {
  constructor() {
    this.metrics = {
      totalDescriptions: 0,
      successfulGenerations: 0,
      failedGenerations: 0,
      averageResponseTime: 0,
    };
  }

  async trackDescription(userId, status) {
    try {
      this.metrics.totalDescriptions++;

      if (status === "success") {
        this.metrics.successfulGenerations++;
      } else {
        this.metrics.failedGenerations++;
      }

      console.log("Generation tracked:", {
        userId,
        status,
        metrics: this.metrics,
      });
    } catch (error) {
      console.error("Error tracking metrics:", error);
    }
  }

  async trackResponseTime(duration) {
    try {
      // Simple moving average
      this.metrics.averageResponseTime =
        (this.metrics.averageResponseTime + duration) / 2;

      console.log("Response time tracked:", {
        duration: `${duration}ms`,
        average: `${this.metrics.averageResponseTime}ms`,
      });
    } catch (error) {
      console.error("Error tracking response time:", error);
    }
  }

  getMetrics() {
    return this.metrics;
  }
}

module.exports = new MonitoringService();
