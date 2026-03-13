import { TILE_ATLAS } from '@config/tile-atlas';

/**
 * Asset Manager - Handles loading and caching of sprite sheets
 */

const imageCache = new Map<string, HTMLImageElement>();
const loadingPromises = new Map<string, Promise<HTMLImageElement>>();

/**
 * Load a tilesheet image
 */
export async function loadTilesheet(name: string): Promise<HTMLImageElement> {
    if (imageCache.has(name)) {
        return imageCache.get(name)!;
    }

    if (loadingPromises.has(name)) {
        return loadingPromises.get(name)!;
    }

    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            imageCache.set(name, img);
            loadingPromises.delete(name);
            resolve(img);
        };
        img.onerror = () => {
            console.warn(`Failed to load tilesheet: ${name}`);
            loadingPromises.delete(name);
            reject(new Error(`Failed to load tilesheet: ${name}`));
        };

        // Get path from atlas sources
        const path = TILE_ATLAS.sources[name as keyof typeof TILE_ATLAS.sources];
        if (!path) {
            reject(new Error(`Unknown tilesheet: ${name}`));
            return;
        }
        img.src = path;
    });

    loadingPromises.set(name, promise);
    return promise;
}

/**
 * Preload all tilesheets
 */
export async function preloadTilesheets(): Promise<void> {
    const promises = [
        loadTilesheet('nature'),
        loadTilesheet('coastal'),
        loadTilesheet('overworld'),
        loadTilesheet('buildings_objects'),
        loadTilesheet('lpc'),
        loadTilesheet('ui')
    ];

    try {
        await Promise.all(promises);
        console.log('✅ All tilesheets loaded');
    } catch (error) {
        console.error('❌ Failed to load some tilesheets:', error);
        // Continue anyway - will use fallback rendering
    }
}

/**
 * Get a cached tilesheet
 */
export function getTilesheet(name: string): HTMLImageElement | null {
    return imageCache.get(name) || null;
}

/**
 * Check if all assets are loaded
 */
export function areAssetsLoaded(): boolean {
    return imageCache.has('nature') && imageCache.has('coastal') && imageCache.has('lpc')
        && imageCache.has('overworld') && imageCache.has('buildings_objects');
}

/**
 * Draw a sprite from a tilesheet
 */
export function drawSprite(
    ctx: CanvasRenderingContext2D,
    tilesheetName: string,
    sx: number,
    sy: number,
    sw: number,
    sh: number,
    dx: number,
    dy: number,
    dw: number,
    dh: number
): void {
    const tilesheet = getTilesheet(tilesheetName);

    if (!tilesheet || !tilesheet.complete) {
        // Fallback: draw a colored rectangle
        ctx.fillStyle = '#808080';
        ctx.fillRect(dx, dy, dw, dh);
        return;
    }

    try {
        ctx.drawImage(tilesheet, sx, sy, sw, sh, dx, dy, dw, dh);
    } catch (error) {
        console.error('Error drawing sprite:', error);
        ctx.fillStyle = '#808080';
        ctx.fillRect(dx, dy, dw, dh);
    }
}
