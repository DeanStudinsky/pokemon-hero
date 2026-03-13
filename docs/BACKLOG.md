# BACKLOG.md — Pokemon Conquest Issues & Opportunities

> Feed this file to Claude via terminal or IDE for task execution.
> Each item has a unique ID, severity, affected files, and acceptance criteria.
> Do NOT rename existing files or change established variable/function names.

---

## DESIGN VISION

### Game Identity
Pokemon Conquest is a **hex-based 4X strategy game** with **Hero's Hour-style auto-battler combat** and a **soft roguelike progression layer**. Death resets the current run. Meta-progression persists between runs.

### Roguelike Layer
- **Permadeath per run**: Losing all settlements or armies ends the run and resets map/armies/resources.
- **Meta-progression between runs** is tied to:
  - Starting Pokemon unlocks and their starting levels
  - Unlockable **Playstyle Types** (run archetypes that change starting conditions and objectives)
  - Discovered item recipes carry over

### Playstyle Types (Run Archetypes)
Each playstyle defines starting conditions, win conditions, and gameplay restrictions:

| Playstyle | Start State | Win Condition | Notes |
|-----------|------------|---------------|-------|
| **Noble** | 1 settlement, starting army, full resources | Accomplish king-assigned objectives (capture X settlements, defeat Y armies, build Z buildings) | Structured goals, guided experience |
| **Bandit** | No settlement, 1 roaming army, minimal resources | Survive N turns OR amass X gold/Pokemon through raiding | Must raid foreign armies in the field, cannot found settlements initially |
| **Explorer** | (future) 1 army, fog everywhere, extra move range | Discover and capture all wild Pokemon on the map | Collection-focused |
| **Warlord** | (future) 2 armies, no Pokemon, extra medieval units | Conquer all enemy settlements | Pure military, no Pokemon capture |

> Playstyle Types unlock through meta-achievements (e.g., "Win a run as Noble" unlocks Bandit).

### Priority Order for New Features
1. Items & synergy builds
2. Monster collection & evolution
3. Procedural map generation (improve existing)
4. Deep type/combat system (expand abilities)

---

## BUG — Critical

### BUG-001: Splice-while-iterating in projectile loop
- **Severity**: Critical (causes skipped projectiles, potential silent failures)
- **Files**: `main.ts` lines ~165-180
- **Problem**: `battle.projectiles.splice(i, 1)` is called inside a `forEach` loop. Splicing an array while iterating forward shifts indices — elements get skipped. This means some projectiles pass through units without registering hits.
- **Fix**: Replace `forEach` + `splice` with a reverse `for` loop, or collect hit indices and filter after iteration.
- **Acceptance**: Projectile collisions never skip units. No `splice` called during forward iteration.

```typescript
// CURRENT (broken)
battle.projectiles.forEach((proj, i) => {
    // ...collision check...
    battle.projectiles.splice(i, 1); // INDEX SHIFT BUG
});

// FIX PATTERN (filter after)
battle.projectiles = battle.projectiles.filter(proj => {
    // ...collision check...
    // return false to remove, true to keep
});
```

---

## BUG — Moderate

### BUG-002: Direct state mutation bypasses Zustand
- **Severity**: Moderate (works now, breaks with subscriptions/React UI)
- **Files**: `main.ts`, `production.ts`, `capture.ts`, `resource-generation.ts`
- **Problem**: Multiple systems mutate state objects directly instead of going through `useGameStore.getState().setSomething()`. Zustand only triggers re-renders when `set()` is called. Direct mutation means:
  - `battle.frame++` in main.ts — battle state mutated directly
  - `battle.particles = updateParticles(...)` — direct assignment
  - `armies.push(newArmy)` in production.ts — array push bypasses store
  - `resources.apricorns -= 3` in capture.ts — direct resource mutation
  - `resources.wood -= cost.wood` in production.ts — same pattern
- **Impact**: Any future UI subscriptions (React panels, HUD components) won't update. Currently masked because render loop reads full state every frame.
- **Fix**: Route all mutations through Zustand actions. Add store actions for `addArmy`, `updateBattleFrame`, `deductResources`, etc. Some actions already exist (e.g., `addArmy`) but aren't used by the systems that should call them.
- **Acceptance**: No direct mutation of store-managed state outside of Zustand `set()` calls. `grep -r "resources\." systems/` shows no direct assignments.

