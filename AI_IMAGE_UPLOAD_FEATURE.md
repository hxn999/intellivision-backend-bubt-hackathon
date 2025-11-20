# AI Image Upload Feature

This document describes the new AI-generated image upload endpoints added to the user management system.

## Features Added

### 1. User Schema Updates

Added two new fields to the User model to store AI-generated image URLs:

- `ai_generated_inventory_logs`: Array of strings (image URLs)
- `ai_generated_food_logs`: Array of strings (image URLs)

Both fields default to empty arrays.

### 2. API Endpoints

#### POST `/user/ai-inventory-log`

Upload an AI-generated inventory log image.

**Authentication:** Required

**Content-Type:** `multipart/form-data`

**Request Body (Form Data):**

- `image`: Image file (JPEG, PNG, etc.)

**Response:** `200 OK`

```json
{
  "message": "AI inventory log image uploaded successfully",
  "imageUrl": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/ai_inventory_logs/xyz.jpg",
  "ai_generated_inventory_logs": [
    "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/ai_inventory_logs/xyz.jpg",
    "https://res.cloudinary.com/your-cloud/image/upload/v1234567891/ai_inventory_logs/abc.jpg"
  ]
}
```

**Status Codes:**

- `200 OK`: Image uploaded successfully
- `400 Bad Request`: No image provided
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: User not found
- `500 Internal Server Error`: Server error

**Behavior:**

- Uploads image to Cloudinary in the `ai_inventory_logs` folder
- Appends the image URL to user's `ai_generated_inventory_logs` array
- Returns the new image URL and complete array

---

#### POST `/user/ai-food-log`

Upload an AI-generated food log image.

**Authentication:** Required

**Content-Type:** `multipart/form-data`

**Request Body (Form Data):**

- `image`: Image file (JPEG, PNG, etc.)

**Response:** `200 OK`

```json
{
  "message": "AI food log image uploaded successfully",
  "imageUrl": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/ai_food_logs/xyz.jpg",
  "ai_generated_food_logs": [
    "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/ai_food_logs/xyz.jpg",
    "https://res.cloudinary.com/your-cloud/image/upload/v1234567891/ai_food_logs/abc.jpg"
  ]
}
```

**Status Codes:**

- `200 OK`: Image uploaded successfully
- `400 Bad Request`: No image provided
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: User not found
- `500 Internal Server Error`: Server error

**Behavior:**

- Uploads image to Cloudinary in the `ai_food_logs` folder
- Appends the image URL to user's `ai_generated_food_logs` array
- Returns the new image URL and complete array

---

## Usage Examples

### JavaScript/Fetch

```javascript
// Upload AI Inventory Log Image
const formData = new FormData();
formData.append("image", fileInput.files[0]);

const response = await fetch("http://localhost:3000/user/ai-inventory-log", {
  method: "POST",
  credentials: "include", // Important for cookies
  body: formData,
});

const data = await response.json();
console.log("Uploaded image URL:", data.imageUrl);
console.log("All inventory logs:", data.ai_generated_inventory_logs);
```

### cURL

```bash
# Upload AI Inventory Log
curl -X POST http://localhost:3000/user/ai-inventory-log \
  -H "Cookie: access_token=YOUR_TOKEN" \
  -F "image=@/path/to/image.jpg"

# Upload AI Food Log
curl -X POST http://localhost:3000/user/ai-food-log \
  -H "Cookie: access_token=YOUR_TOKEN" \
  -F "image=@/path/to/image.jpg"
```

### Axios

```javascript
import axios from "axios";

const uploadAIInventoryLog = async (file) => {
  const formData = new FormData();
  formData.append("image", file);

  const response = await axios.post(
    "http://localhost:3000/user/ai-inventory-log",
    formData,
    {
      withCredentials: true,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};
```

---

## Technical Implementation

### Files Modified

