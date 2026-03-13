import { useGameStore } from '@core/state';
import { setupInputHandlers, getZoom } from '@core/input-handler';
import { generateMap, findSpawnLocation } from '@systems/map-generator';
import { updateVisibility } from '@systems/visibility';
import { generateWildPokemon } from '@systems/capture';
import { initAbilitySystem, useAbility, tickAbilityCooldowns } from '@systems/ability-system';
import { applyDamage, initializeBattle, isBattleOver, syncBattleResults, findNearestEnemy, getDistance } from '@systems/combat';
import { executeAITurn } from '@systems/ai';
import { processProduction } from '@systems/production';
import { Army } from '@entities/Army';
import { Settlement } from '@entities/Settlement';
import { MedievalUnit } from '@entities/MedievalUnit';
import { PokemonUnit } from '@entities/PokemonUnit';
import { SETTLEMENT_NAMES } from '@config/constants';
import { initMainCanvas, initBattleCanvas, setRenderCallback, setUpdateCallback, startGameLoop } from '@rendering/canvas';
import { renderMap } from '@rendering/map-renderer';
import { renderBattle } from '@rendering/battle-renderer';
import { renderResources, renderCombatLog, renderSelectedArmyPanel, renderSelectedSettlementPanel, renderArmyDetailPanel } from '@rendering/ui-renderer';
import { updateParticles, createBattleParticles } from '@rendering/particles';
import { preloadCommonSprites } from '@rendering/sprite-loader';
import { preloadTilesheets } from '@rendering/asset-manager';
import { screenToAxial } from '@utils/hex-math';
import { getValidMoves, wouldTriggerBattle, moveArmy } from '@systems/movement';
import { addLog, logBattle } from '@utils/logger';

/**
 * Initialize game
 */
async function initGame(): Promise<void> {
    console.log('🎮 Initializing Pokemon Conquest...');

    // Preload sprites
    await preloadCommonSprites();
    await preloadTilesheets();

    // Initialize ability system
    initAbilitySystem(
        applyDamage,
        (x: number, y: number, color: string, count: number) => {
            const particles = createBattleParticles(x, y, color, count);
            const battle = useGameStore.getState().battle;
            if (battle) {
                battle.particles.push(...particles);
            }
        }
    );

    // Generate map
    const grid = generateMap();
    useGameStore.getState().setGrid(grid);

    // Generate settlements
    const settlements: Settlement[] = [];
    const settlementPositions: { q: number; r: number }[] = [];

    // Player starting settlement
    const playerSettlementHex = findSpawnLocation(grid, [], 5);
    if (playerSettlementHex) {
        const playerSettlement = new Settlement(
            playerSettlementHex.q,
            playerSettlementHex.r,
            'player',
            SETTLEMENT_NAMES[0]
        );
        playerSettlement.buildPokemonCenter(); // Start with Pokemon Center
        settlements.push(playerSettlement);
        settlementPositions.push({ q: playerSettlementHex.q, r: playerSettlementHex.r });

        useGameStore.getState().addSettlement(playerSettlement);
    }

    // Enemy settlements
    for (let i = 0; i < 3; i++) {
        const hex = findSpawnLocation(grid, settlementPositions, 8);
        if (hex) {
            const settlement = new Settlement(hex.q, hex.r, 'enemy', SETTLEMENT_NAMES[i + 1]);
            settlements.push(settlement);
            settlementPositions.push({ q: hex.q, r: hex.r });
            useGameStore.getState().addSettlement(settlement);
        }
    }

    // Generate wild Pokemon
    const wildPokemon = generateWildPokemon(grid, settlementPositions);
    wildPokemon.forEach(wp => useGameStore.getState().addWildPokemon(wp));

    // Create starting armies
    setupStartingArmies(grid, settlements);

    // Update visibility
    updateVisibility(grid, useGameStore.getState().armies, useGameStore.getState().settlements);

    // Center camera on player settlement
    if (playerSettlementHex) {
        const { x, y } = playerSettlementHex.getScreenCoords();
        useGameStore.getState().setCamera({ x: window.innerWidth / 2 - x, y: window.innerHeight / 2 - y });
    }

    console.log('✅ Game initialized!');
    addLog('🎮 Welcome to Pokemon Conquest!', '#ffd700');
    addLog('⚔️ Build armies, capture Pokemon, conquer the map!', '#60a5fa');
}

/**
 * Setup starting armies for testing
 */