### BUG-003: Loading screen timer ignores actual load state
- **Severity**: Low-moderate (cosmetic, but can show blank screen)
- **Files**: `index.html` lines 209-215
- **Problem**: Loading screen hides after a hardcoded 1500ms timeout regardless of whether `initGame()` has completed or assets have loaded. On slow connections, player sees empty canvas.
- **Fix**: Have `initGame()` dispatch a custom event or set a flag when complete. Loading screen listens for that signal.
- **Acceptance**: Loading screen stays visible until `initGame()` resolves. No hardcoded timeout.

---

## DEBT — Type Safety

### DEBT-001: `any` types in Zustand store erode type safety
- **Severity**: High (defeats purpose of TypeScript migration)
- **Files**: `state.ts`, `types.ts`
- **Problem**: The store uses `any` for all entity arrays and references:
  ```typescript
  armies: any[];
  settlements: any[];
  grid: Map<string, any>;
  selectedArmy: any | null;
  selectedSettlement: any | null;
  wildPokemon: any[];
  ```
  This means TypeScript cannot catch property access errors, misspellings, or wrong method calls on entities accessed through the store.
- **Fix**: Replace `any` with actual entity types:
  ```typescript
  import type { Army } from '@entities/Army';
  import type { Settlement } from '@entities/Settlement';
  import type { Hex } from '@entities/Hex';
  import type { WildPokemon } from '@entities/WildPokemon';

  armies: Army[];
  settlements: Settlement[];
  grid: Map<string, Hex>;
  selectedArmy: Army | null;
  selectedSettlement: Settlement | null;
  wildPokemon: WildPokemon[];
  ```
- **Watch for**: Circular import issues. If `Hex.ts` imports from `state.ts` AND `state.ts` imports `Hex`, you get a cycle. This connects to DEBT-003.
- **Acceptance**: Zero `any` in `state.ts` and `types.ts` (except the `effect` callback in `PokemonAbility` which legitimately needs flexible typing). `npm run type-check` passes clean.

### DEBT-002: BattleUnit god-interface with optional field sprawl
- **Severity**: Moderate (makes combat code fragile)
- **Files**: `types.ts` (BattleUnit interface), `combat.ts`
- **Problem**: `BattleUnit` uses optional fields (`name?`, `pokemonId?`, `type?`, `color?`) to represent two fundamentally different unit types. Code that touches these fields requires runtime checks or `as any` casts. Legacy fields (`trainerHp`, `getTotalHp`, etc.) are never used.
- **Fix**: Use a discriminated union:
  ```typescript
  interface BaseBattleUnit {
      id: number;
      x: number; y: number;
      hp: number; maxHp: number;
      attack: number; defense: number;
      speed: number; range: number;
      isAttacker: boolean;
      state: 'idle' | 'moving' | 'attacking';
      attackCooldown: number;
      stunned?: boolean;
      stunDuration?: number;
      shielded?: boolean;
      shieldDuration?: number;
  }

  interface MedievalBattleUnit extends BaseBattleUnit {
      unitClass: 'medieval';
      type: string;
      color: string;
  }

  interface PokemonBattleUnit extends BaseBattleUnit {
      unitClass: 'pokemon';
      name: string;
      pokemonId: number;
      types: PokemonType[];
      role: PokemonRole;
      abilities: string[];
      abilityCooldowns: Record<string, number>;
      isRevived?: boolean;
  }

  type BattleUnit = MedievalBattleUnit | PokemonBattleUnit;
  ```
  Then TypeScript narrows automatically: `if (unit.unitClass === 'pokemon') { unit.name // safe }`.
- **Also**: Remove all legacy fields: `trainerHp`, `trainerMaxHp`, `trainerAttack`, `pokemonHp`, `pokemonMaxHp`, `pokemonAttack`, `trainerType`, `getTotalHp`, `getTotalAttack`. Remove `col` field from `Particle` interface.
- **Acceptance**: BattleUnit is a discriminated union. No optional `?` on fields that are always present for a given unitClass. Zero legacy fields. `combat.ts` uses no `as any` casts.

### DEBT-003: Hex entity imports global store (tight coupling)
- **Severity**: Moderate (blocks unit testing, creates import cycles)
- **Files**: `Hex.ts`
- **Problem**: `Hex.getScreenCoords()` calls `useGameStore.getState().camera` directly. Entities should be plain data — they shouldn't reach into global state. This also creates a potential circular dependency: `state.ts` → `Hex` → `state.ts`.
- **Fix**: Remove `getScreenCoords()` from Hex. Callers should use `axialToScreen(hex.q, hex.r, camera)` directly, passing camera as a parameter. The only call site is `main.ts` line ~96 for initial camera centering.
- **Also**: Remove `import { useGameStore }` from Hex.ts entirely.
- **Acceptance**: `Hex.ts` has zero imports from `@core/`. `grep -r "useGameStore" entities/` returns nothing.

