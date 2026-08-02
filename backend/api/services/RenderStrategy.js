/**
 * Shared RenderStrategy Enum for MediaFactory
 * Used across Planner, Cache Manager, Compatibility Validator, and Renderers.
 */
const RenderStrategy = Object.freeze({
  CACHE_HIT: 'CACHE_HIT',
  STREAM_COPY: 'STREAM_COPY',
  MINIMAL_ENCODE: 'MINIMAL_ENCODE',
  FULL_ENCODE: 'FULL_ENCODE'
});

module.exports = RenderStrategy;
