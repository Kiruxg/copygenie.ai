const natural = require("natural");
const keywordExtractor = require("keyword-extractor");

class SEOService {
  analyzeDescription(description, targetKeywords) {
    const analysis = {
      keywordDensity: this.calculateKeywordDensity(description, targetKeywords),
      readabilityScore: this.calculateReadability(description),
      wordCount: description.split(" ").length,
      suggestions: [],
    };

    // Add SEO suggestions
    if (analysis.keywordDensity < 1) {
      analysis.suggestions.push("Consider increasing primary keyword usage");
    }
    if (analysis.wordCount < 300) {
      analysis.suggestions.push(
        "Description might be too short for optimal SEO"
      );
    }
    if (analysis.readabilityScore > 12) {
      analysis.suggestions.push(
        "Text might be too complex. Consider simplifying."
      );
    }

    return analysis;
  }

  calculateKeywordDensity(text, keywords) {
    const words = text.toLowerCase().split(" ");
    let keywordCount = 0;

    keywords.forEach((keyword) => {
      const regex = new RegExp(keyword.toLowerCase(), "g");
      const matches = text.toLowerCase().match(regex);
      keywordCount += matches ? matches.length : 0;
    });

    return (keywordCount / words.length) * 100;
  }

  calculateReadability(text) {
    return natural.FleschKincaid.grade(text);
  }

  extractKeywords(text, options = {}) {
    return keywordExtractor.extract(text, {
      language: "english",
      remove_digits: true,
      return_changed_case: true,
      remove_duplicates: true,
      ...options,
    });
  }

  generateMetaDescription(description) {
    const sentences = description.split(".");
    let metaDescription = sentences[0];

    if (metaDescription.length < 150 && sentences[1]) {
      metaDescription += ". " + sentences[1];
    }

    return (
      metaDescription.substring(0, 155) +
      (metaDescription.length > 155 ? "..." : "")
    );
  }
}

module.exports = new SEOService();
