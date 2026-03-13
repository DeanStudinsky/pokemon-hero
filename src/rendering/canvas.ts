/**
 * Canvas setup and game loop management
 */

let mainCanvas: HTMLCanvasElement | null = null;
let mainCtx: CanvasRenderingContext2D | null = null;
let battleCanvas: HTMLCanvasElement | null = null;
let battleCtx: CanvasRenderingContext2D | null = null;

let animationFrameId: number | null = null;
let lastFrameTime = 0;
let isRunning = false;

type RenderCallback = (ctx: CanvasRenderingContext2D, deltaTime: number) => void;
type UpdateCallback = (deltaTime: number) => void;

let renderCallback: RenderCallback | null = null;
let updateCallback: UpdateCallback | null = null;

/**
 * Initialize main game canvas
 */
export function initMainCanvas(canvasId: string = 'game-canvas'): CanvasRenderingContext2D {
    mainCanvas = document.getElementById(canvasId) as HTMLCanvasElement;

    if (!mainCanvas) {
        throw new Error(`Canvas element #${canvasId} not found`);
    }

    mainCtx = mainCanvas.getContext('2d');

    if (!mainCtx) {
        throw new Error('Failed to get 2D context');
    }

    // Set canvas size to window size
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return mainCtx;
}

/**
 * Initialize battle canvas
 */
export function initBattleCanvas(canvasId: string = 'battle-canvas'): CanvasRenderingContext2D {
    battleCanvas = document.getElementById(canvasId) as HTMLCanvasElement;

    if (!battleCanvas) {
        throw new Error(`Canvas element #${canvasId} not found`);
    }

    battleCtx = battleCanvas.getContext('2d');

    if (!battleCtx) {
        throw new Error('Failed to get 2D context for battle canvas');
    }

    // Fixed battle canvas size
    battleCanvas.width = 1000;
    battleCanvas.height = 600;

    return battleCtx;
}

/**
 * Resize canvas to match window
 */
function resizeCanvas(): void {
    if (!mainCanvas) return;

    mainCanvas.width = window.innerWidth;
    mainCanvas.height = window.innerHeight;
}

/**
 * Set update callback (called before render)
 */
export function setUpdateCallback(callback: UpdateCallback): void {
    updateCallback = callback;
}

/**
 * Set render callback
 */
export function setRenderCallback(callback: RenderCallback): void {
    renderCallback = callback;
}

/**
 * Game loop
 */
function gameLoop(timestamp: number): void {
    if (!isRunning) return;

    const deltaTime = Math.min((timestamp - lastFrameTime) / 16.67, 2); // Cap at 2x speed
    lastFrameTime = timestamp;

    // Update game state
    if (updateCallback) {
        updateCallback(deltaTime);
    }

    // Render
    if (mainCtx && renderCallback) {
        // Clear canvas
        mainCtx.fillStyle = '#0a0c12';
        mainCtx.fillRect(0, 0, mainCanvas!.width, mainCanvas!.height);

        // Render game
        renderCallback(mainCtx, deltaTime);
    }

    // Continue loop
    animationFrameId = requestAnimationFrame(gameLoop);
}

/**
 * Start game loop
 */
export function startGameLoop(): void {
    if (isRunning) return;

    isRunning = true;
    lastFrameTime = performance.now();
    animationFrameId = requestAnimationFrame(gameLoop);
}

/**
 * Stop game loop
 */
export function stopGameLoop(): void {
    isRunning = false;

    if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

/**
 * Get main canvas
 */
export function getMainCanvas(): HTMLCanvasElement | null {
    return mainCanvas;
}

/**
 * Get main context
 */
export function getMainContext(): CanvasRenderingContext2D | null {
    return mainCtx;
}

/**
 * Get battle canvas
 */
export function getBattleCanvas(): HTMLCanvasElement | null {
    return battleCanvas;
}

/**
 * Get battle context
 */
export function getBattleContext(): CanvasRenderingContext2D | null {
    return battleCtx;
}

/**
 * Clear canvas
 */
export function clearCanvas(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

/**
 * Get canvas dimensions
 */
export function getCanvasDimensions(): { width: number; height: number } {
    return {
        width: mainCanvas?.width || 0,
        height: mainCanvas?.height || 0
    };
}
