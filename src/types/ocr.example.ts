/**
 * OCR Interface Usage Examples
 * 
 * This file demonstrates how to use the OCR interfaces with your API
 */

import { IOCRResponse, isOCRSuccessful, extractParsedText } from "./ocr";

/**
 * Example 1: Processing OCR Response
 */
export function processOCRResponse(response: IOCRResponse): void {
  // Check if OCR was successful
  if (isOCRSuccessful(response)) {
    console.log("OCR successful!");
    
    // Extract all text
    const text = extractParsedText(response);
    console.log("Extracted text:", text);
    
    // Access individual results
    response.ParsedResults.forEach((result, index) => {
      console.log(`Result ${index + 1}:`, result.ParsedText);
    });
  } else {
    console.error("OCR failed");
    response.ParsedResults.forEach((result) => {
      if (result.ErrorMessage) {
        console.error("Error:", result.ErrorMessage);
      }
    });
  }
}

/**
 * Example 2: Making OCR API Call
 */
export async function performOCR(imageUrl: string): Promise<IOCRResponse> {
  const apiKey = process.env.OCR_API_KEY || "your-api-key";
  
  const formData = new FormData();
  formData.append("url", imageUrl);
  formData.append("apikey", apiKey);
  formData.append("language", "eng");
  formData.append("isOverlayRequired", "false");
  
  const response = await fetch("https://api.ocr.space/parse/image", {
    method: "POST",
    body: formData,
  });
  
  const data: IOCRResponse = await response.json();
  return data;
}

/**
 * Example 3: Processing AI Generated Images
 * This integrates with your AI image upload endpoints
 */
export async function processAIImageWithOCR(
  imageUrl: string
): Promise<string | null> {
  try {
    // Perform OCR on the image
    const ocrResponse = await performOCR(imageUrl);
    
    // Check if successful
    if (!isOCRSuccessful(ocrResponse)) {
      console.error("OCR processing failed");
      return null;
    }
    
    // Extract and return text
    return extractParsedText(ocrResponse);
  } catch (error) {
    console.error("Error processing image with OCR:", error);
    return null;
  }
}

/**
 * Example 4: Parsing Food Information from OCR Text
 */
export interface IParsedFoodInfo {
  name?: string;
  quantity?: number;
  unit?: string;
  expiryHours?: number;
}

export function parseFoodInformationFromOCR(
  ocrText: string
): IParsedFoodInfo[] {
  // This is a simple example - you would implement more sophisticated parsing
  const lines = ocrText.split("\n").filter((line) => line.trim());
  
  const foodItems: IParsedFoodInfo[] = [];
  
  // Example parsing logic (customize based on your needs)
  lines.forEach((line) => {
    const item: IParsedFoodInfo = {};
    
    // Try to extract quantity and unit (e.g., "6ML", "500g")
    const quantityMatch = line.match(/(\d+\.?\d*)\s*(ml|g|kg|l|oz|lb)/i);
    if (quantityMatch) {
      item.quantity = parseFloat(quantityMatch[1]);
      item.unit = quantityMatch[2].toLowerCase();
    }
    
    // Try to extract expiry time (e.g., "4-7 hours")
    const expiryMatch = line.match(/(\d+)[-–]?(\d+)?\s*hours?/i);
    if (expiryMatch) {
      const min = parseInt(expiryMatch[1]);
      const max = expiryMatch[2] ? parseInt(expiryMatch[2]) : min;
      item.expiryHours = (min + max) / 2; // Use average
    }
    
    // The name would be the line itself (cleaned up)
    item.name = line.trim();
    
    if (item.name) {
      foodItems.push(item);
    }
  });
  
  return foodItems;
}

/**
 * Example 5: Full Integration Flow
 * Upload image → Get URL → Perform OCR → Parse food info
 */
export async function processUploadedFoodImage(
  imageUrl: string
): Promise<IParsedFoodInfo[]> {
  // 1. Perform OCR on uploaded image
  const ocrResponse = await performOCR(imageUrl);
  
  if (!isOCRSuccessful(ocrResponse)) {
    throw new Error("OCR processing failed");
  }
  
  // 2. Extract text
  const extractedText = extractParsedText(ocrResponse);
  
  // 3. Parse food information
  const foodItems = parseFoodInformationFromOCR(extractedText);
  
  return foodItems;
}

