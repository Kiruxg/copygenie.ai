const EbayAuthToken = require("ebay-oauth-token-generator");
const axios = require("axios");

class EbayIntegration {
  constructor(clientId, clientSecret, refreshToken) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.refreshToken = refreshToken;
    this.baseUrl = "https://api.ebay.com/sell/inventory/v1";
  }

  async getAccessToken() {
    const ebayAuthToken = new EbayAuthToken({
      clientId: this.clientId,
      clientSecret: this.clientSecret,
      redirectUri: "",
    });

    try {
      const token = await ebayAuthToken.getAccessToken(
        "PRODUCTION",
        this.refreshToken
      );
      return token.access_token;
    } catch (error) {
      console.error("eBay token error:", error);
      throw error;
    }
  }

  async getInventoryItems(limit = 100, offset = 0) {
    try {
      const token = await this.getAccessToken();
      const response = await axios.get(`${this.baseUrl}/inventory_item`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        params: { limit, offset },
      });
      return response.data.inventoryItems;
    } catch (error) {
      console.error("eBay inventory fetch error:", error);
      throw error;
    }
  }

  async updateInventoryItem(sku, description) {
    try {
      const token = await this.getAccessToken();
      await axios.put(
        `${this.baseUrl}/inventory_item/${sku}`,
        {
          product: {
            description,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
    } catch (error) {
      console.error("eBay inventory update error:", error);
      throw error;
    }
  }

  async bulkUpdateInventory(updates) {
    const bulkRequests = updates.map((update) => ({
      sku: update.sku,
      description: update.description,
    }));

    for (const request of bulkRequests) {
      await this.updateInventoryItem(request.sku, request.description);
      // eBay API has rate limits, so we add a delay
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
}

module.exports = EbayIntegration;
