import { NextResponse } from 'next/server';
import { getRoom, saveRoom, updateRoom } from '@/lib/gameServer';
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

    try {
        await updateRoom(code, async (room: RoomState) => {
            switch (action) {
                case 'START_GAME':
                    await transitionState(room, 'INSTRUCTION', false);
                    break;

                case 'SKIP_TIMER':
                    console.log(`[Action Route] Skiping timer for room ${code} (Current State: ${room.state})`);
                    await handleTimerExpiry(room);
                    break;

                case 'EXPIRE_TIMER':
                    const intendedState = payload?.state;
                    if (intendedState && intendedState !== room.state) {
                        console.log(`[Action Route] Ignoring EXPIRE_TIMER for ${intendedState} because room is already in ${room.state}`);
                        break;
                    }
                    await handleTimerExpiry(room);
                    break;

                case 'SUBMIT_GENERATION':
                    const { playerId, imageUrl, promptId } = payload;
                    room.battles.forEach(battle => {
                        if (battle.prompt.id === promptId) {
                            if (battle.playerA === playerId) battle.generationA = { playerId, promptId, imageUrl, votes: 0 };
                            if (battle.playerB === playerId) battle.generationB = { playerId, promptId, imageUrl, votes: 0 };
                        }
                    });

                    const allDone = room.battles.length > 0 && room.battles.every(b => b.generationA && b.generationB);
                    if (allDone && room.state === 'GENERATING') {
                        console.log(`[Action Route] All generations submitted for room ${code}. Transitioning to BATTLE.`);
                        await transitionState(room, 'BATTLE', false);
                    }
                    break;

                case 'VOTE':
                    const { choice, battleIndex, voterId } = payload;
                    const battle = room.battles[battleIndex];
                    if (battle) {
                        // Initialize voterIds if needed
                        if (!battle.voterIds) battle.voterIds = [];

                        // Prevent double voting
                        if (battle.voterIds.includes(voterId)) {
                            console.log(`[Action Route] Player ${voterId} already voted in battle ${battleIndex}`);
                            break;
                        }

                        // Record vote
                        if (choice === 'A') battle.votesA++;
                        else battle.votesB++;
                        battle.voterIds.push(voterId);

                        // Check if all eligible voters have voted
                        // Eligible = all players except the two in this battle
                        const eligibleVoters = room.players.filter(
                            p => p.id !== battle.playerA && p.id !== battle.playerB
                        );
                        const allVotesIn = eligibleVoters.every(p => battle.voterIds.includes(p.id));

                        if (allVotesIn && room.state === 'BATTLE') {
                            console.log(`[Action Route] All ${eligibleVoters.length} votes in for battle ${battleIndex}. Auto-advancing to REVEAL.`);
                            await transitionState(room, 'REVEAL', false);
                        }
                    }
                    break;
            }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error(`[Action Route] Error processing action ${action}:`, error);
        return NextResponse.json({ error: error.message || 'Action failed' }, { status: 400 });
    }
}


async function transitionState(room: RoomState, newState: GameState, save = true) {
    room.state = newState;
    room.timer = INITIAL_TIMER[newState];
    room.updatedAt = Date.now();

    if (newState === 'GENERATING') {
        assignPrompts(room);
    }

    if (newState === 'REVEAL') {
        calculateBattleScores(room);
    }

    if (save) {
        await saveRoom(room);
    }
}

async function handleTimerExpiry(room: RoomState) {
    switch (room.state) {
        case 'INSTRUCTION':
            await transitionState(room, 'GENERATING', false);
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
            await transitionState(room, 'BATTLE', false);
            break;
        case 'BATTLE':
            await transitionState(room, 'REVEAL', false);
            break;
        case 'REVEAL':
            if (room.currentBattleIndex < room.battles.length - 1) {
                // More battles in this round
                room.currentBattleIndex++;
                await transitionState(room, 'BATTLE', false);
            } else {
                // All battles in this round are done
                // Check if there are more rounds
                const totalRounds = room.totalRounds || 3;
                const currentRound = room.currentRound || 1;

                if (currentRound < totalRounds) {
                    // Start next round
                    room.currentRound = currentRound + 1;
                    room.currentBattleIndex = 0;
                    console.log(`[Action Route] Round ${currentRound} complete. Starting round ${room.currentRound}/${totalRounds}`);
                    await transitionState(room, 'INSTRUCTION', false);
                } else {
                    // Game over - all rounds complete
                    console.log(`[Action Route] All ${totalRounds} rounds complete. Game over!`);
                    await transitionState(room, 'GAME_OVER', false);
                }
            }
            break;
    }
}


function assignPrompts(room: RoomState) {
    // Fresh, open-ended prompts - inspired by OG game style but all new
    // Fresh, simpler, and funnier prompts for better accessibility
    const promptTexts = [
        "A suspicious looking potato",
        "The Queen of England breakdancing",
        "A cat running for president",
        "An alien trying to order pizza",
        "A depressed toaster",
        "The awkward silence at a dinner party",
        "A ghost who is bad at haunting",
        "A superhero whose power is mild inconvenience",
        "The worst birthday party ever",
        "A hamster leading a revolution",
        "A banana slipping on a person",
        "A fish riding a bicycle",
        "A very confused penguin",
        "A snowman in a sauna",
        "A slightly threatening cloud",
        "The definition of boredom",
        "A karaoke night gone wrong",
        "A ninja failing stealth mode",
        "A dragon who hoards socks",
        "A vampire at a beach party",
        "A robot trying to drink water",
        "A wizard who only knows one spell",
        "A zombie on a diet",
        "A skeleton trying to look cool",
        "A werewolf at the groomers",
        "A pigeon planning world domination",
        "The most expensive mistake ever",
        "A really bad disguise",
        "A time traveler confused by a smartphone",
        "A medieval knight at a drive-thru"
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
            votesB: 0,
            voterIds: []
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