function setupStartingArmies(grid: Map<string, any>, settlements: Settlement[]): void {
    const playerSettlement = settlements.find(s => s.owner === 'player');
    if (!playerSettlement) return;

    // Find spawn position near player settlement
    const spawnHex = findSpawnLocation(
        grid,
        [{ q: playerSettlement.q, r: playerSettlement.r }],
        2
    );

    if (spawnHex) {
        const army = new Army(spawnHex.q, spawnHex.r, 'player');

        // Add medieval units
        army.addMedievalUnit(new MedievalUnit('Cavalry', 'player'));
        army.addMedievalUnit(new MedievalUnit('Archer', 'player'));
        army.addMedievalUnit(new MedievalUnit('Infantry', 'player'));

        // Add starter Pokemon
        army.addPokemon(new PokemonUnit(257, 'player')); // Blaziken

        useGameStore.getState().addArmy(army);
    }
}

/**
 * Update game state
 */
function updateGame(deltaTime: number): void {
    const state = useGameStore.getState();

    // Update particles
    if (state.particles.length > 0) {
        const updatedParticles = updateParticles(state.particles, deltaTime);
        // Would need to update state particles here
    }

    // Update battle if active
    if (state.battleMode && state.battle) {
        updateBattle(deltaTime);
    }
}

/**
 * Update battle logic
 */
function updateBattle(deltaTime: number): void {
    const state = useGameStore.getState();
    const battle = state.battle;
    if (!battle || battle.paused) return;

    battle.frame++;

    // Update particles
    battle.particles = updateParticles(battle.particles, deltaTime);

    // Update projectiles
    battle.projectiles.forEach((proj, i) => {
        proj.x += proj.vx * deltaTime;
        proj.y += proj.vy * deltaTime;

        // Check collision with units
        battle.units.forEach(unit => {
            if (unit.isAttacker === proj.fromAttacker) return;
            if (unit.hp <= 0) return;

            const dist = Math.hypot(unit.x - proj.x, unit.y - proj.y);
            if (dist < 20) {
                applyDamage(proj.source, unit, proj.damage);
                battle.projectiles.splice(i, 1);
            }
        });
    });

    // Update battle units AI
    battle.units.forEach(unit => {
        if (unit.hp <= 0) return;

        // Update status effects
        if (unit.stunned && unit.stunDuration) {
            unit.stunDuration--;
            if (unit.stunDuration <= 0) {
                unit.stunned = false;
            }
        }

        if (unit.shielded && unit.shieldDuration) {
            unit.shieldDuration--;
            if (unit.shieldDuration <= 0) {
                unit.shielded = false;
            }
        }

        // Tick down ability cooldowns for Pokemon
        if (unit.unitClass === 'pokemon') {
            tickAbilityCooldowns(unit);
        }

        // Skip if stunned
        if (unit.stunned) return;

        // Pokemon ability usage
        if (unit.unitClass === 'pokemon' && unit.abilities && unit.abilities.length > 0) {
            const allies = battle.units.filter(u => u.isAttacker === unit.isAttacker && u.hp > 0);
            const enemies = battle.units.filter(u => u.isAttacker !== unit.isAttacker && u.hp > 0);

            // Try to use each ability
            unit.abilities.forEach(abilityName => {
                const nearestEnemy = findNearestEnemy(unit, battle.units);
                useAbility(unit, abilityName, nearestEnemy, allies, enemies);
            });
        }

        // Find nearest enemy
        const nearestEnemy = findNearestEnemy(unit, battle.units);
        if (!nearestEnemy) return;

        const distance = getDistance(unit, nearestEnemy);

        // Move towards enemy if out of range
        if (distance > unit.range) {
            const dx = nearestEnemy.x - unit.x;
            const dy = nearestEnemy.y - unit.y;
            const dist = Math.hypot(dx, dy);

            unit.x += (dx / dist) * unit.speed * deltaTime;
            unit.y += (dy / dist) * unit.speed * deltaTime;
            unit.state = 'moving';
        } else {
            // In range - attack
            unit.state = 'attacking';

            if (unit.attackCooldown <= 0) {
                // Create projectile or apply melee damage
                if (unit.range > 60) {
                    // Ranged attack - create projectile
                    const proj = {
                        x: unit.x,
                        y: unit.y,
                        vx: ((nearestEnemy.x - unit.x) / distance) * 5,
                        vy: ((nearestEnemy.y - unit.y) / distance) * 5,
                        damage: unit.attack * 0.1,
                        source: unit,
                        fromAttacker: unit.isAttacker,
                        color: unit.color || '#ffffff',
                        size: 5
                    };
                    battle.projectiles.push(proj);
                } else {
                    // Melee attack - direct damage
                    applyDamage(unit, nearestEnemy);
                }

                unit.attackCooldown = 60 / unit.speed;
            } else {
                unit.attackCooldown -= deltaTime;
            }
        }
    });

    // Check if battle is over
    const result = isBattleOver(battle.units);
    if (result.over) {
        endBattle(result.attackerWins);
    }
}

