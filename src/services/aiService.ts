import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;


export const generateImageReal = async (userPrompt: string): Promise<string[]> => {
    if (!ai) {
        throw new Error("GEMINI_API_KEY is not set.");
    }

    try {
        // Step 1: Use Gemini 2.5 Flash to expand the prompt for maximum "Artificial Unintelligence" goofy vibes
        // This makes the modern models act more like the "antiquated" models from the OG game
        console.log("Expanding prompt with Gemini 2.5 Flash...");
        const promptExpansion = await (ai.models as any).generateContent({
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


        const expandedPromptText = typeof (promptExpansion as any).text === 'function'
            ? (promptExpansion as any).text()
            : (promptExpansion.candidates?.[0]?.content?.parts?.[0]?.text ||
                promptExpansion.content?.parts?.[0]?.text ||
                userPrompt);


        const STYLE_MODIFIERS = [
            "digital art style",
            "low fidelity",
            "vibrant but slightly clashing colors",
            "surreal humor",
            "funny and slightly chaotic",
            "amateur digital collage aesthetic",
            "glitch art textures"
        ].join(", ");

        const FINAL_PROMPT = `${expandedPromptText}. ${STYLE_MODIFIERS}.`;

        console.log("Generating 2 candidates with prompt:", FINAL_PROMPT);

        // Step 2: Generate TWO images like the original game
        const response: any = await (ai.models as any).generateImages({
            model: 'imagen-3.0-generate-001',
            prompt: FINAL_PROMPT,
            config: {
                numberOfImages: 2, // We generate two images for the player to choose from
                aspectRatio: "1:1",
                safetySettings: [
                    { category: 'HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
                    { category: 'DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
                    { category: 'HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
                    { category: 'SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' }
                ]
            }
        });

        const generatedImages = response.generatedImages || response.generated_images;

        if (generatedImages && generatedImages.length > 0) {
            const results: string[] = [];
            for (const image of generatedImages) {
                const bytes = image.imageBytes || image.image_bytes || image.bytes;
                if (bytes) {
                    if (typeof bytes === 'string' && bytes.startsWith('data:')) {
                        results.push(bytes);
                    } else {
                        results.push(`data:image/png;base64,${bytes}`);
                    }
                }
            }
            if (results.length > 0) return results;
        }

        throw new Error("No image data returned from Gemini API");

    } catch (error: any) {
        console.error("AI Generation Error details:", error);

        const errorMsg = error.message || "";
        if (errorMsg.includes("billed users") || errorMsg.includes("not found")) {
            console.warn("Imagen API access issue. Please ensure billing is enabled.");
        }

        // Return a pair of error images if generation fails
        return ["/images/error_robot.png", "/images/error_robot.png"];
    }
};
