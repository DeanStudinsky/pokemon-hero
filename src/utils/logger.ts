import { useGameStore } from '@core/state';

/**
 * Add a message to the combat log
 */
export function addLog(message: string, color: string = '#ffffff'): void {
    useGameStore.getState().addCombatLog(message, color);
}

/**
 * Clear combat log messages older than 30 seconds
 */
export function clearOldLogs(): void {
    useGameStore.getState().clearOldLogs();
}

/**
 * Log a damage event
 */
export function logDamage(attackerName: string, defenderName: string, damage: number): void {
    addLog(`${attackerName} hits ${defenderName} for ${damage} damage`, '#ef4444');
}

/**
 * Log a healing event
 */
export function logHeal(healerName: string, targetName: string, amount: number): void {
    addLog(`${healerName} healed ${targetName} for ${amount} HP`, '#22c55e');
}

/**
 * Log a status effect
 */
export function logStatus(targetName: string, effect: string, color: string = '#fbbf24'): void {
    addLog(`${targetName} is ${effect}!`, color);
}

/**
 * Log a death
 */
export function logDeath(unitName: string): void {
    addLog(`💀 ${unitName} was defeated!`, '#ef4444');
}

/**
 * Log a capture
 */
export function logCapture(pokemonName: string, success: boolean): void {
    if (success) {
        addLog(`✨ Captured ${pokemonName}!`, '#22c55e');
    } else {
        addLog(`❌ ${pokemonName} escaped!`, '#ef4444');
    }
}

/**
 * Log a turn event
 */
export function logTurn(message: string): void {
    addLog(`🔄 ${message}`, '#60a5fa');
}

/**
 * Log a battle event
 */
export function logBattle(message: string): void {
    addLog(`⚔️ ${message}`, '#ffd700');
}
