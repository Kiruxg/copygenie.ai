const axios = require("axios");

class ShopifyIntegration {
  constructor(shop, accessToken) {
    this.shop = shop;
    this.accessToken = accessToken;
    this.baseUrl = `https://${shop}/admin/api/2024-01`;
  }

  async getProducts(limit = 50, page = 1) {
    try {
      const response = await axios.get(`${this.baseUrl}/products.json`, {
        headers: this.getHeaders(),
        params: {
          limit,
          page,
        },
      });
      return response.data.products;
    } catch (error) {
      console.error("Shopify products fetch error:", error);
      throw error;
    }
  }

  async updateProduct(productId, description) {
    try {
      await axios.put(
        `${this.baseUrl}/products/${productId}.json`,
        {
          product: {
            id: productId,
            body_html: description,
          },
        },
        { headers: this.getHeaders() }
      );
    } catch (error) {
      console.error("Shopify product update error:", error);
      throw error;
    }
  }

  async bulkUpdateProducts(updates) {
    const operations = updates.map((update) => ({
      productId: update.productId,
      description: update.description,
    }));

    for (const op of operations) {
      await this.updateProduct(op.productId, op.description);
    }
  }

  getHeaders() {
    return {
      "X-Shopify-Access-Token": this.accessToken,
      "Content-Type": "application/json",
    };
  }
}

module.exports = ShopifyIntegration;
