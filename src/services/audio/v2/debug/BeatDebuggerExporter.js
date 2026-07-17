export class BeatDebuggerExporter {
    
    exportJSON(session) {
        return JSON.stringify(session, null, 2);
    }

    exportCSV(session) {
        if (!session || !session.debugFrames) return "";
        const frames = session.debugFrames;
        if (frames.length === 0) return "";

        // Extract headers from the first schema frame
        const headers = Object.keys(frames[0]);
        const lines = [];
        lines.push(headers.join(","));

        for (const f of frames) {
            const row = headers.map(h => {
                let val = f[h];
                if (typeof val === 'boolean') return val ? 1 : 0;
                if (typeof val === 'number') return val.toFixed(4); // Clamp decimal precision
                return val;
            });
            lines.push(row.join(","));
        }

        return lines.join("\n");
    }

    exportTXT(session) {
        if (!session) return "";
        let txt = `=== BEAT DEBUGGER PRO REPORT ===\n`;
        txt += `Audio Hash: ${session.audioHash}\n`;
        txt += `Analyzer Version: ${session.analyzerVersion}\n`;
        txt += `Total Beats: ${session.timelineSummary.totalBeats}\n`;
        txt += `Global BPM: ${session.timelineSummary.globalBpm?.toFixed(2)}\n`;
        txt += `\n--- DEBUG FRAMES (SPARSE) ---\n`;
        
        // Print only physically relevant structural events to prevent file bloating
        session.debugFrames.forEach(f => {
            if (f.isBeat) {
                const marker = f.isDownbeat ? "DOWNBEAT" : "BEAT    ";
                txt += `[${f.timestamp.toFixed(3)}s] ${marker} - BPM: ${f.bpm.toFixed(1)} - Bar: ${f.barIndex} | Kick: ${f.kickProb.toFixed(2)} | Snare: ${f.snareProb.toFixed(2)} | HiHat: ${f.hihatProb.toFixed(2)}\n`;
            } else if (f.isOnset) {
                txt += `[${f.timestamp.toFixed(3)}s] Onset Detected - Flux: ${f.spectralFlux.toFixed(2)} > Threshold: ${f.adaptiveThreshold.toFixed(2)}\n`;
            }
        });

        return txt;
    }
}
