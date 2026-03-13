import { POKEMON_DATA } from '@config/pokemon-data';
import type { Faction, UnitClass, PokemonType, PokemonRole } from '../types';

let pokemonIdCounter = 10000; // Start higher to avoid conflicts with medieval units

export class PokemonUnit {
    id: number;
    pokemonId: number;
    owner: Faction;
    unitClass: UnitClass;

    name: string;
    types: PokemonType[];
    hp: number;
    maxHp: number;
    attack: number;
    defense: number;
    speed: number;
    range: number;
    role: PokemonRole;
    abilities: string[];
    spriteId: string;

    abilityCooldowns: Record<string, number>;
    isDead: boolean;
    inHealingQueue: boolean;
    healingTurnsLeft: number;

    level: number;
    statBoosts: {
        hp: number;
        attack: number;
        defense: number;
        speed: number;
    };

    constructor(pokemonId: number, owner: Faction) {
        this.id = ++pokemonIdCounter;
        this.pokemonId = pokemonId;
        this.owner = owner;
        this.unitClass = 'pokemon';

        const data = POKEMON_DATA[pokemonId];
        if (!data) {
            throw new Error(`Unknown Pokemon ID: ${pokemonId}`);
        }

        this.name = data.name;
        this.types = data.types;
        this.hp = data.hp;
        this.maxHp = data.hp;
        this.attack = data.attack;
        this.defense = data.defense;
        this.speed = data.speed;
        this.range = data.range;
        this.role = data.role;
        this.abilities = data.abilities;
        this.spriteId = data.spriteId;

        this.abilityCooldowns = {};
        this.isDead = false;
        this.inHealingQueue = false;
        this.healingTurnsLeft = 0;

        this.level = 1;
        this.statBoosts = {
            hp: 0,
            attack: 0,
            defense: 0,
            speed: 0
        };
    }

    /**
     * Calculate Pokemon strength for AI decision making
     */
    getStrength(): number {
        return Math.floor(this.hp * 0.4 + this.attack * 0.6);
    }

    /**
     * Check if Pokemon is alive and not permanently dead
     */
    isAlive(): boolean {
        return this.hp > 0 && !this.isDead;
    }

    /**
     * Take damage
     */
    takeDamage(amount: number): void {
        this.hp = Math.max(0, this.hp - amount);
    }

    /**
     * Heal damage
     */
    heal(amount: number): void {
        this.hp = Math.min(this.maxHp, this.hp + amount);
    }

    /**
     * Fully heal (Pokemon Center)
     */
    fullyHeal(): void {
        this.hp = this.maxHp;
        this.isDead = false;
        this.inHealingQueue = false;
        this.healingTurnsLeft = 0;
    }

    /**
     * Mark as permanently dead
     */
    markDead(): void {
        this.hp = 0;
        this.isDead = true;
    }

    /**
     * Get HP percentage
     */
    getHpPercent(): number {
        return this.hp / this.maxHp;
    }

    /**
     * Check if ability is ready
     */
    isAbilityReady(abilityName: string): boolean {
        return !this.abilityCooldowns[abilityName] || this.abilityCooldowns[abilityName] <= 0;
    }

    /**
     * Set ability cooldown
     */
    setAbilityCooldown(abilityName: string, frames: number): void {
        this.abilityCooldowns[abilityName] = frames;
    }

    /**
     * Tick down ability cooldowns
     */
    tickCooldowns(): void {
        for (const ability in this.abilityCooldowns) {
            if (this.abilityCooldowns[ability] > 0) {
                this.abilityCooldowns[ability]--;
            }
        }
    }

    /**
     * Apply stat boost from Rare Candy training
     * Returns true if successful, false if already maxed out
     */
    applyStatBoost(stat: 'hp' | 'attack' | 'defense' | 'speed'): boolean {
        if (this.statBoosts[stat] >= 5) {
            return false; // Max 5 boosts per stat
        }

        this.statBoosts[stat]++;
        this.level++;

        const boostPercent = 0.05; // 5% boost per training

        switch (stat) {
            case 'hp':
                this.maxHp *= (1 + boostPercent);
                this.hp = this.maxHp; // Fully heal on training
                break;
            case 'attack':
                this.attack *= (1 + boostPercent);
                break;
            case 'defense':
                this.defense *= (1 + boostPercent);
                break;
            case 'speed':
                this.speed *= (1 + boostPercent);
                break;
        }

        return true;
    }
}
