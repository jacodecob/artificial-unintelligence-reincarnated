import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const generateImageReal = async (userPrompt: string): Promise<string[]> => {
    if (!ai) {
        throw new Error("GEMINI_API_KEY is not set.");
    }

    try {
        // Step 1: Use Gemini 2.5 Flash to expand the prompt for "Artificial Unintelligence" vibes
        console.log("Expanding prompt with Gemini 2.5 Flash...");

        const expansionResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{
                role: 'user',
                parts: [{
                    text: `You are an expert prompt engineer for a goofy AI game called "Artificial Unintelligence".
                    The game's humor comes from AI interpretations being surreal, glitched, and "off".
                    Take this user vibe: "${userPrompt}"
                    Expand it into a very detailed but surreal image prompt (max 400 characters).
                    Use keywords that induce a low-fidelity, amateur, or distorted digital art style.
                    Return ONLY the expanded prompt string, nothing else.`
                }]
            }]
        });

        // Safe extraction of text from the new SDK response structure
        const expandedPromptText = expansionResponse.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || userPrompt;

        const STYLE_MODIFIERS = [
            "digital art style",
            "low fidelity",
            "vibrant but slightly clashing colors",
            "surreal humor",
            "amateur digital collage aesthetic",
            "glitch art textures"
        ].join(", ");

        const FINAL_PROMPT = `${expandedPromptText}. ${STYLE_MODIFIERS}`;
        console.log("Generating candidates with prompt:", FINAL_PROMPT);

        // Step 2: Generate TWO images using Gemini 2.5 Flash Image (Nano Banana)
        // We run these in parallel because the API typically returns one optimal image per request
        // and we want to force two distinct generations for the game mechanic.
        const imagePromises = [1, 2].map(async () => {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: [{
                    role: 'user',
                    parts: [{ text: FINAL_PROMPT }]
                }]
            });

            // Extract the inline image data
            const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);

            if (part && part.inlineData && part.inlineData.data) {
                const mimeType = part.inlineData.mimeType || 'image/png';
                return `data:${mimeType};base64,${part.inlineData.data}`;
            }
            throw new Error("No inline image data found in response");
        });

        // Wait for both to finish
        const results = await Promise.all(imagePromises);

        if (results.length > 0) {
            return results;
        }

        throw new Error("No valid images generated");

    } catch (error: any) {
        console.error("AI Generation Error details:", error);

        // Detailed logging for debugging
        if (error.response) {
            console.error("API Response Error:", JSON.stringify(error.response, null, 2));
        }

        // Return a pair of error images if generation fails so the game doesn't crash
        return ["/images/error_robot.png", "/images/error_robot.png"];
    }
};
