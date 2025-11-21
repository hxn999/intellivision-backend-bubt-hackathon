# AI Inventory Log - Automated Food Item Creation

This feature automatically processes uploaded images to create food items and add them to user inventory using OCR and AI.

## How It Works

1. **User uploads image** → POST `/user/ai-inventory-log`
2. **Image uploaded to Cloudinary** → Stored in `ai_inventory_logs` folder
3. **OCR extracts text** → Using OCR.space API
4. **AI generates food item** → Using Google Gemini AI
5. **Food item created** → Saved to database
6. **Added to inventory** → Automatically added to user's inventory

---

## Setup Requirements

### 1. Environment Variables

Add these to your `.env` file:

```env
# OCR Configuration
OCR_API_KEY=your_ocr_space_api_key

# Gemini AI Configuration
GEMINI_API_KEY=your_google_gemini_api_key

# Cloudinary (should already be configured)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 2. Get API Keys

#### OCR.space API Key
1. Go to https://ocr.space/ocrapi/freekey
2. Register for a free API key
3. Free tier: 25,000 requests/month

#### Google Gemini API Key
1. Go to https://makersuite.google.com/app/apikey
2. Create a new API key
3. Free tier: Available

---

## API Endpoint

### POST `/user/ai-inventory-log`

Upload an image of a food product for automated processing.

**Authentication:** Required

**Content-Type:** `multipart/form-data`

**Request Body:**
- `image`: Image file (JPG, PNG, etc.)

**Response:** `200 OK`

```json
{
  "message": "AI inventory log processed successfully",
  "imageLog": {
    "_id": "65abc123...",
    "url": "https://res.cloudinary.com/..."
  },
  "ai_generated_inventory_logs": [
    {
      "_id": "65abc123...",
      "url": "https://..."
    }
  ],
  "ocrText": "Extracted text from image...",
  "generatedFoodItem": {
    "_id": "65def456...",
    "name": "Chicken Breast",
    "slug": "chicken-breast",
    "calories": 165,
    "protein": 31,
    "carbohydrate": 0,
    "fat_total": 3.6,
    "serving_quantity": 1,
    "serving_unit": "piece",
    "serving_weight_grams": 100,
    "expiration_hours": 48,
    "source": "AI_Generated",
    "created_by": "65xyz789...",
    ...
  },
  "inventory": {
    "_id": "65inv123...",
    "name": "John's Inventory",
    "user": "65xyz789...",
    "foodItems": [
      {
        "_id": "65def456...",
        "name": "Chicken Breast",
        ...
      }
    ]
  }
}
```

---

## Response Scenarios

### 1. Success - Full Processing
```json
{
  "message": "AI inventory log processed successfully",
  "imageLog": {...},
  "ocrText": "...",
  "generatedFoodItem": {...},
  "inventory": {...}
}
```

### 2. Success - No Text Detected
```json
{
  "message": "AI inventory log image uploaded successfully (no text detected)",
  "imageLog": {...},
  "ai_generated_inventory_logs": [...],
  "ocrText": ""
}
```

### 3. Success - AI Parse Failed
```json
{
  "message": "Image uploaded but failed to parse food item",
  "imageLog": {...},
  "ocrText": "...",
  "aiResponse": "...",
  "error": "Failed to parse AI response as JSON"
}
```

### 4. Success - AI Processing Failed
```json
{
  "message": "Image uploaded but AI processing failed",
  "imageLog": {...},
  "error": "OCR_API_KEY not configured"
}
```

---

## Usage Examples

### JavaScript/Fetch

```javascript
const formData = new FormData();
formData.append('image', fileInput.files[0]);

const response = await fetch('http://localhost:3000/user/ai-inventory-log', {
  method: 'POST',
  credentials: 'include',
  body: formData
});

const data = await response.json();

if (data.generatedFoodItem) {
  console.log('Food item created:', data.generatedFoodItem.name);
  console.log('Added to inventory:', data.inventory.foodItems.length, 'items');
} else {
  console.log('Image uploaded, manual processing needed');
}
```

### cURL

```bash
curl -X POST http://localhost:3000/user/ai-inventory-log \
  -H "Cookie: access_token=YOUR_TOKEN" \
  -F "image=@/path/to/food-label.jpg"
