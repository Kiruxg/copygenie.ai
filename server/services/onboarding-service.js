class OnboardingService {
  constructor() {
    this.steps = {
      welcome: {
        title: "Welcome to CopyGenie",
        content: "Let's create your first product description",
        action: "start_tutorial",
      },
      step1: {
        title: "Enter Product Details",
        content: "Start by entering your product name and key features",
        action: "show_product_form",
      },
      step2: {
        title: "Choose Your Style",
        content: "Select the tone and length that best fits your brand",
        action: "show_style_options",
      },
      step3: {
        title: "Generate Description",
        content: "Click generate and see the magic happen",
        action: "show_generate_button",
      },
      complete: {
        title: "You're Ready!",
        content: "You've created your first description. Explore more features",
        action: "complete_tutorial",
      },
    };
  }

  async getUserProgress(userId) {
    const user = await User.findById(userId);
    return {
      completedSteps: user.onboarding?.completedSteps || [],
      currentStep: user.onboarding?.currentStep || "welcome",
      isComplete: user.onboarding?.isComplete || false,
    };
  }

  async updateProgress(userId, step) {
    await User.findByIdAndUpdate(userId, {
      $push: { "onboarding.completedSteps": step },
      $set: { "onboarding.currentStep": this.getNextStep(step) },
    });
  }

  async completeOnboarding(userId) {
    await User.findByIdAndUpdate(userId, {
      "onboarding.isComplete": true,
    });
  }

  getNextStep(currentStep) {
    const stepOrder = Object.keys(this.steps);
    const currentIndex = stepOrder.indexOf(currentStep);
    return stepOrder[currentIndex + 1] || "complete";
  }
}