1. **`src/models/User.ts`**

   - Added `ai_generated_inventory_logs?: string[]` to IUser interface
   - Added `ai_generated_food_logs?: string[]` to IUser interface
   - Added both fields to UserSchema with default empty arrays

2. **`src/controllers/userController.ts`**

   - Added `uploadAIInventoryLog` controller function
   - Added `uploadAIFoodLog` controller function
   - Both functions handle image upload to Cloudinary
   - Both functions append URLs to respective user arrays

3. **`src/routes/userRouter.ts`**
   - Added POST `/ai-inventory-log` route with multer middleware
   - Added POST `/ai-food-log` route with multer middleware
   - Both routes require authentication

### Cloudinary Configuration

Images are uploaded to separate folders:

- **AI Inventory Logs**: `ai_inventory_logs/`
- **AI Food Logs**: `ai_food_logs/`

This allows for:

- Better organization
- Easier management and cleanup
- Separate image optimization rules if needed

---

## Future Enhancements

These endpoints currently only upload and store images. Future enhancements could include:

1. **AI Processing Integration**

   - Process uploaded images with AI/ML models
   - Extract food items from images
   - Detect inventory items
   - Parse nutritional information

2. **Image Management**

   - Delete specific images from logs
   - Update/replace images
   - Add metadata (date, location, notes)

3. **Analytics**

   - Track upload frequency
   - Image recognition accuracy
   - Auto-populate food logs from images

4. **Validation**
   - Image size limits
   - Format restrictions
   - Duplicate detection

---

## Migration Notes

**No database migration needed** - the new fields have default values and will be automatically added to existing user documents when accessed.

Existing users will have:

```javascript
{
  ai_generated_inventory_logs: [],
  ai_generated_food_logs: []
}
```

---

## Testing

### Manual Testing

1. Register/login to get authenticated
2. Upload inventory log image:
   ```bash
   curl -X POST http://localhost:3000/user/ai-inventory-log \
     -H "Cookie: access_token=YOUR_TOKEN" \
     -F "image=@test_inventory.jpg"
   ```
3. Upload food log image:
   ```bash
   curl -X POST http://localhost:3000/user/ai-food-log \
     -H "Cookie: access_token=YOUR_TOKEN" \
     -F "image=@test_food.jpg"
   ```
4. Verify images are stored in Cloudinary
5. Check user document has image URLs in arrays

### Integration Testing

```javascript
describe("AI Image Upload", () => {
  it("should upload AI inventory log image", async () => {
    const response = await request(app)
      .post("/user/ai-inventory-log")
      .set("Cookie", authCookie)
      .attach("image", "test/fixtures/inventory.jpg");

    expect(response.status).toBe(200);
    expect(response.body.imageUrl).toBeDefined();
    expect(response.body.ai_generated_inventory_logs).toBeInstanceOf(Array);
  });

  it("should upload AI food log image", async () => {
    const response = await request(app)
      .post("/user/ai-food-log")
      .set("Cookie", authCookie)
      .attach("image", "test/fixtures/food.jpg");

    expect(response.status).toBe(200);
    expect(response.body.imageUrl).toBeDefined();
    expect(response.body.ai_generated_food_logs).toBeInstanceOf(Array);
  });
});
```

---

## Security Considerations

- ✅ Authentication required (via authMiddleware)
- ✅ File type validation (handled by multer)
- ✅ Images stored securely in Cloudinary
- ⚠️ Consider adding file size limits
- ⚠️ Consider rate limiting for uploads
- ⚠️ Consider image content validation

---

## Error Handling

All endpoints include comprehensive error handling:

- Missing authentication → 401 Unauthorized
- No image file → 400 Bad Request
- User not found → 404 Not Found
- Cloudinary upload fails → 500 Internal Server Error
- Database save fails → 500 Internal Server Error

Errors are logged to console for debugging.

---

## API Documentation Update

These endpoints should be added to the main README.md API documentation under the User Management section.
