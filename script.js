class ProductDescriptionGenerator {
  constructor() {
    this.form = document.getElementById("productForm");
    this.currentPlan = "free";
    this.descriptionCount = 0;
    this.monthlyLimit = 5; // Free plan limit

    this.initializeEventListeners();
  }

  initializeEventListeners() {
    this.form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleFormSubmission();
    });
  }

  async handleFormSubmission() {
    if (!this.checkUsageLimit()) {
      alert("Monthly limit reached. Please upgrade to continue.");
      return;
    }

    const productName = document.getElementById("productName").value;
    const keyFeatures = document.getElementById("keyFeatures").value;
    const tone = document.getElementById("tone").value;

    // Validate pro features
    if (["fun", "technical"].includes(tone) && this.currentPlan === "free") {
      alert("Please upgrade to Pro to access this tone option.");
      return;
    }

    try {
      const description = await this.generateDescription(
        productName,
        keyFeatures,
        tone
      );
      const keywords = await this.generateSEOKeywords(productName, keyFeatures);

      this.updateOutput(description, keywords);
      this.descriptionCount++;
    } catch (error) {
      console.error("Error generating content:", error);
      alert("Error generating content. Please try again.");
    }
  }

  checkUsageLimit() {
    return this.currentPlan === "free"
      ? this.descriptionCount < this.monthlyLimit
      : true;
  }

  async generateDescription(productName, features, tone) {
    // Mockup of AI generation - In real implementation, this would call an AI API
    const featuresList = features.split("\n").filter((f) => f.trim());

    let description = `Introducing the ${productName}`;

    if (tone === "professional") {
      description += `, a premium solution designed to elevate your experience.`;
    } else if (tone === "casual") {
      description += `, your new favorite must-have!`;
    }

    description += "\n\nKey Features:\n";
    featuresList.forEach((feature) => {
      description += `• ${feature.trim()}\n`;
    });

    return description;
  }

  async generateSEOKeywords(productName, features) {
    // Mockup of SEO keyword generation
    const keywords = [
      productName.toLowerCase(),
      ...features
        .split("\n")
        .filter((f) => f.trim())
        .map((f) => f.toLowerCase())
        .slice(0, 3),
    ];

    return keywords.join(", ");
  }

  updateOutput(description, keywords) {
    document.getElementById("descriptionOutput").textContent = description;
    document.getElementById("keywordsOutput").textContent = keywords;
  }

  showLoadingState() {
    const button = this.form.querySelector('button[type="submit"]');
    const originalText = button.textContent;
    button.disabled = true;
    button.innerHTML = `
        <span class="spinner"></span>
        <span>Processing...</span>
    `;
    return () => {
      button.disabled = false;
      button.textContent = originalText;
    };
  }

  handleError(error) {
    const errorDiv = document.createElement("div");
    errorDiv.className = "error-message";
    errorDiv.textContent =
      error.message || "An error occurred. Please try again.";

    const form = this.form;
    form.insertBefore(errorDiv, form.firstChild);

    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
  }
}

// Initialize the generator when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  const generator = new ProductDescriptionGenerator();
});
