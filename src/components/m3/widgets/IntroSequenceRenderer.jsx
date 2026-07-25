import React from 'react';

// Easing function for a very smooth cinematic transition
const easeInOutSine = (x) => {
    return -(Math.cos(Math.PI * x) - 1) / 2;
};

const IntroSequenceRenderer = ({ el, currentTime, isOutro }) => {
    // Prevent Outro from rendering at the start of the video (overlapping Intro)
    if (isOutro && (!el.startTime || el.startTime === 0)) return null;

    let totalDuration = parseFloat(el.introDuration || '3');
    if (el.introStyle === 'Paragraph (Text)') {
        const pCount = el.paragraphCount ? parseInt(el.paragraphCount) : 1;
        const pDur = el.paragraphDuration ? parseInt(el.paragraphDuration) : 5;
        totalDuration = pCount * pDur;
    }
    
    // Only render the overlay during its active duration window
    // For Intro, this is 0 to totalDuration.
    // For Outro, this is el.startTime to el.startTime + totalDuration
    const activeTime = isOutro ? (currentTime - el.startTime) : currentTime;
    
    if (activeTime < 0 || activeTime > totalDuration) return null;
    
    const style = el.introStyle || 'Focus Pull (Blur)';
    const intensity = el.intensity !== undefined ? el.intensity : (el.blurAmount !== undefined ? el.blurAmount : 40);
    
    // Calculate progress 0 to 1 based on active window
    const progress = Math.min(1, activeTime / totalDuration);
    
    // Apply easing for a smoother fade curve
    const easedProgress = easeInOutSine(progress);
    
    // Reverse progress: 1 means fully blurred/dark (start), 0 means clear (end)
    // For an Outro, we want it to go from Clear (0) to Blurred/Dark (1)!
    // So if it's an outro, invProgress = easedProgress;
    const invProgress = isOutro ? easedProgress : (1 - easedProgress);
    
    let backdropFilter = 'none';
    let WebkitBackdropFilter = 'none';
    let backgroundColor = 'transparent';
    let background = 'none';

    if (style === 'Focus Pull (Blur)') {
        const currentBlur = (intensity / 10) * invProgress;
        if (currentBlur > 0.1) {
            backdropFilter = `blur(${currentBlur}px)`;
            WebkitBackdropFilter = `blur(${currentBlur}px)`;
        }
    } else if (style === 'Fade from Black') {
        // Fade from black must start at 100% black regardless of intensity
        backgroundColor = `rgba(0, 0, 0, ${invProgress})`;
    } else if (style === 'Fade from White') {
        // Fade from white must start at 100% white regardless of intensity
        backgroundColor = `rgba(255, 255, 255, ${invProgress})`;
    } else if (style === 'Cinematic Vignette') {
        // Intensity controls the thickness of the vignette. Increase multiplier so it's more visible.
        const currentOpacity = (intensity / 100) * 2 * invProgress;
        background = `radial-gradient(circle at center, transparent 30%, rgba(0, 0, 0, ${Math.min(1, currentOpacity)}) 100%)`;
    } else if (style === 'Effect Blur' || style === 'Cinematic Fade In (Blur+Black)') {
        const darkIntensity = el.darkIntensity !== undefined ? el.darkIntensity : 100;
        if (darkIntensity > 0) {
            const currentOpacity = (darkIntensity / 100) * invProgress;
            backgroundColor = `rgba(0, 0, 0, ${currentOpacity})`;
        }
        
        const currentBlur = (intensity / 10) * invProgress;
        if (currentBlur > 0.1) {
            backdropFilter = `blur(${currentBlur}px)`;
            WebkitBackdropFilter = `blur(${currentBlur}px)`;
        }
    } else if (style === 'Paragraph (Text)') {
        // Parse settings
        const paragraphCount = el.paragraphCount ? parseInt(el.paragraphCount) : 1;
        const paragraphDuration = el.paragraphDuration ? parseInt(el.paragraphDuration) : 5;
        const totalDuration = paragraphCount * paragraphDuration;
        const textTransition = el.textTransition || 'Fade In/Out';
        const mainTransition = el.mainTransition || 'Fade to Video';
        
        const darkIntensity = el.darkIntensity !== undefined ? el.darkIntensity : 100;
        const blurIntensity = el.blurIntensity !== undefined ? el.blurIntensity : 40;
        
        // Time logic
        const t = Math.max(0, Math.min(totalDuration, (currentTime - (el.startTime || 0))));
        let pIndex = Math.floor(t / paragraphDuration);
        if (pIndex >= paragraphCount) pIndex = paragraphCount - 1;
        
        const localT = t - (pIndex * paragraphDuration);
        const pProgress = localT / paragraphDuration;
        const timeRemaining = totalDuration - t;
        
        const introText = el[`introText${pIndex + 1}`] || '';
        const textColor = el.introTextColor || '#ffffff';
        const fontSize = el.introFontSize !== undefined ? el.introFontSize : 32;
        const fontFamily = el.introFontFamily || 'Inter';
        const textAlign = el.introTextAlign || 'center';
        
        // Background and Main Screen Transition
        let bgOpacity = darkIntensity / 100;
        let currentBlur = blurIntensity / 10;
        let bgWhiteOut = 0;
        
        if (timeRemaining <= 1.0) {
            // Main video transition phase (last 1 second)
            const transProgress = 1.0 - timeRemaining; // 0 to 1
            if (mainTransition === 'Fade to Video') {
                bgOpacity = bgOpacity * (1 - transProgress);
                currentBlur = currentBlur * (1 - transProgress);
            } else if (mainTransition === 'Flash White') {
                if (transProgress > 0.7) {
                    bgWhiteOut = (transProgress - 0.7) / 0.3; // White flash at the very end
                }
            } else if (mainTransition === 'Blur Reveal') {
                bgOpacity = bgOpacity * Math.max(0, 1 - (transProgress * 2)); // Fade dark fast
                currentBlur = currentBlur * (1 - transProgress); // Keep blur slightly longer
            }
        }
        
        let backgroundRender = `rgba(0, 0, 0, ${bgOpacity})`;
        if (bgWhiteOut > 0) {
            backgroundRender = `rgba(255, 255, 255, ${bgWhiteOut})`;
        }
        
        // Text Transition Logic
        let textOpacity = 1;
        let textTransform = 'none';
        let displayedText = introText;
        
        // Fade in/out ramp (0.5s fade in, 0.5s fade out)
        const rampIn = Math.min(1, localT / 0.5);
        const rampOut = Math.min(1, (paragraphDuration - localT) / 0.5);
        const textVisibility = Math.min(rampIn, rampOut);
        
        let textMask = 'none';
        let textFilter = 'none';
        let textLetterSpacing = 'normal';
        let textClipPath = 'none';
        
        if (textTransition === 'Fade In/Out') {
            textOpacity = textVisibility;
        } else if (textTransition === 'Slide Up') {
            textOpacity = textVisibility;
            const yOffset = (1 - rampIn) * 50 - (1 - rampOut) * 50; // Slides up in, slides up out
            textTransform = `translateY(${yOffset}px)`;
        } else if (textTransition === 'Zoom In') {
            textOpacity = textVisibility;
            const scale = 0.8 + (pProgress * 0.4); // 0.8 to 1.2
            textTransform = `scale(${scale})`;
        } else if (textTransition === 'Typewriter') {
            textOpacity = rampOut; // Only fade out at the end
            const typeProgress = Math.min(1, localT / (paragraphDuration - 1.0)); // Type over duration minus 1s
            const charCount = Math.floor(typeProgress * introText.length);
            displayedText = introText.substring(0, charCount);
        } else if (textTransition === 'Handwriting (Sweep)') {
            textOpacity = rampOut; // Only fade out at the end
            const writeProgress = Math.min(1, localT / (paragraphDuration - 1.0)); 
            
            // ULTIMATE POTATO PC OPTIMIZATION: Use pure geometry clipping (clip-path) instead of pixel masks!
            // Starts hidden by clipping 100% from the right.
            const rightClip = Math.max(0, 100 - (writeProgress * 105));
            textClipPath = `inset(0% ${rightClip}% 0% 0%)`;
        } else if (textTransition === 'Focus Pull (Text)') {
            textOpacity = textVisibility;
            const blurIn = Math.max(0, (1 - rampIn) * 15);
            const blurOut = Math.max(0, (1 - rampOut) * 15);
            const textBlur = blurIn + blurOut;
            if (textBlur > 0) {
                textFilter = `blur(${textBlur}px)`;
            }
        } else if (textTransition === 'Cinematic Tracking') {
            textOpacity = textVisibility;
            // Letter spacing expands from wide to normal
            const tracking = Math.max(0, (1 - rampIn) * 15); 
            textLetterSpacing = tracking > 0 ? `${tracking}px` : 'normal';
        }
        
        // Style optimizations
        const overlayStyle = {
            position: 'absolute',
            inset: 0,
            backgroundColor: backgroundRender,
            pointerEvents: 'none',
            zIndex: 9999
        };

        if (currentBlur > 0) {
            overlayStyle.backdropFilter = `blur(${currentBlur}px)`;
            overlayStyle.WebkitBackdropFilter = `blur(${currentBlur}px)`;
        }

        const textStyle = {
            color: textColor,
            fontSize: `${fontSize}px`,
            textAlign: textAlign,
            opacity: textOpacity,
            whiteSpace: 'pre-wrap',
            fontFamily: `"${fontFamily}", sans-serif`,
            lineHeight: 1.4,
            textRendering: 'optimizeSpeed',
        };

        if (textTransform !== 'none') {
            textStyle.transform = textTransform;
        }

        if (textFilter !== 'none') {
            textStyle.filter = textFilter;
        }

        if (textLetterSpacing !== 'normal') {
            textStyle.letterSpacing = textLetterSpacing;
        }

        if (textClipPath !== 'none') {
            textStyle.clipPath = textClipPath;
            textStyle.WebkitClipPath = textClipPath;
        } else if (textFilter === 'none') {
            textStyle.textShadow = '0 4px 12px rgba(0,0,0,0.5)';
        }

        // Render
        return (
            <div className="flex items-center justify-center p-12 overflow-hidden" style={overlayStyle}>
                {displayedText && bgWhiteOut < 0.5 && (
                    <div key={`para-${pIndex}`} style={textStyle}>
                        {displayedText}
                    </div>
                )}
                {bgWhiteOut > 0 && (
                    <div className="absolute inset-0 bg-white pointer-events-none" style={{ opacity: bgWhiteOut }} />
                )}
            </div>
        );
    }
    
    return (
        <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 9999,
            backdropFilter,
            WebkitBackdropFilter,
            backgroundColor,
            background: background !== 'none' ? background : undefined,
            transform: 'translateZ(0)',
            willChange: 'backdrop-filter, background-color'
        }} />
    );
};

export default IntroSequenceRenderer;
