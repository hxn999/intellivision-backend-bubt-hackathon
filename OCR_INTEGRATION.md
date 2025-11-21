# OCR Integration Guide

This document explains the OCR response interface and how to integrate OCR functionality with the AI image upload endpoints.

## OCR Response Interface

### Main Interface: `IOCRResponse`

```typescript
interface IOCRResponse {
  ParsedResults: IOCRParsedResult[];
  OCRExitCode: number;
  IsErroredOnProcessing: boolean;
  ProcessingTimeInMilliseconds: string;
  SearchablePDFURL: string;
}
```

### Parsed Result Interface: `IOCRParsedResult`

```typescript
interface IOCRParsedResult {
  TextOverlay: IOCRTextOverlay;
  TextOrientation: string;
  FileParseExitCode: number;
  ParsedText: string;
  ErrorMessage: string;
  ErrorDetails: string;
}
```

### Text Overlay Interface: `IOCRTextOverlay`

```typescript
interface IOCRTextOverlay {
  Lines: any[];
  HasOverlay: boolean;
  Message: string;
}
```

---

## Exit Codes

| Exit Code | Meaning |
|-----------|---------|
| 1 | Parsed Successfully (Image / All pages parsed successfully) |
| 2 | Parsed Partially (Only few pages out of all the pages parsed successfully) |
| 3 | Image / All the PDF pages failed parsing (This happens mainly because the OCR engine fails to parse an image) |
| 4 | Error occurred when attempting to parse (This happens when a fatal error occurs during parsing ) |

---

## Helper Functions

### `isOCRSuccessful(response: IOCRResponse): boolean`

Checks if the OCR processing was successful.

```typescript
import { isOCRSuccessful } from './types/ocr';

const response: IOCRResponse = await performOCR(imageUrl);
if (isOCRSuccessful(response)) {
  console.log('OCR successful!');
}
```

### `extractParsedText(response: IOCRResponse): string`

Extracts all parsed text from the OCR response.

```typescript
import { extractParsedText } from './types/ocr';

const response: IOCRResponse = await performOCR(imageUrl);
const text = extractParsedText(response);
console.log('Extracted text:', text);
```

---

## Integration with AI Image Endpoints

Your backend already has AI image upload endpoints. Here's how to integrate OCR:

### Current AI Image Endpoints

1. **POST `/user/ai-inventory-log`** - Upload inventory image
2. **POST `/user/ai-food-log`** - Upload food log image
3. **GET `/user/ai-inventory-logs`** - Get all inventory images
4. **GET `/user/ai-food-logs`** - Get all food log images

### Integration Flow

```
User uploads image → Cloudinary stores → OCR processes → Extract data → Store in DB
```

---

## Implementation Example

### 1. Update Controller to Process OCR

```typescript
// src/controllers/userController.ts

import { IOCRResponse, isOCRSuccessful, extractParsedText } from "../types/ocr";

async function performOCR(imageUrl: string): Promise<IOCRResponse> {
  const apiKey = process.env.OCR_API_KEY;
  
  const formData = new FormData();
  formData.append("url", imageUrl);
  formData.append("apikey", apiKey);
  formData.append("language", "eng");
  
  const response = await fetch("https://api.ocr.space/parse/image", {
    method: "POST",
    body: formData,
  });
  
  return await response.json();
}

export const uploadAIInventoryLog = async (req: Request, res: Response) => {
  try {
    // ... existing code to upload to Cloudinary ...
    
    // NEW: Perform OCR on uploaded image
    const ocrResponse = await performOCR(result.secure_url);
    
    let extractedText = "";
    if (isOCRSuccessful(ocrResponse)) {
      extractedText = extractParsedText(ocrResponse);
    }
    
    // Store both image URL and extracted text
    const imageLog = {
      _id: new mongoose.Types.ObjectId().toString(),
      url: result.secure_url,
      extractedText: extractedText, // NEW: Store OCR text
      processedAt: new Date(),
    };
    
    // ... rest of the code ...
  }
};
```

### 2. Update User Schema (Optional)

If you want to store OCR text with images:

```typescript
// src/models/User.ts

export interface IAIImageLog {
  _id: string;
  url: string;
  extractedText?: string;  // NEW
  processedAt?: Date;      // NEW
}
```

### 3. Create OCR Service (Recommended)

