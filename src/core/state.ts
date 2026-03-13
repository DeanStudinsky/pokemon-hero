import { create } from 'zustand';
import type { GameState, BattleUnit, BattleProjectile, Particle, CombatLogEntry, ScreenCoords } from '../types';

interface GameStore extends GameState {
    // Actions
    setCamera: (coords: ScreenCoords) => void;
    moveCamera: (dx: number, dy: number) => void;

    selectArmy: (army: any | null) => void;
    selectSettlement: (settlement: any | null) => void;
    setHoveredHex: (hex: any | null) => void;

    startBattle: (attacker: any, defender: any) => void;
    endBattle: () => void;
    setBattleSpeed: (speed: number) => void;
    toggleBattlePause: () => void;

    addCombatLog: (message: string, color: string) => void;
    clearOldLogs: () => void;

    addParticle: (particle: Particle) => void;
    updateParticles: (deltaTime: number) => void;

    nextTurn: () => void;

    addArmy: (army: any) => void;
    removeArmy: (army: any) => void;

    addSettlement: (settlement: any) => void;

    addWildPokemon: (wildPokemon: any) => void;
    removeWildPokemon: (wildPokemon: any) => void;

    setGrid: (grid: Map<string, any>) => void;
    updateHex: (key: string, hex: any) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
    // Initial state
    grid: new Map(),
    camera: { x: 0, y: 0 },

    armies: [],
    settlements: [],
    wildPokemon: [],

    selectedArmy: null,
    selectedSettlement: null,
    hoveredHex: null,

    battleMode: false,
    battle: null,

    factionResources: {
        player: { food: 100, production: 0, gold: 50, wood: 20, apricorns: 10, leppa_berries: 5, rare_candy: 0 },
        enemy: { food: 100, production: 0, gold: 50, wood: 10, apricorns: 5, leppa_berries: 3, rare_candy: 0 }
    },

    turn: 1,
    combatLog: [],
    particles: [],

    spriteCache: new Map(),

    // Actions
    setCamera: (coords) => set({ camera: coords }),

    moveCamera: (dx, dy) => set((state) => ({
        camera: { x: state.camera.x + dx, y: state.camera.y + dy }
    })),

    selectArmy: (army) => set({ selectedArmy: army, selectedSettlement: null }),

    selectSettlement: (settlement) => set({ selectedSettlement: settlement, selectedArmy: null }),

    setHoveredHex: (hex) => set({ hoveredHex: hex }),

    startBattle: (attacker, defender) => set({
        battleMode: true,
        battle: {
            attacker,
            defender,
            units: [],
            projectiles: [],
            particles: [],
            paused: false,
            speed: 1,
            frame: 0
        }
    }),

    endBattle: () => set({
        battleMode: false,
        battle: null
    }),

    setBattleSpeed: (speed) => set((state) =>
        state.battle ? { battle: { ...state.battle, speed } } : {}
    ),

    toggleBattlePause: () => set((state) =>
        state.battle ? { battle: { ...state.battle, paused: !state.battle.paused } } : {}
    ),

    addCombatLog: (message, color) => set((state) => ({
        combatLog: [
            { message, color, time: Date.now() },
            ...state.combatLog
        ].slice(0, 50) // Keep last 50 messages
    })),

    clearOldLogs: () => set((state) => ({
        combatLog: state.combatLog.filter(log => Date.now() - log.time < 30000)
    })),

    addParticle: (particle) => set((state) => ({
        particles: [...state.particles, particle]
    })),

    updateParticles: (deltaTime) => set((state) => ({
        particles: state.particles
            .map(p => ({
                ...p,
                x: p.x + p.vx * deltaTime,
                y: p.y + p.vy * deltaTime,
                life: p.life - deltaTime
            }))
            .filter(p => p.life > 0)
    })),

    nextTurn: () => set((state) => ({ turn: state.turn + 1 })),

    addArmy: (army) => set((state) => ({
        armies: [...state.armies, army]
    })),

    removeArmy: (army) => set((state) => ({
        armies: state.armies.filter(a => a !== army)
    })),

    addSettlement: (settlement) => set((state) => ({
        settlements: [...state.settlements, settlement]
    })),

    addWildPokemon: (wildPokemon) => set((state) => ({
        wildPokemon: [...state.wildPokemon, wildPokemon]
    })),

    removeWildPokemon: (wildPokemon) => set((state) => ({
        wildPokemon: state.wildPokemon.filter(wp => wp !== wildPokemon)
    })),

    setGrid: (grid) => set({ grid }),

    updateHex: (key, hex) => set((state) => {
        const newGrid = new Map(state.grid);
        newGrid.set(key, hex);
        return { grid: newGrid };
    })
}));
