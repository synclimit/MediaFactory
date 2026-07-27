const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const outDir = path.join(__dirname, 'public', 'ambients');

const ambients = [
  { name: 'ambient_angin_badai.mp3', filter: 'anoisesrc=c=pink:r=44100:a=0.5', af: 'lowpass=f=400' },
  { name: 'ambient_angin_sepoi.mp3', filter: 'anoisesrc=c=pink:r=44100:a=0.2', af: 'lowpass=f=200' },
  { name: 'ambient_angin_malam.mp3', filter: 'anoisesrc=c=white:r=44100:a=0.1', af: 'lowpass=f=800' },
  
  { name: 'ambient_hujan_deras_1.mp3', filter: 'anoisesrc=c=white:r=44100:a=0.3', af: 'lowpass=f=1200' },
  { name: 'ambient_hujan_deras_2.mp3', filter: 'anoisesrc=c=pink:r=44100:a=0.4', af: 'highpass=f=200' },
  { name: 'ambient_hujan_deras_3.mp3', filter: 'anoisesrc=c=brown:r=44100:a=0.6', af: 'lowpass=f=2000' },
  { name: 'ambient_hujan_rintik.mp3', filter: 'anoisesrc=c=white:r=44100:a=0.1', af: 'lowpass=f=800' },
  { name: 'ambient_hujan_petir.mp3', filter: 'anoisesrc=c=brown:r=44100:a=0.7', af: 'lowpass=f=3000' },

  { name: 'ambient_sungai_tenang.mp3', filter: 'anoisesrc=c=brown:r=44100:a=0.4', af: 'lowpass=f=800' },
  { name: 'ambient_sungai_deras.mp3', filter: 'anoisesrc=c=brown:r=44100:a=0.6', af: 'lowpass=f=1500' },
  { name: 'ambient_air_terjun.mp3', filter: 'anoisesrc=c=pink:r=44100:a=0.6', af: 'lowpass=f=3000' },

  { name: 'ambient_pantai_1.mp3', filter: 'anoisesrc=c=brown:r=44100:a=0.5', af: 'lowpass=f=400' },
  { name: 'ambient_pantai_2.mp3', filter: 'anoisesrc=c=brown:r=44100:a=0.4', af: 'lowpass=f=600' },
  { name: 'ambient_ombak_besar.mp3', filter: 'anoisesrc=c=pink:r=44100:a=0.6', af: 'lowpass=f=1200' },

  { name: 'ambient_api_unggun.mp3', filter: 'anoisesrc=c=pink:r=44100:a=0.6', af: 'bandpass=f=800:width_type=q:w=1' },
  { name: 'ambient_kebakaran_hutan.mp3', filter: 'anoisesrc=c=white:r=44100:a=0.5', af: 'bandpass=f=1200:width_type=q:w=0.5' },

  { name: 'ambient_hutan_malam.mp3', filter: 'anoisesrc=c=pink:r=44100:a=0.2', af: 'highpass=f=2000' },
  { name: 'ambient_jangkrik_malam.mp3', filter: 'anoisesrc=c=white:r=44100:a=0.1', af: 'highpass=f=4000' },

  { name: 'ambient_cafe_ramai.mp3', filter: 'anoisesrc=c=brown:r=44100:a=0.4', af: 'bandpass=f=600:width_type=q:w=0.5' },
  { name: 'ambient_keramaian_kota.mp3', filter: 'anoisesrc=c=pink:r=44100:a=0.4', af: 'lowpass=f=800' },
  { name: 'ambient_jalanan_raya.mp3', filter: 'anoisesrc=c=brown:r=44100:a=0.5', af: 'lowpass=f=1500' },

  { name: 'ambient_kereta_api.mp3', filter: 'anoisesrc=c=pink:r=44100:a=0.6', af: 'bandpass=f=300:width_type=q:w=2' },
  { name: 'ambient_kabin_pesawat.mp3', filter: 'anoisesrc=c=brown:r=44100:a=0.4', af: 'lowpass=f=300' },

  { name: 'ambient_white_noise.mp3', filter: 'anoisesrc=c=white:r=44100:a=0.4', af: 'anull' },
  { name: 'ambient_pink_noise.mp3', filter: 'anoisesrc=c=pink:r=44100:a=0.4', af: 'anull' },
  { name: 'ambient_brown_noise.mp3', filter: 'anoisesrc=c=brown:r=44100:a=0.4', af: 'anull' },
];

ambients.forEach(amb => {
  const file = path.join(outDir, amb.name);
  if (fs.existsSync(file)) return;
  console.log('Generating', amb.name);
  const cmd = `ffmpeg -y -f lavfi -i "${amb.filter}" -af "${amb.af}" -t 10 "${file}"`;
  execSync(cmd, { stdio: 'inherit' });
});

console.log('All ambients generated.');