```

---

## AI Processing Details

### OCR Text Extraction

The system calls OCR.space API:
```
GET https://api.ocr.space/parse/image?apikey=KEY&url=IMAGE_URL
```

All parsed text from the image is concatenated and passed to AI.

### Gemini AI Food Item Generation

The AI receives a system instruction to generate a JSON object matching the FoodItem schema:

```json
{
  "name": "string",
  "slug": "lowercase-hyphenated-name",
  "description": "optional description",
  "serving_quantity": 1,
  "serving_unit": "piece",
  "serving_weight_grams": 100,
  "metric_serving_amount": 100,
  "metric_serving_unit": "g",
  "calories": 165,
  "protein": 31,
  "carbohydrate": 0,
  "fat_total": 3.6,
  "fiber": 0,
  "sodium": 74,
  "expiration_hours": 48,
  "tags": ["protein", "meat"],
  "allergens": [],
  "source": "AI_Generated"
}
```

The AI:
1. Extracts product name
2. Estimates nutritional values
3. Determines serving sizes
4. Calculates expiration time
5. Identifies allergens and tags

---

## Automatic Inventory Management

After food item creation, the system:

1. **Checks for user inventory**
   - If exists: Uses existing inventory
   - If not: Creates new inventory

2. **Adds food item**
   - Checks if item already in inventory
   - Adds item reference if not present
   - Avoids duplicates

3. **Returns populated inventory**
   - All food items with full details
   - Ready for display

---

## Error Handling

The endpoint is designed to be fault-tolerant:

- **Image upload always succeeds** → Image URL is saved regardless of OCR/AI status
- **OCR failure** → Returns with error message, image still saved
- **AI parse failure** → Returns raw AI response for debugging
- **Inventory creation** → Auto-creates if doesn't exist

This ensures users can:
- Always access uploaded images
- Manually process failed attempts
- Retry or correct AI-generated items

---

## Best Practices

### For Best Results

1. **Image Quality**
   - Clear, well-lit photos
   - Focus on product label
   - Readable text
   - Minimal glare/shadows

2. **Product Labels**
   - Nutrition facts clearly visible
   - Product name readable
   - Serving size information present
   - Expiration date visible

3. **Supported Products**
   - Packaged foods
   - Bottled beverages
   - Canned goods
   - Products with nutrition labels

### Limitations

1. **OCR Accuracy**
   - Depends on image quality
   - May struggle with handwritten text
   - Non-English text requires configuration

2. **AI Estimates**
   - Nutritional values are estimates
   - May not be 100% accurate
   - Should be verified for critical use

3. **Rate Limits**
   - OCR: 25,000 requests/month (free tier)
   - Gemini: Check current limits

---

## Monitoring & Debugging

### Check Logs

All OCR and AI responses are logged:

```javascript
console.log('OCR Text:', ocrText);
console.log('AI Response:', generatedText);
console.log('Parsed Food Item:', foodItemData);
```

### Test Endpoints

```bash
# Test OCR API
curl "https://api.ocr.space/parse/image?apikey=YOUR_KEY&url=IMAGE_URL"

# Test image upload (without AI processing)
# Remove OCR_API_KEY from .env temporarily
```

---

## Future Enhancements

Potential improvements:

1. **Barcode Scanning** - Use barcode APIs for more accurate data
2. **Multi-language OCR** - Support non-English products
3. **Confidence Scores** - Return AI confidence levels
4. **Manual Review** - Flag low-confidence items for review
5. **Batch Processing** - Process multiple images at once
6. **Recipe Extraction** - Extract recipes from cookbook images
7. **Brand Recognition** - Identify brands and fetch verified data

---

## Troubleshooting

### OCR Returns Empty Text

**Cause:** Image quality too low or no text in image

**Solution:**
- Ensure image has readable text
- Improve lighting/focus
- Check image format is supported

### AI Parse Fails

**Cause:** OCR text is unclear or incomplete

**Solution:**
- Check `aiResponse` in error response
- Adjust system instruction if needed
- Manually create food item from partial data

### Food Item Not in Inventory

**Cause:** Inventory creation failed

**Solution:**
- Check user has valid ID
- Ensure FoodInventory model is accessible
- Verify database connection

---

## Testing

### Manual Test Flow

1. Get authenticated (login/register)
2. Upload clear food product image
3. Check response for `generatedFoodItem`
4. Verify item in inventory: `GET /inventories`
5. Check image saved: `GET /user/ai-inventory-logs`

### Test Images

Good test subjects:
- Nutrition labels (back of packages)
- Product boxes with clear text
- Canned goods labels
- Bottled beverages

---

## Production Considerations

Before deploying:

1. ✅ Set strong API keys
2. ✅ Monitor API usage limits
3. ✅ Implement rate limiting
4. ✅ Add image size limits
5. ✅ Enable error notifications
6. ✅ Set up monitoring/analytics
7. ✅ Consider caching OCR results
8. ✅ Implement retry logic

---

## Support

For issues:
- OCR problems → https://ocr.space/
- Gemini AI → https://ai.google.dev/
- Cloudinary → https://cloudinary.com/support

---

**This feature combines cutting-edge OCR and AI to provide automatic food inventory management! 🚀**

