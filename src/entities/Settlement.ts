import type { HexCoords, Faction, Resources } from '../types';
import type { PokemonUnit } from './PokemonUnit';

interface ProductionQueueItem {
    type: string;
    turnsLeft: number;
    totalTurns: number;
}

interface HealingQueueEntry {
    pokemon: PokemonUnit;
    turnsLeft: number;
}

interface Buildings {
    pokemonCenter: boolean;
    gym: boolean;
    candyFactory: boolean;
}

export class Settlement implements HexCoords {
    q: number;
    r: number;
    owner: Faction;
    name: string;

    productionQueue: ProductionQueueItem[];
    territoryRadius: number;

    buildings: Buildings;
    healingQueue: HealingQueueEntry[];

    constructor(q: number, r: number, owner: Faction, name: string) {
        this.q = q;
        this.r = r;
        this.owner = owner;
        this.name = name;

        this.productionQueue = [];
        this.territoryRadius = 2;

        this.buildings = {
            pokemonCenter: false,
            gym: false,
            candyFactory: false
        };
        this.healingQueue = [];
    }

    /**
     * Add unit to production queue
     */
    addToProductionQueue(unitType: string, turns: number): void {
        this.productionQueue.push({
            type: unitType,
            turnsLeft: turns,
            totalTurns: turns
        });
    }

    /**
     * Process production for one turn
     */
    processProduction(): ProductionQueueItem | null {
        if (this.productionQueue.length === 0) return null;

        const current = this.productionQueue[0];
        current.turnsLeft--;

        if (current.turnsLeft <= 0) {
            this.productionQueue.shift();
            return current;
        }

        return null;
    }

    /**
     * Get current production item
     */
    getCurrentProduction(): ProductionQueueItem | null {
        return this.productionQueue[0] || null;
    }

    /**
     * Build Pokemon Center
     */
    buildPokemonCenter(): boolean {
        if (!this.buildings.pokemonCenter) {
            this.buildings.pokemonCenter = true;
            return true;
        }
        return false;
    }

    /**
     * Build Gym
     */
    buildGym(): boolean {
        if (!this.buildings.gym) {
            this.buildings.gym = true;
            return true;
        }
        return false;
    }

    /**
     * Build Candy Factory
     */
    buildCandyFactory(): boolean {
        if (!this.buildings.candyFactory) {
            this.buildings.candyFactory = true;
            return true;
        }
        return false;
    }

    /**
     * Add Pokemon to healing queue
     */
    addToHealingQueue(pokemon: PokemonUnit, baseTurns: number = 5): void {
        this.healingQueue.push({
            pokemon,
            turnsLeft: baseTurns
        });
        pokemon.inHealingQueue = true;
        pokemon.healingTurnsLeft = baseTurns;
    }

    /**
     * Process healing for one turn
     */
    processHealing(): PokemonUnit[] {
        const healed: PokemonUnit[] = [];

        this.healingQueue = this.healingQueue.filter(entry => {
            entry.turnsLeft--;
            entry.pokemon.healingTurnsLeft = entry.turnsLeft;

            if (entry.turnsLeft <= 0) {
                // Healing complete
                entry.pokemon.fullyHeal();
                healed.push(entry.pokemon);
                return false; // Remove from queue
            }
            return true; // Keep in queue
        });

        return healed;
    }

    /**
     * Cancel all healing (settlement captured/destroyed)
     */
    cancelHealing(): void {
        this.healingQueue.forEach(entry => {
            entry.pokemon.inHealingQueue = false;
            entry.pokemon.healingTurnsLeft = 0;
        });
        this.healingQueue = [];
    }

    /**
     * Calculate resource generation from controlled territory
     */
    calculateResourceGeneration(controlledTiles: number): Resources {
        return {
            food: controlledTiles * 2,
            production: controlledTiles,
            gold: controlledTiles
        };
    }

    /**
     * Get settlement key for position
     */
    getKey(): string {
        return `${this.q},${this.r}`;
    }
}
