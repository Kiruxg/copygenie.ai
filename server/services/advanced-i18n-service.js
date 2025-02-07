const i18next = require("i18next");
const { OpenAI } = require("openai");
const { MarketplaceRules } = require("../config/marketplace-rules");
const { CulturalGuidelines } = require("../config/cultural-guidelines");
const { RegionalSEO } = require("../config/regional-seo");

class AdvancedI18nService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Expanded language support
    this.supportedLanguages = {
      // Europe
      en: { name: "English", regions: ["GB", "US", "CA", "AU"] },
      es: { name: "Spanish", regions: ["ES", "MX", "AR", "CO"] },
      fr: { name: "French", regions: ["FR", "CA", "BE", "CH"] },
      de: { name: "German", regions: ["DE", "AT", "CH"] },
      it: { name: "Italian", regions: ["IT", "CH"] },
      pt: { name: "Portuguese", regions: ["PT", "BR"] },
      nl: { name: "Dutch", regions: ["NL", "BE"] },
      pl: { name: "Polish", regions: ["PL"] },
      ru: { name: "Russian", regions: ["RU", "BY", "KZ"] },

      // Asia
      zh: { name: "Chinese", regions: ["CN", "TW", "HK", "SG"] },
      ja: { name: "Japanese", regions: ["JP"] },
      ko: { name: "Korean", regions: ["KR"] },
      hi: { name: "Hindi", regions: ["IN"] },
      bn: { name: "Bengali", regions: ["IN", "BD"] },
      th: { name: "Thai", regions: ["TH"] },
      vi: { name: "Vietnamese", regions: ["VN"] },
      id: { name: "Indonesian", regions: ["ID"] },
      ms: { name: "Malay", regions: ["MY", "SG"] },

      // Middle East
      ar: { name: "Arabic", regions: ["SA", "AE", "EG", "QA"] },
      tr: { name: "Turkish", regions: ["TR"] },
      fa: { name: "Persian", regions: ["IR"] },

      // Others
      he: { name: "Hebrew", regions: ["IL"] },
      sv: { name: "Swedish", regions: ["SE"] },
      da: { name: "Danish", regions: ["DK"] },
      fi: { name: "Finnish", regions: ["FI"] },
      no: { name: "Norwegian", regions: ["NO"] },
    };

    this.initializeServices();
  }

  async initializeServices() {
    this.marketplaceRules = new MarketplaceRules();
    this.culturalGuidelines = new CulturalGuidelines();
    this.regionalSEO = new RegionalSEO();
  }

  async generateLocalizedContent(productData, targetLanguage, region) {
    const languageConfig = this.supportedLanguages[targetLanguage];

    // Validate region support
    if (!languageConfig.regions.includes(region)) {
      throw new Error(
        `Region ${region} not supported for language ${targetLanguage}`
      );
    }

    // Get region-specific rules and guidelines
    const rules = await this.getRegionSpecificRules(targetLanguage, region);

    // Generate and validate content
    const content = await this.generateContent(productData, rules);
    await this.validateContent(content, rules);

    return content;
  }

  async getRegionSpecificRules(language, region) {
    return {
      seo: await this.regionalSEO.getRules(language, region),
      marketplace: await this.marketplaceRules.getRules(region),
      cultural: await this.culturalGuidelines.getRules(language, region),
      formatting: this.getRegionFormatting(region),
    };
  }

  async validateContent(content, rules) {
    // Cultural sensitivity check
    const culturalCheck = await this.performCulturalCheck(
      content,
      rules.cultural
    );
    if (!culturalCheck.isValid) {
      throw new Error(
        `Cultural validation failed: ${culturalCheck.reasons.join(", ")}`
      );
    }

    // Marketplace compliance
    const complianceCheck = await this.checkMarketplaceCompliance(
      content,
      rules.marketplace
    );
    if (!complianceCheck.isValid) {
      throw new Error(
        `Marketplace compliance failed: ${complianceCheck.reasons.join(", ")}`
      );
    }

    // SEO validation
    const seoCheck = await this.validateSEO(content, rules.seo);
    if (!seoCheck.isValid) {
      throw new Error(`SEO validation failed: ${seoCheck.reasons.join(", ")}`);
    }
  }

  async performCulturalCheck(content, guidelines) {
    const completion = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a cultural sensitivity expert. Analyze the following content for cultural appropriateness according to these guidelines: ${JSON.stringify(
            guidelines
          )}`,
        },
        {
          role: "user",
          content: content,
        },
      ],
    });

    return this.parseCulturalAnalysis(completion.choices[0].message.content);
  }

  async validateSEO(content, seoRules) {
    const analysis = {
      keywords: await this.analyzeKeywordUsage(content, seoRules),
      structure: this.validateStructure(content, seoRules),
      readability: await this.checkReadability(content, seoRules.language),
      localFactors: await this.checkLocalSEOFactors(content, seoRules),
    };

    return {
      isValid: Object.values(analysis).every((check) => check.passed),
      analysis,
      recommendations: this.generateSEORecommendations(analysis),
    };
  }

  async checkMarketplaceCompliance(content, rules) {
    // Check length limits
    const lengthCheck = this.checkLengthLimits(content, rules.lengthLimits);

    // Check prohibited content
    const prohibitedCheck = await this.checkProhibitedContent(
      content,
      rules.prohibited
    );

    // Check required elements
    const requiredCheck = this.checkRequiredElements(content, rules.required);

    return {
      isValid: lengthCheck && prohibitedCheck && requiredCheck,
      details: {
        lengthCheck,
        prohibitedCheck,
        requiredCheck,
      },
    };
  }

  getRegionFormatting(region) {
    return {
      numbers: new Intl.NumberFormat(region),
      currency: new Intl.NumberFormat(region, {
        style: "currency",
        currency: this.getRegionCurrency(region),
      }),
      dates: new Intl.DateTimeFormat(region),
      measurements: this.getRegionMeasurements(region),
    };
  }
}

module.exports = new AdvancedI18nService();
