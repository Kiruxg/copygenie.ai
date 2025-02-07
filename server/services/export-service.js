const json2csv = require("json2csv");
const xml2js = require("xml2js");

class ExportService {
  async exportToCSV(descriptions, format = "shopify") {
    const fields = this.getFieldsForFormat(format);
    const data = this.transformData(descriptions, format);

    return json2csv.parse(data, { fields });
  }

  async exportToXML(descriptions, format = "woocommerce") {
    const builder = new xml2js.Builder();
    const data = this.transformData(descriptions, format);

    return builder.buildObject({ products: { product: data } });
  }

  async exportToJSON(descriptions, format = "generic") {
    return JSON.stringify(this.transformData(descriptions, format), null, 2);
  }

  getFieldsForFormat(format) {
    const formatMappings = {
      shopify: ["handle", "title", "body_html", "vendor", "tags"],
      woocommerce: ["name", "description", "short_description", "categories"],
      amazon: [
        "product-id",
        "product-name",
        "product-description",
        "bullet-points",
      ],
      etsy: ["title", "description", "tags", "materials"],
    };

    return formatMappings[format] || ["title", "description"];
  }

  transformData(descriptions, format) {
    // Transform data according to platform requirements
    switch (format) {
      case "shopify":
        return descriptions.map((d) => ({
          handle: this.generateHandle(d.title),
          title: d.title,
          body_html: d.description,
          vendor: d.brand,
          tags: d.keywords.join(","),
        }));

      case "woocommerce":
        return descriptions.map((d) => ({
          name: d.title,
          description: d.description,
          short_description: d.shortDescription,
          categories: d.categories,
        }));

      case "amazon":
        return descriptions.map((d) => ({
          "product-id": d.id,
          "product-name": d.title,
          "product-description": d.description,
          "bullet-points": d.features,
        }));

      default:
        return descriptions;
    }
  }

  generateHandle(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }
}

module.exports = new ExportService();
