import { MEDIEVAL_UNIT_TYPES } from '@config/medieval-units';
import type { Faction, UnitClass } from '../types';

let unitIdCounter = 0;

export class MedievalUnit {
    id: number;
    type: string;
    owner: Faction;
    unitClass: UnitClass;

    hp: number;
    maxHp: number;
    attack: number;
    defense: number;
    speed: number;
    range: number;
    color: string;

    constructor(unitType: string, owner: Faction) {
        this.id = ++unitIdCounter;
        this.type = unitType;
        this.owner = owner;
        this.unitClass = 'medieval';

        const stats = MEDIEVAL_UNIT_TYPES[unitType];
        if (!stats) {
            throw new Error(`Unknown medieval unit type: ${unitType}`);
        }

        this.hp = stats.hp;
        this.maxHp = stats.hp;
        this.attack = stats.attack;
        this.defense = stats.defense;
        this.speed = stats.speed;
        this.range = stats.range;
        this.color = stats.color;
    }

    /**
     * Calculate unit strength for AI decision making
     */
    getStrength(): number {
        return Math.floor(this.hp * 0.3 + this.attack * 0.7);
    }

    /**
     * Check if unit is alive
     */
    isAlive(): boolean {
        return this.hp > 0;
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
     * Get HP percentage
     */
    getHpPercent(): number {
        return this.hp / this.maxHp;
    }
}
