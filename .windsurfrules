# Windsurf Rules

## Project Context
Building "Artificial Unintelligence," a Next.js + Socket.io party game.

## Critical Constraints
- **Mobile UX**: All buttons min-height 44px. No hover states.
- **Socket Safety**: When editing `server/socket.ts`, always verify the corresponding listener in `src/hooks/useSocket.ts`. Keep events synced.
- **AI Integration**: Use `@google/genai`. Do NOT use `openai` or `google-generative-ai`.
- **Files**:
    - Game Logic: `server/roomManager.ts`
    - Frontend: `src/components/game/*`

## Memories
- We are using Gemini 2.5 Flash for image generation.
- We pass images as Base64 strings.
- The game has 5 states: LOBBY, INSTRUCTION, GENERATING, BATTLE, REVEAL.

## Workflow
- If I ask for a "Refactor," prioritize readability and splitting large components.
- If I ask for "Debug," look for race conditions in the `useEffect` hooks handling socket events.