### DEBT-004: `Particle.col` legacy field from p5.js
- **Severity**: Low
- **Files**: `types.ts` (Particle interface)
- **Problem**: `col?: any` is marked as "p5 color object (legacy)". The project migrated away from p5.js. This field is never set or read.
- **Fix**: Remove the `col` field from the `Particle` interface.
- **Acceptance**: No `col` field on Particle. `npm run type-check` passes.

---

## DEBT — Architecture

### DEBT-005: `getPokemonNameById()` returns placeholder, cites circular dep
- **Severity**: Low (cosmetic — log messages say "Pokemon #257" instead of "Blaziken")
- **Files**: `capture.ts` lines 98-102
- **Problem**: Function returns `"Pokemon #${pokemonId}"` with comment about circular dependencies. The real fix is importing `POKEMON_DATA` from `@config/pokemon-data` which is a config file (no circular dependency risk — config has no imports from systems).
- **Fix**: Import `POKEMON_DATA` and return `POKEMON_DATA[pokemonId]?.name ?? 'Unknown Pokemon'`.
- **Acceptance**: Failed capture logs show actual Pokemon names.

### DEBT-006: `calculateAggression()` defined but never called
- **Severity**: Low-moderate (wasted logic, AI is mindlessly aggressive)
- **Files**: `ai.ts` lines 219-231
- **Problem**: The function exists and works but nothing calls it. The AI always moves toward the nearest player army and attacks regardless of strength comparison.
- **Fix**: Wire `calculateAggression()` into `aiMoveArmy()`. If aggression < 0.5, prefer moving toward own settlements (defensive). If < 0.3, flee from stronger enemies. Only attack when aggression > 0.6.
- **Acceptance**: Enemy AI retreats when significantly outnumbered. AI with no army advantage prefers defensive positioning.

### DEBT-007: Map generation uses periodic sin/cos, not proper noise
- **Severity**: Moderate (hurts replayability — maps look samey)
- **Files**: `map-generator.ts` lines 29-49
- **Problem**: `Math.sin(q * 0.3) * Math.cos(r * 0.3)` produces periodic, repeating terrain patterns. The same band of mountains appears every ~21 hexes. Not suitable for a roguelike where each run should feel unique.
- **Fix**: Replace with simplex noise. Install `simplex-noise` package. Use 2D noise with a random seed per run. Layer multiple octaves for natural terrain:
  ```typescript
  import { createNoise2D } from 'simplex-noise';
  const noise2D = createNoise2D(); // seeded per run
  const elevation = noise2D(q * 0.1, r * 0.1) * 0.6 + noise2D(q * 0.3, r * 0.3) * 0.3;
  ```
- **Acceptance**: Each `generateMap()` call produces visually distinct terrain. No visible repeating patterns. Map seed is stored for replay.

---

## DEBT — Resource System

### DEBT-008: `Settlement.calculateResourceGeneration()` is orphaned
- **Severity**: Low
- **Files**: `Settlement.ts` lines 166-173
- **Problem**: This method exists on Settlement but is never called. Actual resource generation uses `resource-generation.ts → calculateTerritoryResources()`. The Settlement method doesn't account for territory hex types and returns a generic formula.
- **Fix**: Remove `calculateResourceGeneration()` from Settlement class. All resource logic lives in `resource-generation.ts`.
- **Acceptance**: Settlement class has no resource calculation method. `resource-generation.ts` is sole authority.

### DEBT-009: Candy Factory generates fractional rare candy, immediately floored to 0
- **Severity**: Low-moderate (feature silently broken)
- **Files**: `resource-generation.ts` lines 45-53
- **Problem**: Candy Factory adds `0.5` rare candy per turn, then `Math.floor()` rounds all resources. Until a settlement has TWO candy factories (impossible — building is boolean), rare candy generation is always floored to 0.
- **Fix**: Either accumulate fractional resources and only floor on display/spend, or change candy factory output to 1 per turn.
- **Acceptance**: Candy Factory visibly produces rare candy. Player can see rare_candy count increase each turn when a Candy Factory exists.

---

## FEATURE — Items & Synergies (Priority 1)

