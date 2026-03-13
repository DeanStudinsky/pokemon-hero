import type { PokemonAbility, AbilityVisual } from '../types';

// Ability visual effects - maps to particle sprites
export const ABILITY_VISUALS: Record<string, AbilityVisual> = {
    earthquake: { spriteId: 24, tint: '#8b4513', count: 20, spread: 150 },
    freeze: { spriteId: 15, tint: '#98D8D8', count: 12, spread: 100 },
    heal_pulse: { spriteId: 9, tint: '#22c55e', count: 15, spread: 80 },
    quick_attack: { spriteId: 7, tint: '#F8D030', count: 8, spread: 60 },
    protect: { spriteId: '26b', tint: '#60a5fa', count: 6, orbit: true },
    revive: { spriteId: 9, tint: '#ffd700', count: 20, spread: 100 }
};

// Import this in ability-system.ts to avoid circular dependencies
export function createAbilities(applyDamage: Function, spawnBattleParticles: Function, addLog: Function): Record<string, PokemonAbility> {
    return {
        quick_attack: {
            name: 'Quick Attack',
            type: 'damage',
            cooldown: 40,
            effect: (caster, target) => {
                applyDamage(caster, target, caster.attack * 1.5);
            }
        },
        earthquake: {
            name: 'Earthquake',
            type: 'aoe',
            cooldown: 120,
            effect: (caster, _target, _allies, enemies) => {
                enemies?.forEach(t => {
                    const dist = Math.hypot(t.x - caster.x, t.y - caster.y);
                    if (dist < 150) {
                        applyDamage(caster, t, caster.attack * 0.8);
                        spawnBattleParticles(t.x, t.y, '#8b4513', 10);
                    }
                });
            }
        },
        protect: {
            name: 'Protect',
            type: 'buff',
            cooldown: 90,
            effect: (caster) => {
                caster.shielded = true;
                caster.shieldDuration = 120;
            }
        },
        heal_pulse: {
            name: 'Heal Pulse',
            type: 'heal',
            cooldown: 150,
            effect: (caster, _target, allies) => {
                const injured = allies
                    ?.filter(a => a.hp < a.maxHp * 0.5)
                    .sort((a, b) => a.hp - b.hp)[0];

                if (injured) {
                    const healAmount = caster.attack * 2;
                    injured.hp = Math.min(injured.maxHp, injured.hp + healAmount);
                    addLog(`${caster.name} healed ${injured.name || injured.type}!`, '#22c55e');
                    spawnBattleParticles(injured.x, injured.y, '#22c55e', 15);
                }
            }
        },
        freeze: {
            name: 'Ice Beam',
            type: 'control',
            cooldown: 80,
            effect: (caster, target) => {
                applyDamage(caster, target, caster.attack * 1.2);
                if (Math.random() < 0.3) {
                    target.stunned = true;
                    target.stunDuration = 60;
                }
            }
        },
        revive: {
            name: 'Revival',
            type: 'resurrection',
            cooldown: 240,
            effect: (caster, _target, allies) => {
                const deadAllies = allies?.filter(a => a.hp <= 0 && !a.isRevived);
                if (deadAllies && deadAllies.length > 0) {
                    const target = deadAllies[0];
                    target.hp = Math.floor(target.maxHp * 0.3);
                    target.isRevived = true;
                    addLog(`${caster.name} revived ${target.name || target.type}!`, '#ffd700');
                }
            }
        }
    };
}
