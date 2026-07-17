const cmd = 'ffmpeg -i "d:/my space/video.mp4" -c:v copy';
console.log(cmd.match(/(?:[^\s"]+|"[^"]*")+/g).map(s => s.replace(/^"|"$/g, '')));
