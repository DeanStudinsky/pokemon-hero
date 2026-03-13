import { axialToScreen } from '@utils/hex-math';
import type { HexCoords, ScreenCoords, TerrainType, Faction } from '../types';
import { useGameStore } from '@core/state';

export class Hex implements HexCoords {
    q: number;
    r: number;
    type: TerrainType;
    owner: Faction;
    visible: boolean;
    explored: boolean;

    constructor(q: number, r: number, type: TerrainType = 'grass') {
        this.q = q;
        this.r = r;
        this.type = type;
        this.owner = 'none';
        this.visible = false;
        this.explored = false;
    }

    /**
     * Get screen coordinates for this hex
     */
    getScreenCoords(): ScreenCoords {
        const camera = useGameStore.getState().camera;
        return axialToScreen(this.q, this.r, camera);
    }

    /**
     * Get hex key for storage in map
     */
    getKey(): string {
        return `${this.q},${this.r}`;
    }

    /**
     * Set terrain type
     */
    setTerrain(type: TerrainType): void {
        this.type = type;
    }

    /**
     * Set owner faction
     */
    setOwner(faction: Faction): void {
        this.owner = faction;
    }

    /**
     * Mark as visible
     */
    setVisible(visible: boolean): void {
        this.visible = visible;
        if (visible) {
            this.explored = true;
        }
    }

    /**
     * Check if hex is passable
     */
    isPassable(): boolean {
        return this.type !== 'water';
    }

    /**
     * Get movement cost for this terrain
     */
    getMovementCost(): number {
        switch (this.type) {
            case 'grass': return 1;
            case 'plains': return 1;
            case 'forest': return 2;
            case 'mountain': return 3;
            case 'berry_grove': return 1;
            case 'water': return 999; // Impassable
            default: return 1;
        }
    }

    /**
     * Get resource yield from this terrain type
     */
    getResourceYield(): Partial<Resources> {
        switch (this.type) {
            case 'grass':
                return { food: 2, apricorns: 0.2 };
            case 'plains':
                return { food: 1, gold: 1, wood: 0.5 };
            case 'forest':
                return { production: 1, wood: 2, leppa_berries: 0.3 };
            case 'mountain':
                return { production: 2, gold: 1 };
            case 'berry_grove':
                return { food: 1, apricorns: 1, leppa_berries: 1 };
            case 'water':
                return {};
            default:
                return {};
        }
    }
}
