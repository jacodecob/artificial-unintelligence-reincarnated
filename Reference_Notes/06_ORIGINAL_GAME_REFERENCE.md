# Original Game Reference

The original code from the "Artificial Unintelligence" game is available for reference in this repository at:
`/Users/jacobnorgord/Downloads/Code/Artificial Unintelligence Reincarnated/OG_Artificial_Unintelligence`

## Key Differences & Improvements


1. **Image Generation**:
   - **Original**: Used Replicate with `bytedance/sdxl-lightning-4step`. Generated TWO images per prompt and let the player select one.
   - **New Version**: We are using **Gemini 2.5 Flash** for iterative prompt expansion (to capture the "unintelligent" vibe) and **Imagen 3.0** for final generation. We've replicated the **Double Image Choice** mechanic to give players more agency over the goofy outcomes.
   
2. **Architecture**:
   - The original game used a monorepo setup with `drizzle-orm`, `socket.io`, and a separate server/client.
   - The new version is built on **Next.js 15+** with **Ably** for realtime communication and **Upstash Redis** for state management, providing a more modern serverless-friendly architecture.

## Improvements Made
- **Prompt Expansion**: Using Gemini 2.5 Flash to take simple user inputs and turn them into surreal, chaotic prompts that modern models can interpret with the right amount of "unintelligence."
- **Multiple Candidates**: Players now see two AI realizations and pick the funniest one to represent them in the battle, keeping the spirit of the original game while utilizing faster, modern generation.

