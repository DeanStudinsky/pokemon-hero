import { useGameStore } from './state';
import { processResourceGeneration } from '@systems/resource-generation';
import { convertGoldToCandy } from '@systems/pokemon-training';
import { addLog } from '@utils/logger';

const CAMERA_PAN_SPEED = 20;
const ZOOM_SPEED = 0.1;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.0;

// Drag state
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;
let currentZoom = 1.0;

/**
 * Setup all keyboard and mouse input handlers
 */
export function setupInputHandlers(canvas: HTMLCanvasElement): void {
    // Keyboard handler
    document.addEventListener('keydown', handleKeyDown);

    // Mouse handlers
    canvas.addEventListener('click', handleMouseClick);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleMouseWheel, { passive: false });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault()); // Prevent right-click menu
}

/**
 * Handle keyboard input
 */
function handleKeyDown(e: KeyboardEvent): void {
    const state = useGameStore.getState();

    switch(e.key.toLowerCase()) {
        // Camera panning
        case 'arrowup':
        case 'w':
            e.preventDefault();
            state.moveCamera(0, CAMERA_PAN_SPEED);
            break;

        case 'arrowdown':
        case 's':
            e.preventDefault();
            state.moveCamera(0, -CAMERA_PAN_SPEED);
            break;

        case 'arrowleft':
        case 'a':
            e.preventDefault();
            state.moveCamera(CAMERA_PAN_SPEED, 0);
            break;

        case 'arrowright':
        case 'd':
            e.preventDefault();
            state.moveCamera(-CAMERA_PAN_SPEED, 0);
            break;

        // Deselect
        case 'escape':
            state.selectArmy(null);
            state.selectSettlement(null);
            break;

        // End turn
        case ' ':
            e.preventDefault();
            endTurn();
            break;

        // Toggle help
        case 'h':
            toggleHelp();
            break;

        // Convert gold to candy at selected settlement
        case 'c':
            if (state.selectedSettlement && state.selectedSettlement.owner === 'player') {
                const resources = state.factionResources.player;
                convertGoldToCandy(resources, 1);
            } else {
                addLog('⚠️ Select a player settlement to convert gold!', '#ef4444');
            }
            break;

        // Gym training menu (placeholder)
        case 'g':
            if (state.selectedSettlement && state.selectedSettlement.owner === 'player') {
                if (state.selectedSettlement.buildings.gym) {
                    addLog('💪 Gym training UI coming soon! Use trainPokemon() function for now.', '#ffd700');
                } else {
                    addLog('⚠️ No Gym at this settlement!', '#ef4444');
                }
            } else {
                addLog('⚠️ Select a player settlement with a Gym!', '#ef4444');
            }
            break;
    }
}

/**
 * Handle mouse down (start drag)
 */
function handleMouseDown(e: MouseEvent): void {
    if (e.button === 2) { // Right mouse button
        isDragging = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        e.preventDefault();
    }
}

/**
 * Handle mouse up (end drag)
 */
function handleMouseUp(e: MouseEvent): void {
    if (e.button === 2) {
        isDragging = false;
    }
}

/**
 * Handle mouse click
 */
function handleMouseClick(e: MouseEvent): void {
    // Only handle left clicks for game interaction
    if (e.button === 0) {
        const event = new CustomEvent('gameclick', { detail: { x: e.clientX, y: e.clientY } });
        document.dispatchEvent(event);
    }
}

/**
 * Handle mouse move (drag camera or hover)
 */
function handleMouseMove(e: MouseEvent): void {
    if (isDragging) {
        // Calculate drag delta
        const deltaX = e.clientX - lastMouseX;
        const deltaY = e.clientY - lastMouseY;

        // Update camera position
        const state = useGameStore.getState();
        state.moveCamera(deltaX, deltaY);

        // Update last position
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
    } else {
        // Normal hover for hex highlighting
        const event = new CustomEvent('gamemousemove', { detail: { x: e.clientX, y: e.clientY } });
        document.dispatchEvent(event);
    }
}

/**
 * Handle mouse wheel (zoom)
 */
function handleMouseWheel(e: WheelEvent): void {
    e.preventDefault();

    // Calculate zoom delta
    const delta = -Math.sign(e.deltaY) * ZOOM_SPEED;
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, currentZoom + delta));

    if (newZoom !== currentZoom) {
        // Get mouse position relative to canvas
        const canvas = e.target as HTMLCanvasElement;
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Calculate zoom center (mouse position in world space)
        const state = useGameStore.getState();
        const worldX = (mouseX - state.camera.x) / currentZoom;
        const worldY = (mouseY - state.camera.y) / currentZoom;

        // Update zoom
        currentZoom = newZoom;

        // Adjust camera to keep mouse position consistent
        const newCameraX = mouseX - worldX * currentZoom;
        const newCameraY = mouseY - worldY * currentZoom;

        state.setCamera({ x: newCameraX, y: newCameraY });

        // Store zoom in a custom event for rendering to use
        const zoomEvent = new CustomEvent('zoom', { detail: { zoom: currentZoom } });
        document.dispatchEvent(zoomEvent);
    }
}

/**
 * Get current zoom level
 */
export function getZoom(): number {
    return currentZoom;
}

/**
 * Set zoom level programmatically
 */
export function setZoom(zoom: number): void {
    currentZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
    const zoomEvent = new CustomEvent('zoom', { detail: { zoom: currentZoom } });
    document.dispatchEvent(zoomEvent);
}

/**
 * End turn
 */
function endTurn(): void {
    const state = useGameStore.getState();

    // CRITICAL: Generate resources from controlled territory
    processResourceGeneration(state.settlements, state.factionResources, state.grid);

    // Process healing at Pokemon Centers
    state.settlements.forEach(settlement => {
        if (settlement.buildings.pokemonCenter && settlement.healingQueue.length > 0) {
            const healed = settlement.processHealing();
            healed.forEach((pokemon: any) => {
                console.log(`✅ ${pokemon.name} fully healed at ${settlement.name}!`);
            });
        }
    });

    // Process production for settlements
    state.settlements.forEach(settlement => {
        const completed = settlement.processProduction();
        if (completed) {
            console.log(`🏭 ${settlement.name} completed ${completed.type}!`);
        }
    });

    // Reset army moves
    state.armies.forEach((army: any) => {
        army.resetMoves();
    });

    // Process turn for all systems
    state.nextTurn();

    console.log(`Turn ${state.turn + 1} begins!`);
}

/**
 * Toggle help overlay
 */
function toggleHelp(): void {
    const helpOverlay = document.getElementById('help-overlay');
    if (helpOverlay) {
        helpOverlay.classList.toggle('active');
    }
}

/**
 * Cleanup input handlers
 */
export function cleanupInputHandlers(canvas: HTMLCanvasElement): void {
    document.removeEventListener('keydown', handleKeyDown);
    canvas.removeEventListener('click', handleMouseClick);
    canvas.removeEventListener('mousemove', handleMouseMove);
    canvas.removeEventListener('mousedown', handleMouseDown);
    canvas.removeEventListener('mouseup', handleMouseUp);
    canvas.removeEventListener('wheel', handleMouseWheel);
}
