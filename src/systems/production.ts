import type { Settlement } from '@entities/Settlement';
import type { Resources } from '../types';
import { MedievalUnit } from '@entities/MedievalUnit';
import { Army } from '@entities/Army';
import type { Hex } from '@entities/Hex';
import { MEDIEVAL_UNIT_TYPES } from '@config/medieval-units';
import { getNeighbors } from '@utils/hex-math';
import { addLog } from '@utils/logger';

/**
 * Get production cost for a unit type
 */
export function getProductionCost(unitType: string): { prod: number; gold: number } {
    const unitData = MEDIEVAL_UNIT_TYPES[unitType];
    if (!unitData) {
        throw new Error(`Unknown unit type: ${unitType}`);
    }
    return unitData.cost;
}

/**
 * Get production time for a unit type (in turns)
 */
export function getProductionTime(unitType: string): number {
    const cost = getProductionCost(unitType);
    // Production time based on production cost (roughly 1 turn per 10 production)
    return Math.max(1, Math.ceil(cost.prod / 10));
}

/**
 * Check if settlement can afford to produce a unit
 */
export function canAfford(
    unitType: string,
    resources: Resources
): boolean {
    const cost = getProductionCost(unitType);
    return resources.production >= cost.prod &&
           resources.gold >= cost.gold &&
           (!cost.wood || resources.wood >= cost.wood) &&
           (!cost.leppa_berries || resources.leppa_berries >= cost.leppa_berries);
}

/**
 * Deduct production cost from resources
 */
export function deductCost(
    unitType: string,
    resources: Resources
): void {
    const cost = getProductionCost(unitType);
    resources.production -= cost.prod;
    resources.gold -= cost.gold;
    if (cost.wood) resources.wood -= cost.wood;
    if (cost.leppa_berries) resources.leppa_berries -= cost.leppa_berries;
}

/**
 * Queue unit production at settlement
 */
export function queueProduction(
    settlement: Settlement,
    unitType: string,
    resources: Resources
): boolean {
    if (!canAfford(unitType, resources)) {
        addLog(`⚠️ Not enough resources to train ${unitType}!`, '#ef4444');
        return false;
    }

    const turns = getProductionTime(unitType);
    settlement.addToProductionQueue(unitType, turns);
    deductCost(unitType, resources);

    addLog(`⚙️ ${settlement.name} begins training ${unitType} (${turns} turns)`, '#60a5fa');
    return true;
}

/**
 * Process production for all settlements
 */
export function processProduction(
    settlements: Settlement[],
    armies: Army[],
    grid: Map<string, Hex>
): void {
    settlements.forEach(settlement => {
        const completed = settlement.processProduction();

        if (completed) {
            spawnUnit(settlement, completed.type, armies, grid);
        }
    });
}

/**
 * Spawn a produced unit near settlement
 */
export function spawnUnit(
    settlement: Settlement,
    unitType: string,
    armies: Army[],
    grid: Map<string, Hex>
): void {
    const unit = new MedievalUnit(unitType, settlement.owner);

    // Find neighboring tiles
    const neighbors = getNeighbors(settlement.q, settlement.r)
        .map(coords => grid.get(`${coords.q},${coords.r}`))
        .filter(hex => hex && hex.isPassable()) as Hex[];

    if (neighbors.length === 0) {
        addLog(`⚠️ ${settlement.name} has no valid spawn locations!`, '#ef4444');
        return;
    }

    // Try to find existing friendly army nearby
    let targetArmy = armies.find(army =>
        army.owner === settlement.owner &&
        neighbors.some(hex => hex.q === army.q && hex.r === army.r)
    );

    if (targetArmy) {
        // Add to existing army
        targetArmy.addMedievalUnit(unit);
        addLog(`⚙️ ${unitType} joins army at ${settlement.name}`, '#22c55e');
    } else {
        // Create new army
        const spawnHex = neighbors.find(hex =>
            !armies.some(army => army.q === hex.q && army.r === hex.r)
        ) || neighbors[0];

        const newArmy = new Army(spawnHex.q, spawnHex.r, settlement.owner);
        newArmy.addMedievalUnit(unit);
        armies.push(newArmy);

        addLog(`⚙️ ${unitType} trained at ${settlement.name}`, '#22c55e');
    }
}

/**
 * Build Pokemon Center at settlement
 */
export function buildPokemonCenter(
    settlement: Settlement,
    resources: Resources
): boolean {
    const cost = { wood: 30, prod: 20, gold: 30 };

    if (resources.wood < cost.wood || resources.production < cost.prod || resources.gold < cost.gold) {
        addLog(`⚠️ Need ${cost.wood} wood, ${cost.prod} production, ${cost.gold} gold for Pokemon Center!`, '#ef4444');
        return false;
    }

    if (settlement.buildings.pokemonCenter) {
        addLog(`⚠️ Pokemon Center already exists!`, '#ef4444');
        return false;
    }

    resources.wood -= cost.wood;
    resources.production -= cost.prod;
    resources.gold -= cost.gold;
    settlement.buildPokemonCenter();

    addLog(`🏥 Pokemon Center built at ${settlement.name}!`, '#22c55e');
    return true;
}

/**
 * Build Gym at settlement
 */
export function buildGym(
    settlement: Settlement,
    resources: Resources
): boolean {
    const cost = { wood: 40, prod: 30, gold: 50, leppa_berries: 10 };

    if (resources.wood < cost.wood ||
        resources.production < cost.prod ||
        resources.gold < cost.gold ||
        resources.leppa_berries < cost.leppa_berries) {
        addLog(`⚠️ Need ${cost.wood} wood, ${cost.prod} prod, ${cost.gold} gold, ${cost.leppa_berries} berries for Gym!`, '#ef4444');
        return false;
    }

    if (settlement.buildings.gym) {
        addLog(`⚠️ Gym already exists!`, '#ef4444');
        return false;
    }

    resources.wood -= cost.wood;
    resources.production -= cost.prod;
    resources.gold -= cost.gold;
    resources.leppa_berries -= cost.leppa_berries;
    settlement.buildGym();

    addLog(`💪 Gym built at ${settlement.name}!`, '#22c55e');
    return true;
}

/**
 * Build Candy Factory at settlement
 */
export function buildCandyFactory(
    settlement: Settlement,
    resources: Resources
): boolean {
    const cost = { wood: 50, prod: 40, gold: 60 };

    if (resources.wood < cost.wood || resources.production < cost.prod || resources.gold < cost.gold) {
        addLog(`⚠️ Need ${cost.wood} wood, ${cost.prod} prod, ${cost.gold} gold for Candy Factory!`, '#ef4444');
        return false;
    }

    if (settlement.buildings.candyFactory) {
        addLog(`⚠️ Candy Factory already exists!`, '#ef4444');
        return false;
    }

    resources.wood -= cost.wood;
    resources.production -= cost.prod;
    resources.gold -= cost.gold;
    settlement.buildCandyFactory();

    addLog(`🍬 Candy Factory built at ${settlement.name}!`, '#22c55e');
    return true;
}
