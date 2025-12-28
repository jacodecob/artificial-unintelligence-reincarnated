# System Architecture: Artificial Unintelligence

## 1. Technology Stack
- **Frontend Framework**: Next.js 14 (App Router).
- **Language**: TypeScript (Strict Mode).
- **Styling**: Tailwind CSS.
- **Server**: Node.js Custom Server (Express + Socket.io).
- **AI Integration**: @google/genai SDK.

## 2. Directory Structure
The project must adhere to this structure to ensure Agent navigation consistency:
```text
/artificial-unintelligence
├── /src
│   ├── /app              # Next.js App Router pages
│   ├── /components       # React Components
│   │   ├── /game         # Game-specific components (Lobby, Voting, etc.)
│   │   ├── /ui           # Reusable UI atoms (Buttons, Inputs)
│   ├── /hooks            # Custom hooks (useSocket, useGameState)
│   ├── /lib              # Utilities (Game logic helpers)
│   ├── /services         # API services (Gemini wrapper)
│   └── /types            # TypeScript interfaces
├── /server               # Backend Logic
│   ├── server.ts         # Entry point
│   ├── socket.ts         # Socket.io handler
│   └── roomManager.ts    # Game State Logic class
├── .agent                # Antigravity Config
├── .windsurf             # Windsurf Config
└── package.json
```

## 3. Communication Protocol (WebSocket)
We use a **Server-Authoritative** state synchronization pattern.
- The **Server** holds the "True" state (`RoomState`).
- The **Client** is a "Dumb View." It renders whatever state the server emits.
- **Events**:
    - `CLIENT_JOIN_ROOM` -> `SERVER_PLAYER_JOINED`
    - `CLIENT_SUBMIT_PROMPT` -> `SERVER_PROMPT_ACCEPTED`
    - `SERVER_STATE_UPDATE` (Broadcasts full state delta)

## 4. AI Service Integration
- **File**: `src/services/aiService.ts`
- **SDK**: Use `@google/genai`.
- **Function Signature**: `generateImage(prompt: string): Promise<string>`
- **Output**: Returns a Base64 Data URI string.
- **Safety**: Errors must be caught. If the API blocks a prompt (Safety Filter), return a predefined "CENSORED" placeholder image rather than throwing an error. This preserves the game flow.
