const i18next = require("i18next");
const Backend = require("i18next-fs-backend");
const OpenAI = require("openai");

class I18nService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    this.supportedLanguages = {
      en: "English",
      es: "Spanish",
      fr: "French",
      de: "German",
      it: "Italian",
      pt: "Portuguese",
      nl: "Dutch",
      pl: "Polish",
      ru: "Russian",
      zh: "Chinese",
      ja: "Japanese",
      ko: "Korean",
    };

    this.initializeI18n();
  }

  async initializeI18n() {
    await i18next.use(Backend).init({
      fallbackLng: "en",
      supportedLngs: Object.keys(this.supportedLanguages),
      backend: {
        loadPath: "./locales/{{lng}}/{{ns}}.json",
      },
      ns: ["common", "descriptions", "seo", "marketplace"],
    });
  }

  async generateDescription(productData, targetLanguage) {
    try {
      // First generate in English
      const englishDescription = await this.generateEnglishDescription(
        productData
      );

      // If target language is English, return
      if (targetLanguage === "en") {
        return englishDescription;
      }

      // Translate and localize
      const localizedDescription = await this.translateAndLocalize(
        englishDescription,
        targetLanguage,
        productData.marketplace
      );

      return localizedDescription;
    } catch (error) {
      console.error("Description generation error:", error);
      throw error;
    }
  }

  async translateAndLocalize(text, targetLanguage, marketplace) {
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are an expert translator and localizer for ${marketplace} marketplace. 
                                Translate and adapt the text for ${this.supportedLanguages[targetLanguage]} audience, 
                                considering cultural nuances and marketplace-specific terminology.`,
          },
          {
            role: "user",
            content: `Translate and localize this product description: ${text}`,
          },
        ],
        temperature: 0.7,
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error("Translation error:", error);
      throw error;
    }
  }

  async validateLocalization(text, language) {
    // Validate cultural appropriateness and marketplace compliance
    const validation = await this.performValidation(text, language);

    if (!validation.isValid) {
      throw new Error(
        `Localization validation failed: ${validation.errors.join(", ")}`
      );
    }

    return validation;
  }

  async performValidation(text, language) {
    const completion = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a cultural and linguistic expert for ${this.supportedLanguages[language]}. 
                             Validate this text for cultural appropriateness, accuracy, and marketplace compliance.`,
        },
        {
          role: "user",
          content: text,
        },
      ],
    });

    const analysis = completion.choices[0].message.content;
    return this.parseValidationResponse(analysis);
  }

  async optimizeForMarketplace(description, language, marketplace) {
    const marketplaceRules = await this.getMarketplaceRules(
      marketplace,
      language
    );

    return {
      optimizedDescription: await this.applyMarketplaceRules(
        description,
        marketplaceRules
      ),
      marketplaceSpecifics: {
        keywords: await this.getLocalizedKeywords(description, language),
        categorySpecifications: await this.getLocalizedCategories(
          marketplace,
          language
        ),
        compliance: await this.checkCompliance(
          description,
          marketplace,
          language
        ),
      },
    };
  }

  async getLocalizedKeywords(description, language) {
    // Get market-specific keywords
    const marketKeywords = await this.analyzeMarketKeywords(
      description,
      language
    );

    return {
      primary: marketKeywords.slice(0, 5),
      secondary: marketKeywords.slice(5, 15),
      related: marketKeywords.slice(15),
    };
  }

  getLanguageSpecificFormatting(language) {
    return {
      numberFormat: new Intl.NumberFormat(language),
      dateFormat: new Intl.DateTimeFormat(language),
      currencyFormat: new Intl.NumberFormat(language, {
        style: "currency",
        currency: this.getLanguageCurrency(language),
      }),
    };
  }

  getLanguageCurrency(language) {
    const currencyMap = {
      en: "USD",
      gb: "GBP",
      eu: "EUR",
      jp: "JPY",
      // Add more currency mappings
    };
    return currencyMap[language] || "USD";
  }
}

module.exports = new I18nService();
