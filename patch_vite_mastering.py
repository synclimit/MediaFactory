import sys

with open('vite-plugin-render-engine.js', 'r', encoding='utf-8') as f:
    content = f.read()

target = '''    // Use FFmpeg to concat the resolved MP3 files
    try {
      console.log('[M2 Render] FFmpeg started');
      await execAsync(`ffmpeg -y -f concat -safe 0 -i "${concatPath}" -c copy "${outputPath}"`);
      console.log('[M2 Render] FFmpeg finished');
    } catch (ffErr) {
      console.log(`[M2 Render] ERROR: ${ffErr.message}`);
      throw new Error(`FFmpeg exited with error: ${ffErr.message}`);
    }'''

replacement = '''    // Use FFmpeg to concat the resolved MP3 files
    try {
      console.log('[M2 Render] FFmpeg started');
      
      let ffmpegCmd = `ffmpeg -y -f concat -safe 0 -i "${concatPath}"`;
      
      if (job.masteringSettings && job.masteringSettings.id !== 'neutral') {
        // Just checking if mastering is "enabled" or passed. Wait, even 'neutral' applies mastering.
        // If masteringSettings is present and we shouldn't just bypass, we apply it.
        // Actually, if masteringSettings is present, we ALWAYS apply mastering (unless disabled entirely, but there's no master toggle, it's just the profile).
      }
      
      let afStr = '';
      if (job.masteringSettings) {
        console.log('[M2 Mastering] Profile Applied');
        const m = job.masteringSettings;
        const filters = [];
        
        // 1. loudnorm
        filters.push(`loudnorm=I=${m.targetLufs}:TP=-1.0:LRA=11`);
        console.log('[M2 Mastering] Loudness Normalized');
        
        // 2. compressor
        if (m.compressor) {
          filters.push('acompressor');
          console.log('[M2 Mastering] Compressor Applied');
        }
        
        // 3. volume
        if (m.outputGain !== '0') {
          filters.push(`volume=${m.outputGain}dB`);
        }
        
        // 4. limiter
        if (m.limiter) {
          filters.push('alimiter=limit=-0.5dB');
          console.log('[M2 Mastering] Limiter Applied');
        }
        
        if (filters.length > 0) {
          afStr = filters.join(',');
          console.log('[M2 Mastering] FFmpeg Chain:\\n' + filters.join('\\n'));
          ffmpegCmd += ` -af "${afStr}" -c:a libmp3lame -b:a 320k`;
        } else {
          ffmpegCmd += ` -c copy`;
        }
      } else {
        ffmpegCmd += ` -c copy`;
      }
      
      ffmpegCmd += ` "${outputPath}"`;
      
      await execAsync(ffmpegCmd);
      console.log('[M2 Render] FFmpeg finished');
    } catch (ffErr) {
      console.log(`[M2 Render] ERROR: ${ffErr.message}`);
      throw new Error(`Mastering filter chain failed: ${ffErr.message}`);
    }'''

content = content.replace(target, replacement)

with open('vite-plugin-render-engine.js', 'w', encoding='utf-8') as f:
    f.write(content)
