# Render Pipeline Report (MF-600A)

## Architecture Overview
The RenderPipeline has been successfully unified. 
- **Single Runtime**: Subtitle, Visual, and Beat engines execute synchronously and sequentially.
- **Single FrameComposer**: Consumes runtime outputs to generate a strictly immutable `RenderFrame`.
- **OutputManager Delegation**: The RenderPipeline no longer holds any React or rendering logic. It purely dispatches the `RenderFrame` to the `OutputManager`.

## Duplication Removed
- The `Renderer.js` dependency was entirely removed from the core pipeline loop.
- `M3PreviewCanvas` was stripped of its 150-line manual mapping logic. It now acts purely as a UI host relying on the `MediaFactoryRenderer` component via `ReactPreviewAdapter`.

## Preview == Export
Preview and Export targets now consume the exact same `RenderFrame` payload, ensuring true visual parity.
