# Asset Inventory & Requirements

## Directory Structure

```
public/
├── tilesets/
│   ├── nature.png              # 16x16 RPG terrain tiles (grass, water, sand, mountain, trees, rocks, flowers)
│   ├── coastal.png             # 16x16 town/coastal tiles (buildings, piers, lighthouses, beach, fences)
│   ├── terrain/                # [NEEDED] Additional terrain tilesets
│   └── buildings/              # [NEEDED] Settlement & building tilesets
├── sprites/
│   ├── pokemon/                # 1178 PMDCollab follow sprites (4x4 directional walk sheets)
│   │   └── atlasdata.txt       # Atlas layout: 4x4 grid, rows = N/W/E/S
│   ├── units/
│   │   ├── lpc-units.png       # LPC Universal 576x256 spritesheet (placeholder - all units same)
│   │   └── medieval/           # [NEEDED] Per-unit-type LPC spritesheets
│   ├── particles/              # 38 particle mask PNGs (numbered 1-30 with variants)
│   ├── effects/                # [NEEDED] Ability VFX spritesheets
│   ├── battle/                 # [NEEDED] Arena backgrounds, ground tiles
│   └── ui/                     # [NEEDED] HUD icons, resource icons, button frames
└── audio/                      # [NEEDED] SFX and music (Howler.js ready)

assets/
└── lpc-components/             # LPC Universal Spritesheet source components
    ├── README                  # Usage documentation
    ├── examples/               # 15 example character build GIFs
    ├── png/                    # 334 layerable PNG components
    │   ├── bow/                #   Ranged attack animation layers
    │   ├── slash/              #   Melee slash animation layers
    │   ├── thrust/             #   Spear/thrust animation layers
    │   ├── spellcast/          #   Magic cast animation layers
    │   ├── hurt/               #   Damage taken animation layers
    │   ├── walkcycle/          #   Walking animation layers
    │   └── combat_dummy/       #   Target dummy layers
    └── xcf/                    # GIMP project files for compositing
```

## What We Have (Ready to Use)

### Hex Overworld Map
| Asset | File | Details |
|-------|------|---------|
| Terrain tiles | `tilesets/nature.png` | 16x16 tiles: water, grass, plains, sand, forest, mountain, berry grove |
| Trees | `tilesets/nature.png` | Pine (large/small), deciduous - used as forest objects |
| Coastal/town | `tilesets/coastal.png` | Buildings, piers, lighthouses, beach umbrellas, fences, lampposts |
| Pokemon overworld | `sprites/pokemon/` | 1178 PMD follow sprites for wild Pokemon on map |

### Auto-Battler Combat
| Asset | File | Details |
|-------|------|---------|
| Medieval units | `sprites/units/lpc-units.png` | LPC 576x256 - idle/walk/attack anims, 4 directions |
| Pokemon battle | `sprites/pokemon/` | Same PMD sprites used in battle arena |
| Particle effects | `sprites/particles/` | 38 mask PNGs for ability particle FX |
| LPC components | `assets/lpc-components/png/` | 334 layerable PNGs to build per-unit-type sprites |

## What We Need

### Priority 1: Distinct Medieval Unit Sprites
Currently all 7 unit types share one LPC sprite. Use `assets/lpc-components/` to composite:

| Unit Type | Layers to Combine | Style Reference |
|-----------|-------------------|-----------------|
| Infantry | BODY_male + chain_armor + longsword + steel_helmet | `examples/chain_armor.gif` |
| Spearman | BODY_male + leather_armor + spear | `examples/leather_armor.gif` |
| Cavalry | BODY_male + plate_armor + lance | `examples/plate_armor.gif` |
| Archer | BODY_male + leather + longbow + quiver | `examples/robin_hoodlike.gif` |
| Crossbowman | BODY_male + chain_armor + crossbow | `examples/chain_armor_bandit.gif` |
| Mage | BODY_male + robe + staff | `examples/robe.gif` |
| Settler | BODY_male + simple_clothes | `examples/simple_clothes.gif` |

Output: 7 separate 576x256 PNGs → `public/sprites/units/medieval/`

### Priority 2: Battle Arena Assets
| Need | Format | Notes |
|------|--------|-------|
| Arena ground tile | 16x16 or 32x32 PNG | Grass/dirt battle field - tileable |
| Arena background | 1000x600 PNG | Sky/treeline behind battle area |
| Victory/defeat banners | 400x200 PNG | End-of-battle overlay |

### Priority 3: Overworld Building Sprites
| Need | Format | Notes |
|------|--------|-------|
| Settlement (small) | 32x32 or 48x48 | Replaces emoji settlement markers |
| Settlement (large) | 64x64 | Upgraded settlement |
| Pokemon Center | 32x32 | Distinct healing building |
| Barracks | 32x32 | Unit production building |
| Gym | 32x32 | Pokemon training building |
| Candy Factory | 32x32 | Resource building |

Source candidates: `tilesets/coastal.png` already has buildings (ships, houses) that could be repurposed.

### Priority 4: UI Elements
| Need | Format | Notes |
|------|--------|-------|
| Resource icons | 16x16 each | Food, Production, Gold, Apricorn, Rare Candy |
| HP bar frame | Scalable 9-slice | For battle unit health bars |
| Button frames | 9-slice PNG | For battle controls, menus |
| Turn indicator | 32x32 | Current turn/phase icon |
| Minimap frame | Border PNG | For future minimap feature |

### Priority 5: Audio (Howler.js Ready)
| Need | Format | Notes |
|------|--------|-------|
| Battle BGM | .ogg/.mp3 | Looping combat music |
| Overworld BGM | .ogg/.mp3 | Exploration theme |
| Attack SFX | .ogg | Melee hit, ranged shot, ability cast |
| UI SFX | .ogg | Click, turn end, capture success/fail |
| Victory/defeat jingle | .ogg | Short stingers |

## Tile Atlas Mapping

All overworld assets route through `src/config/tile-atlas.ts` which maps sprite source coordinates to terrain types and objects. The atlas currently references 3 sources:

```typescript
sources: {
    nature: "/tilesets/nature.png",
    coastal: "/tilesets/coastal.png",
    lpc: "/sprites/units/lpc-units.png"
}
```

To add new tilesets, add entries to `sources` and reference them in `terrain_map` or `objects`.

## Compatible Art Style

All assets should match the **16x16 pixel art** aesthetic (scaled 4x to 64x64 for rendering). The existing tilesheets use a Pokemon/RPG Maker style with:
- Limited color palettes per tile
- Black outlines on objects
- Top-down perspective for terrain, 3/4 view for objects and buildings
- LPC units are 64x64 native with 4-direction animation strips
