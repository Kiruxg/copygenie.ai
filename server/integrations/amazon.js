const aws = require("aws-sdk");
const xml2js = require("xml2js");

class AmazonIntegration {
  constructor(sellerId, accessKey, secretKey, marketplaceId) {
    this.sellerId = sellerId;
    this.marketplaceId = marketplaceId;

    aws.config.update({
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
      region: "us-east-1",
    });

    this.mws = new aws.MWS({
      version: "2009-01-01",
      region: "us-east-1",
    });
  }

  async getProducts() {
    try {
      const response = await this.mws
        .listMatchingProducts({
          SellerId: this.sellerId,
          MarketplaceId: this.marketplaceId,
          Query: "",
        })
        .promise();

      return this.parseProductsResponse(response);
    } catch (error) {
      console.error("Amazon products fetch error:", error);
      throw error;
    }
  }

  async updateProduct(asin, description, bulletPoints) {
    try {
      const feed = this.createProductFeed(asin, description, bulletPoints);
      await this.submitFeed("_POST_PRODUCT_DATA_", feed);
    } catch (error) {
      console.error("Amazon product update error:", error);
      throw error;
    }
  }

  createProductFeed(asin, description, bulletPoints) {
    const builder = new xml2js.Builder();
    return builder.buildObject({
      AmazonEnvelope: {
        Header: {
          DocumentVersion: "1.01",
          MerchantIdentifier: this.sellerId,
        },
        MessageType: "Product",
        Message: {
          MessageID: "1",
          OperationType: "Update",
          Product: {
            ASIN: asin,
            DescriptionData: {
              Description: description,
              BulletPoint: bulletPoints,
            },
          },
        },
      },
    });
  }

  async submitFeed(feedType, feedContent) {
    try {
      const response = await this.mws
        .submitFeed({
          FeedType: feedType,
          FeedContent: feedContent,
          MarketplaceIdList: [this.marketplaceId],
        })
        .promise();

      return response.FeedSubmissionId;
    } catch (error) {
      console.error("Feed submission error:", error);
      throw error;
    }
  }
}

module.exports = AmazonIntegration;
