/**
 * Tile Atlas - Maps 16x16 sprite assets to game terrain and objects
 */

export interface TileDefinition {
    source: string;
    x: number;
    y: number;
    w?: number;
    h?: number;
}

export interface ObjectDefinition extends TileDefinition {
    id: string;
    w: number;
    h: number;
    anchor_y: number;
    hex_width?: number;
    collision_mask?: string;
    type?: string;
}

export interface UnitSpriteDefinition {
    id: string;
    source: string;
    idle: { x: number; y: number; frames: number };
    walk: { x: number; y: number; frames: number };
    attack: { x: number; y: number; frames: number };
    width: number;
    height: number;
}

export interface TileAtlas {
    meta: {
        tileSize: number;
        scaleFactor: number;
    };
    sources: {
        [key: string]: string;
    };
    terrain_map: {
        [key: string]: TileDefinition;
    };
    objects: {
        trees: ObjectDefinition[];
        buildings: ObjectDefinition[];
    };
    units: {
        medieval: { [key: string]: UnitSpriteDefinition };
    };
}

export const TILE_ATLAS: TileAtlas = {
    meta: {
        tileSize: 16,
        scaleFactor: 4, // Scale up 16x16 tiles to 64x64 to cover hex gaps
    },
    sources: {
        nature: "/tilesets/nature.png",
        coastal: "/tilesets/coastal.png",
        overworld: "/tilesets/overworld-frlg.png",
        buildings_objects: "/tilesets/buildings-objects.png",
        lpc: "/sprites/units/lpc-units.png",
        ui: "/sprites/ui/elements/Spritesheet_UI_Flat.png"
    },
    // Mapping terrain types from Hex.ts to specific sprite coordinates
    terrain_map: {
        water: { source: "nature", x: 0, y: 0 },       // Deep Ocean
        water_shore: { source: "nature", x: 16, y: 0 }, // Shallow/Shore
        sand: { source: "nature", x: 0, y: 16 },       // Sand
        grass: { source: "nature", x: 16, y: 16 },     // Basic Grass
        plains: { source: "nature", x: 32, y: 16 },    // Plains (lighter grass)
        forest: { source: "nature", x: 16, y: 16 },    // Forest uses grass base + tree object
        mountain: { source: "nature", x: 48, y: 16 },  // Rocky terrain
        berry_grove: { source: "nature", x: 32, y: 0 }, // Berry grove (using sand sprite as placeholder)
    },
    // Large objects that sit ON TOP of a hex (Anchor: Bottom-Center)
    objects: {
        // Trees (Randomly selected for 'forest' terrain)
        trees: [
            {
                id: "pine_large",
                source: "nature",
                x: 0, y: 32,
                w: 32, h: 48,
                anchor_y: 44
            },
            {
                id: "pine_small",
                source: "nature",
                x: 32, y: 32,
                w: 16, h: 32,
                anchor_y: 28
            },
            {
                id: "deciduous",
                source: "nature",
                x: 0, y: 80,
                w: 48, h: 48,
                anchor_y: 44
            }
        ],
        // Structures (For Settlements or special map features)
        buildings: [
            {
                id: "lighthouse",
                source: "coastal",
                x: 0, y: 624,
                w: 64, h: 128,
                anchor_y: 120, // Low anchor so players walk "behind" the top
                hex_width: 2,  // Visually spans 2 hexes wide
                collision_mask: "red_x_logic"
            },
            {
                id: "pier_vertical",
                source: "coastal",
                x: 0, y: 1248,
                w: 80, h: 80,
                anchor_y: 40,
                type: "bridge"
            }
        ]
    },
    // LPC character sprites for medieval units (64x64 sprites)
    // Using LPC Universal Character format: 576x256 (9 frames x 4 directions)
    // All units share same base sprite for now (placeholder)
    units: {
        medieval: {
            'Infantry': {
                id: 'infantry',
                source: 'lpc',
                idle: { x: 0, y: 128, frames: 1 },      // Down-facing idle (row 2, frame 0)
                walk: { x: 64, y: 128, frames: 8 },     // Down-facing walk (row 2, frames 1-8)
                attack: { x: 0, y: 128, frames: 6 },    // Thrust animation (frames 0-5)
                width: 64,
                height: 64
            },
            'Spearman': {
                id: 'spearman',
                source: 'lpc',
                idle: { x: 0, y: 128, frames: 1 },
                walk: { x: 64, y: 128, frames: 8 },
                attack: { x: 0, y: 128, frames: 6 },
                width: 64,
                height: 64
            },
            'Cavalry': {
                id: 'cavalry',
                source: 'lpc',
                idle: { x: 0, y: 128, frames: 1 },
                walk: { x: 64, y: 128, frames: 8 },
                attack: { x: 0, y: 128, frames: 6 },
                width: 64,
                height: 64
            },
            'Archer': {
                id: 'archer',
                source: 'lpc',
                idle: { x: 0, y: 128, frames: 1 },
                walk: { x: 64, y: 128, frames: 8 },
                attack: { x: 0, y: 128, frames: 6 },
                width: 64,
                height: 64
            },
            'Crossbowman': {
                id: 'crossbowman',
                source: 'lpc',
                idle: { x: 0, y: 128, frames: 1 },
                walk: { x: 64, y: 128, frames: 8 },
                attack: { x: 0, y: 128, frames: 6 },
                width: 64,
                height: 64
            },
            'Mage': {
                id: 'mage',
                source: 'lpc',
                idle: { x: 0, y: 128, frames: 1 },
                walk: { x: 64, y: 128, frames: 8 },
                attack: { x: 0, y: 128, frames: 6 },
                width: 64,
                height: 64
            },
            'Settler': {
                id: 'settler',
                source: 'lpc',
                idle: { x: 0, y: 128, frames: 1 },
                walk: { x: 64, y: 128, frames: 8 },
                attack: { x: 0, y: 128, frames: 1 },
                width: 64,
                height: 64
            }
        }
    }
};

/**
 * Get unit sprite definition
 */
export function getUnitSprite(unitType: string): UnitSpriteDefinition | null {
    return TILE_ATLAS.units.medieval[unitType] || null;
}

/**
 * Get a deterministic random tree for a hex coordinate
 */
export function getTreeForHex(q: number, r: number): ObjectDefinition {
    // Deterministic random based on hex coordinates
    const seed = Math.abs(Math.sin(q * 12.9898 + r * 78.233));
    const index = Math.floor(seed * TILE_ATLAS.objects.trees.length);
    return TILE_ATLAS.objects.trees[index];
}

/**
 * Get terrain sprite definition
 */
export function getTerrainSprite(terrainType: string): TileDefinition {
    return TILE_ATLAS.terrain_map[terrainType] || TILE_ATLAS.terrain_map.grass;
}
