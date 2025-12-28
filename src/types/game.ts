export type GameState = 'LOBBY' | 'INSTRUCTION' | 'GENERATING' | 'BATTLE' | 'REVEAL' | 'GAME_OVER';

export interface Player {
    id: string;
    nickname: string;
    avatar: string;
    score: number;
    isHost: boolean;
    isReady: boolean;
}

export interface Prompt {
    id: string;
    text: string;
}

export interface Generation {
    playerId: string;
    promptId: string;
    imageUrl: string; // Base64
    votes: number;
}

export interface Battle {
    prompt: Prompt;
    playerA: string; // id
    playerB: string; // id
    generationA?: Generation;
    generationB?: Generation;
    votesA: number;
    votesB: number;
}

export interface RoomState {
    roomCode: string;
    state: GameState;
    players: Player[];
    prompts: Prompt[];
    battles: Battle[];
    currentBattleIndex: number;
    timer: number;
    updatedAt: number;
}

export interface GameSocket {
    emit: (event: string, payload: any) => void;
    on: (event: string, callback: Function) => void;
    off: (event: string, callback: Function) => void;
}

export interface Message {
    type: string;
    payload: any;
}

// Socket/Ably Event Names
export const CLIENT_EVENTS = {
    JOIN_ROOM: 'CLIENT_JOIN_ROOM',
    START_GAME: 'CLIENT_START_GAME',
    SUBMIT_PROMPT: 'CLIENT_SUBMIT_PROMPT',
    GENERATE_IMAGE: 'CLIENT_GENERATE_IMAGE',
    SUBMIT_GENERATION: 'CLIENT_SUBMIT_GENERATION',
    VOTE: 'CLIENT_VOTE',
};

export const SERVER_EVENTS = {
    ROOM_STATE_UPDATE: 'SERVER_STATE_UPDATE',
    IMAGE_GENERATED: 'SERVER_IMAGE_GENERATED',
    ERROR: 'SERVER_ERROR',
};
