import type { Army } from '@entities/Army';
import type { BattleUnit, BattleProjectile, Faction } from '../types';
import { TYPE_EFFECTIVENESS } from '@config/type-effectiveness';
import { logDamage, logBattle, logDeath } from '@utils/logger';

/**
 * Initialize battle units from two armies
 */
export function initializeBattle(
    attacker: Army,
    defender: Army,
    battleWidth: number,
    battleHeight: number
): BattleUnit[] {
    const units: BattleUnit[] = [];

    const spacing = 70;
    const allAttackerUnits = attacker.getAllUnits();
    const allDefenderUnits = defender.getAllUnits();

    const maxUnits = Math.max(allAttackerUnits.length, allDefenderUnits.length);
    const startY = battleHeight / 2 - ((maxUnits - 1) * spacing) / 2;

    // Deploy attacker units (left side)
    allAttackerUnits.forEach((unit, i) => {
        const battleUnit: BattleUnit = {
            id: unit.id,
            unitClass: unit.unitClass,
            owner: unit.owner,
            x: unit.unitClass === 'pokemon' ? 200 : 120,
            y: startY + i * spacing,
            isAttacker: true,
            state: 'idle',
            attackCooldown: 0,

            hp: unit.hp,
            maxHp: unit.maxHp,
            attack: unit.attack,
            defense: unit.defense,
            speed: unit.speed,
            range: unit.range,
        };

        // Add unit-specific properties
        if (unit.unitClass === 'medieval') {
            battleUnit.type = (unit as any).type;
            battleUnit.color = (unit as any).color;
        } else {
            battleUnit.name = (unit as any).name;
            battleUnit.pokemonId = (unit as any).pokemonId;
            battleUnit.types = (unit as any).types;
            battleUnit.role = (unit as any).role;
            battleUnit.abilities = (unit as any).abilities;
            battleUnit.abilityCooldowns = {};
        }

        units.push(battleUnit);
    });

    // Deploy defender units (right side)
    allDefenderUnits.forEach((unit, i) => {
        const battleUnit: BattleUnit = {
            id: unit.id,
            unitClass: unit.unitClass,
            owner: unit.owner,
            x: unit.unitClass === 'pokemon' ? battleWidth - 200 : battleWidth - 120,
            y: startY + i * spacing,
            isAttacker: false,
            state: 'idle',
            attackCooldown: 0,

            hp: unit.hp,
            maxHp: unit.maxHp,
            attack: unit.attack,
            defense: unit.defense,
            speed: unit.speed,
            range: unit.range,
        };

        // Add unit-specific properties
        if (unit.unitClass === 'medieval') {
            battleUnit.type = (unit as any).type;
            battleUnit.color = (unit as any).color;
        } else {
            battleUnit.name = (unit as any).name;
            battleUnit.pokemonId = (unit as any).pokemonId;
            battleUnit.types = (unit as any).types;
            battleUnit.role = (unit as any).role;
            battleUnit.abilities = (unit as any).abilities;
            battleUnit.abilityCooldowns = {};
        }

        units.push(battleUnit);
    });

    return units;
}

/**
 * Apply damage to a unit with type effectiveness
 */
export function applyDamage(
    attacker: BattleUnit,
    defender: BattleUnit,
    baseDamage: number | null = null
): number {
    let damage = baseDamage || attacker.attack * 0.1;

    // Type effectiveness ONLY if both are Pokemon
    if (attacker.unitClass === 'pokemon' && defender.unitClass === 'pokemon' &&
        attacker.types && defender.types) {
        const effectiveness = getTypeEffectiveness(attacker.types, defender.types);
        damage *= effectiveness;
    }

    // Defense reduction
    const defenseMultiplier = 100 / (100 + (defender.defense || 0));
    damage *= defenseMultiplier;

    // Shield check
    if (defender.shielded) {
        damage *= 0.3; // 70% reduction
    }

    // Random variance
    damage = Math.floor(damage * (0.9 + Math.random() * 0.2));
    damage = Math.max(1, damage); // Minimum 1 damage

    // Apply damage
    defender.hp = Math.max(0, defender.hp - damage);

    // Log
    const attackerName = attacker.unitClass === 'pokemon' ? attacker.name : attacker.type;
    const defenderName = defender.unitClass === 'pokemon' ? defender.name : defender.type;
    logDamage(attackerName || 'Unit', defenderName || 'Unit', damage);

    return damage;
}