### FEAT-001: Item system foundation
- **Scope**: New system
- **New files needed**: `types.ts` additions, `items.ts` (config), `item-system.ts` (logic)
- **Design**:
  - Items are defined in a config file with `id`, `name`, `description`, `slot`, `effects[]`
  - `PokemonUnit` gets a `heldItem: Item | null` field
  - `MedievalUnit` gets an `equipment: { weapon?: Item, armor?: Item }` field
  - Item effects hook into existing systems via an effect-type enum:
    - `damage_boost` → modifies `applyDamage()` output
    - `speed_boost` → modifies unit `speed` field
    - `cooldown_reduction` → modifies ability cooldown ticks
    - `on_hit` → triggers effect when unit deals damage
    - `on_damaged` → triggers effect when unit takes damage
    - `passive_heal` → ticks HP each N battle frames
  - Items drop from defeated enemy armies (% chance per unit killed)
  - Wild Pokemon can hold items (visible before capture)
- **Synergy layer**:
  - Army-wide synergies check composition: "2+ Fire Pokemon → Fire Oath: +15% fire damage"
  - Item set bonuses: "3 Charcoal items in one army → Inferno Aura: burn damage to nearby enemies"
- **Acceptance**: Player can equip items on Pokemon and medieval units. Items modify combat stats. At least 10 starter items defined. 1 synergy bonus implemented as proof of concept.

### FEAT-002: Item discovery as meta-progression
- **Scope**: Roguelike layer
- **Design**:
  - Items found during a run are added to a persistent "Codex"
  - Codex entries unlock the item for future run loot pools
  - Starting playstyles may grant guaranteed codex items
- **Depends on**: FEAT-001, FEAT-005

---

## FEATURE — Evolution (Priority 2)

### FEAT-003: Evolution chains
- **Scope**: Moderate
- **Files**: `pokemon-data.ts` additions, `PokemonUnit.ts`, new `evolution.ts` system
- **Design**:
  - Add `evolvesFrom?: number` and `evolvesTo?: number` and `evolveLevel: number` to `PokemonData`
  - Existing chains in data: Treecko(252)→Grovyle(253)→Sceptile(254), Torchic(255)→Combusken(256)→Blaziken(257), etc.
  - When `PokemonUnit.level >= evolveLevel`, prompt evolution
  - Evolution preserves: stat boosts, held item, owner, id
  - Evolution changes: pokemonId, name, base stats, abilities, spriteId
  - Gym building accelerates leveling (existing `applyStatBoost` + new XP system)
  - Rare Candy forces instant level-up (connect to existing `rare_candy` resource)
- **Acceptance**: Treecko can evolve into Grovyle at level threshold. Stats update. Sprite changes. Held item preserved.

---

## FEATURE — Roguelike Structure (Priority 2)

### FEAT-004: Run lifecycle (start/end/reset)
- **Scope**: Core system
- **New files**: `run-manager.ts`
- **Design**:
  - `startRun(playstyle: PlaystyleType)` — initializes map, starting army, resources per playstyle config
  - `endRun(victory: boolean)` — calculates meta-rewards, updates persistent save
  - `checkDefeat()` — called each turn: if player has 0 armies AND 0 settlements, run ends
  - `checkVictory(playstyle)` — checks playstyle-specific win conditions
  - Run state stored separately from meta state
- **Acceptance**: Player can start a run, lose all units, see a defeat screen, and start a new run with meta-progression intact.

### FEAT-005: Meta-progression persistence
- **Scope**: Save system
- **New files**: `meta-save.ts`
- **Design**:
  - `MetaSave` object stored in `localStorage`:
    ```typescript
    interface MetaSave {
        unlockedPlaystyles: PlaystyleType[];
        unlockedStarterPokemon: number[]; // pokemonIds
        starterLevelBonuses: Record<number, number>; // pokemonId → bonus levels
        discoveredItems: string[]; // item IDs for codex
        completedRuns: number;
        achievements: string[];
    }
    ```
  - Winning a run as Noble unlocks Bandit
  - Capturing 20+ unique Pokemon across runs unlocks Explorer
  - Each completed run grants +1 starting level to the starter Pokemon used
- **Acceptance**: Data persists across browser sessions. Unlocked playstyles appear on run-start screen. Starting Pokemon reflect level bonuses.

### FEAT-006: Playstyle system
- **Scope**: Moderate (config + run-manager integration)
- **New files**: `playstyles.ts` (config)
- **Design**:
  ```typescript
  interface PlaystyleConfig {
      id: string;
      name: string;
      description: string;
      startingSettlements: number; // 0 for Bandit
      startingArmies: number;
      startingPokemon: number[]; // pokemonIds
      startingMedievalUnits: { type: string; count: number }[];
      startingResources: Partial<Resources>;
      canFoundSettlements: boolean;
      winCondition: WinCondition;
      unlockRequirement: string; // achievement ID
  }
  ```
