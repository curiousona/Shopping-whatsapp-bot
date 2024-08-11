// In progress
const { DynamicStructuredTool } = require("@langchain/core/tools");
const { z } = require("zod");
const axios = require("axios");
require("dotenv").config(); // Load environment variables

// Define the schema for the Flipkart search parameters
const flipkartSearchSchema = z.object({
  q: z.string().describe("Search query"),
  page: z.number().optional().describe("Results page to return"),
  sort_by: z.enum(["popularity", "price_asc", "price_desc", "recency_desc", "discount"]).optional().describe("Return the results in a specific sort order If not passed it will be sorted by relevence"),
});

// Create the Flipkart search tool
const flipkartSearchTool = new DynamicStructuredTool({
  name: "flipkartSearch",
  description: "Search for products on Flipkart using various parameters",
  schema: flipkartSearchSchema,
  func: async (params) => {
    const apiKey = process.env.RAPIDAPI_KEY; // Load API key from environment variables

    // Construct the query parameters object
    const queryParams = {
      q: params.q,
      ...params.page && { page: params.page.toString() },
      ...params.sort_by && { sort_by: params.sort_by },
    };

    const options = {
      method: 'GET',
      url: 'https://real-time-flipkart-api.p.rapidapi.com/product-search',
      params: queryParams,
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'real-time-flipkart-api.p.rapidapi.com',
      },
    };

    try {
      const response = await axios.request(options);
      return JSON.stringify(response.data.products); // Return the JSON response as a string
    } catch (error) {
      throw new Error(`Error fetching data from Flipkart API: ${error.message}`);
    }
  },
});

// Export the tool
module.exports = flipkartSearchTool;

// Test block to run manually
if (require.main === module) {
  (async () => {
    try {
      // Sample parameters for testing
      const params = {
        q: 'apple',
        page: 1,
        sort_by: 'POPULARITY',
      };

      const result = await flipkartSearchTool.func(params);
      console.log('Test Result:', result);
    } catch (error) {
      console.error('Test Error:', error);
    }
  })();
}
