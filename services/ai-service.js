class AIService {
  constructor() {
    this.baseUrl = "http://localhost:3000/api";
  }

  async generateDescription(productData) {
    try {
      const response = await fetch(`${this.baseUrl}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productName: productData.productName,
          personality: productData.personality,
        }),
        credentials: "include", // For session cookies
      });

      if (!response.ok) {
        throw new Error("Failed to generate description");
      }

      return await response.json();
    } catch (error) {
      console.error("AI Service Error:", error);
      throw error;
    }
  }
}

// Export for use in product-description.js
export default new AIService();
