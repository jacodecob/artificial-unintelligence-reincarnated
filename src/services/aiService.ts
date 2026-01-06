import { GoogleGenAI } from "@google/genai";

// Ensure you have GEMINI_API_KEY set in your .env
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const generateImageReal = async (userPrompt: string): Promise<string[]> => {
    if (!ai) {
        console.error("AI Service Error: Missing API Key");
        throw new Error("GEMINI_API_KEY is not set.");
    }

    try {
        // --- STEP 1: PROMPT EXPANSION (Text) ---
        // We use Gemini 2.5 Flash for its speed and "intelligence" to make the prompt funny/weird.
        console.log(`[AI Service] Expanding prompt: "${userPrompt}"`);

        let finalPrompt = userPrompt;

        try {
            const expansionResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [{
                    role: 'user',
                    parts: [{
                        text: `You are a surrealist artist AI. 
                        Rephrase this concept into a short, vivid, and slightly weird image prompt description: "${userPrompt}".
                        Keep it under 40 words. Do not add commentary. Just the description.`
                    }]
                }]
            });

            // Extract text safely
            const expandedText = expansionResponse.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            if (expandedText) {
                finalPrompt = expandedText;
            }
        } catch (textError) {
            console.warn("[AI Service] Prompt expansion failed, using original prompt:", textError);
            // We continue with the original prompt if expansion fails
        }

        // Add the specific style modifiers for the game
        const imagePrompt = `${finalPrompt}, digital art style, low fidelity, surrealist humor, glitch art aesthetics, 4k`;
        console.log(`[AI Service] Generating images with prompt: "${imagePrompt}"`);

        // --- STEP 2: IMAGE GENERATION (Image) ---
        // We use Imagen 3.0 via the generateImages method. 
        // Gemini 2.5 cannot do this step directly.
        const imageResponse = await ai.models.generateImages({
            model: 'imagen-3.0-generate-001',
            prompt: imagePrompt,
            config: {
                numberOfImages: 2, // Ask for 2 images directly
                aspectRatio: '1:1',
                outputMimeType: 'image/jpeg'
            }
        });

        // Extract images from the Imagen response format
        // The SDK returns base64 images in the response.generatedImages array
        if (imageResponse.generatedImages && imageResponse.generatedImages.length > 0) {
            return imageResponse.generatedImages.map(img => {
                const imageBytes = (img as any).image?.imageBytes;
                if (imageBytes) {
                    // Convert Uint8Array or base64 string to data URL
                    const base64 = typeof imageBytes === 'string'
                        ? imageBytes
                        : Buffer.from(imageBytes).toString('base64');
                    return `data:image/jpeg;base64,${base64}`;
                }
                return "/images/error_robot.png";
            });
        }

        throw new Error("No images returned from Imagen API");

    } catch (error: any) {
        console.error("----------------------------------------");
        console.error("[AI Service] CRITICAL ERROR:");
        console.error(error);
        if (error.response) {
            console.error("API Response Details:", JSON.stringify(error.response, null, 2));
        }
        console.error("----------------------------------------");

        // Return the placeholders so the game doesn't crash
        return ["/images/error_robot.png", "/images/error_robot.png"];
    }
};
