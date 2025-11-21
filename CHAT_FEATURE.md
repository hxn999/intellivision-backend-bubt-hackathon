# Chat Feature Documentation

## Overview

Users can now have multiple AI chat sessions with conversation history. Each session maintains context across messages using Google Gemini AI.

---

## Data Structure

### User Schema

```typescript
interface IChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface IChatSession {
  _id: string;
  title: string;
  systemInstruction?: string;
  messages: IChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

// In IUser interface:
chatSessions?: IChatSession[];
```

---

## API Endpoints

### 1. GET `/user/chat-sessions`

Get all chat sessions for the authenticated user.

**Authentication:** Required

**Response:** `200 OK`

```json
{
  "chatSessions": [
    {
      "_id": "65abc123...",
      "title": "Nutrition Advice",
      "systemInstruction": "You are a nutrition expert",
      "messages": [
        {
          "role": "user",
          "content": "What are high-protein foods?",
          "timestamp": "2024-01-15T10:30:00.000Z"
        },
        {
          "role": "assistant",
          "content": "Here are some high-protein foods...",
          "timestamp": "2024-01-15T10:30:05.000Z"
        }
      ],
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:05.000Z"
    }
  ]
}
```

---

### 2. POST `/user/chat-sessions`

Create a new chat session.

**Authentication:** Required

**Request Body:**

```json
{
  "title": "Fitness Coach",
  "systemInstruction": "You are a personal fitness trainer" // optional
}
```

**Validation:**

- `title`: string, min 1 character, required
- `systemInstruction`: string, optional

**Response:** `201 Created`

```json
{
  "message": "Chat session created",
  "chatSession": {
    "_id": "65def456...",
    "title": "Fitness Coach",
    "systemInstruction": "You are a personal fitness trainer",
    "messages": [],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 3. GET `/user/chat-sessions/:sessionId`

Get a specific chat session with all messages.

**Authentication:** Required

**URL Parameters:**

- `sessionId`: Chat session ID

**Example:** `GET /user/chat-sessions/65abc123...`

**Response:** `200 OK`

```json
{
  "chatSession": {
    "_id": "65abc123...",
    "title": "Nutrition Advice",
    "messages": [...],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:35:00.000Z"
  }
}
```

**Status Codes:**

- `200 OK`: Session found
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: Session not found

---

### 4. POST `/user/chat-sessions/:sessionId/message`

Send a message in a chat session and get AI response.

**Authentication:** Required

**URL Parameters:**

- `sessionId`: Chat session ID

**Request Body:**

```json
{
  "message": "What exercises should I do for weight loss?"
}
```

**Validation:**

- `message`: string, min 1 character, required

**Response:** `200 OK`

```json
{
  "message": "Message sent",
  "userMessage": {
    "role": "user",
    "content": "What exercises should I do for weight loss?",
    "timestamp": "2024-01-15T10:35:00.000Z"
  },
  "aiMessage": {
    "role": "assistant",
    "content": "For weight loss, I recommend a combination of cardio and strength training...",
    "timestamp": "2024-01-15T10:35:03.000Z"
  },
  "chatSession": {
    "_id": "65abc123...",
    "title": "Fitness Coach",
    "messages": [
      // All messages including new ones
    ],
    "updatedAt": "2024-01-15T10:35:03.000Z"
  }
}
```

**Behavior:**

1. Adds user message to session
2. Builds conversation history from all previous messages
3. Sends to Gemini AI with system instruction (if set)
4. AI response considers full conversation context
5. Adds AI response to session
6. Updates session timestamp
7. Returns both messages and updated session

**Status Codes:**

- `200 OK`: Message sent and response received
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: Session not found
- `500 Internal Server Error`: AI generation failed

---

### 5. DELETE `/user/chat-sessions/:sessionId`

Delete a chat session.

**Authentication:** Required

**URL Parameters:**

- `sessionId`: Chat session ID

**Example:** `DELETE /user/chat-sessions/65abc123...`

**Response:** `200 OK`

```json
{
  "message": "Chat session deleted",
  "deleted": {
    "_id": "65abc123...",
    "title": "Nutrition Advice",
    ...
  }
}
```

**Status Codes:**

- `200 OK`: Session deleted
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: Session not found

---

## Usage Examples

### JavaScript/Fetch

```javascript
// 1. Create a new chat session
const createSession = async () => {
  const response = await fetch("http://localhost:3000/user/chat-sessions", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Health Advice",
      systemInstruction: "You are a health and wellness expert",
    }),
  });

  const data = await response.json();
  return data.chatSession._id;
};

// 2. Send a message
const sendMessage = async (sessionId, message) => {
  const response = await fetch(
    `http://localhost:3000/user/chat-sessions/${sessionId}/message`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    }
  );

  const data = await response.json();
  console.log("User:", data.userMessage.content);
  console.log("AI:", data.aiMessage.content);
  return data;
};

// 3. Get all sessions
const getAllSessions = async () => {
  const response = await fetch("http://localhost:3000/user/chat-sessions", {
    credentials: "include",
  });

  const data = await response.json();
  console.log("Sessions:", data.chatSessions);
};

