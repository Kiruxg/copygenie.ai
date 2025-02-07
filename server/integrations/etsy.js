const axios = require("axios");
const OAuth = require("oauth-1.0a");
const crypto = require("crypto");

class EtsyIntegration {
  constructor(apiKey, apiSecret, accessToken, tokenSecret) {
    this.apiKey = apiKey;
    this.baseUrl = "https://openapi.etsy.com/v3";
    this.oauth = OAuth({
      consumer: { key: apiKey, secret: apiSecret },
      signature_method: "HMAC-SHA1",
      hash_function(base_string, key) {
        return crypto
          .createHmac("sha1", key)
          .update(base_string)
          .digest("base64");
      },
    });
    this.token = {
      key: accessToken,
      secret: tokenSecret,
    };
  }

  async getListings(limit = 100, offset = 0) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/application/shops/me/listings/active`,
        {
          headers: this.getAuthHeaders(
            "GET",
            "/application/shops/me/listings/active"
          ),
          params: { limit, offset },
        }
      );
      return response.data.results;
    } catch (error) {
      console.error("Etsy listings fetch error:", error);
      throw error;
    }
  }

  async updateListing(listingId, description, tags) {
    try {
      await axios.put(
        `${this.baseUrl}/application/listings/${listingId}`,
        {
          description,
          tags: tags.join(","),
        },
        {
          headers: this.getAuthHeaders(
            "PUT",
            `/application/listings/${listingId}`
          ),
        }
      );
    } catch (error) {
      console.error("Etsy listing update error:", error);
      throw error;
    }
  }

  getAuthHeaders(method, path) {
    const request = {
      url: `${this.baseUrl}${path}`,
      method,
    };

    return {
      ...this.oauth.toHeader(this.oauth.authorize(request, this.token)),
      "x-api-key": this.apiKey,
      "Content-Type": "application/json",
    };
  }
}

module.exports = EtsyIntegration;
