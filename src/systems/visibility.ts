import type { Hex } from '@entities/Hex';
import type { Army } from '@entities/Army';
import type { Settlement } from '@entities/Settlement';
import { axialDistance } from '@utils/hex-math';

const ARMY_VISION_RADIUS = 3;
const SETTLEMENT_VISION_RADIUS = 4;

/**
 * Update visibility for all hexes based on player-controlled entities
 */
export function updateVisibility(
    grid: Map<string, Hex>,
    armies: Army[],
    settlements: Settlement[]
): void {
    // Reset all hexes to not visible (but keep explored status)
    grid.forEach(hex => {
        hex.setVisible(false);
    });

    // Reveal hexes around player armies
    armies
        .filter(army => army.owner === 'player')
        .forEach(army => {
            revealAroundPosition(grid, army, ARMY_VISION_RADIUS);
        });

    // Reveal hexes around player settlements
    settlements
        .filter(settlement => settlement.owner === 'player')
        .forEach(settlement => {
            revealAroundPosition(grid, settlement, SETTLEMENT_VISION_RADIUS);
        });
}

/**
 * Reveal hexes in a radius around a position
 */
function revealAroundPosition(
    grid: Map<string, Hex>,
    position: { q: number; r: number },
    radius: number
): void {
    for (let q = -radius; q <= radius; q++) {
        const r1 = Math.max(-radius, -q - radius);
        const r2 = Math.min(radius, -q + radius);

        for (let r = r1; r <= r2; r++) {
            const hex = grid.get(`${position.q + q},${position.r + r}`);
            if (hex && axialDistance(position, hex) <= radius) {
                hex.setVisible(true);
            }
        }
    }
}

/**
 * Check if a position is visible to the player
 */
export function isVisibleToPlayer(
    grid: Map<string, Hex>,
    q: number,
    r: number
): boolean {
    const hex = grid.get(`${q},${r}`);
    return hex ? hex.visible : false;
}

/**
 * Check if a position has been explored by the player
 */
export function isExplored(
    grid: Map<string, Hex>,
    q: number,
    r: number
): boolean {
    const hex = grid.get(`${q},${r}`);
    return hex ? hex.explored : false;
}
