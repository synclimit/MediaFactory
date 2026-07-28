import { reactiveObjectProcessor } from '../audio/ReactiveObjectProcessor.js';

export class ParticleEngineCore {
    constructor() {
        this.systems = new Map(); // Map of config.id -> array of particle objects
        this.ctx = null;
        this.width = 0;
        this.height = 0;
        this.time = 0;
        this.dt = 0;
        this.idCounter = 1;
        this.pathCache = new Map();
    }

    setContext(ctx, width, height, time) {
        this.ctx = ctx;
        this.width = width;
        this.height = height;
        
        if (this.time === 0) {
            this.dt = 16.66; // approx 60fps initial
        } else {
            this.dt = time - this.time;
        }
        this.time = time;
    }

    getShapePath(shape, size) {
        if (shape === 'shape_snowflake') return null; // Snowflake uses ctx.rotate internally, skip Path2D
        
        const key = shape + '_' + size;
        let p = this.pathCache.get(key);
        if (p) return p;
        
        p = new Path2D();
        switch (shape) {
            case 'shape_circle':
                p.arc(0, 0, size, 0, Math.PI * 2);
                break;
            case 'shape_square':
            case 'shape_pixel':
                p.rect(-size/2, -size/2, size, size);
                break;
            case 'shape_triangle':
                p.moveTo(0, -size);
                p.lineTo(size * 0.866, size * 0.5);
                p.lineTo(-size * 0.866, size * 0.5);
                p.closePath();
                break;
            case 'shape_star':
                const spikes = 5;
                const outer = size;
                const inner = size / 2;
                let rot = Math.PI / 2 * 3;
                let x = 0, y = 0;
                const step = Math.PI / spikes;
                p.moveTo(0, -outer);
                for(let i = 0; i < spikes; i++){
                    x = Math.cos(rot) * outer;
                    y = Math.sin(rot) * outer;
                    p.lineTo(x, y);
                    rot += step;
                    x = Math.cos(rot) * inner;
                    y = Math.sin(rot) * inner;
                    p.lineTo(x, y);
                    rot += step;
                }
                p.lineTo(0, -outer);
                p.closePath();
                break;
            case 'shape_diamond':
            case 'shape_crystal':
                p.moveTo(0, -size);
                p.lineTo(size, 0);
                p.lineTo(0, size);
                p.lineTo(-size, 0);
                p.closePath();
                break;
            case 'shape_hexagon':
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI / 3) * i;
                    if (i === 0) p.moveTo(size * Math.cos(angle), size * Math.sin(angle));
                    else p.lineTo(size * Math.cos(angle), size * Math.sin(angle));
                }
                p.closePath();
                break;
            case 'shape_heart':
                const topCurveHeight = size * 0.3;
                p.moveTo(0, topCurveHeight);
                p.bezierCurveTo(0, topCurveHeight - 3, -size/2, -size/2, -size/2, 0);
                p.bezierCurveTo(-size/2, size/2, 0, size/2, 0, size);
                p.bezierCurveTo(0, size/2, size/2, size/2, size/2, 0);
                p.bezierCurveTo(size/2, -size/2, 0, topCurveHeight - 3, 0, topCurveHeight);
                p.closePath();
                break;
            case 'shape_music_note':
                p.arc(-size*0.3, size*0.5, size*0.3, 0, Math.PI*2);
                p.moveTo(-size*0.1, size*0.5);
                p.lineTo(-size*0.1, -size*0.5);
                p.lineTo(size*0.4, -size*0.2);
                p.lineTo(size*0.4, size*0.2);
                p.lineTo(-size*0.1, -size*0.1);
                break;
            case 'shape_lightning':
                p.moveTo(0, -size);
                p.lineTo(-size*0.5, size*0.2);
                p.lineTo(0, size*0.2);
                p.lineTo(-size*0.2, size);
                p.lineTo(size*0.5, -size*0.1);
                p.lineTo(0, -size*0.1);
                p.closePath();
                break;
            case 'shape_flame':
                p.moveTo(0, size);
                p.bezierCurveTo(size, size, size, 0, 0, -size);
                p.bezierCurveTo(-size, 0, -size, size, 0, size);
                p.closePath();
                break;
            case 'shape_leaf':
                p.moveTo(0, size);
                p.quadraticCurveTo(size, 0, 0, -size);
                p.quadraticCurveTo(-size, 0, 0, size);
                break;
            case 'shape_feather':
                p.moveTo(0, size);
                p.quadraticCurveTo(size*0.5, 0, 0, -size);
                p.quadraticCurveTo(-size*0.2, 0, 0, size);
                break;
            case 'shape_bubble':
                p.arc(0, 0, size, 0, Math.PI * 2);
                p.moveTo(size * 0.4, -size * 0.4);
                p.arc(size * 0.4, -size * 0.4, size * 0.2, 0, Math.PI * 2);
                break;
            case 'shape_droplet':
                p.moveTo(0, -size);
                p.bezierCurveTo(size/1.5, -size/2, size, size/3, 0, size);
                p.bezierCurveTo(-size, size/3, -size/1.5, -size/2, 0, -size);
                break;
            case 'shape_ring':
                p.arc(0, 0, size, 0, Math.PI * 2);
                p.moveTo(0, 0);
                break;
            default:
                p.arc(0, 0, size, 0, Math.PI * 2);
        }
        this.pathCache.set(key, p);
        return p;
    }

    // --- Shapes ---
    drawShape(ctx, p, config) {
        const size = p.size;
        
        const effectiveScale = p.scale * (p.currentBeatScale || 1.0);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation * Math.PI / 180);
        ctx.scale(effectiveScale, effectiveScale);

        const cachedPath = this.getShapePath(config.shape, size);
        
        if (cachedPath) {
            // Apply style with reliable globalAlpha
            const rawOpacity = config.opacity !== undefined ? Number(config.opacity) : 100;
            ctx.globalAlpha = Math.min(Math.max((rawOpacity <= 1 && rawOpacity > 0 && config.opacityNormalized) ? rawOpacity : rawOpacity / 100, 0), 1);
            
            ctx.fillStyle = config.fillColor || '#ffffff';
            ctx.fill(cachedPath);
            
            if (config.strokeWidth > 0) {
                ctx.strokeStyle = config.strokeColor || '#000000';
                ctx.lineWidth = config.strokeWidth;
                ctx.stroke(cachedPath);
            }
        } else {
            // Fallback for snowflake
            ctx.beginPath();
            switch (config.shape) {
            case 'shape_circle':
                ctx.arc(0, 0, size, 0, Math.PI * 2);
                break;
            case 'shape_square':
            case 'shape_pixel':
                ctx.rect(-size/2, -size/2, size, size);
                break;
            case 'shape_triangle':
                ctx.moveTo(0, -size);
                ctx.lineTo(size * 0.866, size * 0.5);
                ctx.lineTo(-size * 0.866, size * 0.5);
                ctx.closePath();
                break;
            case 'shape_star':
                const spikes = 5;
                const outer = size;
                const inner = size / 2;
                let rot = Math.PI / 2 * 3;
                let x = 0;
                let y = 0;
                const step = Math.PI / spikes;
                ctx.moveTo(0, -outer);
                for(let i = 0; i < spikes; i++){
                    x = Math.cos(rot) * outer;
                    y = Math.sin(rot) * outer;
                    ctx.lineTo(x, y);
                    rot += step;
                    x = Math.cos(rot) * inner;
                    y = Math.sin(rot) * inner;
                    ctx.lineTo(x, y);
                    rot += step;
                }
                ctx.lineTo(0, -outer);
                ctx.closePath();
                break;
            case 'shape_diamond':
            case 'shape_crystal':
                ctx.moveTo(0, -size);
                ctx.lineTo(size, 0);
                ctx.lineTo(0, size);
                ctx.lineTo(-size, 0);
                ctx.closePath();
                break;
            case 'shape_hexagon':
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI / 3) * i;
                    if (i === 0) ctx.moveTo(size * Math.cos(angle), size * Math.sin(angle));
                    else ctx.lineTo(size * Math.cos(angle), size * Math.sin(angle));
                }
                ctx.closePath();
                break;
            case 'shape_heart':
                const topCurveHeight = size * 0.3;
                ctx.moveTo(0, topCurveHeight);
                ctx.bezierCurveTo(0, topCurveHeight - 3, -size/2, -size/2, -size/2, 0);
                ctx.bezierCurveTo(-size/2, size/2, 0, size/2, 0, size);
                ctx.bezierCurveTo(0, size/2, size/2, size/2, size/2, 0);
                ctx.bezierCurveTo(size/2, -size/2, 0, topCurveHeight - 3, 0, topCurveHeight);
                ctx.closePath();
                break;
            case 'shape_music_note':
                ctx.arc(-size*0.3, size*0.5, size*0.3, 0, Math.PI*2);
                ctx.moveTo(-size*0.1, size*0.5);
                ctx.lineTo(-size*0.1, -size*0.5);
                ctx.lineTo(size*0.4, -size*0.2);
                ctx.lineTo(size*0.4, size*0.2);
                ctx.lineTo(-size*0.1, -size*0.1);
                break;
            case 'shape_lightning':
                ctx.moveTo(0, -size);
                ctx.lineTo(-size*0.5, size*0.2);
                ctx.lineTo(0, size*0.2);
                ctx.lineTo(-size*0.2, size);
                ctx.lineTo(size*0.5, -size*0.1);
                ctx.lineTo(0, -size*0.1);
                ctx.closePath();
                break;
            case 'shape_flame':
                ctx.moveTo(0, size);
                ctx.bezierCurveTo(size, size, size, 0, 0, -size);
                ctx.bezierCurveTo(-size, 0, -size, size, 0, size);
                ctx.closePath();
                break;
            case 'shape_snowflake':
                for(let i=0; i<6; i++) {
                    ctx.moveTo(0,0);
                    ctx.lineTo(0, size);
                    ctx.moveTo(0, size*0.5);
                    ctx.lineTo(size*0.2, size*0.7);
                    ctx.moveTo(0, size*0.5);
                    ctx.lineTo(-size*0.2, size*0.7);
                    ctx.rotate(Math.PI/3);
                }
                break;
            case 'shape_leaf':
                ctx.moveTo(0, size);
                ctx.quadraticCurveTo(size, 0, 0, -size);
                ctx.quadraticCurveTo(-size, 0, 0, size);
                break;
            case 'shape_feather':
                ctx.moveTo(0, size);
                ctx.quadraticCurveTo(size*0.5, 0, 0, -size);
                ctx.quadraticCurveTo(-size*0.2, 0, 0, size);
                break;
            case 'shape_bubble':
                ctx.arc(0, 0, size, 0, Math.PI * 2);
                ctx.moveTo(size * 0.4, -size * 0.4);
                ctx.arc(size * 0.4, -size * 0.4, size * 0.2, 0, Math.PI * 2);
                break;
            case 'shape_droplet':
                ctx.moveTo(0, -size);
                ctx.bezierCurveTo(size/1.5, -size/2, size, size/3, 0, size);
                ctx.bezierCurveTo(-size, size/3, -size/1.5, -size/2, 0, -size);
                break;
            case 'shape_ring':
                ctx.arc(0, 0, size, 0, Math.PI * 2);
                ctx.moveTo(0, 0); // To separate outer/inner
                break;
            default:
                ctx.arc(0, 0, size, 0, Math.PI * 2);
        }

        const rawOpacity = config.opacity !== undefined ? Number(config.opacity) : 100;
        ctx.globalAlpha = Math.min(Math.max((rawOpacity <= 1 && rawOpacity > 0 && config.opacityNormalized) ? rawOpacity : rawOpacity / 100, 0), 1);
        ctx.fillStyle = config.fillColor || '#ffffff';
        ctx.fill();

        if (config.strokeWidth > 0) {
            ctx.strokeStyle = config.strokeColor || '#000000';
            ctx.lineWidth = config.strokeWidth;
            ctx.stroke();
        }
        } // end of fallback

        ctx.restore();
    }

    // --- Flows ---
    spawnParticle(config, width, height, initialSpawn = false, poolObj = null) {
        const flow = config.flow || 'flow_float';
        const baseScale = config.scale || 1.0;
        const scaleMult = config.randomScale ? (0.5 + Math.random()) : 1.0;
        
        let p = poolObj;
        if (!p) {
            p = {
                id: this.idCounter++,
                historyX: new Float32Array(10),
                historyY: new Float32Array(10)
            };
        }
        
        p.x = 0;
        p.y = 0;
        p.size = (config.size || 5) * 2;
        p.scale = baseScale * scaleMult;
        p.rotation = config.randomRotation ? Math.random() * 360 : (config.rotation || 0);
        p.rotSpeed = config.randomRotation ? (Math.random() - 0.5) * 2 : 0;
        p.life = 1.0; 
        p.decay = Math.random() * 0.01 + 0.005;
        p.vx = 0;
        p.vy = 0;
        p.flow = flow;
        p.historyHead = 0;
        p.historyCount = 0;
        
        // Custom flow parameters
        p.angle = 0;
        p.radius = 0;
        p.angularVelocity = 0;
        p.radialVelocity = 0;
        p.pulsePhase = 0;
        p.wavePhase = 0;
        p.waveSpeed = 0;
        p.waveAmp = 0;
        p.startY = 0;
        p.gravity = 0;

        // Spawn Logic based on Flow
        switch (flow) {
            case 'flow_float':
                p.x = Math.random() * width;
                p.y = initialSpawn ? Math.random() * height : height + p.size;
                p.vy = -(Math.random() * 2 + 1);
                p.vx = (Math.random() - 0.5) * 1;
                break;
            case 'flow_rain':
                p.x = Math.random() * width;
                p.y = initialSpawn ? Math.random() * height : -p.size;
                p.vy = Math.random() * 5 + 5;
                p.vx = 0;
                break;
            case 'flow_swirl':
                const radius = Math.random() * Math.min(width, height) / 2;
                const angle = Math.random() * Math.PI * 2;
                p.x = width/2 + Math.cos(angle) * radius;
                p.y = height/2 + Math.sin(angle) * radius;
                p.angle = angle;
                p.radius = radius;
                p.angularVelocity = (Math.random() * 0.02 + 0.01) * (Math.random() > 0.5 ? 1 : -1);
                break;
            case 'flow_explosion':
                p.x = width/2;
                p.y = height/2;
                const burstAngle = Math.random() * Math.PI * 2;
                const burstForce = Math.random() * 5 + 2;
                p.vx = Math.cos(burstAngle) * burstForce;
                p.vy = Math.sin(burstAngle) * burstForce;
                break;
            case 'flow_static':
                p.x = Math.random() * width;
                p.y = Math.random() * height;
                p.vx = 0;
                p.vy = 0;
                break;
            case 'flow_drift':
                p.x = Math.random() * width;
                p.y = Math.random() * height;
                p.vx = (Math.random() - 0.5) * 0.5;
                p.vy = (Math.random() - 0.5) * 0.5;
                break;
            case 'flow_snow':
                p.x = Math.random() * width;
                p.y = initialSpawn ? Math.random() * height : -p.size;
                p.vy = Math.random() * 1.5 + 0.5;
                p.vx = Math.sin(Math.random() * Math.PI * 2) * 1.5;
                p.angle = Math.random() * Math.PI * 2;
                break;
            case 'flow_wind_left':
                p.x = initialSpawn ? Math.random() * width : width + p.size;
                p.y = Math.random() * height;
                p.vx = -(Math.random() * 4 + 2);
                p.vy = (Math.random() - 0.5) * 1;
                break;
            case 'flow_wind_right':
                p.x = initialSpawn ? Math.random() * width : -p.size;
                p.y = Math.random() * height;
                p.vx = Math.random() * 4 + 2;
                p.vy = (Math.random() - 0.5) * 1;
                break;
            case 'flow_spiral':
                const spRadius = Math.random() * Math.min(width, height) / 2;
                const spAngle = Math.random() * Math.PI * 2;
                p.x = width/2 + Math.cos(spAngle) * spRadius;
                p.y = height/2 + Math.sin(spAngle) * spRadius;
                p.angle = spAngle;
                p.radius = spRadius;
                p.angularVelocity = (Math.random() * 0.05 + 0.02);
                p.radialVelocity = (Math.random() * 1 + 0.5);
                break;
            case 'flow_orbit':
                p.angle = Math.random() * Math.PI * 2;
                p.radius = Math.random() * Math.min(width, height) / 2 + 50;
                p.angularVelocity = (Math.random() * 0.02 + 0.01) * (Math.random() > 0.5 ? 1 : -1);
                p.x = width/2 + Math.cos(p.angle) * p.radius;
                p.y = height/2 + Math.sin(p.angle) * p.radius;
                break;
            case 'flow_implosion':
                p.angle = Math.random() * Math.PI * 2;
                p.radius = Math.min(width, height);
                p.radialVelocity = -(Math.random() * 5 + 2);
                p.x = width/2 + Math.cos(p.angle) * p.radius;
                p.y = height/2 + Math.sin(p.angle) * p.radius;
                break;
            case 'flow_pulse':
                p.x = width/2;
                p.y = height/2;
                const puAngle = Math.random() * Math.PI * 2;
                const puForce = Math.random() * 3 + 1;
                p.vx = Math.cos(puAngle) * puForce;
                p.vy = Math.sin(puAngle) * puForce;
                p.pulsePhase = Math.random() * Math.PI * 2;
                break;
            case 'flow_wave':
                p.x = initialSpawn ? Math.random() * width : -p.size;
                p.y = Math.random() * height;
                p.vx = Math.random() * 2 + 1;
                p.vy = 0;
                p.wavePhase = Math.random() * Math.PI * 2;
                p.waveSpeed = Math.random() * 0.1 + 0.05;
                p.waveAmp = Math.random() * 50 + 20;
                p.startY = p.y;
                break;
            case 'flow_fountain':
                p.x = width/2 + (Math.random() - 0.5) * (initialSpawn ? width * 0.5 : 50);
                p.y = initialSpawn ? Math.random() * height : height;
                p.vx = (Math.random() - 0.5) * 3;
                p.vy = -(Math.random() * 6 + 6);
                p.gravity = Math.random() * 0.1 + 0.1;
                break;
            default:
                p.x = Math.random() * width;
                p.y = Math.random() * height;
                p.vx = (Math.random() - 0.5) * 2;
                p.vy = (Math.random() - 0.5) * 2;
        }

        return p;
    }

    updateParticle(p, config, width, height, reactiveValue) {
        const flow = config.flow || 'flow_float';
        
        // If flow pattern changed mid-flight, kill particle to force clean respawn
        if (p.flow !== flow) {
            p.life = 0;
            p.flow = flow;
            return;
        }

        const baseSpeed = config.speedMultiplier !== undefined ? Number(config.speedMultiplier) : 1.0;
        let speedMult = baseSpeed;
        if (config.beatReactive) {
            // High-contrast dynamic contrast: 0.25x slow-motion float between beats (lambat) -> up to 7.0x burst on drum hits (cepat)
            const targetMult = baseSpeed * (0.25 + Math.pow(reactiveValue, 1.2) * 6.8);
            const targetBeatScale = 1.0 + Math.pow(reactiveValue, 1.2) * 0.45;
            if (p.currentSpeedMult === undefined) p.currentSpeedMult = baseSpeed * 0.25;
            if (p.currentBeatScale === undefined) p.currentBeatScale = 1.0;
            
            if (targetMult > p.currentSpeedMult) {
                p.currentSpeedMult += (targetMult - p.currentSpeedMult) * 0.45; // Instantaneous burst right on drum impact (cepat)
                p.currentBeatScale += (targetBeatScale - p.currentBeatScale) * 0.45;
            } else {
                p.currentSpeedMult += (targetMult - p.currentSpeedMult) * 0.10; // Smooth deceleration down to slow-motion float (lambat)
                p.currentBeatScale += (targetBeatScale - p.currentBeatScale) * 0.10;
            }
            speedMult = p.currentSpeedMult;
        } else {
            p.currentSpeedMult = baseSpeed;
            p.currentBeatScale = 1.0;
        }

        // Record history for trails
        if (config.trail && config.trail !== 'trail_none') {
            p.historyX[p.historyHead] = p.x;
            p.historyY[p.historyHead] = p.y;
            p.historyHead = (p.historyHead + 1) % 10;
            if (p.historyCount < 10) p.historyCount++;
        }

        p.rotation += p.rotSpeed * speedMult;

        switch (flow) {
            case 'flow_swirl':
                p.angle += p.angularVelocity * speedMult;
                p.x = width/2 + Math.cos(p.angle) * p.radius;
                p.y = height/2 + Math.sin(p.angle) * p.radius;
                break;
            case 'flow_snow':
                p.angle += 0.05 * speedMult;
                p.x += (p.vx + Math.cos(p.angle)) * speedMult;
                p.y += p.vy * speedMult;
                break;
            case 'flow_spiral':
                p.angle += p.angularVelocity * speedMult;
                p.radius += p.radialVelocity * speedMult;
                p.x = width/2 + Math.cos(p.angle) * p.radius;
                p.y = height/2 + Math.sin(p.angle) * p.radius;
                break;
            case 'flow_orbit':
                p.angle += p.angularVelocity * speedMult;
                p.x = width/2 + Math.cos(p.angle) * p.radius;
                p.y = height/2 + Math.sin(p.angle) * p.radius;
                break;
            case 'flow_implosion':
                p.radius += p.radialVelocity * speedMult;
                if (p.radius < 5) p.life = 0;
                p.x = width/2 + Math.cos(p.angle) * p.radius;
                p.y = height/2 + Math.sin(p.angle) * p.radius;
                break;
            case 'flow_pulse':
                p.pulsePhase += 0.1 * speedMult;
                const puScale = 1 + Math.sin(p.pulsePhase) * 0.5;
                p.x += p.vx * speedMult * puScale;
                p.y += p.vy * speedMult * puScale;
                break;
            case 'flow_wave':
                p.wavePhase += p.waveSpeed * speedMult;
                p.x += p.vx * speedMult;
                p.y = p.startY + Math.sin(p.wavePhase) * p.waveAmp;
                break;
            case 'flow_fountain':
                p.vy += p.gravity * speedMult;
                p.x += p.vx * speedMult;
                p.y += p.vy * speedMult;
                break;
            default:
                p.x += p.vx * speedMult;
                p.y += p.vy * speedMult;
        }

        // Lifetime bounds checking
        if (p.x < -100 || p.x > width + 100 || p.y < -100 || p.y > height + 100) {
            p.life = 0;
        }
        
        if (flow === 'flow_explosion' || flow === 'flow_pulse') {
            p.life -= p.decay;
        }
    }

    drawTrail(ctx, p, config) {
        if (!config.trail || config.trail === 'trail_none' || p.historyCount < 2) return;

        ctx.save();
        const rawOpacity = config.opacity !== undefined ? Number(config.opacity) : 100;
        const alpha = Math.min(Math.max((rawOpacity <= 1 && rawOpacity > 0 && config.opacityNormalized) ? rawOpacity : rawOpacity / 100, 0), 1);
        ctx.globalAlpha = alpha;

        ctx.beginPath();
        let oldestIdx = (p.historyHead - p.historyCount + 10) % 10;
        let hx = p.historyX[oldestIdx];
        let hy = p.historyY[oldestIdx];
        ctx.moveTo(hx, hy);
        
        let currIdx = oldestIdx;
        for (let i = 1; i < p.historyCount; i++) {
            currIdx = (currIdx + 1) % 10;
            ctx.lineTo(p.historyX[currIdx], p.historyY[currIdx]);
        }

        const stroke = config.fillColor || '#ffffff';
        
        ctx.strokeStyle = stroke;
        ctx.lineWidth = p.size * p.scale * 0.5;
        
        if (config.trail === 'trail_fade') {
             // Create gradient for fade
             if (p.historyCount > 0) {
                 if (!Number.isFinite(hx) || !Number.isFinite(hy) || !Number.isFinite(p.x) || !Number.isFinite(p.y)) {
                     ctx.restore();
                     return;
                 }
                 // Prevent zero-length gradient crash (non-finite double error)
                 if (Math.abs(hx - p.x) < 0.01 && Math.abs(hy - p.y) < 0.01) {
                     hx += 0.01;
                 }
                 const grad = ctx.createLinearGradient(hx, hy, p.x, p.y);
                 grad.addColorStop(0, 'rgba(255,255,255,0)');
                 grad.addColorStop(1, stroke);
                 ctx.strokeStyle = grad;
             }
        } else if (config.trail === 'trail_glow') {
             ctx.shadowBlur = p.size;
             ctx.shadowColor = stroke;
        } else if (config.trail === 'trail_light') {
             ctx.globalCompositeOperation = 'screen';
             ctx.lineWidth = p.size * p.scale;
        } else if (config.trail === 'trail_rainbow') {
             const hue = (p.id * 10 + this.time * 100) % 360;
             ctx.strokeStyle = `hsla(${hue}, 100%, 60%, ${alpha})`;
        } else if (config.trail === 'trail_smoke') {
             ctx.lineWidth = p.size * p.scale * 1.5;
             ctx.lineCap = 'round';
             ctx.lineJoin = 'round';
             ctx.filter = 'blur(4px)';
        } else if (config.trail === 'trail_fire') {
             ctx.strokeStyle = `rgba(255, ${Math.floor(Math.random()*150 + 50)}, 0, ${alpha})`;
             ctx.shadowBlur = 10;
             ctx.shadowColor = 'red';
             ctx.globalCompositeOperation = 'screen';
        } else if (config.trail === 'trail_energy') {
             ctx.setLineDash([5, 15]);
             ctx.shadowBlur = 5;
             ctx.shadowColor = stroke;
        } else if (config.trail === 'trail_dotted') {
             ctx.setLineDash([p.size*0.5, p.size*1.5]);
        } else if (config.trail === 'trail_pixel') {
             ctx.setLineDash([p.size, p.size*2]);
             ctx.lineCap = 'square';
        }
        
        ctx.stroke();
        ctx.restore();
    }

    render(configArray) {
        if (!this.ctx || !configArray || !configArray.length) return;

        // FEATURE FLAG: Particle Object Pool
        // Jika aktif, sistem tidak akan menggunakan array.length = count (yang memicu GC),
        // melainkan menggunakan array pra-alokasi (Object Pool) dan index activeCount.
        const useObjectPool = window.__M3_FEATURE_FLAGS?.enableParticlePool ?? true;

        configArray.forEach(config => {
            if (config.visible === false) return;

            let system = this.systems.get(config.id);
            const initialSpawn = !system || system.length === 0;
            if (!system) {
                system = [];
                this.systems.set(config.id, system);
            }

            // Audio Reactivity
            let reactiveValue = 0;
            if (config.beatReactive) {
                reactiveValue = reactiveObjectProcessor.getValue(config.id) || 0;
            }

            const targetCount = config.count || 50;
            
            if (useObjectPool) {
                // 1. PRE-ALLOCATION (OBJECT POOL)
                // Alokasikan batas memori di awal (misalnya 2000 partikel per config).
                if (initialSpawn) {
                    const poolLimit = Math.max(targetCount, 2000);
                    while (system.length < poolLimit) {
                        // Alokasi dummy yang dimatikan (life = 0) agar tidak terlihat
                        let p = this.spawnParticle(config, this.width, this.height, true);
                        p.life = 0; 
                        p.isDummy = true;
                        system.push(p);
                    }
                }
                
                // 2. DYNAMIC FALLBACK
                // Jika targetCount melampaui poolLimit yang ada, buat objek baru (fallback aman)
                while (system.length < targetCount) {
                    let p = this.spawnParticle(config, this.width, this.height, false);
                    p.life = 0;
                    p.isDummy = true;
                    system.push(p);
                }

                system.activeCount = targetCount;
            } else {
                // LEGACY MODE (Fallback)
                // Spawn missing particles
                while (system.length < targetCount) {
                    system.push(this.spawnParticle(config, this.width, this.height, initialSpawn));
                }
                
                // Trim excess particles if count was reduced (GC SPIKE TRIGGER)
                if (system.length > targetCount) {
                    system.length = targetCount;
                }
            }

            this.ctx.save();

            // Set blend mode
            let globalComp = 'source-over';
            if (config.blendMode === 'Screen') globalComp = 'screen';
            if (config.blendMode === 'Additive') globalComp = 'lighter';
            if (config.blendMode === 'Overlay') globalComp = 'overlay';
            this.ctx.globalCompositeOperation = globalComp;

            // Update & Draw
            const loopLimit = useObjectPool ? system.activeCount : system.length;
            
            for (let i = loopLimit - 1; i >= 0; i--) {
                let p = system[i];
                
                // Jika partikel baru diambil dari pool (life <= 0), hidupkan kembali
                if (p.life <= 0) {
                    this.spawnParticle(config, this.width, this.height, initialSpawn || p.isDummy, p);
                    p.isDummy = false;
                }

                this.updateParticle(p, config, this.width, this.height, reactiveValue);
                
                // Cek lagi setelah update, bila life habis, respawn
                if (p.life <= 0) {
                    this.spawnParticle(config, this.width, this.height, false, p);
                }

                this.drawTrail(this.ctx, p, config);
                this.drawShape(this.ctx, p, config);
            }

            this.ctx.restore();
        });
        
        // Reset composite mode
        this.ctx.globalCompositeOperation = 'source-over';
    }
}

export const particleEngineCore = new ParticleEngineCore();
