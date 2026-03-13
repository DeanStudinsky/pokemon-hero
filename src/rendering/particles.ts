import type { Particle } from '../types';
import { loadParticleSprite } from './sprite-loader';

/**
 * Create particles at a position
 */
export function createParticles(
    x: number,
    y: number,
    count: number,
    color: string,
    spriteId?: string | number,
    spread: number = 100,
    orbit: boolean = false
): Particle[] {
    const particles: Particle[] = [];

    for (let i = 0; i < count; i++) {
        const angle = orbit ? (i / count) * Math.PI * 2 : Math.random() * Math.PI * 2;
        const speed = orbit ? 1 : Math.random() * 2 + 1;
        const distance = orbit ? spread : Math.random() * spread;

        const particle: Particle = {
            x: x + (orbit ? Math.cos(angle) * distance : 0),
            y: y + (orbit ? Math.sin(angle) * distance : 0),
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            tint: color,
            life: 60,
            maxLife: 60,
            decay: 1,
            rotation: Math.random() * Math.PI * 2,
            scale: 0.5 + Math.random() * 0.5,
            size: 8
        };

        // Load sprite if provided
        if (spriteId) {
            loadParticleSprite(spriteId).then(sprite => {
                particle.sprite = sprite;
            }).catch(() => {
                // Sprite failed to load, particle will render as circle
            });
        }

        particles.push(particle);
    }

    return particles;
}

/**
 * Update particles (physics simulation)
 */
export function updateParticles(particles: Particle[], deltaTime: number = 1): Particle[] {
    return particles
        .map(p => ({
            ...p,
            x: p.x + p.vx * deltaTime,
            y: p.y + p.vy * deltaTime,
            life: p.life - p.decay * deltaTime,
            rotation: (p.rotation || 0) + 0.05,
            vy: p.vy + 0.1 * deltaTime // Gravity
        }))
        .filter(p => p.life > 0);
}

/**
 * Render particles on canvas
 */
export function renderParticles(
    ctx: CanvasRenderingContext2D,
    particles: Particle[]
): void {
    particles.forEach(particle => {
        const alpha = particle.life / particle.maxLife;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation || 0);

        if (particle.sprite && particle.sprite.complete) {
            // Render sprite with tint
            const scale = particle.scale || 1;
            const size = particle.size || 16;

            // Apply tint using color overlay
            if (particle.tint) {
                ctx.globalCompositeOperation = 'source-over';
                ctx.drawImage(
                    particle.sprite,
                    -size * scale / 2,
                    -size * scale / 2,
                    size * scale,
                    size * scale
                );

                // Apply tint
                ctx.globalCompositeOperation = 'source-atop';
                ctx.fillStyle = particle.tint;
                ctx.fillRect(
                    -size * scale / 2,
                    -size * scale / 2,
                    size * scale,
                    size * scale
                );
            } else {
                ctx.drawImage(
                    particle.sprite,
                    -size * scale / 2,
                    -size * scale / 2,
                    size * scale,
                    size * scale
                );
            }
        } else {
            // Fallback: render as colored circle
            ctx.fillStyle = particle.tint || '#ffffff';
            ctx.beginPath();
            ctx.arc(0, 0, particle.size || 4, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    });
}

/**
 * Create battle particles (for abilities and hits)
 */
export function createBattleParticles(
    x: number,
    y: number,
    color: string,
    count: number,
    spriteId?: string | number
): Particle[] {
    return createParticles(x, y, count, color, spriteId, 50, false);
}

/**
 * Create ability visual effect particles
 */
export function createAbilityVisual(
    x: number,
    y: number,
    abilityName: string,
    visual: { spriteId: string | number; tint: string; count: number; spread?: number; orbit?: boolean }
): Particle[] {
    return createParticles(
        x,
        y,
        visual.count,
        visual.tint,
        visual.spriteId,
        visual.spread || 100,
        visual.orbit || false
    );
}
