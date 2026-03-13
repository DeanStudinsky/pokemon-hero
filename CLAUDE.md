# CLAUDE.md - Pokemon Conquest Strategy Game

This file provides guidance to Claude Code when working with this codebase.

## Project Overview

**Pokemon Conquest Strategy** is a fully functional hexagonal turn-based strategy game that combines:
- **Civilization-style** hex grid exploration and resource management
- **Hero's Hour-style** real-time auto-battler combat
- **Pokemon** as elite special units with abilities alongside medieval troops
- **LPC character sprites** for animated battle units

**Status:** ✅ **Fully Playable** - All core systems implemented and working

## 🎮 Core Gameplay Loop

1. **Explore** - Move armies across a hexagonal grid, revealing fog of war
2. **Expand** - Capture wild Pokemon and build medieval unit armies
3. **Exploit** - Manage resources (Food, Production, Gold) from settlements
4. **Exterminate** - Auto-battles trigger when armies clash

## 🏗️ Architecture (100% Complete)

### Technology Stack
- **TypeScript** - Full type safety across the codebase
- **Vite** - Lightning-fast dev server with HMR
- **Zustand** - Centralized state management
- **Vanilla Canvas** - High-performance 2D rendering (no p5.js dependency)
- **HTTPS** - Secure local development with mkcert

### Project Structure
```
src/
├── main.ts              # Entry point, game loop, battle logic
├── types.ts             # TypeScript type definitions
├── config/              # Game data & configuration
│   ├── constants.ts         # HEX_SIZE, MAP_RADIUS, color themes
│   ├── pokemon-data.ts      # 28 Pokemon with stats, types, abilities
│   ├── medieval-units.ts    # 7 medieval unit types (Infantry, Cavalry, etc.)
│   ├── abilities.ts         # 6 Pokemon abilities with particle effects
│   ├── type-effectiveness.ts # 18x18 Pokemon type matchup table
│   └── tile-atlas.ts        # Sprite mappings for terrain, objects, units
├── core/                # State & input management
│   ├── state.ts             # Zustand store (grid, armies, settlements, battle)
│   └── input-handler.ts     # WASD/mouse controls, zoom, camera pan
├── entities/            # Game object classes
│   ├── Hex.ts               # Hex tile (terrain, visibility, ownership)
│   ├── MedievalUnit.ts      # Medieval combat units
│   ├── PokemonUnit.ts       # Pokemon with abilities & permadeath
│   ├── Army.ts              # Container for units (medieval + Pokemon)
│   ├── Settlement.ts        # Production queues, buildings, healing
│   └── WildPokemon.ts       # Capturable Pokemon spawns
├── systems/             # Game logic (pure functions)
│   ├── map-generator.ts     # Procedural hex grid generation
│   ├── visibility.ts        # Fog of war calculations
│   ├── movement.ts          # Army pathfinding & validation
│   ├── combat.ts            # Battle initialization, damage, victory
│   ├── ability-system.ts    # Pokemon ability execution
│   ├── production.ts        # Settlement unit training
│   ├── capture.ts           # Wild Pokemon spawning & capture
│   └── ai.ts                # Enemy AI decision-making
├── rendering/           # All visual rendering
│   ├── canvas.ts            # Game loop (60fps update/render)
│   ├── map-renderer.ts      # Hex grid, terrain, Y-sorted objects
│   ├── battle-renderer.ts   # Auto-battler arena with LPC sprites
│   ├── ui-renderer.ts       # HUD, panels, resource display
│   ├── particles.ts         # Sprite-based particle effects
│   ├── sprite-loader.ts     # Pokemon sprite caching
│   └── asset-manager.ts     # Tilesheet loading & drawing
└── utils/               # Helper functions
    ├── hex-math.ts          # Axial coordinate conversion
    └── logger.ts            # Combat log utilities
```

## 🗺️ Hexagonal Grid System

### Coordinate System
- **Axial coordinates** (q, r) for hexagon positioning
- **HEX_SIZE = 32** pixels (defined in constants.ts)
- **MAP_RADIUS = 14** hexes from center

### Hex-to-Screen Conversion
```typescript
// From utils/hex-math.ts
export function axialToScreen(q: number, r: number, camera: ScreenCoords): ScreenCoords {
    const x = HEX_SIZE * (3/2 * q) + camera.x;
    const y = HEX_SIZE * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r) + camera.y;
    return { x, y };
}
```

