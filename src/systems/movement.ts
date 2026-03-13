import type { Army } from '@entities/Army';
import type { Hex } from '@entities/Hex';
import { axialDistance, getNeighbors } from '@utils/hex-math';

/**
 * Check if an army can move to a target hex
 */
export function canArmyMoveTo(
    army: Army,
    targetHex: Hex,
    grid: Map<string, Hex>,
    otherArmies: Army[]
): boolean {
    // Check if army has moves left
    if (!army.canMove()) return false;

    // Check if target is passable
    if (!targetHex.isPassable()) return false;

    // Check if target is adjacent
    const distance = axialDistance(army, targetHex);
    if (distance !== 1) return false;

    // Check if target is occupied by friendly army
    const occupyingArmy = otherArmies.find(
        a => a !== army && a.q === targetHex.q && a.r === targetHex.r
    );

    if (occupyingArmy && occupyingArmy.owner === army.owner) {
        return false; // Can't stack friendly armies
    }

    return true;
}

/**
 * Move an army to a target position
 */
export function moveArmy(
    army: Army,
    targetQ: number,
    targetR: number
): void {
    army.moveTo(targetQ, targetR);
}

/**
 * Get all valid move positions for an army
 */
export function getValidMoves(
    army: Army,
    grid: Map<string, Hex>,
    otherArmies: Army[]
): Hex[] {
    if (!army.canMove()) return [];

    const neighbors = getNeighbors(army.q, army.r);
    const validMoves: Hex[] = [];

    for (const neighbor of neighbors) {
        const hex = grid.get(`${neighbor.q},${neighbor.r}`);
        if (hex && canArmyMoveTo(army, hex, grid, otherArmies)) {
            validMoves.push(hex);
        }
    }

    return validMoves;
}

/**
 * Check if there's an enemy army at position
 */
export function getArmyAtPosition(
    armies: Army[],
    q: number,
    r: number
): Army | null {
    return armies.find(a => a.q === q && a.r === r) || null;
}

/**
 * Check if moving to position would trigger battle
 */
export function wouldTriggerBattle(
    army: Army,
    targetQ: number,
    targetR: number,
    otherArmies: Army[]
): Army | null {
    const targetArmy = getArmyAtPosition(otherArmies, targetQ, targetR);

    if (targetArmy && targetArmy.owner !== army.owner) {
        return targetArmy;
    }

    return null;
}
