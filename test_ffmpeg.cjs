const { spawn } = require('child_process');

const filterComplex = `[0:v]scale=-2:240,pad=ceil(iw/2)*2:ceil(ih/2)*2[v0];[v0]drawtext=fontfile='C\\:/Windows/Fonts/arial.ttf':text='(WATERMARK)':x=10:y=10:fontsize=24:fontcolor=white[v1];[v1]copy[v]`;

const ffmpegArgs = [
  '-y',
  '-f', 'lavfi',
  '-i', 'color=c=black:s=640x480:d=1',
  '-filter_complex', filterComplex,
  '-map', '[v]',
  '-c:v', 'libx264',
  'test_ffmpeg_out.mp4'
];

const proc = spawn('ffmpeg', ffmpegArgs);
proc.stdout.on('data', d => console.log(d.toString()));
proc.stderr.on('data', d => console.error(d.toString()));
proc.on('close', code => console.log('Exited with', code));
