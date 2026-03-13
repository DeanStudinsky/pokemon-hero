// Core game types
export type Faction = 'player' | 'enemy' | 'none';
export type UnitClass = 'medieval' | 'pokemon';
export type PokemonType = 'fire' | 'water' | 'grass' | 'electric' | 'psychic' | 'fighting' |
                          'dragon' | 'ground' | 'flying' | 'steel' | 'rock' | 'normal' |
                          'ice' | 'dark' | 'fairy' | 'poison' | 'ghost' | 'bug';
export type PokemonRole = 'tank' | 'damage' | 'support' | 'control';
export type AbilityType = 'damage' | 'aoe' | 'buff' | 'heal' | 'control' | 'resurrection';
export type TerrainType = 'grass' | 'plains' | 'forest' | 'mountain' | 'water' | 'berry_grove';

// Coordinates
export interface HexCoords {
    q: number;
    r: number;
}

export interface ScreenCoords {
    x: number;
    y: number;
}

// Resources
export interface Resources {
    food: number;
    production: number;
    gold: number;
    wood: number;
    apricorns: number;
    leppa_berries: number;
    rare_candy: number;
}

export interface Cost {
    prod: number;
    gold: number;
    wood?: number;
    leppa_berries?: number;
}

// Pokemon data structure
export interface PokemonData {
    name: string;
    types: PokemonType[];
    hp: number;
    attack: number;
    defense: number;
    speed: number;
    range: number;
    role: PokemonRole;
    abilities: string[];
    spriteId: string;
}

// Medieval unit data structure
export interface MedievalUnitData {
    hp: number;
    attack: number;
    defense: number;
    speed: number;
    range: number;
    color: string;
    cost: Cost;
}

// Pokemon ability structure
export interface PokemonAbility {
    name: string;
    type: AbilityType;
    cooldown: number;
    effect: (caster: any, target?: any, allies?: any[], enemies?: any[]) => void;
}

// Ability visual effects
export interface AbilityVisual {
    spriteId: string | number;
    tint: string;
    count: number;
    spread?: number;
    orbit?: boolean;
}

// Type effectiveness map
export type TypeEffectivenessMap = {
    [attackType in PokemonType]?: Partial<Record<PokemonType, number>>;
};

// Particle data
export interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    sprite?: HTMLImageElement;
    tint?: string;
    life: number;
    maxLife: number;
    decay: number;
    rotation?: number;
    scale?: number;
    size?: number;
    col?: any; // p5 color object (legacy)
}

// Battle unit (runtime)
export interface BattleUnit {
    id: number;
    unitClass: UnitClass;
    owner: Faction;
    x: number;
    y: number;
    isAttacker: boolean;
    state: 'idle' | 'moving' | 'attacking';
    attackCooldown: number;
    stunned?: boolean;
    stunDuration?: number;
    shielded?: boolean;
    shieldDuration?: number;
    isRevived?: boolean;

    // Medieval unit properties
    type?: string;

    // Pokemon unit properties
    name?: string;
    pokemonId?: number;
    types?: PokemonType[];
    role?: PokemonRole;
    abilities?: string[];
    abilityCooldowns?: Record<string, number>;

    // Stats
    hp: number;
    maxHp: number;
    attack: number;
    defense: number;
    speed: number;
    range: number;
    color?: string;

    // Legacy support
    trainerHp?: number;
    trainerMaxHp?: number;
    trainerAttack?: number;
    pokemonHp?: number;
    pokemonMaxHp?: number;
    pokemonAttack?: number;
    trainerType?: string;
    getTotalHp?: () => number;
    getTotalAttack?: () => number;
}

// Battle projectile
export interface BattleProjectile {
    x: number;
    y: number;
    vx: number;
    vy: number;
    damage: number;
    source: BattleUnit;
    fromAttacker: boolean;
    color: string;
    size: number;
}

// Settlement building
export interface Buildings {
    pokemonCenter: boolean;
}

// Healing queue entry
export interface HealingQueueEntry {
    pokemon: any; // PokemonUnit instance
    turnsLeft: number;
}

// Combat log entry
export interface CombatLogEntry {
    message: string;
    color: string;
    time: number;
}

// Game state structure
export interface GameState {
    // Map
    grid: Map<string, any>; // Hex instances
    camera: ScreenCoords;

    // Entities
    armies: any[]; // Army instances
    settlements: any[]; // Settlement instances
    wildPokemon: any[]; // WildPokemon instances

    // Selection
    selectedArmy: any | null;
    selectedSettlement: any | null;
    hoveredHex: any | null;

    // Battle
    battleMode: boolean;
    battle: {
        attacker: any;
        defender: any;
        units: BattleUnit[];
        projectiles: BattleProjectile[];
        particles: Particle[];
        paused: boolean;
        speed: number;
        frame: number;
    } | null;

    // Resources
    factionResources: {
        player: Resources;
        enemy: Resources;
    };

    // Meta
    turn: number;
    combatLog: CombatLogEntry[];
    particles: Particle[];

    // Assets
    spriteCache: Map<number, any>;
}
