const { spawn } = require('child_process');

const args = [
  'ffmpeg',
  '-progress', 'pipe:1',
  '-y',
  '-i',
  'D:\\MediaFactory\\mock\\main.mp4',
  '-i',
  'D:\\MediaFactory\\mock\\cta.mp4',
  '-filter_complex',
  '[0:v]trim=start=0:end=3,setpts=PTS-STARTPTS[v0];[1:v]trim=start=0:end=3,setpts=PTS-STARTPTS[v1];[0:v]trim=start=3,setpts=PTS-STARTPTS[v2];[v0][v1][v2]concat=n=3:v=1:a=0[outv]',
  '-map',
  '[outv]',
  '-r',
  '30',
  '-s',
  '720x1280',
  'D:\\MediaFactory\\Output\\M5\\M5_INTERRUPT_5.mp4'
];

console.log("Spawning:", args[0], args.slice(1).join(' '));

const ffProc = spawn(args[0], args.slice(1));

ffProc.stdout.on('data', d => console.log("STDOUT:", d.toString()));
ffProc.stderr.on('data', d => console.error("STDERR:", d.toString()));
ffProc.on('close', c => console.log("CLOSE:", c));
ffProc.on('error', e => console.error("ERROR:", e));
