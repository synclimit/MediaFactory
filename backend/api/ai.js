const express = require('express');
const router = express.Router();

/**
 * AI Rephrase Endpoint for Video & Song Metadata Descriptions
 * Supports: Google Gemini, Groq, OpenAI, and Smart Heuristic Engine
 */
router.post('/api/v1/ai/rephrase', async (req, res) => {
    const { text, title, style = 'clean_rephrase', apiKey, provider = 'gemini' } = req.body;

    if (!text || typeof text !== 'string' || text.trim() === '') {
        return res.status(400).json({ error: 'Text description is required' });
    }

    const systemPrompt = `You are a professional YouTube Metadata & SEO Specialist for music, videos, and creative content.
Your task is to rephrase and optimize the given video description.
Guidelines:
1. Retain essential credits (Song Title, Original Artist, Vocalist, Producer, Composers, Arrangers).
2. Remove ugly spam links, broken tracking URLs, raw IDs, or irrelevant promotional clutter.
3. Keep clean social links, official links, or hashtag credits if present.
4. Format with neat, professional emojis, clean section dividers, and high-CTR layout.
5. Add relevant hashtags at the bottom (e.g. #Music #Cover #Audio).
6. Output ONLY the finalized rephrased description text. Do not include markdown code blocks, backticks, or intro/outro chat.`;

    let styleInstruction = '';
    switch (style) {
        case 'seo_rich':
            styleInstruction = 'Maximize YouTube SEO search visibility with engaging tags, catchy hook, and structured bullet points.';
            break;
        case 'short_catchy':
            styleInstruction = 'Make it concise, punchy, modern, and engaging for mobile viewers (under 5-6 lines total).';
            break;
        case 'translate_id':
            styleInstruction = 'Translate and localize the description naturally into fluent, engaging Indonesian language while keeping artist/song names intact.';
            break;
        case 'translate_en':
            styleInstruction = 'Translate and localize the description naturally into fluent, professional English while keeping artist/song names intact.';
            break;
        case 'clean_rephrase':
        default:
            styleInstruction = 'Clean up all messy text, fix Japanese/foreign formatting into clean readable layout, retain all song credits, and polish with modern YouTube style.';
            break;
    }

    const fullPrompt = `${systemPrompt}\n\nStyle Requirement: ${styleInstruction}\n${title ? `Video/Song Title: ${title}\n` : ''}\nOriginal Description to Rephrase:\n"""\n${text.trim()}\n"""\n\nOptimized & Rephrased Description:`;

    // 1. Try Gemini API
    if ((provider === 'gemini' || provider === 'google') && apiKey) {
        try {
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`;
            const response = await fetch(geminiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: fullPrompt }] }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 1200
                    }
                })
            });

            if (response.ok) {
                const data = await response.json();
                const outText = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (outText && outText.trim()) {
                    return res.json({ 
                        success: true, 
                        rephrased: outText.trim(), 
                        provider: 'Google Gemini' 
                    });
                }
            } else {
                const errData = await response.json().catch(() => ({}));
                console.warn('[AI Rephrase] Gemini error:', errData);
            }
        } catch (e) {
            console.warn('[AI Rephrase] Gemini request failed:', e.message);
        }
    }

    // 2. Try Groq API
    if (provider === 'groq' && apiKey) {
        try {
            const groqUrl = 'https://api.groq.com/openai/v1/chat/completions';
            const response = await fetch(groqUrl, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey.trim()}`
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        { role: 'system', content: systemPrompt + '\n' + styleInstruction },
                        { role: 'user', content: text }
                    ],
                    temperature: 0.7,
                    max_tokens: 1200
                })
            });

            if (response.ok) {
                const data = await response.json();
                const outText = data.choices?.[0]?.message?.content;
                if (outText && outText.trim()) {
                    return res.json({ 
                        success: true, 
                        rephrased: outText.trim(), 
                        provider: 'Groq AI (Llama-3.3)' 
                    });
                }
            }
        } catch (e) {
            console.warn('[AI Rephrase] Groq request failed:', e.message);
        }
    }

    // 3. Try OpenAI API
    if (provider === 'openai' && apiKey) {
        try {
            const openaiUrl = 'https://api.openai.com/v1/chat/completions';
            const response = await fetch(openaiUrl, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey.trim()}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        { role: 'system', content: systemPrompt + '\n' + styleInstruction },
                        { role: 'user', content: text }
                    ],
                    temperature: 0.7,
                    max_tokens: 1200
                })
            });

            if (response.ok) {
                const data = await response.json();
                const outText = data.choices?.[0]?.message?.content;
                if (outText && outText.trim()) {
                    return res.json({ 
                        success: true, 
                        rephrased: outText.trim(), 
                        provider: 'OpenAI GPT' 
                    });
                }
            }
        } catch (e) {
            console.warn('[AI Rephrase] OpenAI request failed:', e.message);
        }
    }

    // 4. Smart Built-In Cleaner & Rephraser Fallback
    const cleaned = fallbackSmartRephrase(text, title, style);
    return res.json({ 
        success: true, 
        rephrased: cleaned, 
        provider: 'MediaFactory Smart Engine (Offline/Default)' 
    });
});

function fallbackSmartRephrase(rawText, title, style) {
    let lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    // Filter out tracking/spam patterns
    lines = lines.filter(line => {
        if (/utm_|track|click\.php|affiliate|subscribe_link_spam/i.test(line)) return false;
        return true;
    });

    const header = title ? `✨ ${title.toUpperCase()}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━` : '✨ OFFICIAL VIDEO METADATA\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    const body = lines.join('\n\n');
    const footer = `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n🔔 Subscribe & Aktifkan Notifikasi untuk update karya terbaru!\n#Music #FullCover #Audio #Trending`;

    return `${header}\n\n${body}\n${footer}`;
}

module.exports = router;
