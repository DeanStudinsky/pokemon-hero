import type { Hex } from '@entities/Hex';
import type { Army } from '@entities/Army';
import type { Settlement } from '@entities/Settlement';
import type { WildPokemon } from '@entities/WildPokemon';
import type { ScreenCoords } from '../types';
import { THEME, HEX_SIZE } from '@config/constants';
import { TILE_ATLAS, getTreeForHex, getTerrainSprite } from '@config/tile-atlas';
import { drawSprite, areAssetsLoaded } from './asset-manager';
import { POKEMON_DATA } from '@config/pokemon-data';
import { axialToScreen } from '@utils/hex-math';

/**
 * Draw a hexagon outline (for debugging/selection)
 */
function drawHexOutline(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    strokeColor: string,
    lineWidth: number = 2
): void {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const hx = x + size * Math.cos(angle);
        const hy = y + size * Math.sin(angle);
        if (i === 0) {
            ctx.moveTo(hx, hy);
        } else {
            ctx.lineTo(hx, hy);
        }
    }
    ctx.closePath();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
}

/**
 * Render terrain tile (ground layer)
 */
function renderTerrainTile(
    ctx: CanvasRenderingContext2D,
    hex: Hex,
    camera: ScreenCoords
): void {
    const { x, y } = axialToScreen(hex.q, hex.r, camera);
    const tileDef = getTerrainSprite(hex.type);
    const scale = TILE_ATLAS.meta.scaleFactor;
    const tileSize = TILE_ATLAS.meta.tileSize;

    // If assets not loaded, use fallback colored hex
    if (!areAssetsLoaded()) {
        renderFallbackHex(ctx, hex, x, y);
        return;
    }

    // Draw the terrain sprite centered on hex
    const drawSize = tileSize * scale;
    drawSprite(
        ctx,
        tileDef.source,
        tileDef.x,
        tileDef.y,
        tileSize,
        tileSize,
        x - drawSize / 2,
        y - drawSize / 2,
        drawSize,
        drawSize
    );
}

/**
 * Fallback rendering when assets aren't loaded
 */
function renderFallbackHex(ctx: CanvasRenderingContext2D, hex: Hex, x: number, y: number): void {
    let fillColor: string;

    if (!hex.explored) {
        fillColor = THEME.unexplored;
    } else if (!hex.visible) {
        fillColor = THEME.fog;
    } else {
        const terrainTheme = THEME[hex.type];
        fillColor = typeof terrainTheme === 'object' ? terrainTheme.base : terrainTheme;
    }

    // Draw hex shape
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const hx = x + HEX_SIZE * Math.cos(angle);
        const hy = y + HEX_SIZE * Math.sin(angle);
        if (i === 0) {
            ctx.moveTo(hx, hy);
        } else {
            ctx.lineTo(hx, hy);
        }
    }
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();
}

/**
 * Y-sorted renderable object
 */
interface RenderObject {
    y: number; // Y coordinate for sorting
    render: (ctx: CanvasRenderingContext2D) => void;
}

/**
 * Render hex grid terrain layer
 */
export function renderHexGrid(
    ctx: CanvasRenderingContext2D,
    grid: Map<string, Hex>,
    camera: ScreenCoords,
    hoveredHex: Hex | null
): void {
    // Render all terrain tiles
    grid.forEach(hex => {
        // Render all hexes (explored or not)
        renderTerrainTile(ctx, hex, camera);

        // Highlight hovered hex
        if (hex === hoveredHex && hex.visible) {
            const { x, y } = axialToScreen(hex.q, hex.r, camera);
            drawHexOutline(ctx, x, y, HEX_SIZE, '#ffffff', 2);
        }

        // Territory borders
        if (hex.owner !== 'none' && hex.visible) {
            const { x, y } = axialToScreen(hex.q, hex.r, camera);
            const borderColor = hex.owner === 'player' ? THEME.player : THEME.enemy;
            drawHexOutline(ctx, x, y, HEX_SIZE - 2, borderColor, 2);
        }
    });
}

/**
 * Render objects layer with Y-sorting (trees, buildings, units)
 */
