import type { Army } from '@entities/Army';
import type { Settlement } from '@entities/Settlement';
import type { Hex } from '@entities/Hex';
import type { Resources } from '../types';
import type { WildPokemon } from '@entities/WildPokemon';
import { getValidMoves, wouldTriggerBattle } from './movement';
import { queueProduction, buildPokemonCenter, buildGym, buildCandyFactory } from './production';
import { attemptCapture, getWildPokemonAt } from './capture';
import { MEDIEVAL_UNIT_TYPES } from '@config/medieval-units';
import { axialDistance } from '@utils/hex-math';

/**
 * Execute AI turn for enemy faction
 */
export function executeAITurn(
    armies: Army[],
    settlements: Settlement[],
    grid: Map<string, Hex>,
    resources: Resources,
    wildPokemon: WildPokemon[]
): void {
    const enemyArmies = armies.filter(a => a.owner === 'enemy');
    const playerArmies = armies.filter(a => a.owner === 'player');
    const enemySettlements = settlements.filter(s => s.owner === 'enemy');

    // AI Building Construction
    enemySettlements.forEach(settlement => {
        aiBuildings(settlement, resources);
    });

    // AI Production
    enemySettlements.forEach(settlement => {
        aiProduction(settlement, resources);
    });

    // AI Pokemon Capture
    enemyArmies.forEach(army => {
        aiCapture(army, wildPokemon, resources);
    });

    // AI Movement
    enemyArmies.forEach(army => {
        aiMoveArmy(army, playerArmies, grid, armies);
    });
}

/**
 * AI building construction logic
 */
function aiBuildings(settlement: Settlement, resources: Resources): void {
    // Priority 1: Pokemon Center (if affordable)
    if (!settlement.buildings.pokemonCenter &&
        resources.wood >= 30 && resources.production >= 20 && resources.gold >= 30) {
        buildPokemonCenter(settlement, resources);
        return;
    }

    // Priority 2: Gym (if Pokemon Center exists and affordable)
    if (settlement.buildings.pokemonCenter && !settlement.buildings.gym &&
        resources.wood >= 40 && resources.production >= 30 && resources.gold >= 50 && resources.leppa_berries >= 10) {
        buildGym(settlement, resources);
        return;
    }

    // Priority 3: Candy Factory (if Gym exists and affordable)
    if (settlement.buildings.gym && !settlement.buildings.candyFactory &&
        resources.wood >= 50 && resources.production >= 40 && resources.gold >= 60) {
        buildCandyFactory(settlement, resources);
    }
}

/**
 * AI Pokemon capture logic
 */
function aiCapture(army: Army, wildPokemon: WildPokemon[], resources: Resources): void {
    // Only attempt if have apricorns and available slot
    if (resources.apricorns < 3) return;
    if (army.pokemon.length >= army.maxPokemonSlots) return;

    // Check if wild Pokemon at current position
    const wild = getWildPokemonAt(wildPokemon, army.q, army.r);
    if (wild) {
        attemptCapture(army, wild, resources);
    }
}

/**
 * AI production logic
 */
function aiProduction(
    settlement: Settlement,
    resources: Resources
): void {
    // Don't queue if already producing
    if (settlement.productionQueue.length > 0) return;

    // Choose unit type based on resources
    const unitTypes = Object.keys(MEDIEVAL_UNIT_TYPES).filter(
        type => type !== 'Settler'
    );

    // Prefer more expensive units if we can afford them (including new resource costs)
    const affordableUnits = unitTypes.filter(type => {
        const cost = MEDIEVAL_UNIT_TYPES[type].cost;
        return resources.production >= cost.prod &&
               resources.gold >= cost.gold &&
               (!cost.wood || resources.wood >= cost.wood) &&
               (!cost.leppa_berries || resources.leppa_berries >= cost.leppa_berries);
    });

    if (affordableUnits.length === 0) return;

    // Pick random affordable unit (weighted towards more expensive)
    const sortedUnits = affordableUnits.sort((a, b) => {
        const costA = MEDIEVAL_UNIT_TYPES[a].cost.prod + MEDIEVAL_UNIT_TYPES[a].cost.gold;
        const costB = MEDIEVAL_UNIT_TYPES[b].cost.prod + MEDIEVAL_UNIT_TYPES[b].cost.gold;
        return costB - costA;
    });

    const chosenUnit = sortedUnits[Math.floor(Math.random() * Math.min(3, sortedUnits.length))];
    queueProduction(settlement, chosenUnit, resources);
}

/**
 * AI army movement logic
 */
function aiMoveArmy(
    army: Army,
    playerArmies: Army[],
    grid: Map<string, Hex>,
    allArmies: Army[]
): void {
    if (!army.canMove()) return;

    // Find nearest player army
    const nearestEnemy = findNearestEnemy(army, playerArmies);

    if (!nearestEnemy) {
        // No enemies - move randomly
        aiRandomMove(army, grid, allArmies);
        return;
    }

    // Move towards enemy
    aiMoveTowards(army, nearestEnemy, grid, allArmies);
}

/**
 * Find nearest enemy army
 */
function findNearestEnemy(army: Army, enemies: Army[]): Army | null {
    if (enemies.length === 0) return null;

    let nearest = enemies[0];
    let minDist = axialDistance(army, nearest);

    enemies.forEach(enemy => {
        const dist = axialDistance(army, enemy);
        if (dist < minDist) {
            minDist = dist;
            nearest = enemy;
        }
    });

    return nearest;
}

/**
 * Move army towards a target
 */
function aiMoveTowards(
    army: Army,
    target: { q: number; r: number },
    grid: Map<string, Hex>,
    allArmies: Army[]
): void {
    const validMoves = getValidMoves(army, grid, allArmies);

    if (validMoves.length === 0) return;

    // Find move that gets closest to target
    let bestMove = validMoves[0];
    let bestDist = axialDistance(bestMove, target);

    validMoves.forEach(move => {
        const dist = axialDistance(move, target);
        if (dist < bestDist) {
            bestDist = dist;
            bestMove = move;
        }
    });

    // Check if move would trigger battle
    const battleTarget = wouldTriggerBattle(army, bestMove.q, bestMove.r, allArmies);

    // Always attack if possible
    army.moveTo(bestMove.q, bestMove.r);
}

/**
 * Move army randomly
 */
function aiRandomMove(
    army: Army,
    grid: Map<string, Hex>,
    allArmies: Army[]
): void {
    const validMoves = getValidMoves(army, grid, allArmies);

    if (validMoves.length === 0) return;

    const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
    army.moveTo(randomMove.q, randomMove.r);
}

/**
 * Calculate AI aggression level based on strength comparison
 */
function calculateAggression(army: Army, nearestEnemy: Army | null): number {
    if (!nearestEnemy) return 0.3; // Low aggression if no enemies

    const ourStrength = army.getTotalStrength();
    const theirStrength = nearestEnemy.getTotalStrength();

    const ratio = ourStrength / (theirStrength + 1); // +1 to avoid division by zero

    if (ratio > 1.5) return 0.9; // Very aggressive if much stronger
    if (ratio > 1.0) return 0.7; // Aggressive if stronger
    if (ratio > 0.7) return 0.5; // Balanced
    return 0.3; // Cautious if weaker
}
