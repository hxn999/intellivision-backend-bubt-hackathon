import { GoogleGenAI } from "@google/genai";
import * as dotenv from 'dotenv';
dotenv.config();

// 1. Initialize the client.
// It automatically finds the GEMINI_API_KEY from your .env file.
const ai = new GoogleGenAI({}); 

/**
 * Sends a single, stateless prompt to the Gemini model.
 * @param {string} prompt The text prompt to send.
 * @returns {Promise<string>} The generated text response.
 */
async function getSimpleResponse(prompt) {
  try {
    // 2. Use the generateContent method directly on the models submodule.
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt, // Pass the prompt directly here
      // Optional: Configure system instructions or temperature here
      config: {
        systemInstruction: "give response like this json object , { question:string , answer:string , question_rating:number} dont give any other text beside this json and only json exlclude backticks and formatting for beatiful rendering also",
      },
    });

    // 3. Extract the final text from the response object.
    return response.text;
  } catch (error) {
    console.error("Error generating content:", error);
    return "Failed to get response.";
  }
}

// --- Example Usage ---
async function main() {
  const userPrompt = "hey give a short description how to ensure daily macro and micro nutrient about 2-3 lines";
  console.log(`Prompt: ${userPrompt}`);
  
  const resultText = await getSimpleResponse(userPrompt);
  
  console.log("\n--- AI Response ---");
  console.log(resultText);
}

main();