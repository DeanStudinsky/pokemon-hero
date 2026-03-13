import type { Army } from '@entities/Army';
import type { Settlement } from '@entities/Settlement';
import type { Resources, CombatLogEntry } from '../types';
import { MEDIEVAL_UNIT_TYPES } from '@config/medieval-units';

/**
 * Render resource display
 */
export function renderResources(
    ctx: CanvasRenderingContext2D,
    resources: Resources,
    turn: number
): void {
    const x = 20;
    const y = 20;

    // Background panel (increased size for new resources)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(x, y, 320, 140);

    // Border
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, 320, 140);

    // Turn number
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Turn ${turn}`, x + 10, y + 25);

    // Resources (2 columns)
    ctx.font = '13px Arial';

    // Left column
    ctx.fillText(`🌾 Food: ${Math.floor(resources.food)}`, x + 10, y + 50);
    ctx.fillText(`⚙️ Prod: ${Math.floor(resources.production)}`, x + 10, y + 70);
    ctx.fillText(`💰 Gold: ${Math.floor(resources.gold)}`, x + 10, y + 90);
    ctx.fillText(`🍬 Candy: ${Math.floor(resources.rare_candy)}`, x + 10, y + 110);

    // Right column
    ctx.fillText(`🪵 Wood: ${Math.floor(resources.wood)}`, x + 170, y + 50);
    ctx.fillText(`🔴 Apricorns: ${Math.floor(resources.apricorns)}`, x + 170, y + 70);
    ctx.fillText(`🍓 Leppa: ${Math.floor(resources.leppa_berries)}`, x + 170, y + 90);
}

/**
 * Render combat log
 */
export function renderCombatLog(
    ctx: CanvasRenderingContext2D,
    combatLog: CombatLogEntry[],
    canvasWidth: number
): void {
    const x = canvasWidth - 320;
    const y = 20;
    const width = 300;
    const maxHeight = 400;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(x, y, width, maxHeight);

    // Border
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, maxHeight);

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Combat Log', x + 10, y + 20);

    // Log entries (most recent first, up to 15 entries)
    ctx.font = '11px Arial';
    const entriesToShow = combatLog.slice(0, 15);

    entriesToShow.forEach((entry, i) => {
        const entryY = y + 40 + i * 22;

        // Fade older entries
        const age = Date.now() - entry.time;
        const opacity = Math.max(0.3, 1 - age / 30000);
        ctx.globalAlpha = opacity;

        ctx.fillStyle = entry.color;

        // Word wrap for long messages
        const maxWidth = width - 20;
        const words = entry.message.split(' ');
        let line = '';
        let lineY = entryY;

        words.forEach(word => {
            const testLine = line + word + ' ';
            const metrics = ctx.measureText(testLine);

            if (metrics.width > maxWidth && line.length > 0) {
                ctx.fillText(line, x + 10, lineY);
                line = word + ' ';
                lineY += 12;
            } else {
                line = testLine;
            }
        });

        ctx.fillText(line, x + 10, lineY);
        ctx.globalAlpha = 1;
    });
}

/**
 * Render selected army panel
 */
export function renderSelectedArmyPanel(
    ctx: CanvasRenderingContext2D,
    army: Army,
    canvasHeight: number
): void {
    const x = 20;
    const y = canvasHeight - 200;
    const width = 300;
    const height = 180;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(x, y, width, height);

    // Border
    ctx.strokeStyle = army.owner === 'player' ? '#3b82f6' : '#ef4444';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`${army.owner === 'player' ? 'Your' : 'Enemy'} Army`, x + 10, y + 25);

    // Army stats
    ctx.font = '13px Arial';
    ctx.fillText(`Medieval Units: ${army.medievalUnits.length}`, x + 10, y + 50);
    ctx.fillText(`Pokemon: ${army.pokemon.length}/${army.maxPokemonSlots}`, x + 10, y + 70);
    ctx.fillText(`Moves Left: ${army.movesLeft}/${army.maxMoves}`, x + 10, y + 90);
    ctx.fillText(`Strength: ${army.getTotalStrength()}`, x + 10, y + 110);

    // Unit list
    ctx.font = '11px Arial';
    let listY = y + 130;

    army.medievalUnits.slice(0, 3).forEach((unit, i) => {
        ctx.fillStyle = unit.color || '#8b7355';
        ctx.fillText(`• ${unit.type} (HP: ${Math.floor(unit.hp)}/${unit.maxHp})`, x + 10, listY);
        listY += 15;
    });

    if (army.medievalUnits.length > 3) {
        ctx.fillStyle = '#888888';
        ctx.fillText(`+ ${army.medievalUnits.length - 3} more...`, x + 10, listY);
    }
}

/**
 * Render selected settlement panel
 */
export function renderSelectedSettlementPanel(
    ctx: CanvasRenderingContext2D,
    settlement: Settlement,
    resources: Resources,
    canvasHeight: number
): void {
    const x = 20;
    const y = canvasHeight - 250;
    const width = 320;
    const height = 230;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(x, y, width, height);

    // Border
    ctx.strokeStyle = settlement.owner === 'player' ? '#3b82f6' : '#ef4444';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(settlement.name, x + 10, y + 25);

    // Buildings
    ctx.font = '13px Arial';
    ctx.fillText('Buildings:', x + 10, y + 50);

    ctx.font = '12px Arial';
    if (settlement.buildings.pokemonCenter) {
        ctx.fillStyle = '#22c55e';
        ctx.fillText('🏥 Pokemon Center', x + 15, y + 70);

        if (settlement.healingQueue.length > 0) {
            ctx.fillStyle = '#60a5fa';
            ctx.font = '11px Arial';
            ctx.fillText(`Healing ${settlement.healingQueue.length} Pokemon`, x + 15, y + 85);
        }
    } else {
        ctx.fillStyle = '#888888';
        ctx.fillText('No buildings', x + 15, y + 70);
    }

    // Production queue
    ctx.fillStyle = '#ffffff';
    ctx.font = '13px Arial';
    ctx.fillText('Production Queue:', x + 10, y + 110);

    if (settlement.productionQueue.length > 0) {
        const current = settlement.productionQueue[0];
        ctx.font = '12px Arial';
        ctx.fillStyle = '#fbbf24';
        ctx.fillText(`Training: ${current.type}`, x + 15, y + 130);
        ctx.fillText(`Turns left: ${current.turnsLeft}/${current.totalTurns}`, x + 15, y + 145);

        // Progress bar
        const progress = 1 - (current.turnsLeft / current.totalTurns);
        const barWidth = 200;
        const barX = x + 15;
        const barY = y + 155;

        ctx.fillStyle = '#000000';
        ctx.fillRect(barX, barY, barWidth, 10);

        ctx.fillStyle = '#22c55e';
        ctx.fillRect(barX, barY, barWidth * progress, 10);

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, 10);
    } else {
        ctx.fillStyle = '#888888';
        ctx.font = '12px Arial';
        ctx.fillText('Idle', x + 15, y + 130);
    }

    // Available units to train
    ctx.fillStyle = '#ffffff';
    ctx.font = '11px Arial';
    ctx.fillText('Press U to open training menu', x + 10, y + 185);
}

/**
 * Render tooltip
 */
export function renderTooltip(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number
): void {
    ctx.font = '12px Arial';
    const metrics = ctx.measureText(text);
    const padding = 8;
    const width = metrics.width + padding * 2;
    const height = 20;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(x, y, width, height);

    // Border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, height);

    // Text
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + padding, y + height / 2);
}

/**
 * Render detailed army composition panel (right side of screen)
 */
export function renderArmyDetailPanel(
    ctx: CanvasRenderingContext2D,
    army: Army,
    canvasWidth: number,
    canvasHeight: number
): void {
    const width = 350;
    const x = canvasWidth - width - 20;
    const y = 440; // Below combat log
    const maxHeight = canvasHeight - y - 20;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
    ctx.fillRect(x, y, width, maxHeight);

    // Border (faction color)
    ctx.strokeStyle = army.owner === 'player' ? '#10b981' : '#ef4444';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, maxHeight);

    // Header
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('ARMY COMPOSITION', x + 10, y + 22);

    let contentY = y + 42;
    const lineHeight = 16;

    // Summary stats
    ctx.font = '13px Arial';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`Strength: ${army.getTotalStrength()}`, x + 10, contentY);
    ctx.fillStyle = '#a0aec0';
    ctx.fillText(`Moves: ${army.movesLeft}/${army.maxMoves}`, x + 200, contentY);
    contentY += lineHeight + 8;

    // Medieval units section
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px Arial';
    ctx.fillText(`📜 MEDIEVAL UNITS (${army.medievalUnits.length})`, x + 10, contentY);
    contentY += lineHeight + 4;

    if (army.medievalUnits.length > 0) {
        // Group units by type
        const unitGroups = new Map<string, typeof army.medievalUnits>();
        army.medievalUnits.forEach(unit => {
            if (!unitGroups.has(unit.type)) {
                unitGroups.set(unit.type, []);
            }
            unitGroups.get(unit.type)!.push(unit);
        });

        // Display grouped units
        ctx.font = '12px Arial';
        unitGroups.forEach((units, type) => {
            const totalHp = units.reduce((sum, u) => sum + u.hp, 0);
            const maxHp = units.reduce((sum, u) => sum + u.maxHp, 0);
            const icon = getUnitIcon(type);

            ctx.fillStyle = units[0].color || '#8b7355';
            ctx.fillText(`${icon} ${type} x${units.length}`, x + 15, contentY);
            ctx.fillText(`HP: ${Math.floor(totalHp)}/${Math.floor(maxHp)}`, x + 220, contentY);
            contentY += lineHeight;
        });
    } else {
        ctx.fillStyle = '#666666';
        ctx.font = '11px Arial';
        ctx.fillText('None', x + 15, contentY);
        contentY += lineHeight;
    }

    contentY += 8;

    // Pokemon section
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px Arial';
    ctx.fillText(`⭐ POKEMON (${army.pokemon.length}/${army.maxPokemonSlots})`, x + 10, contentY);
    contentY += lineHeight + 4;

    if (army.pokemon.length > 0) {
        ctx.font = '12px Arial';

        army.pokemon.forEach(pokemon => {
            // Pokemon name and level
            ctx.fillStyle = '#ffd700';
            ctx.fillText(`${pokemon.name} (Lv ${pokemon.level})`, x + 15, contentY);
            contentY += lineHeight;

            // HP bar
            const hpPercent = pokemon.hp / pokemon.maxHp;
            const barWidth = 300;
            const barHeight = 10;
            const barX = x + 20;
            const barY = contentY;

            ctx.fillStyle = '#333333';
            ctx.fillRect(barX, barY, barWidth, barHeight);

            ctx.fillStyle = hpPercent > 0.5 ? '#22c55e' : hpPercent > 0.25 ? '#fbbf24' : '#ef4444';
            ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.strokeRect(barX, barY, barWidth, barHeight);

            ctx.fillStyle = '#ffffff';
            ctx.font = '10px Arial';
            ctx.fillText(`${Math.floor(pokemon.hp)}/${pokemon.maxHp}`, barX + barWidth + 5, barY + 8);
            contentY += 16;

            // Role and types
            ctx.font = '11px Arial';
            ctx.fillStyle = '#888888';
            ctx.fillText(`Role: ${pokemon.role} | Types: ${pokemon.types.join('/')}`, x + 20, contentY);
            contentY += 14;

            // Abilities
            ctx.fillStyle = '#60a5fa';
            const abilities = pokemon.abilities.slice(0, 2).join(', ');
            ctx.fillText(`Abilities: ${abilities}`, x + 20, contentY);
            contentY += 14;

            // Stat boosts
            const boosts = [];
            if (pokemon.statBoosts.hp > 0) boosts.push(`HP+${pokemon.statBoosts.hp * 5}%`);
            if (pokemon.statBoosts.attack > 0) boosts.push(`ATK+${pokemon.statBoosts.attack * 5}%`);
            if (pokemon.statBoosts.defense > 0) boosts.push(`DEF+${pokemon.statBoosts.defense * 5}%`);
            if (pokemon.statBoosts.speed > 0) boosts.push(`SPD+${pokemon.statBoosts.speed * 5}%`);

            if (boosts.length > 0) {
                ctx.fillStyle = '#22c55e';
                ctx.fillText(`Boosts: ${boosts.join(', ')}`, x + 20, contentY);
                contentY += 14;
            }

            contentY += 6; // Spacing between Pokemon
        });
    } else {
        ctx.fillStyle = '#666666';
        ctx.font = '11px Arial';
        ctx.fillText('None', x + 15, contentY);
        contentY += lineHeight;
    }

    // Empty slots
    const emptySlots = army.maxPokemonSlots - army.pokemon.length;
    if (emptySlots > 0) {
        contentY += 4;
        for (let i = 0; i < emptySlots; i++) {
            ctx.fillStyle = '#666666';
            ctx.font = '12px Arial';
            ctx.fillText('[Empty Slot] - Capture Pokemon', x + 15, contentY);
            contentY += 18;
        }
    }
}

/**
 * Helper function to get icon for unit type
 */
function getUnitIcon(type: string): string {
    const icons: Record<string, string> = {
        'Infantry': '⚔️',
        'Spearman': '🗡️',
        'Cavalry': '🐴',
        'Archer': '🏹',
        'Crossbowman': '🎯',
        'Mage': '🧙',
        'Settler': '👷'
    };
    return icons[type] || '⚔️';
}

/**
 * Render minimap
 */
export function renderMinimap(
    ctx: CanvasRenderingContext2D,
    armies: Army[],
    settlements: Settlement[],
    canvasWidth: number,
    canvasHeight: number
): void {
    const size = 150;
    const x = canvasWidth - size - 20;
    const y = canvasHeight - size - 20;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(x, y, size, size);

    // Border
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, size, size);

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Minimap', x + size / 2, y - 8);

    // Placeholder - would need to scale map coordinates
    ctx.fillStyle = '#666666';
    ctx.font = '10px Arial';
    ctx.fillText('(Coming Soon)', x + size / 2, y + size / 2);
}