### Terrain Types
- `water` - Deep ocean (impassable)
- `grass` - Basic grassland (food production)
- `plains` - Open fields (gold income)
- `forest` - Wooded areas (production + trees)
- `mountain` - Rocky terrain (production & gold)

### Hex Grid Features
- ✅ Fog of war exploration
- ✅ Territory ownership visualization
- ✅ Y-sorted rendering (painter's algorithm)
- ✅ Zoom (0.5x - 2.0x) with mouse wheel
- ✅ Camera pan (WASD / right-click drag)

## 🎨 Asset System

### Tile-Based Rendering

All assets are managed through `src/config/tile-atlas.ts`:

```typescript
TILE_ATLAS = {
    meta: {
        tileSize: 16,        // Base sprite size
        scaleFactor: 4,      // Scale to 64x64 for rendering
    },
    sources: {
        nature: "/tilesets/nature.png",
        coastal: "/tilesets/coastal.png",
        lpc: "/sprites/units/lpc-units.png"
    },
    terrain_map: {
        water: { source: "nature", x: 0, y: 0 },
        grass: { source: "nature", x: 16, y: 16 },
        // ... etc
    },
    objects: {
        trees: [ /* ObjectDefinition[] */ ],
        buildings: [ /* ObjectDefinition[] */ ]
    },
    units: {
        medieval: { /* UnitSpriteDefinition by type */ }
    }
}
```

### Asset Directory Layout

```
public/
├── tilesets/
│   ├── nature.png          # 16x16 terrain tiles (water, grass, plains, sand, mountain, trees)
│   ├── coastal.png         # 16x16 town/coastal tiles (buildings, piers, lighthouses)
│   ├── terrain/            # Additional terrain tilesets (future)
│   └── buildings/          # Settlement & building tilesets (future)
├── sprites/
│   ├── pokemon/            # 1178 PMDCollab follow sprites ({id}-b-n.png format)
│   ├── units/
│   │   ├── lpc-units.png   # LPC Universal 576x256 (placeholder - all units same)
│   │   └── medieval/       # Per-unit-type LPC spritesheets (future)
│   ├── particles/          # 38 particle mask PNGs for ability VFX
│   ├── effects/            # Ability VFX spritesheets (future)
│   ├── battle/             # Arena backgrounds, ground tiles (future)
│   └── ui/                 # HUD icons, resource icons (future)
└── audio/                  # SFX and music - Howler.js ready (future)
```

**LPC Components:** `assets/lpc-components/` contains 334 layerable PNG components for building per-unit-type sprites (body, armor, weapons, etc.)

See `ASSETS.md` for full inventory and asset creation guide.

### Rendering Pipeline

1. **Terrain Layer** - 16x16 tiles scaled to 64x64, centered on hexes
2. **Move Indicators** - Green highlights for valid army movements
3. **Objects Layer** - Y-sorted (trees, buildings, settlements, armies, wild Pokemon)
4. **Selection Layer** - Gold circle around selected army
5. **UI Layer** - Resources, combat log, panels (no zoom applied)

## 🪖 Unit System: Medieval Troops + Pokemon

### Two Unit Types Working Together

The game features a **dual unit system** where armies contain both medieval troops (fodder) and Pokemon (elite special units):

#### Medieval Units (Fodder)
- **Purpose:** Bulk of army strength, expendable cannon fodder
- **7 Unit Types:**
  - `Infantry` - Balanced melee (HP: 80, Attack: 10, Defense: 15)
  - `Spearman` - Anti-cavalry (HP: 70, Attack: 12, Range: 60)
  - `Cavalry` - Fast shock troops (HP: 100, Attack: 18, Speed: 2.5x)
  - `Archer` - Long-range (HP: 50, Attack: 10, Range: 200)
  - `Crossbowman` - Heavy ranged (HP: 60, Attack: 14, Range: 180)
  - `Mage` - Magic damage (HP: 45, Attack: 16, Range: 150)
  - `Settler` - Can found new settlements (HP: 30, non-combatant)
- **Acquisition:** Trained at settlements (costs Production + Gold)
- **Death:** Respawn at settlements after defeat
- **Combat:** Basic attacks (melee or ranged projectiles)

#### Pokemon Units (Elite)
- **Purpose:** Powerful special units with unique abilities
- **28 Pokemon** across types: Fire, Water, Grass, Electric, Psychic, Fighting, Dragon, etc.
- **4 Roles:**
  - `damage` - High attack dealers (Blaziken, Sceptile, Salamence)
  - `tank` - High HP/Defense (Swampert, Aggron)
  - `support` - Healing & buffs (Gardevoir, Linoone)
  - `control` - Crowd control & debuffs (Manectric, Raichu)
- **Acquisition:** Captured from wild Pokemon spawns on the map
- **Army Slots:** Each army has **3 Pokemon slots** (can be upgraded)
- **Death:** **PERMANENT** unless defending at settlement with Pokemon Center
- **Combat:**
  - Special abilities with cooldowns (Quick Attack, Earthquake, Heal Pulse, etc.)
  - Type effectiveness system (Fire beats Grass, Water beats Fire, etc.)
  - Elite positioning in battle (slightly behind medieval units)

### Army Composition
```typescript
class Army {
    medievalUnits: MedievalUnit[];   // Unlimited, respawnable
    pokemon: PokemonUnit[];          // Max 3 slots, permanent death
    maxPokemonSlots: number;         // Upgradeable limit
}
```

### Wild Pokemon Spawning
- **8-12 wild Pokemon** spawn on map generation
- Located away from settlements (minimum 3 hexes)
- Higher tier Pokemon spawn in dangerous terrain (mountains, forests)
- **Capture Mechanic:**
  - Base 40% capture chance + 5% per unit in army (max 90%)
  - Requires available Pokemon slot
  - Wild Pokemon disappear when captured

### Pokemon Death & Revival
1. **Normal Battles:** Pokemon death is **permanent**
   - Dead Pokemon are removed from army
   - Cannot be recovered
   - Lost Pokemon must be replaced by capturing wild ones

2. **Defending at Pokemon Center:**
   - If army defends at settlement with Pokemon Center building
   - Defeated Pokemon go to **healing queue** instead of dying
   - Healing takes **5 turns** to complete
   - Fully healed Pokemon return to available pool at settlement

3. **Pokemon Center Building:**
   - Cost: 50 Production + 50 Gold
   - Built at settlements
   - Processes healing queue each turn
   - Settlement capture/destruction cancels all healing

### Strategic Implications
- **Medieval units** are your expendable frontline
- **Pokemon** are precious limited resources requiring careful deployment
- **Pokemon Centers** provide safety net but only for defensive battles
- **Offensive operations** risk permanent Pokemon loss
- **Army composition** matters: balance fodder vs elite power

## ⚔️ Combat System (Auto-Battler)

### Battle Initialization
```typescript
// From systems/combat.ts
initializeBattle(attacker: Army, defender: Army, width: number, height: number): BattleUnit[]
```

- Creates `BattleUnit` instances from both armies
- Positions units on left (attacker) and right (defender) sides
- Initializes HP, attack, defense, speed, range for each unit

### Real-Time Battle Logic

**Update Loop** (60 FPS, in main.ts):
```typescript
updateBattle(deltaTime: number) {
    // 1. Update particles
    // 2. Update projectiles (ranged attacks)
    // 3. Update unit AI:
    //    - Move towards nearest enemy if out of range
    //    - Attack when in range
    //    - Pokemon use abilities on cooldown
    // 4. Apply status effects (stun, shield)
    // 5. Check victory conditions
}
```

### Unit AI Behavior
- **Medieval Units:** Basic melee/ranged attacks
- **Pokemon Units:**
  - Use special abilities (Quick Attack, Earthquake, Protect, Heal Pulse, Ice Beam, Revival)
  - Type effectiveness vs other Pokemon
  - Role-based targeting (Tank, Damage, Support, Control)

### Battle Rendering (LPC Sprites)
```typescript
// From rendering/battle-renderer.ts
renderMedievalUnit(ctx, unit) {
    // 1. Determine animation state (idle/walk/attack)
    // 2. Calculate current frame
    // 3. Draw sprite from sprites/units/lpc-units.png
    // 4. Render HP bar, shield, stun indicators
}
```

**Animation States:**
- `idle` - Standing still (1 frame)
- `moving` - Walking toward enemy (8 frames)
- `attacking` - Attack animation (6 frames)

### Battle Results
- **Attacker Wins:** Sync survivors back to army, remove defender
- **Defender Wins:**
  - If at settlement with Pokemon Center: dead Pokemon go to healing queue
  - Otherwise: Pokemon death is permanent
  - Attacker army destroyed

## 🏙️ Settlement System

### Buildings
- **Pokemon Center** - Cost: 50 Production, 50 Gold
  - Heals defeated Pokemon over 5 turns
  - Prevents permadeath for defending armies

### Production Queue
- FIFO (First In, First Out) queue
- Medieval units trained over multiple turns
- Spawns units adjacent to settlement

### Resource Generation
- Food, Production, Gold from controlled territory
- Territory radius: 2 hexes from settlement
- Calculated per turn based on terrain types

## 🎮 Controls

### Camera
- **WASD / Arrow Keys** - Pan camera
- **Right-click drag** - Pan camera
- **Mouse wheel** - Zoom (0.5x - 2.0x, centered on cursor)

### Selection
- **Left click** - Select army/settlement or move selected army
- **Esc** - Deselect

### Turn Management
- **Spacebar** - End turn (triggers AI, production, healing)

### Battle Controls
- **1x / 2x buttons** - Adjust battle speed
- **Pause button** - Pause/resume battle
- **Retreat button** - Forfeit battle (lose attacker)

## 🔧 Development Commands

```bash
# Install dependencies
npm install

# Start dev server (HTTPS on port 3000)
npm run dev

# Type check
npm run type-check

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📋 Current State & Next Steps

### ✅ Fully Implemented
- Hexagonal grid strategy map with fog of war
- 28 Pokemon with full stats, types, abilities
- 7 medieval unit types
- Real-time auto-battler combat
- Type effectiveness system (18 types)
- Wild Pokemon spawning & capture
- Settlement production & Pokemon Center healing
- Resource management (food, production, gold)
- Enemy AI
- Particle effects
- LPC character sprite integration
- Zoom & camera controls
- HTTPS development server

### 🎨 Asset Customization (Optional)

To create custom unit sprites for lpc-units.png:
1. Navigate to `assets/lpc-components/` folder
2. Layer different components:
   - Base: BODY_male.png, BODY_skeleton.png
   - Armor: TORSO_plate_armor_torso.png, LEGS_plate_armor_pants.png
   - Weapons: (from thrust/, slash/, bow/ folders)
3. Combine layers for each unit type in 576x256 layout
4. Save as `/public/sprites/units/lpc-units.png` (or per-unit in `medieval/`)

### 🔮 Enhancement Ideas
- More Pokemon (expand beyond Gen 3)
- More abilities (currently 6)
- Terrain battle effects
- Save/load system
- Multiplayer (WebSockets)
- Sound effects & music (Howler.js ready)
- Minimap
- Tutorial mode

## 🐛 Known Limitations

- All units share same LPC sprite (placeholder)
- No minimap (shows placeholder)
- Pokemon sprites must be manually placed in /public/sprites/pokemon/
- Camera bounds not enforced (can pan infinitely)

## 📖 Key Files to Reference

**For hex grid logic:**
- [src/utils/hex-math.ts](src/utils/hex-math.ts) - Coordinate conversion
- [src/rendering/map-renderer.ts](src/rendering/map-renderer.ts) - Hex rendering
- [src/systems/map-generator.ts](src/systems/map-generator.ts) - Grid generation

**For combat:**
- [src/main.ts](src/main.ts) - Battle update loop (lines 152-254)
- [src/systems/combat.ts](src/systems/combat.ts) - Damage calculation
- [src/rendering/battle-renderer.ts](src/rendering/battle-renderer.ts) - LPC sprite rendering

**For assets:**
- [src/config/tile-atlas.ts](src/config/tile-atlas.ts) - Sprite mapping definitions
- [src/rendering/asset-manager.ts](src/rendering/asset-manager.ts) - Image loading

## 🎯 Core Principles

1. **Hexagonal Grid Always** - All map logic uses axial coordinates
2. **Type Safety** - Leverage TypeScript for all game logic
3. **Separation of Concerns** - Entities, Systems, Rendering are isolated
4. **Fallback Rendering** - Colored shapes when sprites unavailable
5. **Performance** - Y-sorting, asset caching, efficient rendering

## 🔗 External Resources

- **LPC Universal Character Spritesheet:** http://gaurav.munjal.us/Universal-LPC-Spritesheet-Character-Generator/
- **PMDCollab Pokemon Sprites:** https://sprites.pmdcollab.org/
- **Hex Grid Guide:** https://www.redblobgames.com/grids/hexagons/

---

**Game is fully playable at https://localhost:3000** 🚀
