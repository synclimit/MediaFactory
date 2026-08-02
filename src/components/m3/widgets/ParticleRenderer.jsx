import React, { useRef, useEffect } from 'react';
import { renderFrameStore } from '../../../services/pipeline/runtime/RenderFrameStore';

export default function ParticleRenderer({ config, id }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animId;

        // Configuration
        const count = config.count || 50;
        const shape = config.shape || 'shape_circle';
        const flow = config.flow || 'flow_float';
        const trail = config.trail || 'trail_none';
        const fillColor = config.fillColor || '#ffffff';
        const strokeColor = config.strokeColor || '#000000';
        const strokeWidth = config.strokeWidth || 0;
        const globalOpacity = (config.opacity !== undefined ? config.opacity : 100) / 100;
        const scaleMult = config.scale || 1.0;
        const speedMult = config.speedMultiplier || 1.0;

        // Initialize particles
        const particles = [];
        for (let i = 0; i < count; i++) {
            particles.push(createParticle());
        }

        function createParticle(reset = false) {
            const size = (config.randomScale ? Math.random() * 8 + 2 : 5) * scaleMult;
            let x = Math.random() * canvas.width;
            let y = Math.random() * canvas.height;
            let vx = 0;
            let vy = 0;

            if (flow === 'flow_float') {
                vy = (Math.random() * -1 - 0.5) * speedMult;
                vx = (Math.random() - 0.5) * speedMult;
                if (reset) y = canvas.height + size;
            } else if (flow === 'flow_rain') {
                vy = (Math.random() * 5 + 5) * speedMult;
                vx = (Math.random() - 0.5) * speedMult;
                if (reset) y = -size;
            } else if (flow === 'flow_snow') {
                vy = (Math.random() * 2 + 1) * speedMult;
                vx = (Math.random() * 2 - 1) * speedMult;
                if (reset) y = -size;
            } else if (flow === 'flow_wind_left') {
                vx = -(Math.random() * 4 + 2) * speedMult;
                vy = (Math.random() - 0.5) * speedMult;
                if (reset) x = canvas.width + size;
            } else if (flow === 'flow_wind_right') {
                vx = (Math.random() * 4 + 2) * speedMult;
                vy = (Math.random() - 0.5) * speedMult;
                if (reset) x = -size;
            } else if (flow === 'flow_drift') {
                vx = (Math.random() - 0.5) * 2 * speedMult;
                vy = (Math.random() - 0.5) * 2 * speedMult;
            } else if (flow === 'flow_explosion' || flow === 'flow_implosion') {
                if (reset) {
                    x = canvas.width / 2;
                    y = canvas.height / 2;
                }
                const angle = Math.random() * Math.PI * 2;
                const speed = (Math.random() * 3 + 1) * speedMult * (flow === 'flow_explosion' ? 1 : -1);
                vx = Math.cos(angle) * speed;
                vy = Math.sin(angle) * speed;
            } else if (flow === 'flow_starfield') {
                const angle = Math.random() * Math.PI * 2;
                const spread = Math.random() * 0.8 + 0.2;
                const speed = (Math.random() * 0.4 + 0.3) * speedMult;
                const progress = reset ? 0 : Math.random();
                return {
                    x: canvas.width / 2, y: canvas.height / 2, vx: 0, vy: 0, size,
                    starAngle: angle, starSpread: spread, speed,
                    progress,
                    angle: config.randomRotation ? Math.random() * Math.PI * 2 : (config.rotation || 0) * Math.PI / 180,
                    rotSpeed: (Math.random() - 0.5) * 0.1 * speedMult,
                    life: 1.0,
                    decay: 0
                };
            } else if (flow === 'flow_orbit') {
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * Math.min(canvas.width, canvas.height) / 2;
                x = canvas.width/2 + Math.cos(angle) * radius;
                y = canvas.height/2 + Math.sin(angle) * radius;
                vx = 0; vy = 0; // handled dynamically
            } else {
                // static or fallback
                vx = 0; vy = 0;
            }

            return {
                x, y, vx, vy, size,
                angle: config.randomRotation ? Math.random() * Math.PI * 2 : (config.rotation || 0) * Math.PI / 180,
                rotSpeed: (Math.random() - 0.5) * 0.1 * speedMult,
                life: Math.random(),
                decay: (Math.random() * 0.01 + 0.005) * speedMult,
                orbitAngle: Math.random() * Math.PI * 2,
                orbitRadius: Math.random() * Math.min(canvas.width, canvas.height) / 2
            };
        }

        const render = () => {
            animId = requestAnimationFrame(render);
            
            // Adjust canvas size to match container safely
            const parent = canvas.parentElement;
            if (parent) {
                const targetW = Math.max(100, parent.clientWidth || parent.offsetWidth || 1920);
                const targetH = Math.max(100, parent.clientHeight || parent.offsetHeight || 1080);
                if (canvas.width !== targetW || canvas.height !== targetH) {
                    canvas.width = targetW;
                    canvas.height = targetH;
                }
            }

            // Handle Trail
            if (trail === 'trail_none') {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            } else if (trail === 'trail_fade') {
                ctx.fillStyle = `rgba(0, 0, 0, 0.1)`;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            } else {
                // Default fallback for trails
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }

            // Optional Beat reactivity
            const frame = renderFrameStore.getFrame();
            let beatScale = 1.0;
            if (config.beatReactive && frame?.debug?.beat) {
                beatScale = 1.0 + (frame.debug.beat.bass * (config.beatReactLevel || 40) / 100);
            }

            // Draw particles using solid composite mode for maximum visibility
            ctx.globalAlpha = globalOpacity;
            const blendModeLower = (config.blendMode || 'Screen').toLowerCase();
            ctx.globalCompositeOperation = blendModeLower === 'screen' ? 'screen' : (blendModeLower === 'additive' ? 'lighter' : 'source-over');

            particles.forEach((p, index) => {
                // Update Physics
                if (flow === 'flow_starfield') {
                    p.progress += (p.speed || 0.4) * 0.016;
                    if (p.progress >= 1.0) {
                        p.progress = 0;
                        p.starAngle = Math.random() * Math.PI * 2;
                        p.starSpread = Math.random() * 0.8 + 0.2;
                    }
                    const cw = canvas.width || 1920;
                    const ch = canvas.height || 1080;
                    const maxR = Math.sqrt(cw * cw + ch * ch) / 2;
                    const r = p.progress * maxR * (p.starSpread || 0.5);
                    p.x = (cw / 2) + Math.cos(p.starAngle || 0) * r;
                    p.y = (ch / 2) + Math.sin(p.starAngle || 0) * r;
                    p.starScale = 0.4 + (p.progress * 2.2);
                } else if (flow === 'flow_orbit') {
                    p.orbitAngle += p.rotSpeed;
                    p.x = canvas.width/2 + Math.cos(p.orbitAngle) * p.orbitRadius;
                    p.y = canvas.height/2 + Math.sin(p.orbitAngle) * p.orbitRadius;
                } else if (flow === 'flow_swirl' || flow === 'flow_spiral') {
                     // Add some swirl factor
                     p.angle += p.rotSpeed;
                     p.x += p.vx + Math.cos(p.angle) * 2;
                     p.y += p.vy + Math.sin(p.angle) * 2;
                } else {
                    p.x += p.vx;
                    p.y += p.vy;
                }

                p.angle += p.rotSpeed;
                if (flow !== 'flow_starfield') p.life -= p.decay;

                // Reset out of bounds
                let isDead = p.life <= 0;
                if (flow === 'flow_float' && p.y < -p.size) isDead = true;
                if ((flow === 'flow_rain' || flow === 'flow_snow') && p.y > canvas.height + p.size) isDead = true;
                if (flow === 'flow_wind_left' && p.x < -p.size) isDead = true;
                if (flow === 'flow_wind_right' && p.x > canvas.width + p.size) isDead = true;
                if (flow !== 'flow_starfield' && (p.x < -p.size * 5 || p.x > canvas.width + p.size * 5 || p.y < -p.size * 5 || p.y > canvas.height + p.size * 5)) isDead = true;

                if (isDead) {
                    Object.assign(p, createParticle(true));
                    if (flow !== 'flow_starfield') p.life = 1.0;
                }

                // Render Shape
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.angle);
                
                // Opacity based on life or radial progress
                let alpha = p.life;
                if (flow === 'flow_starfield') {
                    alpha = Math.max(0.35, Math.min(1.0, 0.2 + (p.progress || 0) * 1.2));
                } else if (p.life > 0.8) {
                    alpha = (1.0 - p.life) * 5; // Fade in
                }

                ctx.globalAlpha = globalOpacity * alpha;
                ctx.fillStyle = fillColor || '#ffffff';
                if (strokeWidth > 0) {
                    ctx.strokeStyle = strokeColor || '#000000';
                    ctx.lineWidth = strokeWidth;
                }

                // Enforce minimum draw size 6px for 1080p canvas so browser CSS scale-down never filters particles to sub-pixel invisibility
                const baseSize = (p.size && p.size > 0) ? p.size : 10;
                const s = Math.max(6, baseSize * beatScale * (flow === 'flow_starfield' ? (p.starScale || 1) : 1));

                ctx.beginPath();
                if (shape === 'shape_circle') {
                    ctx.arc(0, 0, s, 0, Math.PI * 2);
                } else if (shape === 'shape_square' || shape === 'shape_pixel') {
                    ctx.rect(-s, -s, s*2, s*2);
                } else if (shape === 'shape_triangle') {
                    ctx.moveTo(0, -s);
                    ctx.lineTo(s, s);
                    ctx.lineTo(-s, s);
                    ctx.closePath();
                } else if (shape === 'shape_diamond') {
                    ctx.moveTo(0, -s);
                    ctx.lineTo(s, 0);
                    ctx.lineTo(0, s);
                    ctx.lineTo(-s, 0);
                    ctx.closePath();
                } else if (shape === 'shape_star') {
                    for (let i = 0; i < 5; i++) {
                        ctx.lineTo(Math.cos((18 + i * 72) / 180 * Math.PI) * s, -Math.sin((18 + i * 72) / 180 * Math.PI) * s);
                        ctx.lineTo(Math.cos((54 + i * 72) / 180 * Math.PI) * (s/2), -Math.sin((54 + i * 72) / 180 * Math.PI) * (s/2));
                    }
                    ctx.closePath();
                } else if (shape === 'shape_heart') {
                    ctx.moveTo(0, s/2);
                    ctx.bezierCurveTo(0, -s/2, -s, -s, -s, -s/4);
                    ctx.bezierCurveTo(-s, s/2, 0, s/2, 0, s);
                    ctx.bezierCurveTo(0, s/2, s, s/2, s, -s/4);
                    ctx.bezierCurveTo(s, -s, 0, -s/2, 0, s/2);
                } else if (shape === 'shape_hexagon') {
                    for (let i = 0; i < 6; i++) {
                        ctx.lineTo(s * Math.cos(i * Math.PI / 3), s * Math.sin(i * Math.PI / 3));
                    }
                    ctx.closePath();
                } else if (shape === 'shape_music_note') {
                    ctx.arc(-s/2, s/2, s/2, 0, Math.PI * 2);
                    ctx.arc(s*1.2, s/2, s/2, 0, Math.PI * 2);
                    ctx.rect(0, -s, s/4, s*1.5);
                    ctx.rect(s*1.7, -s, s/4, s*1.5);
                    ctx.rect(0, -s, s*1.9, s/3);
                } else if (shape === 'shape_lightning') {
                    ctx.moveTo(s/2, -s);
                    ctx.lineTo(-s/2, 0);
                    ctx.lineTo(0, 0);
                    ctx.lineTo(-s/2, s);
                    ctx.lineTo(s/2, -s/4);
                    ctx.lineTo(0, -s/4);
                    ctx.closePath();
                } else if (shape === 'shape_flame' || shape === 'shape_droplet') {
                    ctx.moveTo(0, -s);
                    ctx.bezierCurveTo(s, 0, s, s, 0, s);
                    ctx.bezierCurveTo(-s, s, -s, 0, 0, -s);
                } else if (shape === 'shape_snowflake') {
                    for (let i = 0; i < 6; i++) {
                        ctx.moveTo(0, 0);
                        ctx.lineTo(s * Math.cos(i * Math.PI / 3), s * Math.sin(i * Math.PI / 3));
                    }
                } else if (shape === 'shape_leaf') {
                    ctx.moveTo(0, -s);
                    ctx.quadraticCurveTo(s, -s/2, 0, s);
                    ctx.quadraticCurveTo(-s, -s/2, 0, -s);
                } else if (shape === 'shape_feather') {
                    ctx.moveTo(-s/2, s);
                    ctx.quadraticCurveTo(0, 0, s/2, -s);
                    ctx.quadraticCurveTo(-s/4, -s/4, -s/2, s);
                } else if (shape === 'shape_bubble' || shape === 'shape_ring') {
                    ctx.arc(0, 0, s, 0, Math.PI * 2);
                    if (shape === 'shape_bubble') {
                        ctx.moveTo(-s/3, -s/3);
                        ctx.arc(-s/3, -s/3, s/4, 0, Math.PI/2);
                    }
                } else if (shape === 'shape_crystal') {
                    ctx.moveTo(0, -s);
                    ctx.lineTo(s/2, 0);
                    ctx.lineTo(0, s);
                    ctx.lineTo(-s/2, 0);
                    ctx.closePath();
                    ctx.moveTo(0, -s);
                    ctx.lineTo(0, s);
                } else {
                    // Fallback to circle
                    ctx.arc(0, 0, s, 0, Math.PI * 2);
                }

                ctx.fill();
                if (strokeWidth > 0) ctx.stroke();
                
                ctx.restore();
            });
        };

        render();

        return () => cancelAnimationFrame(animId);
    }, [config]);

    return (
        <div className="w-full h-full relative pointer-events-none flex items-center justify-center overflow-hidden">
            <canvas 
                ref={canvasRef} 
                className="w-full h-full pointer-events-none block"
            />
        </div>
    );
}
