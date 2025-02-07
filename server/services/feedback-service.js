class FeedbackService {
  async submitFeedback(userId, data) {
    const feedback = await Feedback.create({
      userId,
      type: data.type, // 'bug', 'feature', 'description'
      content: data.content,
      descriptionId: data.descriptionId,
      rating: data.rating,
      status: "pending",
    });

    // If high priority, create support ticket
    if (data.priority === "high") {
      await this.createSupportTicket(feedback);
    }

    // Use feedback for AI improvement
    await this.updateAIModel(feedback);

    return feedback;
  }

  async createSupportTicket(feedback) {
    const user = await User.findById(feedback.userId);

    return await SupportTicket.create({
      userId: feedback.userId,
      feedbackId: feedback._id,
      priority: user.tier === "business" ? "high" : "normal",
      status: "open",
      category: feedback.type,
    });
  }

  async updateAIModel(feedback) {
    if (feedback.type === "description") {
      await AIPersonalizationEngine.incorporateFeedback({
        descriptionId: feedback.descriptionId,
        rating: feedback.rating,
        feedback: feedback.content,
      });
    }
  }

  async getFeedbackAnalytics(userId) {
    return {
      totalSubmitted: await Feedback.countDocuments({ userId }),
      averageRating: await this.calculateAverageRating(userId),
      recentFeedback: await this.getRecentFeedback(userId),
      improvementMetrics: await this.getImprovementMetrics(userId),
    };
  }
}