/**
 * Get type effectiveness multiplier
 */
export function getTypeEffectiveness(attackerTypes: string[], defenderTypes: string[]): number {
    let effectiveness = 1;

    attackerTypes.forEach(attackType => {
        defenderTypes.forEach(defendType => {
            const typeMatchup = TYPE_EFFECTIVENESS[attackType as keyof typeof TYPE_EFFECTIVENESS];
            if (typeMatchup && typeMatchup[defendType as keyof typeof typeMatchup] !== undefined) {
                effectiveness *= typeMatchup[defendType as keyof typeof typeMatchup] as number;
            }
        });
    });

    return effectiveness;
}

/**
 * Find nearest enemy for a battle unit
 */
export function findNearestEnemy(unit: BattleUnit, allUnits: BattleUnit[]): BattleUnit | null {
    const enemies = allUnits.filter(u =>
        u.isAttacker !== unit.isAttacker && u.hp > 0
    );

    if (enemies.length === 0) return null;

    let nearest = enemies[0];
    let minDist = getDistance(unit, nearest);

    enemies.forEach(enemy => {
        const dist = getDistance(unit, enemy);
        if (dist < minDist) {
            minDist = dist;
            nearest = enemy;
        }
    });

    return nearest;
}

/**
 * Calculate distance between two units
 */
export function getDistance(a: { x: number; y: number }, b: { x: number; y: number }): number {
    return Math.hypot(b.x - a.x, b.y - a.y);
}

/**
 * Check if battle is over
 */
export function isBattleOver(units: BattleUnit[]): { over: boolean; attackerWins: boolean } {
    const attackersAlive = units.filter(u => u.isAttacker && u.hp > 0).length;
    const defendersAlive = units.filter(u => !u.isAttacker && u.hp > 0).length;

    if (attackersAlive === 0) {
        return { over: true, attackerWins: false };
    }

    if (defendersAlive === 0) {
        return { over: true, attackerWins: true };
    }

    return { over: false, attackerWins: false };
}

/**
 * Sync battle results back to army
 */
export function syncBattleResults(
    army: Army,
    battleUnits: BattleUnit[],
    isAttacker: boolean
): void {
    const armyBattleUnits = battleUnits.filter(u => u.isAttacker === isAttacker);

    // Update medieval units
    army.medievalUnits.forEach(unit => {
        const battleUnit = armyBattleUnits.find(bu => bu.id === unit.id && bu.unitClass === 'medieval');
        if (battleUnit) {
            unit.hp = battleUnit.hp;
        }
    });

    // Update Pokemon
    army.pokemon.forEach(pokemon => {
        const battlePokemon = armyBattleUnits.find(bu => bu.id === pokemon.id && bu.unitClass === 'pokemon');
        if (battlePokemon) {
            pokemon.hp = battlePokemon.hp;
        }
    });

    // Remove dead units
    army.medievalUnits = army.medievalUnits.filter(u => u.hp > 0);
    army.pokemon = army.pokemon.filter(p => p.hp > 0);
}

/**
 * Create a projectile
 */
export function createProjectile(
    source: BattleUnit,
    target: BattleUnit,
    damage: number
): BattleProjectile {
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const dist = Math.hypot(dx, dy);

    const speed = 5;

    return {
        x: source.x,
        y: source.y,
        vx: (dx / dist) * speed,
        vy: (dy / dist) * speed,
        damage,
        source,
        fromAttacker: source.isAttacker,
        color: source.color || '#ffffff',
        size: 5
    };
}
