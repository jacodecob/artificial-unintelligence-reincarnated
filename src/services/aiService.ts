import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const generateImageReal = async (userPrompt: string): Promise<string> => {
    if (!ai) {
        throw new Error("GEMINI_API_KEY is not set.");
    }

    try {
        const STYLE_MODIFIERS = [
            "digital art style",
            "low fidelity",
            "slightly distorted",
            "vibrant colors",
            "surreal humor",
            "glitch art aesthetic",
            "amateur photoshop style",
            "funny and slightly chaotic"
        ].join(", ");

        const FINAL_PROMPT = `${userPrompt}. ${STYLE_MODIFIERS}.`;

        // Using 'any' for the response to handle potential SDK version discrepancies
        // while adhering to the standard Gemini/Imagen API response structure.
        const response: any = await (ai.models as any).generateImages({
            model: 'imagen-3.0-generate-001',
            prompt: FINAL_PROMPT,
            config: {
                number_of_images: 1,
                aspect_ratio: "1:1"
            }
        });

        if (response.generated_images && response.generated_images.length > 0) {
            const image = response.generated_images[0];
            const bytes = image.image_bytes || image.bytes;
            if (bytes) {
                return `data:image/png;base64,${bytes}`;
            }
        }

        throw new Error("No image data returned from Gemini API");

    } catch (error: any) {
        console.error("AI Generation Error:", error);
        // Safety filter or generic error: return placeholder
        return "/images/error_robot.png";
    }
};