/**
 * End battle and sync results
 */
function endBattle(attackerWins: boolean): void {
    const state = useGameStore.getState();
    const battle = state.battle;
    if (!battle) return;

    const attackerUnits = battle.units.filter(u => u.isAttacker);
    const defenderUnits = battle.units.filter(u => !u.isAttacker);

    if (attackerWins) {
        logBattle('Victory! Enemy defeated!');

        // Sync survivors back to attacker
        syncBattleResults(battle.attacker, battle.units, true);

        // Handle dead attacker Pokemon (permanent death)
        const deadPokemon = battle.attacker.pokemon.filter((p: PokemonUnit) => {
            const battleUnit = attackerUnits.find(u => u.id === p.id);
            return !battleUnit || battleUnit.hp <= 0;
        });

        deadPokemon.forEach((pokemon: PokemonUnit) => {
            pokemon.markDead();
            battle.attacker.removePokemon(pokemon);
            addLog(`💀 ${pokemon.name} was defeated...`, '#ef4444');
        });

        // Move attacker to defender position
        battle.attacker.moveTo(battle.defender.q, battle.defender.r);

        // Remove defender army
        state.removeArmy(battle.defender);

    } else {
        logBattle('Defeat! Army destroyed!');

        // Check if defender was at settlement with Pokemon Center
        const defenderSettlement = state.settlements.find(s =>
            s.q === battle.defender.q &&
            s.r === battle.defender.r &&
            s.owner === battle.defender.owner &&
            s.buildings.pokemonCenter
        );

        // Sync defender results
        syncBattleResults(battle.defender, battle.units, false);

        if (defenderSettlement) {
            // Dead Pokemon go to healing queue instead of permanent death
            const deadDefenderPokemon = battle.defender.pokemon.filter((p: PokemonUnit) => {
                const battleUnit = defenderUnits.find(u => u.id === p.id);
                return !battleUnit || battleUnit.hp <= 0;
            });

            deadDefenderPokemon.forEach((pokemon: PokemonUnit) => {
                defenderSettlement.addToHealingQueue(pokemon, 5);
                battle.defender.removePokemon(pokemon);
                addLog(`🏥 ${pokemon.name} sent to Pokemon Center for healing`, '#60a5fa');
            });
        }

        // Attacker loses all Pokemon permanently
        battle.attacker.pokemon.forEach((pokemon: PokemonUnit) => {
            pokemon.markDead();
            addLog(`💀 ${pokemon.name} was defeated...`, '#ef4444');
        });

        // Remove attacker army
        state.removeArmy(battle.attacker);
    }

    // Clean up empty armies
    state.armies.forEach(army => {
        if (army.isEmpty()) {
            state.removeArmy(army);
        }
    });

    state.endBattle();
}

/**
 * Render game
 */
function renderGame(ctx: CanvasRenderingContext2D, deltaTime: number): void {
    const state = useGameStore.getState();

    if (state.battleMode) {
        // Render battle on separate canvas
        const battleCtx = document.getElementById('battle-canvas') as HTMLCanvasElement;
        if (battleCtx && state.battle) {
            const ctx2d = battleCtx.getContext('2d');
            if (ctx2d) {
                renderBattle(
                    ctx2d,
                    battleCtx.width,
                    battleCtx.height,
                    state.battle.units,
                    state.battle.projectiles,
                    state.battle.particles,
                    state.battle.speed,
                    state.battle.paused,
                    state.battle.frame
                );
            }
        }
    } else {
        // Save canvas state
        ctx.save();

        // Apply zoom transform
        const zoom = getZoom();
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        // Scale from center
        ctx.translate(centerX, centerY);
        ctx.scale(zoom, zoom);
        ctx.translate(-centerX, -centerY);

        // Render main map with zoom
        const validMoves = state.selectedArmy
            ? getValidMoves(state.selectedArmy, state.grid, state.armies)
            : [];

        renderMap(
            ctx,
            state.grid,
            state.armies,
            state.settlements,
            state.wildPokemon,
            state.selectedArmy,
            state.hoveredHex,
            validMoves,
            state.camera
        );

        // Restore canvas state
        ctx.restore();

        // Render UI (not zoomed)
        renderResources(ctx, state.factionResources.player, state.turn);
        renderCombatLog(ctx, state.combatLog, window.innerWidth);

        if (state.selectedArmy) {
            renderSelectedArmyPanel(ctx, state.selectedArmy, window.innerHeight);
            renderArmyDetailPanel(ctx, state.selectedArmy, window.innerWidth, window.innerHeight);
        }

        if (state.selectedSettlement) {
            renderSelectedSettlementPanel(
                ctx,
                state.selectedSettlement,
                state.factionResources.player,
                window.innerHeight
            );
        }

        // Render zoom indicator
        renderZoomIndicator(ctx, zoom);
    }
}

