/**
 * Sprite Index - Resolves game entities to their sprite file paths
 *
 * Pokesprite items: /sprites/ui/items/{category}/{name}.png (32x32)
 * Pokemon box icons: /sprites/ui/pokemon-icons/{name}.png (68x56)
 * Type icons: /sprites/ui/types/gen8/{type}.png
 * Pokeball icons: /sprites/ui/items/ball/{name}.png
 * UI elements: /sprites/ui/elements/ (Crusenho Flat Theme)
 */

import { POKEMON_DATA } from '@config/pokemon-data';

// --- Item Sprites (from pokesprite) ---

/** All available item categories in /sprites/ui/items/ */
export const ITEM_CATEGORIES = [
    'apricorn', 'ball', 'battle-item', 'berry', 'evo-item',
    'exp-candy', 'fossil', 'gem', 'hold-item', 'incense',
    'key-item', 'medicine', 'mega-stone', 'mint', 'plate',
    'valuable-item', 'tm', 'shard', 'flute', 'mulch',
    'scarf', 'memory', 'other-item'
] as const;

export type ItemCategory = typeof ITEM_CATEGORIES[number];

/**
 * Get the sprite path for an item
 * @param category - Item category folder (e.g. 'berry', 'hold-item', 'ball')
 * @param name - Item filename without extension (e.g. 'cheri', 'assault-vest', 'ultra')
 */
export function getItemSpritePath(category: string, name: string): string {
    return `/sprites/ui/items/${category}/${name}.png`;
}

/**
 * Get pokeball sprite path
 */
export function getBallSpritePath(ballType: string): string {
    return `/sprites/ui/items/ball/${ballType}.png`;
}

/**
 * Get berry sprite path
 */
export function getBerrySpritePath(berryName: string): string {
    return `/sprites/ui/items/berry/${berryName}.png`;
}

// --- Pokemon Box Icons (68x56, from pokesprite gen8) ---

/**
 * Get the box icon sprite path for a Pokemon by name
 * @param name - Pokemon name in lowercase-hyphenated form (e.g. 'blaziken', 'mr-mime')
 */
export function getPokemonIconPath(name: string): string {
    return `/sprites/ui/pokemon-icons/${name.toLowerCase()}.png`;
}

/**
 * Get the box icon path for a Pokemon by national dex ID
 * Looks up the name from POKEMON_DATA and converts to pokesprite filename format
 */
export function getPokemonIconById(pokemonId: number): string {
    const data = POKEMON_DATA[pokemonId];
    if (!data) return `/sprites/ui/pokemon-icons/unknown.png`;
    // Convert "Blaziken" → "blaziken", "Mr. Mime" → "mr-mime"
    const name = data.name.toLowerCase().replace(/[.\s]+/g, '-').replace(/[^a-z0-9-]/g, '');
    return `/sprites/ui/pokemon-icons/${name}.png`;
}

// --- Type Icons ---

/**
 * Get type icon sprite path (Gen 8 style)
 * @param type - Pokemon type in lowercase (e.g. 'fire', 'water', 'grass')
 */
export function getTypeIconPath(type: string): string {
    return `/sprites/ui/types/gen8/${type.toLowerCase()}.png`;
}

// --- Audio ---

export const AUDIO = {
    bgm: {
        overworld: '/audio/bgm-overworld.mp3',
        battle: '/audio/bgm-battle.mp3',
    },
    sfx: {
        click: '/audio/click_001.ogg',
        confirm: '/audio/confirmation_001.ogg',
        error: '/audio/error_004.ogg',
        open: '/audio/maximize_003.ogg',
        close: '/audio/minimize_003.ogg',
        drop: '/audio/drop_002.ogg',
        toggle: '/audio/toggle_001.ogg',
        glass: '/audio/glass_003.ogg',
        back: '/audio/back_001.ogg',
        scroll: '/audio/scroll_001.ogg',
        pluck: '/audio/pluck_001.ogg',
    }
} as const;

// --- UI Elements (Crusenho Flat Theme) ---

/** Base path for Crusenho UI element sprites */
export const UI_ELEMENTS_PATH = '/sprites/ui/elements';

/** Commonly used UI element sprite filenames */
export const UI_SPRITES = {
    // Frames & panels
    frame_light: `${UI_ELEMENTS_PATH}/UI_Flat_Frame01a.png`,
    frame_blue: `${UI_ELEMENTS_PATH}/UI_Flat_Frame02a.png`,
    frame_dark: `${UI_ELEMENTS_PATH}/UI_Flat_Frame03a.png`,
    slot_light: `${UI_ELEMENTS_PATH}/UI_Flat_FrameSlot01a.png`,
    slot_blue: `${UI_ELEMENTS_PATH}/UI_Flat_FrameSlot02a.png`,
    slot_dark: `${UI_ELEMENTS_PATH}/UI_Flat_FrameSlot03a.png`,

    // Buttons
    button_light: `${UI_ELEMENTS_PATH}/UI_Flat_Button01a_1.png`,
    button_blue: `${UI_ELEMENTS_PATH}/UI_Flat_Button02a_1.png`,
    button_pressed: `${UI_ELEMENTS_PATH}/UI_Flat_Button01a_2.png`,

    // Bars (HP, XP, etc.)
    bar_frame: `${UI_ELEMENTS_PATH}/UI_Flat_Bar01a.png`,
    bar_fill_green: `${UI_ELEMENTS_PATH}/UI_Flat_BarFill01a.png`,
    bar_fill_blue: `${UI_ELEMENTS_PATH}/UI_Flat_BarFill01b.png`,
    bar_fill_red: `${UI_ELEMENTS_PATH}/UI_Flat_BarFill01c.png`,
    bar_fill_yellow: `${UI_ELEMENTS_PATH}/UI_Flat_BarFill01d.png`,
    bar_fill_orange: `${UI_ELEMENTS_PATH}/UI_Flat_BarFill01e.png`,

    // Icons
    icon_arrow: `${UI_ELEMENTS_PATH}/UI_Flat_IconArrow01a.png`,
    icon_check: `${UI_ELEMENTS_PATH}/UI_Flat_IconCheck01a.png`,
    icon_cross: `${UI_ELEMENTS_PATH}/UI_Flat_IconCross01a.png`,
    icon_dropdown: `${UI_ELEMENTS_PATH}/UI_Flat_IconDropdown01a.png`,
    icon_play: `${UI_ELEMENTS_PATH}/UI_Flat_IconPlay01a.png`,

    // Banners
    banner_light: `${UI_ELEMENTS_PATH}/UI_Flat_Banner01a.png`,
    banner_blue: `${UI_ELEMENTS_PATH}/UI_Flat_Banner02a.png`,

    // Spritesheet (full atlas)
    spritesheet: `${UI_ELEMENTS_PATH}/Spritesheet_UI_Flat.png`,
} as const;
