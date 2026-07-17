import { subtitlePlaybackEngine } from './SubtitlePlaybackEngine';

class SubtitleMediaSync {
    constructor() {
        this.mediaElement = null;
        this._bindEvents = this._bindEvents.bind(this);
        this._handleTimeUpdate = this._handleTimeUpdate.bind(this);
        this._handlePlay = this._handlePlay.bind(this);
        this._handlePause = this._handlePause.bind(this);
        this._handleSeeked = this._handleSeeked.bind(this);
        this._handleRateChange = this._handleRateChange.bind(this);
    }

    attach(media) {
        if (!media) return;
        this.detach();
        this.mediaElement = media;
        this._bindEvents(true);
        this.update();
    }

    detach() {
        if (this.mediaElement) {
            this._bindEvents(false);
            this.mediaElement = null;
        }
    }

    destroy() {
        this.detach();
    }

    update() {
        if (!this.mediaElement) return;
        // Assuming engine operates in milliseconds for fine granularity subtitle sync
        subtitlePlaybackEngine.update(this.mediaElement.currentTime * 1000);
    }

    _bindEvents(bind) {
        if (!this.mediaElement) return;
        
        const action = bind ? 'addEventListener' : 'removeEventListener';
        this.mediaElement[action]('timeupdate', this._handleTimeUpdate);
        this.mediaElement[action]('play', this._handlePlay);
        this.mediaElement[action]('pause', this._handlePause);
        this.mediaElement[action]('seeked', this._handleSeeked);
        this.mediaElement[action]('ratechange', this._handleRateChange);
    }

    _handleTimeUpdate() {
        this.update();
    }

    _handlePlay() {
        subtitlePlaybackEngine.resume();
        this.update();
    }

    _handlePause() {
        subtitlePlaybackEngine.pause();
        this.update();
    }

    _handleSeeked() {
        this.update();
    }

    _handleRateChange() {
        subtitlePlaybackEngine.setPlaybackRate(this.mediaElement.playbackRate);
    }
}

export const subtitleMediaSync = new SubtitleMediaSync();
export default SubtitleMediaSync;
