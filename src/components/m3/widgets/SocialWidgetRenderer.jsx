import React, { useEffect, useRef, useState } from 'react';

// WebGL Chroma Key Shader implementation
const VERTEX_SHADER = `
    attribute vec2 a_position;
    attribute vec2 a_texCoord;
    varying vec2 v_texCoord;
    void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = vec2(a_texCoord.x, 1.0 - a_texCoord.y); // Flip Y
    }
`;

// Advanced Chroma Key Fragment Shader using YUV color space distance
const FRAGMENT_SHADER = `
    precision mediump float;
    varying vec2 v_texCoord;
    uniform sampler2D u_image;
    
    uniform vec3 u_keyColor;
    uniform float u_similarity;
    uniform float u_smoothness;
    uniform float u_spill;
    uniform int u_alphaMode; // 0 = alpha, 1 = chroma

    // RGB to YUV conversion matrix
    const mat3 rgb2yuv = mat3(
        0.299, -0.14713,  0.615,
        0.587, -0.28886, -0.51499,
        0.114,  0.436,   -0.10001
    );

    void main() {
        vec4 color = texture2D(u_image, v_texCoord);
        
        if (u_alphaMode == 0) {
            // WebM Alpha / APNG - Just output native pixels
            gl_FragColor = color;
            return;
        }

        // Chroma Key removal (Green Screen)
        vec3 yuvColor = color.rgb * rgb2yuv;
        vec3 yuvKey = u_keyColor * rgb2yuv;
        
        // Calculate distance in UV space (chrominance only)
        float dist = distance(yuvColor.yz, yuvKey.yz);
        
        // Calculate alpha based on similarity and smoothness
        // If dist < similarity, it's green background -> alpha 0
        // If dist > similarity + smoothness, it's foreground -> alpha 1
        // Smooth interpolation in between
        float alpha = smoothstep(u_similarity, u_similarity + u_smoothness, dist);
        
        // Spill suppression: Desaturate the green spill on edges
        // We reduce the green channel if it's too dominant compared to red/blue
        if (u_spill > 0.0) {
            float maxRB = max(color.r, color.b);
            // If green is higher than max(red, blue), it's a spill pixel
            float spillAmount = max(0.0, color.g - maxRB) * u_spill;
            color.g -= spillAmount * (1.0 - alpha);
            color.g = max(color.g, 0.0);
        }

        // Pre-multiply alpha for correct blending
        gl_FragColor = vec4(color.rgb * alpha, alpha);
    }
`;

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255
    ] : [0, 1, 0];
}

export default function SocialWidgetRenderer({ config }) {
    const canvasRef = useRef(null);
    const videoRef = useRef(null);
    const glRef = useRef(null);
    const programRef = useRef(null);
    const textureRef = useRef(null);
    
    // WebGL uniform locations
    const uniforms = useRef({});
    
    const [isVideoReady, setIsVideoReady] = useState(false);

    // 1. Setup WebGL Context & Shader Program
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        // Must use premultipliedAlpha for transparent video rendering to match CSS standard compositing
        const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true });
        if (!gl) {
            console.error('WebGL not supported');
            return;
        }
        glRef.current = gl;

        const vs = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
        const fs = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
        
        const program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Program link error:', gl.getProgramInfoLog(program));
            return;
        }
        programRef.current = program;
        gl.useProgram(program);

        // Setup geometry (fullscreen quad)
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1.0, -1.0,   1.0, -1.0,  -1.0,  1.0,
            -1.0,  1.0,   1.0, -1.0,   1.0,  1.0
        ]), gl.STATIC_DRAW);

        const texCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            0.0, 0.0,   1.0, 0.0,   0.0, 1.0,
            0.0, 1.0,   1.0, 0.0,   1.0, 1.0
        ]), gl.STATIC_DRAW);

        const posLoc = gl.getAttribLocation(program, 'a_position');
        gl.enableVertexAttribArray(posLoc);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

        const texLoc = gl.getAttribLocation(program, 'a_texCoord');
        gl.enableVertexAttribArray(texLoc);
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 0, 0);

        // Texture setup
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        textureRef.current = texture;

        // Cache uniform locations
        uniforms.current = {
            u_keyColor: gl.getUniformLocation(program, 'u_keyColor'),
            u_similarity: gl.getUniformLocation(program, 'u_similarity'),
            u_smoothness: gl.getUniformLocation(program, 'u_smoothness'),
            u_spill: gl.getUniformLocation(program, 'u_spill'),
            u_alphaMode: gl.getUniformLocation(program, 'u_alphaMode'),
        };

        // Enable blending
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

        return () => {
            gl.deleteProgram(program);
            gl.deleteShader(vs);
            gl.deleteShader(fs);
            gl.deleteBuffer(positionBuffer);
            gl.deleteBuffer(texCoordBuffer);
            gl.deleteTexture(texture);
        };
    }, []);

    // 2. Video Playback & Render Loop
    useEffect(() => {
        let animId;
        const gl = glRef.current;
        const program = programRef.current;
        const texture = textureRef.current;
        const video = videoRef.current;

        if (!gl || !program || !video) return;

        const render = () => {
            if (video.readyState >= 2) {
                // Resize canvas to match video natively
                if (canvasRef.current.width !== video.videoWidth || canvasRef.current.height !== video.videoHeight) {
                    canvasRef.current.width = video.videoWidth;
                    canvasRef.current.height = video.videoHeight;
                    gl.viewport(0, 0, video.videoWidth, video.videoHeight);
                }

                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);

                // Update Uniforms from config
                const rgb = hexToRgb(config.keyColor || '#00FF00');
                gl.uniform3f(uniforms.current.u_keyColor, rgb[0], rgb[1], rgb[2]);
                gl.uniform1f(uniforms.current.u_similarity, config.similarity ?? 0.22);
                gl.uniform1f(uniforms.current.u_smoothness, config.smoothness ?? 0.08);
                gl.uniform1f(uniforms.current.u_spill, config.spill ?? 0.15);
                gl.uniform1i(uniforms.current.u_alphaMode, config.alphaMode === 'chroma' ? 1 : 0);

                // Clear transparent and draw
                gl.clearColor(0.0, 0.0, 0.0, 0.0);
                gl.clear(gl.COLOR_BUFFER_BIT);
                gl.drawArrays(gl.TRIANGLES, 0, 6);
            }
            animId = requestAnimationFrame(render);
        };

        animId = requestAnimationFrame(render);
        return () => cancelAnimationFrame(animId);
    }, [isVideoReady, config]);

    // Apply runtime props to hidden video
    useEffect(() => {
        const v = videoRef.current;
        if (v) {
            v.loop = config.loop !== false;
            v.muted = config.muted !== false; // Always mute widgets by default usually, but obey config
            if (v.playbackRate !== (config.playbackRate || 1)) {
                v.playbackRate = config.playbackRate || 1;
            }
        }
    }, [config.loop, config.muted, config.playbackRate]);

    return (
        <div className="w-full h-full relative pointer-events-none">
            <video 
                ref={videoRef}
                src={config.videoUrl || config.source}
                crossOrigin="anonymous"
                className="opacity-0 absolute pointer-events-none w-[1px] h-[1px]" // Hidden from view, but still decodes frames
                autoPlay
                muted
                onCanPlay={() => setIsVideoReady(true)}
                onLoadedData={() => setIsVideoReady(true)}
                onPlaying={() => setIsVideoReady(true)}
            />
            <canvas 
                ref={canvasRef}
                className="w-full h-full object-contain pointer-events-none"
            />
        </div>
    );
}
