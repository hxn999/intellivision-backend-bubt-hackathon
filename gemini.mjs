import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";
dotenv.config();

/**
 * ChatSession class - Maintains conversation history
 */
class ChatSession {
  constructor(systemInstruction = null, modelName = "gemini-2.5-flash") {
    this.ai = new GoogleGenAI({});
    this.modelName = modelName;
    this.systemInstruction = systemInstruction;
    this.history = [];
  }
  
  async sendMessage(userMessage) {
    // Add user message to history
    this.history.push({
      role: "user",
      content: userMessage,
    });

    // Build conversation context
    const conversationContext = this.history
      .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
      .join("\n\n");

    const fullPrompt = `${conversationContext}\n\nAssistant:`;

    // Generate response
    const config = this.systemInstruction
      ? { systemInstruction: this.systemInstruction }
      : {};

    const response = await this.ai.models.generateContent({
      model: this.modelName,
      contents: fullPrompt,
      config: config,
    });

    const aiResponse = response.text || "";

    // Add AI response to history
    this.history.push({
      role: "assistant",
      content: aiResponse,
    });

    return aiResponse;
  }
}

/**
 * Hardcoded chat example with 3 messages
 */
async function main() {
  console.log("\n=== Chat Session Started ===\n");

  const chat = new ChatSession(
    "You are a nutrition expert. Provide helpful, concise advice."
  );

  // Message 1
  console.log("User: What are some high-protein foods?");
  let response = await chat.sendMessage("What are some high-protein foods?");
  console.log(`AI: ${response}\n`);

  // Message 2 (remembers context)
  console.log("User: Which one is best for weight loss?");
  response = await chat.sendMessage("Which one is best for weight loss?");
  console.log(`AI: ${response}\n`);

  // Message 3 (still remembers context)
  console.log("User: How much should I eat per day?");
  response = await chat.sendMessage("How much should I eat per day?");
  console.log(`AI: ${response}\n`);

  console.log(`\n=== Chat Complete (${chat.history.length} messages) ===\n`);
}

main().catch(console.error);