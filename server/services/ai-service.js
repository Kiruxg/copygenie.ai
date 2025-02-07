const OpenAI = require("openai");
const { ValidationError } = require("../utils/errors");

class AIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateDescription({
    productName,
    category,
    features,
    tone,
    length,
    userId,
  }) {
    try {
      // Validate input
      this.validateInput({ productName, category, features });

      // Create prompt based on parameters
      const prompt = this.createPrompt({
        productName,
        category,
        features,
        tone,
        length,
      });

      // Generate description using OpenAI
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are a professional product description writer. Create compelling, SEO-friendly product descriptions.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: this.getLengthTokens(length),
      });

      // Process and format the response
      const description = completion.choices[0].message.content;

      // Save to generation history
      await this.saveGeneration({
        userId,
        productName,
        description,
        category,
      });

      return {
        description,
        tokens: completion.usage.total_tokens,
        metadata: {
          tone,
          length,
          category,
        },
      };
    } catch (error) {
      console.error("AI Generation Error:", error);
      throw this.handleError(error);
    }
  }

  validateInput({ productName, category, features }) {
    const errors = [];

    if (!productName?.trim()) {
      errors.push({
        field: "productName",
        message: "Product name is required",
      });
    }

    if (!category?.trim()) {
      errors.push({
        field: "category",
        message: "Category is required",
      });
    }

    if (!features?.trim()) {
      errors.push({
        field: "features",
        message: "At least one feature is required",
      });
    }

    if (errors.length > 0) {
      throw new ValidationError("Invalid input", errors);
    }
  }

  createPrompt({ productName, category, features, tone, length }) {
    return `
            Create a ${tone} product description for the following ${category} product:
            
            Product Name: ${productName}
            
            Key Features:
            ${features}
            
            Requirements:
            - Use a ${tone} tone of voice
            - Optimize for SEO and conversions
            - Include key features and benefits
            - Make it ${length} in length
            - Focus on value proposition
            - Use persuasive language
        `;
  }

  getLengthTokens(length) {
    const tokenMap = {
      short: 150,
      medium: 250,
      long: 400,
    };
    return tokenMap[length] || 250;
  }

  async saveGeneration({ userId, productName, description, category }) {
    // Save to database
    await pool.query(
      `INSERT INTO generations 
            (user_id, product_name, description, category) 
            VALUES ($1, $2, $3, $4)`,
      [userId, productName, description, category]
    );
  }

  handleError(error) {
    if (error instanceof ValidationError) {
      return error;
    }

    if (error.response?.status === 429) {
      return new Error("Rate limit exceeded. Please try again later.");
    }

    return new Error("Failed to generate description. Please try again.");
  }
}

module.exports = new AIService();
