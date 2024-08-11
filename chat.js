const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const {
  ChatPromptTemplate,
  MessagesPlaceholder,
} = require("@langchain/core/prompts");
const {
  AgentExecutor,
  createToolCallingAgent,
} = require("langchain/agents");
const { AIMessage, HumanMessage } = require("@langchain/core/messages");
const { ChatMessageHistory } = require("langchain/stores/message/in_memory");
const { RunnableWithMessageHistory } = require("@langchain/core/runnables");
const flipkartSearchTool = require("./flipkart.js")
require("dotenv").config();

// Define the chat prompt template
const prompt = ChatPromptTemplate.fromMessages([
  ["system", 
`You are a dedicated shopping assistant designed to help users find the perfect products.

**Task:**
* When a user requests products, gather necessary details (product type, budget, preferences) in a single query.
* Invoke the provided "flipkartSearchTool" function to fetch product data based on the user's query.
* Analyze the returned JSON data to determine the top two products considering price, ratings, features, and customer reviews.
* Provide a concise summary for each of the top two products, including their name, link, and key selling points.

**Output Format:**
* A clear and informative response, including product names, links, ratings, and a brief summary for each of the top two products.

**Example:**
User: "I need a new gaming laptop under 50000"
You: [Call flipkartSearchTool with query "gaming laptop under $1500"]
[Analyze JSON data of both find best product and output result in one go]
"Top Picks:"
* Product A: Acer Nitro 5
  * Link: [product link]
  * Price: 48000
  * Rating: 4.5/5
  * Reason to Buy: [Fill you reason why you think this is a good product for user]
* Product B: Lenovo Legion 5
  * Link: [product link]
  * Price: 49000
  * Rating: 4.3/5
  * Reason to Buy: [Fill you reason why you think this is a good product for user]

**Additional Considerations:**
* If the user doesn't provide a budget, politely request one before proceeding if they no budget then find sort using RELEVANCE.
* Handle language variations by using a translation tool (if available) before searching.
* Prioritize products with higher ratings and positive reviews.
* Consider incorporating user preferences (e.g., brand, size) into the search and analysis process.
* Do not ask more than 2 question then invoke the search tool as best as you can compulsarily.
`
  ],
  ["placeholder", "{chat_history}"],
  ["human", "{input}"],
  ["placeholder", "{agent_scratchpad}"],
]);

// Initialize the LLM with Google Generative AI
const llm = new ChatGoogleGenerativeAI({
  model: "gemini-1.5-flash",
  maxOutputTokens: 2048,
});

// Define the tools the agent will have access to.
const tools = [flipkartSearchTool]; // Add amazon search tool

// Create the agent with the LLM and the tool
const agent = createToolCallingAgent({ llm, tools, prompt });

// Initialize the agent executor
const agentExecutor = new AgentExecutor({ agent, tools });

// Create a message history object
const messageHistory = new ChatMessageHistory();

// Wrap the agent executor with message history
const agentWithChatHistory = new RunnableWithMessageHistory({
  runnable: agentExecutor,
  getMessageHistory: (_sessionId) => messageHistory,
  inputMessagesKey: "input",
  historyMessagesKey: "chat_history",
});

// Define a function to generate a reply using the agent with history
const generateReply = async (msg, sessionId = "default") => {
  try {
    const result = await agentWithChatHistory.invoke(
      {
        input: msg,
      },
      {
        configurable: {
          sessionId,
        },
      }
    );
// Add direct voice support 
    console.log("Agent Result:", result.output);
    return result.output;
  } catch (error) {
    console.error("Error using Agent Executor:", error);
    return "There was an error processing your request. Please try again.";
  }
};


module.exports = generateReply;