/**
 * Render zoom level indicator
 */
function renderZoomIndicator(ctx: CanvasRenderingContext2D, zoom: number): void {
    const x = window.innerWidth - 80;
    const y = window.innerHeight - 40;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(x, y, 70, 30);

    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, 70, 30);

    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${(zoom * 100).toFixed(0)}%`, x + 35, y + 15);
}

/**
 * Handle mouse click
 */
function handleClick(event: MouseEvent): void {
    const state = useGameStore.getState();
    const coords = screenToAxial(event.clientX, event.clientY, state.camera);
    const hex = state.grid.get(`${coords.q},${coords.r}`);

    if (!hex || !hex.visible) return;

    // Check for army selection
    const clickedArmy = state.armies.find(a => a.q === coords.q && a.r === coords.r);

    if (clickedArmy && clickedArmy.owner === 'player') {
        state.selectArmy(clickedArmy);
        return;
    }

    // Check for settlement selection
    const clickedSettlement = state.settlements.find(s => s.q === coords.q && s.r === coords.r);

    if (clickedSettlement && clickedSettlement.owner === 'player') {
        state.selectSettlement(clickedSettlement);
        return;
    }

    // Move selected army
    if (state.selectedArmy && state.selectedArmy.owner === 'player') {
        const validMoves = getValidMoves(state.selectedArmy, state.grid, state.armies);
        const isValidMove = validMoves.some(h => h.q === coords.q && h.r === coords.r);

        if (isValidMove) {
            const enemyArmy = wouldTriggerBattle(state.selectedArmy, coords.q, coords.r, state.armies);

            if (enemyArmy) {
                // Start battle
                startBattle(state.selectedArmy, enemyArmy);
            } else {
                moveArmy(state.selectedArmy, coords.q, coords.r);
                updateVisibility(state.grid, state.armies, state.settlements);
            }
        }
    }
}

/**
 * Start battle
 */
function startBattle(attacker: Army, defender: Army): void {
    const state = useGameStore.getState();
    const battleCanvas = document.getElementById('battle-canvas') as HTMLCanvasElement;

    const units = initializeBattle(attacker, defender, battleCanvas.width, battleCanvas.height);

    state.startBattle(attacker, defender);
    if (state.battle) {
        state.battle.units = units;
    }

    logBattle(`Battle begins! ${attacker.getUnitCount()} vs ${defender.getUnitCount()} units`);

    // Show battle arena
    const arena = document.getElementById('battle-arena');
    if (arena) {
        arena.classList.add('active');
    }
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
    try {
        // Initialize canvases
        initMainCanvas('game-canvas');
        initBattleCanvas('battle-canvas');

        // Initialize game
        await initGame();

        // Set up game loop
        setUpdateCallback(updateGame);
        setRenderCallback(renderGame);

        // Set up input handlers
        const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
        setupInputHandlers(canvas);

        // Custom event listeners for game interactions
        document.addEventListener('gameclick', (e: Event) => {
            const detail = (e as CustomEvent).detail;
            handleClick({ clientX: detail.x, clientY: detail.y } as MouseEvent);
        });

        // Battle control buttons
        setupBattleControls();

        // Start game loop
        startGameLoop();

        console.log('🚀 Game started!');
    } catch (error) {
        console.error('❌ Failed to start game:', error);
    }
}

/**
 * Setup battle control button handlers
 */
function setupBattleControls(): void {
    document.getElementById('battle-speed-1x')?.addEventListener('click', () => {
        useGameStore.getState().setBattleSpeed(1);
    });

    document.getElementById('battle-speed-2x')?.addEventListener('click', () => {
        useGameStore.getState().setBattleSpeed(2);
    });

    document.getElementById('battle-pause')?.addEventListener('click', () => {
        useGameStore.getState().toggleBattlePause();
        const btn = document.getElementById('battle-pause');
        const paused = useGameStore.getState().battle?.paused;
        if (btn) {
            btn.textContent = paused ? '▶️ Resume' : '⏸️ Pause';
        }
    });

    document.getElementById('battle-retreat')?.addEventListener('click', () => {
        const state = useGameStore.getState();
        if (state.battle) {
            logBattle('Retreating from battle!');
            state.removeArmy(state.battle.attacker);
            state.endBattle();

            const arena = document.getElementById('battle-arena');
            if (arena) {
                arena.classList.remove('active');
            }
        }
    });
}

// Start the game when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
} else {
    main();
}
