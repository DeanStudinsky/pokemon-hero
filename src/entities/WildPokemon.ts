import type { HexCoords } from '../types';

export class WildPokemon implements HexCoords {
    q: number;
    r: number;
    pokemonId: number;
    discovered: boolean;
    captured: boolean;

    constructor(q: number, r: number, pokemonId: number) {
        this.q = q;
        this.r = r;
        this.pokemonId = pokemonId;
        this.discovered = false;
        this.captured = false;
    }

    /**
     * Mark as discovered (visible through fog of war)
     */
    discover(): void {
        this.discovered = true;
    }

    /**
     * Mark as captured
     */
    capture(): void {
        this.captured = true;
    }

    /**
     * Get wild Pokemon key for position
     */
    getKey(): string {
        return `${this.q},${this.r}`;
    }
}
