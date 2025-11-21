import { GoogleGenAI } from "@google/genai";
import * as dotenv from 'dotenv';
dotenv.config();

// The GoogleGenAI client automatically looks for the GEMINI_API_KEY
// in your environment variables (.env file).
const ai = new GoogleGenAI({});

/**
 * Initializes a new chat session with a system instruction.
 * @param {string} modelName - The Gemini model to use (e.g., 'gemini-2.5-flash').
 * @param {string} systemInstruction - The initial instruction/persona for the AI.
 * @returns {object} The chat session object.
 */
function initializeChat(modelName = 'gemini-2.5-flash', systemInstruction) {
  const model = ai.models.getGenerativeModel({
    model: modelName,
    config: {
      systemInstruction: systemInstruction,
    },
  });

  // startChat() is the method that creates and manages the multi-turn conversation.
  const chat = model.startChat(); 
  console.log(`Chat session started with ${modelName}.`);
  return chat;
}

/**
 * Sends a message to the chat session and prints the response.
 * @param {object} chat - The active chat session object.
 * @param {string} message - The new user message.
 */
async function sendMessageToChat(chat, message) {
  try {
    const response = await chat.sendMessage({ message });
    console.log(`\nUser: ${message}`);
    console.log(`\nAI: ${response.text}`);
  } catch (error) {
    console.error("Error sending message:", error);
  }
}

async function runChatExample() {
  // 1. Initialize the chat with a persona
  const chatSession = initializeChat(
    'gemini-2.5-flash', 
    'You are a friendly, witty pirate captain who only speaks in pirate slang.'
  );

  console.log(chatSession)

  // // 2. First message - The history is automatically recorded.
  // await sendMessageToChat(chatSession, 'Hello, what is your name?');

  // // 3. Second message - The model remembers the pirate persona and the first response.
  // await sendMessageToChat(chatSession, 'I have a large ship, what should I name it?');

  // Optional: Retrieve full history after conversation ends
  // const history = await chatSession.getHistory();
  // console.log('\n--- Full Conversation History ---');
  // console.log(JSON.stringify(history, null, 2));
}

runChatExample();