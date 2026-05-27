/**
 * Hex Tile Cache - Pre-renders hex-clipped terrain tiles for clean visuals
 *
 * Instead of drawing square 64x64 tiles onto a hex grid (causing gaps and overlap),
 * we clip each terrain tile to the hex shape once and cache the result.
 * Each frame just blits the cached hex-shaped image.
 */

import { TILE_ATLAS } from '@config/tile-atlas';
import { HEX_SIZE, THEME } from '@config/constants';
import { getTilesheet } from './asset-manager';

// Flat-top hex geometry
const PAD = 1; // Slight oversize to eliminate subpixel gaps between hexes
const CLIP_SIZE = HEX_SIZE + PAD;
export const HEX_TILE_W = Math.ceil(2 * CLIP_SIZE);            // ~66
export const HEX_TILE_H = Math.ceil(Math.sqrt(3) * CLIP_SIZE); // ~58
const CX = HEX_TILE_W / 2;
const CY = HEX_TILE_H / 2;

interface CachedVariant {
    normal: HTMLCanvasElement;
    fog: HTMLCanvasElement;
}

const cache = new Map<string, CachedVariant[]>();
let unexploredTile: HTMLCanvasElement | null = null;

/**
 * Draw a flat-top hex path centered at (cx, cy) with given radius
 */
function hexPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const hx = cx + size * Math.cos(angle);
        const hy = cy + size * Math.sin(angle);
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
}

/**
 * Render a single hex-clipped terrain tile to an offscreen canvas
 */
function renderOneHexTile(
    tilesheet: HTMLImageElement,
    sx: number,
    sy: number,
    sw: number,
    sh: number,
    fogOverlay: boolean
): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = HEX_TILE_W;
    canvas.height = HEX_TILE_H;
    const ctx = canvas.getContext('2d')!;

    // Crisp pixel art scaling
    ctx.imageSmoothingEnabled = false;

    // Clip to hex shape
    ctx.save();
    hexPath(ctx, CX, CY, CLIP_SIZE);
    ctx.clip();

    // Draw terrain tile scaled to fill hex bounding box
    ctx.drawImage(tilesheet, sx, sy, sw, sh, 0, 0, HEX_TILE_W, HEX_TILE_H);

    // Fog overlay for explored-but-not-visible hexes
    if (fogOverlay) {
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = THEME.fog;
        ctx.fillRect(0, 0, HEX_TILE_W, HEX_TILE_H);
    }

    ctx.restore();
    return canvas;
}

/**
 * Build the full hex tile cache for all terrain types.
 * Call this after tilesheets are loaded.
 */
export function buildHexTileCache(): void {
    cache.clear();

    const tileSize = TILE_ATLAS.meta.tileSize;

    for (const [type, tileDef] of Object.entries(TILE_ATLAS.terrain_map)) {
        const tilesheet = getTilesheet(tileDef.source);
        if (!tilesheet) continue;

        const sw = tileDef.w ?? tileSize;
        const sh = tileDef.h ?? tileSize;

        const variant: CachedVariant = {
            normal: renderOneHexTile(tilesheet, tileDef.x, tileDef.y, sw, sh, false),
            fog: renderOneHexTile(tilesheet, tileDef.x, tileDef.y, sw, sh, true),
        };

        cache.set(type, [variant]);
    }

    // Unexplored hex: solid dark fill clipped to hex shape
    const uCanvas = document.createElement('canvas');
    uCanvas.width = HEX_TILE_W;
    uCanvas.height = HEX_TILE_H;
    const uCtx = uCanvas.getContext('2d')!;
    hexPath(uCtx, CX, CY, CLIP_SIZE);
    uCtx.fillStyle = THEME.unexplored;
    uCtx.fill();
    unexploredTile = uCanvas;
}

/**
 * Get the appropriate cached hex tile for a given terrain/visibility state.
 * Uses deterministic coordinate-based selection for variants.
 */
export function getHexTile(
    terrainType: string,
    q: number,
    r: number,
    visible: boolean,
    explored: boolean
): HTMLCanvasElement | null {
    if (!explored) return unexploredTile;

    const variants = cache.get(terrainType);
    if (!variants || variants.length === 0) return null;

    // Deterministic variant selection
    let idx = 0;
    if (variants.length > 1) {
        const seed = Math.abs(Math.sin(q * 12.9898 + r * 78.233) * 43758.5453);
        idx = Math.floor((seed - Math.floor(seed)) * variants.length);
    }

    return visible ? variants[idx].normal : variants[idx].fog;
}

/**
 * Check if the hex tile cache has been built
 */
export function isHexCacheReady(): boolean {
    return cache.size > 0;
}

/** Export hex center offsets for positioning */
export const HEX_CX = CX;
export const HEX_CY = CY;
