const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api");

class WooCommerceIntegration {
  constructor(url, consumerKey, consumerSecret) {
    this.api = new WooCommerceRestApi({
      url,
      consumerKey,
      consumerSecret,
      version: "wc/v3",
    });
  }

  async getProducts(page = 1) {
    try {
      const response = await this.api.get("products", {
        per_page: 100,
        page,
      });
      return response.data;
    } catch (error) {
      console.error("WooCommerce products fetch error:", error);
      throw error;
    }
  }

  async updateProduct(productId, description) {
    try {
      await this.api.put(`products/${productId}`, {
        description,
      });
    } catch (error) {
      console.error("WooCommerce product update error:", error);
      throw error;
    }
  }

  async bulkUpdateProducts(updates) {
    const operations = updates.map((update) => ({
      id: update.productId,
      description: update.description,
    }));

    try {
      await this.api.post("products/batch", {
        update: operations,
      });
    } catch (error) {
      console.error("WooCommerce bulk update error:", error);
      throw error;
    }
  }
}

module.exports = WooCommerceIntegration;
