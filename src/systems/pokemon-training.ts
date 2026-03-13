import type { PokemonUnit } from '@entities/PokemonUnit';
import type { Settlement } from '@entities/Settlement';
import type { Resources } from '../types';
import { addLog } from '@utils/logger';

/**
 * Train Pokemon with Rare Candy at Gym
 * Applies a 5% stat boost to the chosen stat
 */
export function trainPokemon(
    pokemon: PokemonUnit,
    stat: 'hp' | 'attack' | 'defense' | 'speed',
    settlement: Settlement,
    resources: Resources
): boolean {
    // Check gym exists
    if (!settlement.buildings.gym) {
        addLog('⚠️ Need a Gym to train Pokemon!', '#ef4444');
        return false;
    }

    // Check rare candy
    if (resources.rare_candy < 1) {
        addLog('⚠️ Need 1 Rare Candy to train!', '#ef4444');
        return false;
    }

    // Apply stat boost
    const success = pokemon.applyStatBoost(stat);

    if (!success) {
        addLog(`⚠️ ${pokemon.name}'s ${stat.toUpperCase()} is already maxed out (5 boosts max)!`, '#ef4444');
        return false;
    }

    resources.rare_candy -= 1;
    const statDisplay = stat.toUpperCase();
    addLog(`⭐ ${pokemon.name} trained ${statDisplay}! Now level ${pokemon.level}`, '#ffd700');
    return true;
}

/**
 * Convert gold to rare candy at settlement
 * Ratio: 5 gold → 1 rare candy
 */
export function convertGoldToCandy(
    resources: Resources,
    amount: number = 1
): boolean {
    const goldCost = 5;
    const totalCost = goldCost * amount;

    if (resources.gold < totalCost) {
        addLog(`⚠️ Need ${totalCost} gold to craft ${amount} Rare Candy!`, '#ef4444');
        return false;
    }

    resources.gold -= totalCost;
    resources.rare_candy += amount;
    addLog(`🍬 Crafted ${amount} Rare Candy from ${totalCost} gold!`, '#22c55e');
    return true;
}
