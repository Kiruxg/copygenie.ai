const checkTrial = async (req, res, next) => {
  try {
    // If user is not logged in, redirect to signup
    if (!req.user) {
      return res.redirect("/signup");
    }

    const trialEndDate = new Date(req.user.createdAt);
    trialEndDate.setDate(trialEndDate.getDate() + 7);
    const now = new Date();

    // If trial has ended and no subscription
    if (now > trialEndDate && !req.user.hasActiveSubscription) {
      return res.status(402).json({
        success: false,
        error: "Trial period has ended. Please subscribe to continue.",
        trialEnded: true,
      });
    }

    next();
  } catch (error) {
    console.error("Trial check error:", error);
    next(error);
  }
};

module.exports = checkTrial;
