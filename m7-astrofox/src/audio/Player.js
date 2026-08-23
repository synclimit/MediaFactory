import EventEmitter from 'core/EventEmitter';

const UPDATE_INTERVAL = 200;

export default class Player extends EventEmitter {
  constructor(context) {
    super();

    this.audioContext = context;
    this.nodes = [];
    this.audio = null;

    this.compressor = this.audioContext.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-24, this.audioContext.currentTime);
    this.compressor.knee.setValueAtTime(30, this.audioContext.currentTime);
    this.compressor.ratio.setValueAtTime(12, this.audioContext.currentTime);
    this.compressor.attack.setValueAtTime(0.003, this.audioContext.currentTime);
    this.compressor.release.setValueAtTime(0.25, this.audioContext.currentTime);

    this.volume = this.audioContext.createGain();
    this.compressor.connect(this.volume);
    this.volume.connect(this.audioContext.destination);

    this.normalization = true;
    this.pitch = 0;
    this.fadeIn = 0;
    this.fadeOut = 0;
    this.loop = false;
  }

  load(audio) {
    this.unload();

    this.audio = audio;
    if (this.audio) {
      if (this.pitch !== 0 && this.audio.setPitch) {
        this.audio.setPitch(this.pitch);
      }
      this.audio.addNode(this.normalization ? this.compressor : this.volume);
      this.audio.on('ended', () => {
        this.emit('ended');
      });
    }

    this.emit('audio-load');
  }

  unload() {
    const { audio } = this;

    if (audio) {
      this.stop();
      audio.unload();

      this.emit('audio-unload');
    }
  }

  play() {
    const { audio } = this;

    if (audio) {
      if (audio.playing) {
        this.pause();
      } else {
        audio.play();

        this.timer = setInterval(() => {
          if (!audio.repeat && audio.getPosition() >= 1.0) {
            if (this.loop) {
              this.seek(0);
            } else {
              this.stop();
              this.emit('ended');
            }
          }

          this.emit('tick');
        }, UPDATE_INTERVAL);

        this.emit('play');
        this.emit('playback-change');
      }
    }
  }

  pause() {
    const { audio } = this;

    if (audio) {
      audio.pause();

      clearInterval(this.timer);

      this.emit('pause');
      this.emit('playback-change');
    }
  }

  stop() {
    const { audio } = this;

    if (audio) {
      audio.stop();
      clearInterval(this.timer);
      this.emit('stop');
      this.emit('playback-change');
    }
  }

  setPlaylistContext(totalDuration, trackStartTime = 0) {
    this.playlistTotalDuration = totalDuration || 0;
    this.playlistTrackStartTime = trackStartTime || 0;
    this.emit('tick');
    this.emit('playback-change');
  }

  seek(val) {
    if (this.playlistTotalDuration && this.playlistTotalDuration > 0) {
      const globalTime = Math.max(0, Math.min(this.playlistTotalDuration, val * this.playlistTotalDuration));
      this.emit('playlist-seek', { globalTime, pos: val });
      return;
    }

    const { audio } = this;
    if (audio) {
      audio.seek(val);
      this.emit('seek');
    }
  }

  seekLocal(val) {
    const { audio } = this;
    if (audio) {
      audio.seek(val);
      this.emit('seek');
    }
  }

  getAudio() {
    return this.audio;
  }

  hasAudio() {
    return !!this.getAudio();
  }

  setVolume(val) {
    if (this.volume) {
      this.volume.gain.value = val;
    }
  }

  setPitch(semitones = 0) {
    this.pitch = semitones;
    if (this.audio && this.audio.setPitch) {
      this.audio.setPitch(semitones);
    }
  }

  setNormalization(enabled = true) {
    this.normalization = !!enabled;
    if (this.audio) {
      this.audio.removeNode(this.volume);
      this.audio.removeNode(this.compressor);
      this.audio.addNode(this.normalization ? this.compressor : this.volume);
    }
  }

  setFade(fadeIn = 0, fadeOut = 0) {
    this.fadeIn = parseFloat(fadeIn) || 0;
    this.fadeOut = parseFloat(fadeOut) || 0;
  }

  getVolume() {
    return this.volume.gain.value;
  }

  getCurrentTime() {
    const localTime = this.audio ? this.audio.getCurrentTime() : 0;
    if (this.playlistTotalDuration && this.playlistTotalDuration > 0) {
      return (this.playlistTrackStartTime || 0) + localTime;
    }
    return localTime;
  }

  getDuration() {
    if (this.playlistTotalDuration && this.playlistTotalDuration > 0) {
      return this.playlistTotalDuration;
    }
    if (this.audio) {
      return this.audio.getDuration();
    }
    return 0;
  }

  getPosition() {
    if (this.playlistTotalDuration && this.playlistTotalDuration > 0) {
      return Math.min(1.0, this.getCurrentTime() / this.playlistTotalDuration);
    }
    if (this.audio) {
      return this.audio.getPosition();
    }
    return 0;
  }

  setLoop(val) {
    this.loop = val;
  }

  isPlaying() {
    return !!(this.audio && this.audio.playing);
  }

  isLooping() {
    return !!this.loop;
  }
}
