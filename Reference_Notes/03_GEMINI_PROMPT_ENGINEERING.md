# Gemini Prompt Engineering Strategy

## Objective
Replicate the "glitchy," "surreal," and "lo-fi" aesthetic of early AI models using modern, high-fidelity models (Gemini 2.5 Flash / Imagen 3).

## The "Unintelligence" Wrapper
We cannot send the user's prompt raw. We must wrap it to induce a specific style.

**User Input:** "A cat eating pizza"

**System Prompt Construction:**
```typescript
const BASE_PROMPT = userPrompt;
const STYLE_MODIFIERS = [
  "digital art style",
  "low fidelity",
  "slightly distorted",
  "vibrant colors",
  "surreal humor",
  "glitch art aesthetic",
  "amateur photoshop style"
].join(", ");

const FINAL_PROMPT = `${BASE_PROMPT}. ${STYLE_MODIFIERS}. Make it look funny and slightly chaotic.`;
```

## Model Configuration
- **Model Name**: `gemini-2.5-flash` (or `imagen-3.0-generate-001`).
- **Aspect Ratio**: `1:1` (Square is best for mobile layouts).
- **Safety Settings**:
    - Set `HARM_CATEGORY_SEXUALLY_EXPLICIT` to `BLOCK_ONLY_HIGH`.
    - Set `HARM_CATEGORY_HATE_SPEECH` to `BLOCK_MEDIUM_AND_ABOVE`.
    - *Reasoning*: Party games often involve "edgy" humor. Strict safety filters will ruin the experience. We rely on the social contract of the private room for moderation.

## Fallback Mechanism
If the API returns a 400 or 500 error (or a strict safety block):
1. Log the error on the server.
2. Return `assets/images/error_robot.png`.
3. Client displays this image. It acts as a "Badge of Honor" for the player (i.e., "Your prompt was too crazy for the AI").
