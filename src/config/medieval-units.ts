import type { MedievalUnitData } from '../types';

export const MEDIEVAL_UNIT_TYPES: Record<string, MedievalUnitData> = {
    Infantry: { hp: 80, attack: 10, defense: 15, speed: 1.2, range: 40, color: '#8b7355', cost: { prod: 10, gold: 5 } },
    Spearman: { hp: 70, attack: 12, defense: 10, speed: 1.3, range: 60, color: '#6b5d4f', cost: { prod: 12, gold: 6 } },
    Cavalry: { hp: 100, attack: 18, defense: 8, speed: 2.5, range: 40, color: '#6366f1', cost: { prod: 20, gold: 15, wood: 10 } },
    Archer: { hp: 50, attack: 10, defense: 5, speed: 1.8, range: 200, color: '#22c55e', cost: { prod: 15, gold: 8, wood: 5 } },
    Crossbowman: { hp: 60, attack: 14, defense: 8, speed: 1.5, range: 180, color: '#16a34a', cost: { prod: 18, gold: 10, wood: 8 } },
    Mage: { hp: 45, attack: 16, defense: 5, speed: 1.6, range: 150, color: '#a855f7', cost: { prod: 25, gold: 20, leppa_berries: 5 } },
    Settler: { hp: 30, attack: 0, defense: 5, speed: 1.2, range: 0, color: '#eab308', cost: { prod: 40, gold: 30 } }
};
