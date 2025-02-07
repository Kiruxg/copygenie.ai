class AIService {
  constructor() {
    this.baseUrl = "http://localhost:3000/api";
    this.token = localStorage.getItem("authToken");
  }

  async makeRequest(endpoint, data) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please try again later.");
        }
        throw new Error("Request failed");
      }

      return await response.json();
    } catch (error) {
      console.error("API Request Error:", error);
      throw error;
    }
  }

  async generateProductDescription(productName, features, tone) {
    const response = await this.makeRequest("/generate/description", {
      productName,
      features,
      tone,
    });
    return response.description;
  }

  async generateSEOKeywords(productName, category, targetMarket) {
    const response = await this.makeRequest("/generate/seo-keywords", {
      productName,
      category,
      targetMarket,
    });
    return response.keywords;
  }

  async generateContent(productData) {
    try {
      const response = await fetch(`${this.baseUrl}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: productData.name,
          features: productData.features,
          tone: productData.tone,
          targetAudience: productData.targetAudience,
          keywords: productData.keywords,
          competitorAnalysis: true,
          marketplacePlatform: productData.platform,
          conversionOptimization: true,
          localMarketAdaptation: productData.locale,
        }),
      });

      return await response.json();
    } catch (error) {
      console.error("AI Service Error:", error);
      throw error;
    }
  }

  async generateABVariants(
    productName,
    features,
    targetAudience,
    variantCount
  ) {
    const prompt = `
            Create ${variantCount} different product description variants for A/B testing:
            Product: ${productName}
            Features: ${features}
            Target Audience: ${targetAudience}

            For each variant, provide:
            1. A unique headline
            2. A distinct product description
            3. Different value propositions
            4. Varied call-to-actions
        `;

    return this.generateContent(prompt, { temperature: 0.9 });
  }

  async translateContent(content, targetLanguages) {
    const prompt = `
            Translate the following product description into ${targetLanguages.join(
              ", "
            )}:
            
            Original (English):
            ${content}

            Provide translations maintaining the same formatting and tone.
        `;

    return this.generateContent(prompt);
  }

  async generateDescription(productData) {
    try {
      const response = await fetch(`${this.baseUrl}/generate/description`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: productData.name,
          features: productData.features,
          tone: productData.tone,
          targetAudience: productData.targetAudience,
          keywords: productData.keywords,
        }),
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
