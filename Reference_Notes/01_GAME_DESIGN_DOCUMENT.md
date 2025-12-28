# Game Design Document: Artificial Unintelligence (Resurrection)

## 1. Executive Summary
"Artificial Unintelligence" is a multiplayer browser-based party game (3-8 players) where players respond to humorous prompts by generating AI images. The goal is to create images that are funny, "unintelligent," or absurdist. The game emphasizes speed, humor, and social interaction over artistic quality.

## 2. Terminology
- **Host**: The player who initiated the game session.
- **Room Code**: A 4-character uppercase alphanumeric string (e.g., "ABCD") used to join the lobby.
- **Prompt**: A scenario provided by the system (e.g., "The worst pizza topping").
- **Generation**: The AI-generated image created by a player.
- **Battle**: A head-to-head comparison of two Generations for the same Prompt.

## 3. Game Loop & State Machine

### Phase 1: The Lobby (STATE_LOBBY)
- **Entry**: Players enter a Nickname and the Room Code.
- **Avatars**: Players select a simple pixel-art avatar.
- **Start Condition**: Host can press "Start Game" once 3 players have joined.
- **Max Players**: 8.

### Phase 2: Instruction (STATE_INSTRUCTION)
- **Duration**: 15 seconds (skippable by Host).
- **Content**: Overlay explaining: "You will be given a prompt. Type a description to generate an image. Try to be funny. The AI is not smart."

### Phase 3: The Prompt & Generation (STATE_GENERATING)
- **Logic**: The system assigns prompts to players. Each prompt is given to exactly two players to ensure a head-to-head battle.
- **Example (4 Players)**:
    - Prompt A -> Player 1 & Player 2
    - Prompt B -> Player 3 & Player 4
    - Prompt C -> Player 1 & Player 3
    - Prompt D -> Player 2 & Player 4
- **Action**:
    - Player types a text description.
    - Player clicks "Generate".
    - **System Action**: Server calls Gemini API. Returns Base64 image.
    - Player views image. Can "Submit" or "Retry" (Max 1 Retry to save time/cost).
- **Time Limit**: 90 Seconds.

### Phase 4: The Battle (STATE_BATTLE)
- **Logic**: The system iterates through the pairs of submitted images.
- **Display**:
    - Top: The Prompt Text.
    - Left: Image A.
    - Right: Image B.
- **Action**: Spectators (players not involved in the current battle) vote for their favorite.
- **Time Limit**: 15 Seconds per battle.

### Phase 5: The Reveal (STATE_REVEAL)
- **Display**:
    - Winner is highlighted.
    - Percentage of votes shown (e.g., "60% vs 40%").
    - Player names revealed (e.g., "Player 1 generated this").
- **Scoring**:
    - +1000 Points for winning the battle.
    - +100 Points for every vote received.
    - +500 Points "Pity Bonus" if you get 0 votes (optional, for humor).

### Phase 6: Game Over (STATE_GAME_OVER)
- **Display**: Leaderboard ranking players by score.
- **Actions**: "Play Again" (same players, new prompts) or "New Game" (kick to lobby).

## 4. Technical Constraints
- **Mobile First**: UI controls must be large and accessible on smartphones.
- **Latency**: Image generation must happen under 5 seconds.
- **Disconnection**: If a player disconnects, their submissions remain. If they reconnect, they rejoin the session via session ID or cookie.