```typescript
// src/services/ocrService.ts

import { IOCRResponse, isOCRSuccessful, extractParsedText } from "../types/ocr";

export class OCRService {
  private apiKey: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async processImage(imageUrl: string): Promise<string | null> {
    try {
      const response = await this.performOCR(imageUrl);
      
      if (!isOCRSuccessful(response)) {
        console.error("OCR failed:", response.ParsedResults[0]?.ErrorMessage);
        return null;
      }
      
      return extractParsedText(response);
    } catch (error) {
      console.error("OCR error:", error);
      return null;
    }
  }
  
  private async performOCR(imageUrl: string): Promise<IOCRResponse> {
    const formData = new FormData();
    formData.append("url", imageUrl);
    formData.append("apikey", this.apiKey);
    formData.append("language", "eng");
    formData.append("isOverlayRequired", "false");
    
    const response = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      body: formData,
    });
    
    return await response.json();
  }
  
  parseFoodItems(ocrText: string): Array<{ name: string; quantity?: number }> {
    // Implement custom parsing logic
    const lines = ocrText.split("\n").filter(line => line.trim());
    
    return lines.map(line => ({
      name: line.trim(),
      quantity: this.extractQuantity(line),
    }));
  }
  
  private extractQuantity(text: string): number | undefined {
    const match = text.match(/(\d+\.?\d*)\s*(ml|g|kg|l)/i);
    return match ? parseFloat(match[1]) : undefined;
  }
}
```

### 4. Use in Controller

```typescript
// src/controllers/userController.ts

import { OCRService } from "../services/ocrService";

const ocrService = new OCRService(process.env.OCR_API_KEY || "");

export const uploadAIInventoryLog = async (req: Request, res: Response) => {
  try {
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "ai_inventory_logs",
    });
    
    // Process with OCR
    const extractedText = await ocrService.processImage(result.secure_url);
    
    // Parse food items (optional)
    const foodItems = extractedText 
      ? ocrService.parseFoodItems(extractedText)
      : [];
    
    // Store everything
    const imageLog = {
      _id: new mongoose.Types.ObjectId().toString(),
      url: result.secure_url,
      extractedText,
      parsedItems: foodItems,
    };
    
    // ... save to database ...
    
    return res.status(200).json({
      message: "Image uploaded and processed",
      imageLog,
      extractedText,
      parsedItems: foodItems,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
```

---

## Environment Variables

Add to your `.env` file:

```env
OCR_API_KEY=your_ocr_space_api_key
```

Get your free API key from: https://ocr.space/ocrapi

---

## API Response Example

### Successful Response

```json
{
  "ParsedResults": [
    {
      "TextOverlay": {
        "Lines": [],
        "HasOverlay": false,
        "Message": "Text overlay is not provided"
      },
      "TextOrientation": "0",
      "FileParseExitCode": 1,
      "ParsedText": "Chicken Breast\n500g\nExpires in 3 days",
      "ErrorMessage": "",
      "ErrorDetails": ""
    }
  ],
  "OCRExitCode": 1,
  "IsErroredOnProcessing": false,
  "ProcessingTimeInMilliseconds": "328",
  "SearchablePDFURL": "Searchable PDF not generated"
}
```

### Error Response

```json
{
  "ParsedResults": [
    {
      "FileParseExitCode": 3,
      "ParsedText": "",
      "ErrorMessage": "Unable to parse image",
      "ErrorDetails": "Image resolution too low"
    }
  ],
  "OCRExitCode": 3,
  "IsErroredOnProcessing": true
}
```

---

## Testing

### Test with cURL

```bash
# Upload image and get OCR text
curl -X POST http://localhost:3000/user/ai-inventory-log \
  -H "Cookie: access_token=YOUR_TOKEN" \
  -F "image=@/path/to/food-label.jpg"
```

### Test OCR API directly

```bash
curl -X POST https://api.ocr.space/parse/image \
  -F "apikey=YOUR_API_KEY" \
  -F "url=https://res.cloudinary.com/your-image.jpg" \
  -F "language=eng"
```

---

## Best Practices

1. **Error Handling**: Always check `isOCRSuccessful()` before processing
2. **Caching**: Store OCR results to avoid reprocessing
3. **Rate Limiting**: OCR.space free tier has limits (25,000 requests/month)
4. **Image Quality**: Better quality images = better OCR results
5. **Language**: Specify correct language for better accuracy
6. **Async Processing**: OCR can be slow, consider background jobs

---

## Advanced Features

### Multi-language Support

```typescript
const ocrOptions = {
  language: "eng+ara", // English + Arabic
  detectOrientation: true,
};
```

### Table Detection

```typescript
const ocrOptions = {
  isTable: true,
  OCREngine: 2, // Use engine 2 for table detection
};
```

---

## Next Steps

1. Add OCR processing to AI image upload endpoints
2. Parse extracted text to identify food items
3. Auto-create food items from OCR data
4. Add confidence scores and validation
5. Implement background processing for large images
6. Add user feedback for OCR accuracy

---

## Support

- **OCR.space Documentation**: https://ocr.space/ocrapi
- **OCR.space Support**: support@ocr.space
- **Free API Key**: https://ocr.space/ocrapi/freekey

---

## License

This integration guide is part of your hackathon backend project.

