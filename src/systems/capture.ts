import { Army } from '@entities/Army';
import { WildPokemon } from '@entities/WildPokemon';
import { PokemonUnit } from '@entities/PokemonUnit';
import type { Resources } from '../types';
import { STARTER_POKEMON, EVOLVED_POKEMON } from '@config/constants';
import { findSpawnLocation } from './map-generator';
import type { Hex } from '@entities/Hex';
import { logCapture } from '@utils/logger';
import { addLog } from '@utils/logger';

/**
 * Attempt to capture a wild Pokemon
 */
export function attemptCapture(
    army: Army,
    wildPokemon: WildPokemon,
    resources: Resources
): { success: boolean; pokemon?: PokemonUnit } {
    // Check if army has space
    if (army.pokemon.length >= army.maxPokemonSlots) {
        addLog('⚠️ Army has no Pokemon slots available!', '#ef4444');
        return { success: false };
    }

    // Check apricorn cost
    if (resources.apricorns < 3) {
        addLog('⚠️ Need 3 apricorns to craft Pokeball!', '#ef4444');
        return { success: false };
    }

    // Deduct apricorns BEFORE capture attempt
    resources.apricorns -= 3;

    // Calculate capture chance based on army strength
    const baseChance = 0.4;
    const strengthBonus = army.getUnitCount() * 0.05;
    const captureChance = Math.min(0.9, baseChance + strengthBonus);

    const success = Math.random() < captureChance;

    if (success) {
        const pokemon = new PokemonUnit(wildPokemon.pokemonId, army.owner);
        army.addPokemon(pokemon);
        wildPokemon.capture();

        logCapture(pokemon.name, true);
        return { success: true, pokemon };
    } else {
        const pokemonName = getPokemonNameById(wildPokemon.pokemonId);
        addLog(`❌ Capture failed! 3 apricorns wasted.`, '#ef4444');
        logCapture(pokemonName, false);
        return { success: false };
    }
}

/**
 * Generate wild Pokemon spawns on the map
 */
export function generateWildPokemon(
    grid: Map<string, Hex>,
    settlements: { q: number; r: number }[]
): WildPokemon[] {
    const wildPokemon: WildPokemon[] = [];
    const count = 8 + Math.floor(Math.random() * 5); // 8-12 wild Pokemon

    for (let i = 0; i < count; i++) {
        const spawnHex = findSpawnLocation(grid, settlements, 3);

        if (!spawnHex) continue;

        // Choose Pokemon rarity based on terrain
        let pokemonPool: readonly number[] = STARTER_POKEMON;
        if (spawnHex.type === 'mountain' || spawnHex.type === 'forest') {
            pokemonPool = Math.random() > 0.5 ? EVOLVED_POKEMON : STARTER_POKEMON;
        }

        const pokemonId = pokemonPool[Math.floor(Math.random() * pokemonPool.length)];
        wildPokemon.push(new WildPokemon(spawnHex.q, spawnHex.r, pokemonId));
    }

    return wildPokemon;
}

/**
 * Check if a wild Pokemon is at a position
 */
export function getWildPokemonAt(
    wildPokemon: WildPokemon[],
    q: number,
    r: number
): WildPokemon | null {
    return wildPokemon.find(wp => wp.q === q && wp.r === r && !wp.captured) || null;
}

/**
 * Get Pokemon name by ID (helper for logging)
 */
function getPokemonNameById(pokemonId: number): string {
    // This is a fallback - in real usage, we'd import POKEMON_DATA
    // but to avoid circular dependencies, we'll use a simple placeholder
    return `Pokemon #${pokemonId}`;
}

/**
 * Check if army can capture at current position
 */
export function canCaptureAtPosition(
    army: Army,
    wildPokemon: WildPokemon[]
): WildPokemon | null {
    const wild = getWildPokemonAt(wildPokemon, army.q, army.r);

    if (!wild) return null;

    if (army.pokemon.length >= army.maxPokemonSlots) {
        return null;
    }

    return wild;
}
