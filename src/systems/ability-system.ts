import { createAbilities, ABILITY_VISUALS } from '@config/abilities';
import type { PokemonAbility, BattleUnit, AbilityVisual } from '../types';
import { addLog } from '@utils/logger';

// Ability registry - initialized with dependency injection
let ABILITIES: Record<string, PokemonAbility> = {};

/**
 * Initialize the ability system with required dependencies
 */
export function initAbilitySystem(
    applyDamage: Function,
    spawnParticles: Function
): void {
    ABILITIES = createAbilities(applyDamage, spawnParticles, addLog);
}

/**
 * Use an ability in battle
 */
export function useAbility(
    caster: BattleUnit,
    abilityName: string,
    target: BattleUnit | null,
    allies: BattleUnit[],
    enemies: BattleUnit[]
): boolean {
    const ability = ABILITIES[abilityName];
    if (!ability) {
        console.warn(`Unknown ability: ${abilityName}`);
        return false;
    }

    // Check if Pokemon has this ability
    if (!caster.abilities?.includes(abilityName)) {
        return false;
    }

    // Check cooldown
    if (!caster.abilityCooldowns) {
        caster.abilityCooldowns = {};
    }

    const currentCooldown = caster.abilityCooldowns[abilityName] || 0;
    if (currentCooldown > 0) {
        return false; // Ability on cooldown
    }

    // Execute ability effect
    try {
        ability.effect(caster, target, allies, enemies);

        // Set cooldown
        caster.abilityCooldowns[abilityName] = ability.cooldown;

        // Spawn visual particles
        spawnAbilityVisual(caster, abilityName);

        return true;
    } catch (error) {
        console.error(`Error executing ability ${abilityName}:`, error);
        return false;
    }
}

/**
 * Spawn visual particles for an ability
 */
function spawnAbilityVisual(caster: BattleUnit, abilityName: string): void {
    const visual = ABILITY_VISUALS[abilityName];
    if (!visual) return;

    // This will be implemented by the particle system
    // For now, just log it
    console.log(`Spawning ${abilityName} visual at (${caster.x}, ${caster.y})`);
}

/**
 * Tick down ability cooldowns for a battle unit
 */
export function tickAbilityCooldowns(unit: BattleUnit): void {
    if (!unit.abilityCooldowns) return;

    for (const abilityName in unit.abilityCooldowns) {
        if (unit.abilityCooldowns[abilityName] > 0) {
            unit.abilityCooldowns[abilityName]--;
        }
    }
}

/**
 * Get ability info
 */
export function getAbilityInfo(abilityName: string): PokemonAbility | null {
    return ABILITIES[abilityName] || null;
}

/**
 * Check if ability is ready
 */
export function isAbilityReady(unit: BattleUnit, abilityName: string): boolean {
    if (!unit.abilityCooldowns) return true;
    const cooldown = unit.abilityCooldowns[abilityName] || 0;
    return cooldown <= 0;
}

/**
 * Get ability visual info
 */
export function getAbilityVisual(abilityName: string): AbilityVisual | null {
    return ABILITY_VISUALS[abilityName] || null;
}
