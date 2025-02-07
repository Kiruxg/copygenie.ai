class SEOKeywordGenerator {
  constructor() {
    this.aiService = new AIService();
    this.form = document.getElementById("seoForm");
    this.initializeEventListeners();
  }

  initializeEventListeners() {
    this.form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleFormSubmission();
    });
  }

  async handleFormSubmission() {
    const productName = document.getElementById("productName").value;
    const category = document.getElementById("category").value;
    const targetMarket = document.getElementById("targetMarket").value;

    try {
      this.showLoadingState();

      const keywords = await this.aiService.generateSEOKeywords(
        productName,
        category,
        targetMarket
      );

      this.displayResults(keywords);
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to generate keywords. Please try again.");
    } finally {
      this.hideLoadingState();
    }
  }

  displayResults(keywords) {
    // Parse and display the AI response in the appropriate sections
    const sections = keywords.split("\n\n");

    document.getElementById("primaryKeywords").textContent = sections[0];
    document.getElementById("longTailKeywords").textContent = sections[1];
    document.getElementById("relatedTerms").textContent = sections[2];
  }

  // ... loading state methods ...
}
