import { NextResponse } from 'next/server';
import { getRoom, saveRoom } from '@/lib/gameServer';
import { RoomState, Battle, GameState } from '@/types/game';

const INITIAL_TIMER: Record<GameState, number> = {
    LOBBY: 0,
    INSTRUCTION: 15,
    GENERATING: 90,
    BATTLE: 30,
    REVEAL: 10,
    GAME_OVER: 0,
};

export async function POST(
    request: Request,
    { params }: { params: Promise<{ code: string }> }
) {
    const { code } = await params;
    const { action, payload } = await request.json();
    const room = await getRoom(code);

    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

    switch (action) {
        case 'START_GAME':
            await transitionState(room, 'INSTRUCTION');
            break;

        case 'EXPIRE_TIMER':
            await handleTimerExpiry(room);
            break;

        case 'TICK':
            // Manual tick from client to sync state
            if (room.timer > 0) {
                room.timer--;
                // Don't broadcast every tick to save on Ably messages, 
                // only save to redis or just let client handle it.
                // For simplicity, we just save to redis.
                await saveRoom(room);
            }
            break;

        case 'SUBMIT_GENERATION':
            const { playerId, imageUrl, promptId } = payload;
            room.battles.forEach(battle => {
                if (battle.prompt.id === promptId) {
                    if (battle.playerA === playerId) battle.generationA = { playerId, promptId, imageUrl, votes: 0 };
                    if (battle.playerB === playerId) battle.generationB = { playerId, promptId, imageUrl, votes: 0 };
                }
            });

            const allDone = room.battles.every(b => b.generationA && b.generationB);
            if (allDone && room.state === 'GENERATING') {
                await transitionState(room, 'BATTLE');
            } else {
                await saveRoom(room);
            }
            break;

        case 'VOTE':
            const { choice, battleIndex } = payload;
            const battle = room.battles[battleIndex];
            if (choice === 'A') battle.votesA++;
            else battle.votesB++;
            await saveRoom(room);
            break;
    }

    return NextResponse.json({ success: true });
}

async function transitionState(room: RoomState, newState: GameState) {
    room.state = newState;
    room.timer = INITIAL_TIMER[newState];
    room.updatedAt = Date.now();

    if (newState === 'GENERATING') {
        assignPrompts(room);
    }

    if (newState === 'REVEAL') {
        calculateBattleScores(room);
    }

    await saveRoom(room);
}

async function handleTimerExpiry(room: RoomState) {
    switch (room.state) {
        case 'INSTRUCTION':
            await transitionState(room, 'GENERATING');
            break;
        case 'GENERATING':
            // Auto-fill missing
            room.battles.forEach(battle => {
                if (!battle.generationA) {
                    battle.generationA = { playerId: battle.playerA, promptId: battle.prompt.id, imageUrl: '/images/error_robot.png', votes: 0 };
                }
                if (!battle.generationB) {
                    battle.generationB = { playerId: battle.playerB, promptId: battle.prompt.id, imageUrl: '/images/error_robot.png', votes: 0 };
                }
            });
            await transitionState(room, 'BATTLE');
            break;
        case 'BATTLE':
            await transitionState(room, 'REVEAL');
            break;
        case 'REVEAL':
            if (room.currentBattleIndex < room.battles.length - 1) {
                room.currentBattleIndex++;
                await transitionState(room, 'BATTLE');
            } else {
                await transitionState(room, 'GAME_OVER');
            }
            break;
    }
}

function assignPrompts(room: RoomState) {
    const promptTexts = [
        "The creature hidden in IKEA", "A canceled children's toy", "The worst pizza topping",
        "Surreal fashion show", "Cyberpunk farmer", "A dog's fever dream",
        "Intergalactic DMV", "Haunted toaster", "A midlife crisis for a dragon",
        "Viking at a tech support desk", "The ghost of a Victorian child discovering a fidget spinner",
        "Medieval medical procedure performed by pigeons", "Extreme ironing in a volcano",
        "A fancy dinner party attended only by capybaras", "The secret life of garden gnomes",
        "Steampunk underwater city", "A world where everyone is a literal potato",
        "Cat conducting a symphony of meows", "Renaissance painting of a guy eating a Big Mac",
        "Cybernetic Bigfoot", "The DMV (Department of Mythical Vehicles)",
        "A knight in shining armor fighting a Roomba", "Alien abduction but the spaceship is just a giant taco",
        "Samurai pizza delivery"
    ].sort(() => Math.random() - 0.5);

    room.battles = [];
    for (let i = 0; i < room.players.length; i++) {
        const playerA = room.players[i];
        const playerB = room.players[(i + 1) % room.players.length];

        room.battles.push({
            prompt: { id: `p-${i}`, text: promptTexts[i % promptTexts.length] },
            playerA: playerA.id,
            playerB: playerB.id,
            votesA: 0,
            votesB: 0
        });
    }
}

function calculateBattleScores(room: RoomState) {
    const battle = room.battles[room.currentBattleIndex];
    if (!battle) return;

    const winnerId = battle.votesA > battle.votesB ? battle.playerA : battle.playerB;
    const winner = room.players.find(p => p.id === winnerId);
    if (winner) winner.score += 1000;

    const pA = room.players.find(p => p.id === battle.playerA);
    const pB = room.players.find(p => p.id === battle.playerB);
    if (pA) pA.score += battle.votesA * 100;
    if (pB) pB.score += battle.votesB * 100;

    if (battle.votesA === 0 && battle.votesB === 0) {
        if (pA) pA.score += 500;
        if (pB) pB.score += 500;
    }
}
