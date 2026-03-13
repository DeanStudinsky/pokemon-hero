export const HEX_SIZE = 32;
export const MAP_RADIUS = 14;

export const THEME = {
    fog: '#0a0c12',
    unexplored: '#12151f',
    grass: { base: '#2d5a3a', light: '#3d7a4d', dark: '#1d4028' },
    forest: { base: '#1a4025', light: '#2a5a35', dark: '#0f2a18' },
    mountain: { base: '#5a6070', light: '#7a8090', dark: '#3a4050' },
    water: { base: '#1a4a70', light: '#2a6090', dark: '#0f3050' },
    plains: { base: '#6a8040', light: '#8aa050', dark: '#4a6030' },
    berry_grove: { base: '#8a4080', light: '#aa5090', dark: '#6a3060' }, // Purple theme for berry groves
    player: '#3b82f6',
    enemy: '#ef4444',
    gold: '#ffd700'
} as const;

export const SETTLEMENT_NAMES = [
    'Pallet Town', 'Viridian City', 'Pewter Keep', 'Cerulean Fort',
    'Vermillion Hold', 'Lavender Watch', 'Celadon Castle', 'Saffron Citadel',
    'Fuchsia Fortress', 'Cinnabar Bastion', 'Indigo Stronghold', 'Victory Hold'
] as const;

export const TYPE_COLORS = {
    fire: '#F08030',
    water: '#6890F0',
    grass: '#78C850',
    electric: '#F8D030',
    psychic: '#F85888',
    fighting: '#C03028',
    dragon: '#7038F8',
    ground: '#E0C068',
    flying: '#A890F0',
    steel: '#B8B8D0',
    rock: '#B8A038',
    normal: '#A8A878',
    ice: '#98D8D8',
    dark: '#705848',
    fairy: '#EE99AC',
    poison: '#A040A0',
    ghost: '#705898',
    bug: '#A8B820'
} as const;

export const STARTER_POKEMON = [252, 255, 258, 280, 304, 285, 263, 309, 371, 307] as const;
export const EVOLVED_POKEMON = [254, 257, 260, 282, 306, 286, 264, 310, 373, 308] as const;
