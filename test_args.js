const str = 'ffmpeg -y -i "D:\\MediaFactory\\mock\\main.mp4" -i "D:\\MediaFactory\\mock\\cta.mp4" -filter_complex "[0:v]trim=start=0:end=3,setpts=PTS-STARTPTS[v0];[1:v]trim=start=0:end=3,setpts=PTS-STARTPTS[v1];[0:v]trim=start=3,setpts=PTS-STARTPTS[v2];[v0][v1][v2]concat=n=3:v=1:a=0[outv]" -map "[outv]" -r 30 -s 1080x1920 "D:\\MediaFactory\\Output\\M5\\M5_INTERRUPT_4.mp4"';
const args = str.match(/(?:[^\s"]+|"[^"]*")+/g).map(s => s.replace(/^"|"$/g, ''));
console.log(args);
