import { HEX_SIZE } from '@config/constants';
import type { HexCoords, ScreenCoords } from '../types';

/**
 * Calculate axial distance between two hexes
 */
export function axialDistance(a: HexCoords, b: HexCoords): number {
    return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
}

/**
 * Convert axial coordinates to screen coordinates
 */
export function axialToScreen(q: number, r: number, camera: ScreenCoords): ScreenCoords {
    const x = HEX_SIZE * (3/2 * q) + camera.x;
    const y = HEX_SIZE * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r) + camera.y;
    return { x, y };
}

/**
 * Convert screen coordinates to axial coordinates
 */
export function screenToAxial(screenX: number, screenY: number, camera: ScreenCoords): HexCoords {
    const x = screenX - camera.x;
    const y = screenY - camera.y;

    const q = (2/3 * x) / HEX_SIZE;
    const r = (-1/3 * x + Math.sqrt(3)/3 * y) / HEX_SIZE;

    return axialRound(q, r);
}

/**
 * Round fractional axial coordinates to nearest hex
 */
export function axialRound(q: number, r: number): HexCoords {
    let s = -q - r;

    let rq = Math.round(q);
    let rr = Math.round(r);
    let rs = Math.round(s);

    const qDiff = Math.abs(rq - q);
    const rDiff = Math.abs(rr - r);
    const sDiff = Math.abs(rs - s);

    if (qDiff > rDiff && qDiff > sDiff) {
        rq = -rr - rs;
    } else if (rDiff > sDiff) {
        rr = -rq - rs;
    }

    return { q: rq, r: rr };
}

/**
 * Get all hexes within a given radius
 */
export function getHexesInRadius(center: HexCoords, radius: number): HexCoords[] {
    const results: HexCoords[] = [];

    for (let q = -radius; q <= radius; q++) {
        const r1 = Math.max(-radius, -q - radius);
        const r2 = Math.min(radius, -q + radius);

        for (let r = r1; r <= r2; r++) {
            results.push({ q: center.q + q, r: center.r + r });
        }
    }

    return results;
}

/**
 * Get the 6 neighbors of a hex
 */
export function getNeighbors(q: number, r: number): HexCoords[] {
    const directions = [
        { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
        { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 }
    ];

    return directions.map(d => ({ q: q + d.q, r: r + d.r }));
}

/**
 * Check if a point is inside a hex
 */
export function isPointInHex(point: ScreenCoords, hexCenter: ScreenCoords): boolean {
    const dx = Math.abs(point.x - hexCenter.x);
    const dy = Math.abs(point.y - hexCenter.y);

    return dx <= HEX_SIZE &&
           dy <= HEX_SIZE * Math.sqrt(3) / 2 &&
           HEX_SIZE * Math.sqrt(3) / 2 * dx + HEX_SIZE / 2 * dy <= HEX_SIZE * HEX_SIZE * Math.sqrt(3) / 2;
}
