# Asset Inventory & Requirements

## Directory Structure

```
public/
├── tilesets/
│   ├── nature.png              # 16x16 RPG terrain tiles (grass, water, sand, mountain, trees, rocks)
│   ├── coastal.png             # 16x16 town/coastal tiles (buildings, piers, lighthouses, beach)
│   ├── overworld-frlg.png      # FireRed/LeafGreen outdoor tileset (16x16, comprehensive)
│   ├── buildings-objects.png   # Large tileset with buildings, objects, terrain variants (860x1339)
│   ├── terrain/                # Additional terrain tilesets (future)
│   └── buildings/              # Settlement & building tilesets (future)
├── sprites/
│   ├── pokemon/                # 1177 PMDCollab follow sprites (4x4 directional walk sheets)
│   │   └── atlasdata.txt       # Atlas layout: 4x4 grid, rows = N/W/E/S
│   ├── units/
│   │   ├── lpc-units.png       # LPC Universal 576x256 (placeholder - all units same)
│   │   └── medieval/           # Per-unit-type LPC spritesheets (future)
│   ├── particles/              # 38 particle mask PNGs for ability VFX
│   ├── effects/                # Ability VFX spritesheets (future)
│   ├── battle/                 # Arena backgrounds, ground tiles (future)
│   └── ui/
│       ├── items/              # 1074 pokesprite item icons (32x32) in 37 categories
│       │   ├── ball/           # Pokeballs (poke, great, ultra, master, etc.)
│       │   ├── berry/          # All berries (cheri, leppa, sitrus, etc.)
│       │   ├── hold-item/      # Held items (assault-vest, choice-band, etc.)
│       │   ├── evo-item/       # Evolution items (fire-stone, thunderstone, etc.)
│       │   ├── medicine/       # Potions, revives, vitamins
│       │   ├── key-item/       # Key items
│       │   ├── gem/            # Type gems
│       │   ├── plate/          # Arceus plates
│       │   └── ...             # 29 more categories
│       ├── pokemon-icons/      # 1352 Pokemon box sprites (68x56, Gen 8 style)
│       ├── types/              # 72 type icons across 4 styles (gen8, go, legends-arceus, masters)
│       │   └── gen8/           # Primary: bug, dark, dragon, fire, etc. (18 types)
│       ├── elements/           # 100 Crusenho Flat UI sprites (buttons, bars, frames, icons)
│       └── misc/               # Additional UI sprites (future)
└── audio/
    ├── bgm-overworld.mp3       # Overworld background music
    ├── bgm-battle.mp3          # Battle background music
    └── *.ogg                   # 100 Kenney interface sounds (click, confirm, error, etc.)

assets/                         # Source files (not served at runtime)
├── lpc-components/             # LPC Universal Spritesheet source components
│   ├── png/                    # 334 layerable PNGs by animation type
│   ├── examples/               # 15 example character build GIFs
│   └── xcf/                    # GIMP project files
├── pokesprite/                 # Full pokesprite repo (cloned, gitignored)
│   ├── items/                  # Source item sprites
│   ├── pokemon-gen8/           # Source Pokemon box sprites
│   ├── misc/                   # Ribbons, type logos, body styles
│   └── data/                   # JSON metadata (pokemon.json, item-map.json)
├── crusenho-ui/                # Extracted Crusenho UI pack
├── kenney-sounds/              # Extracted Kenney interface sounds
└── *.mp3                       # Source background music files
```

## Asset Counts

| Category | Count | Format | Location |
|----------|-------|--------|----------|
| Tilesets | 4 sheets | 16x16 PNG | `public/tilesets/` |
| Pokemon PMD sprites | 1177 | 4x4 walk sheets | `public/sprites/pokemon/` |
| Pokemon box icons | 1352 | 68x56 PNG | `public/sprites/ui/pokemon-icons/` |
| Item sprites | 1074 | 32x32 PNG | `public/sprites/ui/items/` |
| Type icons | 72 | Various PNG | `public/sprites/ui/types/` |
| UI elements | 100 | Various PNG | `public/sprites/ui/elements/` |
| Particle masks | 38 | 16x16 PNG | `public/sprites/particles/` |
| LPC unit sheet | 1 | 576x256 PNG | `public/sprites/units/` |
| Sound effects | 100 | OGG | `public/audio/` |
| Background music | 2 | MP3 | `public/audio/` |
| **Total runtime assets** | **3920** | | |

## Config Files

### `src/config/tile-atlas.ts`
Maps tilesheet sources to terrain types and objects. Registered sources:
```typescript
sources: {
    nature: "/tilesets/nature.png",
    coastal: "/tilesets/coastal.png",
    overworld: "/tilesets/overworld-frlg.png",
    buildings_objects: "/tilesets/buildings-objects.png",
    lpc: "/sprites/units/lpc-units.png",
    ui: "/sprites/ui/elements/Spritesheet_UI_Flat.png"
}
```

### `src/config/sprite-index.ts`
Resolves game entities to sprite file paths:
- `getItemSpritePath(category, name)` → item icon path
- `getPokemonIconById(pokemonId)` → box sprite path
- `getTypeIconPath(type)` → type icon path
- `getBallSpritePath(type)` → pokeball icon path
- `AUDIO` object → all audio file paths
- `UI_SPRITES` object → all UI element paths

## What's Still Needed

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
| Arena ground tile | 16x16 tileable | Can extract from overworld-frlg.png or buildings-objects.png |
| Arena background | 1000x600 PNG | Sky/treeline behind battle area |
| Victory/defeat banners | 400x200 PNG | End-of-battle overlay |

### Priority 3: Overworld Building Sprites
Source: `buildings-objects.png` has extensive building tiles that can be mapped in tile-atlas.ts

| Need | Source Candidate | Notes |
|------|-----------------|-------|
| Settlement (small) | buildings-objects.png | Multiple house styles available |
| Settlement (large) | buildings-objects.png | Larger building composites |
| Pokemon Center | buildings-objects.png + recolor | Red-roofed building |
| Barracks | buildings-objects.png | Military-style building |

## Compatible Art Style

All assets should match the **16x16 pixel art** aesthetic (scaled 4x to 64x64 for rendering):
- Limited color palettes per tile
- Black outlines on objects
- Top-down perspective for terrain, 3/4 view for objects and buildings
- LPC units are 64x64 native with 4-direction animation strips
- UI sprites (pokesprite items, type icons) are higher-res but designed for small display
