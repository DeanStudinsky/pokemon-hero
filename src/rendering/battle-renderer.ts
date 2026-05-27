import type { BattleUnit, BattleProjectile } from '../types';
import { TYPE_COLORS } from '@config/constants';
import { loadPokemonSprite } from './sprite-loader';
import { renderParticles } from './particles';
import type { Particle } from '../types';
import { getUnitSprite, TILE_ATLAS } from '@config/tile-atlas';
import { getTilesheet, drawSprite } from './asset-manager';

/**
 * Render battle arena background
 */
export function renderBattleBackground(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Ground
    ctx.fillStyle = '#2d4a3e';
    ctx.fillRect(0, height - 100, width, 100);

    // Center line
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();
    ctx.setLineDash([]);
}

/**
 * Render a medieval unit in battle
 */
function renderMedievalUnit(ctx: CanvasRenderingContext2D, unit: BattleUnit): void {
    const spriteData = getUnitSprite(unit.type || 'Infantry');

    if (spriteData && getTilesheet('lpc')) {
        // Determine animation state
        let animData;
        let animSpeed = 8; // frames per animation frame

        if (unit.state === 'attacking' && unit.attackCooldown && unit.attackCooldown > 0) {
            animData = spriteData.attack;
            animSpeed = 6;
        } else if (unit.state === 'moving') {
            animData = spriteData.walk;
        } else {
            animData = spriteData.idle;
        }

        // Calculate current frame in animation
        const frameIndex = animData.frames > 1
            ? Math.floor((Date.now() / (animSpeed * 16)) % animData.frames)
            : 0;

        // Draw sprite
        const spriteX = animData.x + (frameIndex * spriteData.width);
        const spriteY = animData.y;

        drawSprite(
            ctx,
            'lpc',
            spriteX,
            spriteY,
            spriteData.width,
            spriteData.height,
            unit.x - 32,  // Center the 64px sprite
            unit.y - 48,  // Anchor at feet
            64,
            64
        );
    } else {
        // Fallback: colored circle
        ctx.fillStyle = unit.color || '#8b7355';
        ctx.beginPath();
        ctx.arc(unit.x, unit.y, 15, 0, Math.PI * 2);
        ctx.fill();

        // Unit type label
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(unit.type || 'Unit', unit.x, unit.y + 35);
    }

    // Shield indicator
    if (unit.shielded) {
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(unit.x, unit.y, 35, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Stunned indicator
    if (unit.stunned) {
        ctx.fillStyle = '#fbbf24';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⭐', unit.x, unit.y - 50);
    }

    // HP bar
    renderHealthBar(ctx, unit);
}

/**
 * Render a Pokemon unit in battle
 */
function renderPokemonUnit(ctx: CanvasRenderingContext2D, unit: BattleUnit): void {
    // Try to load and render sprite
    if (unit.pokemonId) {
        const spriteId = `${unit.pokemonId}-b-n`;
        loadPokemonSprite(spriteId).then(sprite => {
            // Sprite will be cached and rendered next frame
            ctx.drawImage(sprite, unit.x - 25, unit.y - 25, 50, 50);
        }).catch(() => {
            // Fallback rendering
            renderPokemonFallback(ctx, unit);
        });
    } else {
        renderPokemonFallback(ctx, unit);
    }

    // Shield indicator
    if (unit.shielded) {
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(unit.x, unit.y, 30, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Stunned indicator
    if (unit.stunned) {
        ctx.fillStyle = '#fbbf24';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⭐', unit.x, unit.y - 35);
    }

    // HP bar
    renderHealthBar(ctx, unit);

    // Pokemon name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(unit.name || 'Pokemon', unit.x, unit.y + 45);

    // Type indicators
    if (unit.types && unit.types.length > 0) {
        unit.types.forEach((type, i) => {
            const typeColor = TYPE_COLORS[type] || '#ffffff';
            ctx.fillStyle = typeColor;
            ctx.beginPath();
            ctx.arc(unit.x - 10 + i * 20, unit.y + 55, 6, 0, Math.PI * 2);
            ctx.fill();
        });
    }
}

/**
 * Fallback Pokemon rendering (colored circle)
 */
function renderPokemonFallback(ctx: CanvasRenderingContext2D, unit: BattleUnit): void {
    const typeColor = unit.types && unit.types[0] ? TYPE_COLORS[unit.types[0]] : '#a8a878';

    ctx.fillStyle = typeColor;
    ctx.beginPath();
    ctx.arc(unit.x, unit.y, 25, 0, Math.PI * 2);
    ctx.fill();

    // Outline
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
}

/**
 * Render health bar for a unit
 */
function renderHealthBar(ctx: CanvasRenderingContext2D, unit: BattleUnit): void {
    const barWidth = 60;
    const barHeight = 6;
    const x = unit.x - barWidth / 2;
    const y = unit.y - 40;

    // Background
    ctx.fillStyle = '#000000';
    ctx.fillRect(x, y, barWidth, barHeight);

    // HP fill
    const hpPercent = unit.hp / unit.maxHp;
    const fillWidth = barWidth * hpPercent;

    let hpColor = '#22c55e';
    if (hpPercent < 0.3) hpColor = '#ef4444';
    else if (hpPercent < 0.6) hpColor = '#fbbf24';

    ctx.fillStyle = hpColor;
    ctx.fillRect(x, y, fillWidth, barHeight);

    // Border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, barWidth, barHeight);

    // HP text
    ctx.fillStyle = '#ffffff';
    ctx.font = '9px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.max(0, Math.floor(unit.hp))}/${unit.maxHp}`, unit.x, y - 2);
}

/**
 * Render battle units
 */
export function renderBattleUnits(ctx: CanvasRenderingContext2D, units: BattleUnit[]): void {
    units.forEach(unit => {
        if (unit.hp <= 0 && !unit.isRevived) return;

        if (unit.unitClass === 'medieval') {
            renderMedievalUnit(ctx, unit);
        } else if (unit.unitClass === 'pokemon') {
            renderPokemonUnit(ctx, unit);
        }
    });
}

/**
 * Render projectiles
 */
export function renderProjectiles(ctx: CanvasRenderingContext2D, projectiles: BattleProjectile[]): void {
    projectiles.forEach(proj => {
        ctx.fillStyle = proj.color;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, proj.size, 0, Math.PI * 2);
        ctx.fill();

        // Glow effect
        ctx.strokeStyle = proj.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, proj.size + 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
    });
}

/**
 * Render battle UI (speed controls, pause, etc)
 */
export function renderBattleUI(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    speed: number,
    paused: boolean,
    frame: number
): void {
    // Battle speed indicator
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 150, 40);

    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Speed: ${speed}x`, 20, 30);
    ctx.fillText(paused ? '⏸️ PAUSED' : '▶️ Playing', 20, 45);

    // Frame counter (debug)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(width - 100, 10, 90, 25);
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`Frame: ${frame}`, width - 10, 28);
}

/**
 * Main battle render function
 */
export function renderBattle(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    units: BattleUnit[],
    projectiles: BattleProjectile[],
    particles: Particle[],
    speed: number,
    paused: boolean,
    frame: number
): void {
    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Render layers
    renderBattleBackground(ctx, width, height);
    renderBattleUnits(ctx, units);
    renderProjectiles(ctx, projectiles);
    renderParticles(ctx, particles);
    renderBattleUI(ctx, width, height, speed, paused, frame);
}
