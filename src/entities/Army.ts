import type { HexCoords, Faction } from '../types';
import type { MedievalUnit } from './MedievalUnit';
import type { PokemonUnit } from './PokemonUnit';

export class Army implements HexCoords {
    q: number;
    r: number;
    owner: Faction;

    medievalUnits: MedievalUnit[];
    pokemon: PokemonUnit[];
    maxPokemonSlots: number;

    movesLeft: number;
    maxMoves: number;

    constructor(q: number, r: number, owner: Faction = 'player') {
        this.q = q;
        this.r = r;
        this.owner = owner;

        this.medievalUnits = [];
        this.pokemon = [];
        this.maxPokemonSlots = 3;

        this.movesLeft = 2;
        this.maxMoves = 2;
    }

    /**
     * Add a medieval unit to this army
     */
    addMedievalUnit(unit: MedievalUnit): void {
        this.medievalUnits.push(unit);
    }

    /**
     * Add a Pokemon to this army
     */
    addPokemon(pokemon: PokemonUnit): boolean {
        if (this.pokemon.length < this.maxPokemonSlots) {
            this.pokemon.push(pokemon);
            return true;
        }
        return false; // Army full
    }

    /**
     * Remove a Pokemon from this army
     */
    removePokemon(pokemon: PokemonUnit): void {
        this.pokemon = this.pokemon.filter(p => p !== pokemon);
    }

    /**
     * Remove a medieval unit from this army
     */
    removeMedievalUnit(unit: MedievalUnit): void {
        this.medievalUnits = this.medievalUnits.filter(u => u !== unit);
    }

    /**
     * Get all units (both medieval and Pokemon)
     */
    getAllUnits(): (MedievalUnit | PokemonUnit)[] {
        return [...this.medievalUnits, ...this.pokemon];
    }

    /**
     * Get only alive units
     */
    getAliveUnits(): (MedievalUnit | PokemonUnit)[] {
        return this.getAllUnits().filter(u => u.isAlive());
    }

    /**
     * Get total unit count
     */
    getUnitCount(): number {
        return this.medievalUnits.length + this.pokemon.length;
    }

    /**
     * Get alive unit count
     */
    getAliveUnitCount(): number {
        return this.getAliveUnits().length;
    }

    /**
     * Calculate total army strength
     */
    getTotalStrength(): number {
        return this.getAllUnits().reduce((sum, unit) => sum + unit.getStrength(), 0);
    }

    /**
     * Move army to new position
     */
    moveTo(q: number, r: number): void {
        this.q = q;
        this.r = r;
        this.movesLeft--;
    }

    /**
     * Reset moves for new turn
     */
    resetMoves(): void {
        this.movesLeft = this.maxMoves;
    }

    /**
     * Check if army can move
     */
    canMove(): boolean {
        return this.movesLeft > 0;
    }

    /**
     * Check if army is empty
     */
    isEmpty(): boolean {
        return this.getAliveUnitCount() === 0;
    }

    /**
     * Get army key for position
     */
    getKey(): string {
        return `${this.q},${this.r}`;
    }
}