- **Acceptance**: At least Noble and Bandit playstyles are defined and selectable. Bandit starts with no settlement. Noble gets objective-based win conditions.

---

## FEATURE — Combat Expansion (Priority 4)

### FEAT-007: Expand ability pool beyond 6
- **Scope**: Moderate
- **Files**: `abilities.ts`, `pokemon-data.ts`
- **Problem**: 28 Pokemon share 6 abilities. Most just have `quick_attack`.
- **Target**: 15-20 abilities covering more strategic options:
  - Per-type signature moves (Flamethrower, Surf, Solar Beam, Thunderbolt)
  - Terrain-affecting abilities (Rain Dance, Sandstorm)
  - Army-buff abilities (Tailwind: speed boost to all allies)
  - Debuff abilities (Intimidate: lower enemy attack on battle start)
- **Acceptance**: Every Pokemon has at least 1 unique or semi-unique ability. No more than 4 Pokemon share the same single ability.

---

## REFERENCE — Established Naming Conventions

> These names are locked. Do NOT rename without explicit direction.

### Files
- Entity classes: PascalCase (`Army.ts`, `PokemonUnit.ts`, `Settlement.ts`)
- Systems: kebab-case (`ability-system.ts`, `map-generator.ts`, `resource-generation.ts`)
- Config: kebab-case (`pokemon-data.ts`, `medieval-units.ts`, `type-effectiveness.ts`)
- Rendering: kebab-case (`battle-renderer.ts`, `map-renderer.ts`, `ui-renderer.ts`)
- Utils: kebab-case (`hex-math.ts`, `logger.ts`)

### Key Variables/Exports
- `useGameStore` — Zustand store hook
- `POKEMON_DATA` — Pokemon stats record keyed by national dex number
- `MEDIEVAL_UNIT_TYPES` — Medieval unit stats record keyed by type name string
- `TYPE_EFFECTIVENESS` — Type matchup table
- `THEME` — Color constants
- `HEX_SIZE`, `MAP_RADIUS` — Grid constants
- `STARTER_POKEMON`, `EVOLVED_POKEMON` — Pokemon ID arrays
- `SETTLEMENT_NAMES` — Name pool
- `ABILITY_VISUALS` — Particle effect config per ability
- `createAbilities()` — Factory function returning ability definitions

### Path Aliases (from tsconfig)
- `@core/` → `src/core/`
- `@config/` → `src/config/`
- `@entities/` → `src/entities/`
- `@systems/` → `src/systems/`
- `@rendering/` → `src/rendering/`
- `@utils/` → `src/utils/`

### Import Patterns
- Types use `import type { X }` (not `import { X }`)
- Config imports reference `@config/` alias
- Entity imports reference `@entities/` alias
- System-to-system imports use relative paths within `systems/`

---

## TASK DEPENDENCY GRAPH

```
DEBT-001 (any types)  ←  needed before any new feature work
DEBT-002 (BattleUnit) ←  needed before FEAT-007 (abilities)
DEBT-003 (Hex coupling) — standalone
BUG-001 (splice)      — standalone, do first
BUG-002 (mutations)   ←  needed before FEAT-004 (run lifecycle)
DEBT-007 (noise)      ←  needed before FEAT-004 (run lifecycle)
DEBT-009 (candy)      ←  needed before FEAT-003 (evolution)

FEAT-001 (items)      — standalone, highest priority
FEAT-003 (evolution)  — standalone after DEBT-009
FEAT-004 (run mgr)    ←  depends on BUG-002, DEBT-007
FEAT-005 (meta save)  ←  depends on FEAT-004
FEAT-006 (playstyles) ←  depends on FEAT-004, FEAT-005
FEAT-002 (item codex) ←  depends on FEAT-001, FEAT-005
FEAT-007 (abilities)  ←  depends on DEBT-002
```

### Recommended Execution Order
1. BUG-001 (splice fix — 5 min)
2. DEBT-001 (any types — 30 min)
3. DEBT-002 (BattleUnit union — 30 min)
4. DEBT-003 (Hex decoupling — 10 min)
5. DEBT-004, DEBT-005, DEBT-008 (cleanup batch — 15 min)
6. BUG-002 (store mutations — 45 min)
7. DEBT-009 (candy factory — 10 min)
8. FEAT-001 (items — multi-session)
9. FEAT-003 (evolution — 1 session)
10. DEBT-007 (noise maps — 30 min)
11. FEAT-004 → FEAT-005 → FEAT-006 (roguelike stack — multi-session)
12. FEAT-007 (abilities — ongoing)
