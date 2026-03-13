import { Hex } from '@entities/Hex';
import { MAP_RADIUS } from '@config/constants';
import type { TerrainType } from '../types';
import { axialDistance } from '@utils/hex-math';

/**
 * Generate the hex grid map
 */
export function generateMap(): Map<string, Hex> {
    const grid = new Map<string, Hex>();

    for (let q = -MAP_RADIUS; q <= MAP_RADIUS; q++) {
        const r1 = Math.max(-MAP_RADIUS, -q - MAP_RADIUS);
        const r2 = Math.min(MAP_RADIUS, -q + MAP_RADIUS);

        for (let r = r1; r <= r2; r++) {
            const hex = new Hex(q, r);
            hex.setTerrain(generateTerrain(q, r));
            grid.set(hex.getKey(), hex);
        }
    }

    return grid;
}

/**
 * Generate terrain type for a hex based on position and noise
 */
function generateTerrain(q: number, r: number): TerrainType {
    const distanceFromCenter = Math.sqrt(q * q + r * r);
    const noise = (Math.sin(q * 0.3) * Math.cos(r * 0.3) + 1) / 2;

    // Water at edges
    if (distanceFromCenter > MAP_RADIUS - 2) {
        return 'water';
    }

    // Clustered terrain generation
    if (noise > 0.75) {
        return 'mountain';
    } else if (noise > 0.65) {
        return 'berry_grove'; // 10% spawn rate (0.65-0.75)
    } else if (noise > 0.55) {
        return 'forest';
    } else if (noise > 0.35) {
        return 'plains';
    } else {
        return 'grass';
    }
}

/**
 * Find a valid spawn location away from other entities
 */
export function findSpawnLocation(
    grid: Map<string, Hex>,
    avoidPositions: { q: number; r: number }[],
    minDistance: number = 3
): Hex | null {
    const attempts = 100;

    for (let i = 0; i < attempts; i++) {
        const q = Math.floor(Math.random() * MAP_RADIUS * 2) - MAP_RADIUS;
        const r = Math.floor(Math.random() * MAP_RADIUS * 2) - MAP_RADIUS;

        const hex = grid.get(`${q},${r}`);
        if (!hex || !hex.isPassable()) continue;

        // Check distance from avoided positions
        const isFarEnough = avoidPositions.every(pos =>
            axialDistance(hex, pos) >= minDistance
        );

        if (isFarEnough) {
            return hex;
        }
    }

    return null;
}

/**
 * Get all hexes within radius of a center point
 */
export function getHexesInRadius(
    grid: Map<string, Hex>,
    center: { q: number; r: number },
    radius: number
): Hex[] {
    const results: Hex[] = [];

    for (let q = -radius; q <= radius; q++) {
        const r1 = Math.max(-radius, -q - radius);
        const r2 = Math.min(radius, -q + radius);

        for (let r = r1; r <= r2; r++) {
            const hex = grid.get(`${center.q + q},${center.r + r}`);
            if (hex) {
                results.push(hex);
            }
        }
    }

    return results;
}
