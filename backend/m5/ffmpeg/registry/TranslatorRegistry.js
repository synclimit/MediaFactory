const VisualTranslator = require('../translators/VisualTranslator');
const CameraTranslator = require('../translators/CameraTranslator');
const MotionTranslator = require('../translators/MotionTranslator');
const AudioTranslator = require('../translators/AudioTranslator');
const OverlayTranslator = require('../translators/OverlayTranslator');
const TransitionTranslator = require('../translators/TransitionTranslator');

class TranslatorRegistry {
    static get visual() { return VisualTranslator; }
    static get camera() { return CameraTranslator; }
    static get motion() { return MotionTranslator; }
    static get audio() { return AudioTranslator; }
    static get overlay() { return OverlayTranslator; }
    static get transition() { return TransitionTranslator; }
}

module.exports = TranslatorRegistry;
