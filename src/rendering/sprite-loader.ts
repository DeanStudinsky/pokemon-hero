/**
 * Sprite loader for Pokemon sprites and particle sprites
 */

const spriteCache = new Map<string, HTMLImageElement>();
const loadingPromises = new Map<string, Promise<HTMLImageElement>>();

/**
 * Load a Pokemon sprite by ID
 */
export async function loadPokemonSprite(spriteId: string): Promise<HTMLImageElement> {
    const key = `pokemon-${spriteId}`;

    if (spriteCache.has(key)) {
        return spriteCache.get(key)!;
    }

    if (loadingPromises.has(key)) {
        return loadingPromises.get(key)!;
    }

    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            spriteCache.set(key, img);
            loadingPromises.delete(key);
            resolve(img);
        };
        img.onerror = () => {
            console.warn(`Failed to load Pokemon sprite: ${spriteId}`);
            loadingPromises.delete(key);
            reject(new Error(`Failed to load sprite: ${spriteId}`));
        };

        // Try PMDCollab sprite path
        img.src = `/sprites/pokemon/${spriteId}.png`;
    });

    loadingPromises.set(key, promise);
    return promise;
}

/**
 * Load a particle sprite by ID
 */
export async function loadParticleSprite(spriteId: string | number): Promise<HTMLImageElement> {
    const key = `particle-${spriteId}`;

    if (spriteCache.has(key)) {
        return spriteCache.get(key)!;
    }

    if (loadingPromises.has(key)) {
        return loadingPromises.get(key)!;
    }

    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            spriteCache.set(key, img);
            loadingPromises.delete(key);
            resolve(img);
        };
        img.onerror = () => {
            console.warn(`Failed to load particle sprite: ${spriteId}`);
            loadingPromises.delete(key);
            // Resolve with empty image instead of rejecting
            const fallback = new Image();
            fallback.width = 16;
            fallback.height = 16;
            resolve(fallback);
        };

        // Particle sprite path
        img.src = `/sprites/particles/${spriteId}.png`;
    });

    loadingPromises.set(key, promise);
    return promise;
}

/**
 * Preload common sprites
 */
export async function preloadCommonSprites(): Promise<void> {
    // Preload common particle sprites
    const particleIds = [7, 9, 15, 24, '26b'];
    const promises = particleIds.map(id => loadParticleSprite(id).catch(() => null));

    await Promise.all(promises);
}

/**
 * Get cached sprite or null
 */
export function getCachedSprite(key: string): HTMLImageElement | null {
    return spriteCache.get(key) || null;
}

/**
 * Clear sprite cache
 */
export function clearSpriteCache(): void {
    spriteCache.clear();
    loadingPromises.clear();
}
