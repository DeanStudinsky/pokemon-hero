# Pokemon Conquest Strategy Game

A hexagonal strategy game combining Civilization-style resource management with Hero's Hour style real-time auto-battling, featuring Pokemon as elite special units.

## 🎮 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

## 🎯 How to Play

### Controls
- **Click** - Select armies, settlements, or move selected units
- **WASD / Arrow Keys** - Pan the camera around the map
- **Space** - End turn
- **Esc** - Deselect current selection
- **H** - Toggle help overlay

### Gameplay Loop

1. **Explore the Map**
   - Your starting army reveals fog of war as you move
   - Wild Pokemon spawn on the map (marked with ✨🔴)
   - Enemy settlements are scattered across the map

2. **Build Your Forces**
   - Select settlements to queue unit production
   - Train 7 types of medieval units (Infantry, Cavalry, Archer, etc.)
   - Capture wild Pokemon by moving armies onto their tiles

3. **Manage Resources**
   - **Food** (🌾) - Unit upkeep
   - **Production** (⚙️) - Training units
   - **Gold** (💰) - Building costs

4. **Battle**
   - Move armies into enemy armies to trigger real-time battles
   - Units automatically fight using their stats and abilities
   - Pokemon use special abilities (damage, AoE, healing, buffs, control)
   - Type effectiveness applies between Pokemon

5. **Pokemon System**
   - Max 3 Pokemon per army
   - Pokemon have roles: Tank, Damage, Support, Control
   - Pokemon death is **permanent** unless:
     - Defending at a settlement with a Pokemon Center
     - Pokemon Center heals over 5 turns

### Battle Controls
When in battle:
- **1x Speed** - Normal battle speed
- **2x Speed** - Fast battle speed
- **⏸️ Pause** - Pause the battle
- **Retreat** - Forfeit the battle (lose attacking army)

## 📦 Features

### Implemented ✅
- Hexagonal tile-based strategy map
- Fog of war exploration
- 28 unique Pokemon with stats, types, and abilities
- 7 medieval unit types
- 6 Pokemon abilities (Quick Attack, Earthquake, Protect, Heal Pulse, Ice Beam, Revival)
- Real-time auto-battler combat
- Type effectiveness system (18 types)
- Wild Pokemon spawning and capture
- Settlement production queues
- Pokemon Center healing system
- Resource management (food, production, gold)
- Enemy AI
- Particle effects
- Combat log

### Tech Stack
- **TypeScript** - Full type safety
- **Vite** - Lightning-fast dev server
- **Zustand** - State management
- **Vanilla Canvas** - High-performance rendering
- **Modular Architecture** - 30+ focused modules

## 📁 Project Structure

```
src/
├── main.ts              # Game entry point
├── types.ts             # TypeScript definitions
├── config/              # Game data (Pokemon, units, abilities)
├── core/                # State management & input handling
├── entities/            # Game entity classes
├── systems/             # Game logic systems
├── rendering/           # Canvas rendering
└── utils/               # Helper functions
```

## 🎨 Adding Assets

### Pokemon Sprites
Place PMDCollab sprites in `/public/followsprites/`:
- Format: `0252.png` (Pokemon ID padded to 4 digits)
- Example: Treecko = `0252.png`, Blaziken = `0257.png`

### Particle Sprites
Place particle masks in `/public/masks for particles 3 transparent/`:
- Numbered sprites: `1.png`, `2.png`, etc.
- Variants: `26b.png`
- Used for ability effects with color tinting

## 🔧 Development

```bash
# Type checking
npm run type-check

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🎯 Game Balance

### Medieval Units
| Unit | HP | Attack | Defense | Speed | Range | Cost |
|------|-----|--------|---------|-------|-------|------|
| Infantry | 80 | 10 | 15 | 1.2 | 40 | 10⚙️ 5💰 |
| Spearman | 70 | 12 | 10 | 1.3 | 60 | 12⚙️ 6💰 |
| Cavalry | 100 | 18 | 8 | 2.5 | 40 | 20⚙️ 15💰 |
| Archer | 50 | 10 | 5 | 1.8 | 200 | 15⚙️ 8💰 |
| Crossbowman | 60 | 14 | 8 | 1.5 | 180 | 18⚙️ 10💰 |
| Mage | 45 | 16 | 5 | 1.6 | 150 | 25⚙️ 20💰 |

### Pokemon Abilities
- **Quick Attack** - Fast single-target damage (40 frame cooldown)
- **Earthquake** - AoE ground damage in 150px radius (120 frame cooldown)
- **Protect** - Shield buff reducing damage by 70% for 2 seconds (90 frame cooldown)
- **Heal Pulse** - Heals lowest HP ally for 2x caster attack (150 frame cooldown)
- **Ice Beam** - Damage with 30% chance to stun for 1 second (80 frame cooldown)
- **Revival** - Revive fallen ally at 30% HP (240 frame cooldown)

## 🚀 Next Steps

Optional enhancements:
1. Add Pokemon sprite assets
2. Add sound effects (Howler.js is included)
3. Implement minimap
4. Add more Pokemon and abilities
5. Terrain effects in battle
6. Save/load system
7. Tutorial mode

## 📚 Documentation

- **[CLAUDE.md](CLAUDE.md)** - Complete architecture guide
- **[MIGRATION_STATUS.md](MIGRATION_STATUS.md)** - Migration checklist

## 🎮 Tips

- Pokemon are powerful but limited (max 3 per army)
- Build Pokemon Centers early to avoid permanent Pokemon loss
- Different terrains spawn different Pokemon rarities
- Medieval units are expendable fodder - use them strategically
- Type effectiveness only applies Pokemon vs Pokemon
- Cavalry is fast and strong, perfect for hit-and-run tactics
- Archers and Crossbowmen can attack from safety

## 🐛 Known Issues

- Pokemon sprites need to be added to `/public/followsprites/`
- Some visual placeholders (medieval units = colored circles)
- Minimap is placeholder
- Camera panning limits not implemented

## 📝 License

This is a personal project. Pokemon is © Nintendo/Game Freak/Creatures Inc.

---

**Made with TypeScript, Vite, and Zustand**

Enjoy conquering the map! 🎮⚔️✨