// Full example
const chatExample = async () => {
  // Create session
  const sessionId = await createSession();

  // Send multiple messages (context is maintained)
  await sendMessage(sessionId, "What are some healthy breakfast options?");
  await sendMessage(sessionId, "Which one has the most protein?");
  await sendMessage(sessionId, "How should I prepare it?");
};
```

### cURL

```bash
# Create session
curl -X POST http://localhost:3000/user/chat-sessions \
  -H "Cookie: access_token=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Workout Plan",
    "systemInstruction": "You are a fitness trainer"
  }'

# Send message
curl -X POST http://localhost:3000/user/chat-sessions/SESSION_ID/message \
  -H "Cookie: access_token=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Create a beginner workout plan"}'

# Get all sessions
curl http://localhost:3000/user/chat-sessions \
  -H "Cookie: access_token=YOUR_TOKEN"

# Delete session
curl -X DELETE http://localhost:3000/user/chat-sessions/SESSION_ID \
  -H "Cookie: access_token=YOUR_TOKEN"
```

---

## Features

### Context Awareness

The AI maintains context across all messages in a session:

```
User: What are high-protein foods?
AI: Chicken, fish, eggs, beans, tofu...

User: Which one is best for weight loss?
AI: (Knows you're asking about protein foods from previous message)

User: How much should I eat daily?
AI: (Remembers the context of weight loss and protein foods)
```

### System Instructions

Set a persona/role for the AI in each session:

```typescript
// Nutrition Expert
systemInstruction: "You are a nutrition expert. Provide evidence-based advice.";

// Fitness Trainer
systemInstruction: "You are a personal trainer. Give motivating workout advice.";

// Meal Planner
systemInstruction: "You are a meal planning assistant. Suggest healthy recipes.";

// General Assistant
systemInstruction: undefined; // Uses default AI behavior
```

---

## Implementation Details

### Conversation History Building

```typescript
// In sendChatMessage controller
const conversationHistory = session.messages
  .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
  .join("\n\n");

const fullPrompt = `${conversationHistory}\n\nAssistant:`;
```

### AI Integration

```typescript
const { GoogleGenAI } = await import("@google/genai");
const ai = new GoogleGenAI({});

const config = session.systemInstruction
  ? { systemInstruction: session.systemInstruction }
  : {};

const aiResponse = await ai.models.generateContent({
  model: "gemini-2.5-flash",
  contents: fullPrompt,
  config: config,
});
```

---

## Use Cases

### 1. Nutrition Consultation

```javascript
const session = await createSession({
  title: "Nutrition Q&A",
  systemInstruction: "You are a registered dietitian",
});

await sendMessage(session._id, "I want to lose 10 pounds");
await sendMessage(session._id, "What should my daily calorie intake be?");
await sendMessage(session._id, "Create a meal plan for me");
```

### 2. Workout Guidance

```javascript
const session = await createSession({
  title: "Fitness Coach",
  systemInstruction: "You are a certified personal trainer",
});

await sendMessage(session._id, "I am a beginner");
await sendMessage(session._id, "Create a 3-day workout plan");
await sendMessage(session._id, "How do I do a proper squat?");
```

### 3. Recipe Suggestions

```javascript
const session = await createSession({
  title: "Recipe Ideas",
  systemInstruction: "You are a creative chef",
});

await sendMessage(session._id, "I have chicken and broccoli");
await sendMessage(session._id, "Make it high protein");
await sendMessage(session._id, "Give me the recipe");
```

---

## Best Practices

### Session Management

1. **Create specific sessions** - One topic per session for better context
2. **Use descriptive titles** - "Weight Loss Plan" not "Chat 1"
3. **Set appropriate system instructions** - Guides AI responses
4. **Delete old sessions** - Keep your chat list clean

### Message Design

1. **Be specific** - "Create a 1500 calorie meal plan" vs "help me"
2. **Build on context** - AI remembers previous messages
3. **Ask follow-ups** - "Can you explain that more?" works great
4. **Reference earlier messages** - "Based on what you said before..."

---

## Limitations

1. **Context Window** - Very long conversations may exceed AI limits
2. **No Editing** - Cannot edit previous messages (delete and recreate session)
3. **No Branching** - Linear conversation only
4. **Rate Limits** - Gemini API has rate limits

---

## Future Enhancements

Potential improvements:

1. **Message Editing** - Edit/regenerate specific messages
2. **Session Sharing** - Share conversations with others
3. **Conversation Export** - Download as PDF/text
4. **Voice Input** - Send voice messages
5. **Image Context** - Send images with messages
6. **Session Templates** - Pre-configured session types
7. **Message Reactions** - Like/dislike responses
8. **Conversation Search** - Search across all messages

---

## Troubleshooting

### AI Response Fails

**Cause:** Gemini API error or rate limit

**Solution:**

- Check GEMINI_API_KEY is set
- Verify API key is valid
- Check rate limits
- Response returns error message

### Session Not Found

**Cause:** Invalid session ID or session was deleted

**Solution:**

- Verify session ID is correct
- Check session exists in GET /chat-sessions
- Create new session if needed

### Context Lost

**Cause:** Session was cleared or recreated

**Solution:**

- Messages are permanent in session
- Don't delete and recreate
- Context builds from all messages in session

---

**Your AI chat feature is ready! Users can now have intelligent conversations with context awareness! 🚀**