export function renderObjectsLayer(
    ctx: CanvasRenderingContext2D,
    grid: Map<string, Hex>,
    armies: Army[],
    settlements: Settlement[],
    wildPokemon: WildPokemon[],
    camera: ScreenCoords
): void {
    const renderQueue: RenderObject[] = [];

    // Add trees from forest hexes
    grid.forEach(hex => {
        if (hex.type === 'forest' && hex.visible && areAssetsLoaded()) {
            const { x, y } = axialToScreen(hex.q, hex.r, camera);
            const tree = getTreeForHex(hex.q, hex.r);
            const scale = TILE_ATLAS.meta.scaleFactor;

            renderQueue.push({
                y: y, // Sort by hex center Y
                render: (ctx) => {
                    const drawWidth = tree.w * scale;
                    const drawHeight = tree.h * scale;
                    const anchorY = tree.anchor_y * scale;

                    drawSprite(
                        ctx,
                        tree.source,
                        tree.x,
                        tree.y,
                        tree.w,
                        tree.h,
                        x - drawWidth / 2,
                        y - anchorY,
                        drawWidth,
                        drawHeight
                    );
                }
            });
        }
    });

    // Add settlements
    settlements.forEach(settlement => {
        const hex = grid.get(settlement.getKey());
        if (!hex || !hex.visible) return;

        const { x, y } = axialToScreen(hex.q, hex.r, camera);

        renderQueue.push({
            y: y,
            render: (ctx) => {
                // Settlement icon
                ctx.fillStyle = settlement.owner === 'player' ? THEME.player : THEME.enemy;
                ctx.font = '28px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('🏰', x, y - 10);

                // Settlement name
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 10px Arial';
                ctx.fillText(settlement.name, x, y + 15);

                // Pokemon Center indicator
                if (settlement.buildings.pokemonCenter) {
                    ctx.fillText('🏥', x - 15, y - 10);
                }
            }
        });
    });

    // Add wild Pokemon
    wildPokemon.forEach(wp => {
        if (wp.captured) return;

        const hex = grid.get(wp.getKey());
        if (!hex || !hex.visible) return;

        const { x, y } = axialToScreen(hex.q, hex.r, camera);

        renderQueue.push({
            y: y,
            render: (ctx) => {
                // Sparkle effect
                ctx.fillStyle = THEME.gold;
                ctx.font = '20px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('✨', x, y - 15);

                // Pokemon indicator
                ctx.fillStyle = '#ffffff';
                ctx.font = '16px Arial';
                ctx.fillText('🔴', x, y);

                // Pokemon name if discovered
                if (wp.discovered) {
                    const data = POKEMON_DATA[wp.pokemonId];
                    if (data) {
                        ctx.fillStyle = '#ffffff';
                        ctx.font = 'bold 9px Arial';
                        ctx.fillText(data.name, x, y + 18);
                    }
                }
            }
        });
    });

    // Add armies
    armies.forEach(army => {
        const hex = grid.get(army.getKey());
        if (!hex || !hex.visible) return;

        const { x, y } = axialToScreen(hex.q, hex.r, camera);

        renderQueue.push({
            y: y,
            render: (ctx) => {
                // Army background
                ctx.fillStyle = army.owner === 'player' ? THEME.player : THEME.enemy;
                ctx.globalAlpha = 0.7;
                ctx.beginPath();
                ctx.arc(x, y, 20, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;

                // Unit count
                const medievalCount = army.medievalUnits.length;
                const pokemonCount = army.pokemon.length;

                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(`${medievalCount}`, x - 8, y);

                // Pokemon indicator
                if (pokemonCount > 0) {
                    ctx.fillStyle = THEME.gold;
                    ctx.font = 'bold 10px Arial';
                    ctx.fillText(`⭐${pokemonCount}`, x + 8, y + 12);
                }
            }
        });
    });

    // Sort by Y coordinate (painter's algorithm)
    renderQueue.sort((a, b) => a.y - b.y);

    // Render all objects in sorted order
    renderQueue.forEach(obj => obj.render(ctx));
}

/**
 * Render move indicators for selected army
 */
export function renderMoveIndicators(
    ctx: CanvasRenderingContext2D,
    validMoves: Hex[],
    camera: ScreenCoords
): void {
    validMoves.forEach(hex => {
        const { x, y } = axialToScreen(hex.q, hex.r, camera);
        drawHexOutline(ctx, x, y, HEX_SIZE - 5, '#22c55e', 2);

        // Fill with semi-transparent green
        ctx.globalAlpha = 0.2;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const hx = x + (HEX_SIZE - 5) * Math.cos(angle);
            const hy = y + (HEX_SIZE - 5) * Math.sin(angle);
            if (i === 0) {
                ctx.moveTo(hx, hy);
            } else {
                ctx.lineTo(hx, hy);
            }
        }
        ctx.closePath();
        ctx.fillStyle = '#22c55e';
        ctx.fill();
        ctx.globalAlpha = 1;
    });
}

/**
 * Main map render function
 */
export function renderMap(
    ctx: CanvasRenderingContext2D,
    grid: Map<string, Hex>,
    armies: Army[],
    settlements: Settlement[],
    wildPokemon: WildPokemon[],
    selectedArmy: Army | null,
    hoveredHex: Hex | null,
    validMoves: Hex[],
    camera: ScreenCoords
): void {
    // Layer 1: Terrain
    renderHexGrid(ctx, grid, camera, hoveredHex);

    // Layer 2: Move indicators
    if (validMoves.length > 0) {
        renderMoveIndicators(ctx, validMoves, camera);
    }

    // Layer 3: Objects (Y-sorted)
    renderObjectsLayer(ctx, grid, armies, settlements, wildPokemon, camera);

    // Layer 4: Selection highlight
    if (selectedArmy) {
        const hex = grid.get(selectedArmy.getKey());
        if (hex && hex.visible) {
            const { x, y } = axialToScreen(hex.q, hex.r, camera);
            ctx.strokeStyle = THEME.gold;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(x, y, 25, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}
