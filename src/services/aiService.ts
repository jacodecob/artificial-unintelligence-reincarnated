import { GoogleGenAI } from "@google/genai";

// Ensure you have GEMINI_API_KEY set in your .env
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Model for image generation (Nano Banana)
const IMAGE_MODEL = 'gemini-2.5-flash-image-preview';
// Backup model if primary fails
const IMAGE_MODEL_BACKUP = 'gemini-2.0-flash-exp-image-generation';

/**
 * Generate a single image using Gemini's native image generation
 * Uses the user's EXACT prompt - no AI modification
 */
async function generateSingleImage(prompt: string, attempt: number = 1): Promise<string | null> {
    if (!ai) return null;

    const model = attempt === 1 ? IMAGE_MODEL : IMAGE_MODEL_BACKUP;
    console.log(`[AI Service] Attempt ${attempt}: Generating image with model ${model}`);

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });

        // Parse the response - look for image data in parts
        const parts = response.candidates?.[0]?.content?.parts || [];

        for (const part of parts) {
            // Check for inlineData (image)
            const inlineData = (part as any).inlineData;
            if (inlineData?.data) {
                const mimeType = inlineData.mimeType || 'image/png';
                console.log(`[AI Service] ✅ Image generated successfully (${mimeType})`);
                return `data:${mimeType};base64,${inlineData.data}`;
            }
        }

        console.warn(`[AI Service] ⚠️ No image found in response. Parts received:`,
            parts.map((p: any) => Object.keys(p)));
        return null;

    } catch (error: any) {
        console.error(`[AI Service] ❌ Model ${model} failed:`, error.message || error);

        // If this was the first attempt and it failed, try backup model
        if (attempt === 1) {
            console.log(`[AI Service] Trying backup model...`);
            return generateSingleImage(prompt, 2);
        }

        return null;
    }
}

/**
 * Main image generation function - generates 2 distinct images
 * Uses the user's EXACT prompt for full artistic control
 */
export const generateImageReal = async (userPrompt: string): Promise<string[]> => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`[AI Service] 🎨 Starting image generation`);
    console.log(`[AI Service] User prompt (EXACT): "${userPrompt}"`);
    console.log(`${'='.repeat(60)}`);

    if (!ai) {
        console.error("[AI Service] ❌ CRITICAL: Missing API Key");
        throw new Error("GEMINI_API_KEY is not set.");
    }

    try {
        // Use the user's EXACT prompt - no modification, no style additions
        // This gives users full artistic control over their creations
        const imagePrompt = userPrompt;

        console.log(`[AI Service] 🖼️ Generating 2 images with user's exact prompt...`);

        // Generate two images in parallel for variety
        // Each uses the exact same prompt - AI will create natural variation
        const [image1, image2] = await Promise.all([
            generateSingleImage(imagePrompt),
            generateSingleImage(imagePrompt)
        ]);

        const results: string[] = [];

        if (image1) {
            results.push(image1);
            console.log(`[AI Service] ✅ Image 1: Generated (${image1.length} chars)`);
        } else {
            console.error(`[AI Service] ❌ Image 1: FAILED`);
        }

        if (image2) {
            results.push(image2);
            console.log(`[AI Service] ✅ Image 2: Generated (${image2.length} chars)`);
        } else {
            console.error(`[AI Service] ❌ Image 2: FAILED`);
        }

        // If we got at least one image, return what we have
        if (results.length > 0) {
            // If only one succeeded, duplicate it
            if (results.length === 1) {
                console.log(`[AI Service] ⚠️ Only 1 image generated, duplicating`);
                results.push(results[0]);
            }

            console.log(`[AI Service] 🎉 Generation complete: ${results.length} images`);
            console.log(`${'='.repeat(60)}\n`);
            return results;
        }

        // Both failed
        throw new Error("Both image generation attempts failed");

    } catch (error: any) {
        console.error(`\n${'!'.repeat(60)}`);
        console.error(`[AI Service] ❌ GENERATION FAILED`);
        console.error(`[AI Service] Error: ${error.message || error}`);
        console.error(`[AI Service] Stack: ${error.stack || 'No stack trace'}`);
        console.error(`${'!'.repeat(60)}\n`);

        // Return placeholder error images
        const failedImageSvg = `data:image/svg+xml;base64,${Buffer.from(`
            <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg" style="background:#18181b">
                <text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="24" fill="#ef4444">
                    GENERATION FAILED
                </text>
                <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="14" fill="#52525b">
                    ${error.message?.substring(0, 40) || 'Unknown error'}
                </text>
                <text x="50%" y="65%" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="12" fill="#3f3f46">
                    Try again later
                </text>
            </svg>
        `).toString('base64')}`;

        return [failedImageSvg, failedImageSvg];
    }
};
