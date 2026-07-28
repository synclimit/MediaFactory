import { RendererKernel } from '../renderer/RendererKernel.js';
import { RendererBuilder } from '../renderer/RendererBuilder.js';
import { CommandTranslator } from '../renderer/CommandTranslator.js';
import { RenderValidator } from '../renderer/RenderValidator.js';

export class RendererFactory {
    static createRenderer() {
        return new RendererKernel(
            new RendererBuilder(new CommandTranslator(), new RenderValidator())
        );
    }
}
