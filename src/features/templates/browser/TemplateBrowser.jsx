import React, { useState, useEffect } from 'react';
import { templateBrowserController } from './TemplateBrowserController';
import TemplateToolbar from './TemplateToolbar';
import TemplateGrid from './TemplateGrid';
import PreviewPanel from './PreviewPanel';

export default function TemplateBrowser() {
    const [state, setState] = useState(templateBrowserController.getState());

    useEffect(() => {
        const handleStateChange = (e) => setState(e.detail);
        templateBrowserController.addEventListener('stateChanged', handleStateChange);
        
        // Initial fetch
        templateBrowserController.refresh();

        return () => {
            templateBrowserController.removeEventListener('stateChanged', handleStateChange);
        };
    }, []);

    return (
        <div className="flex h-full w-full bg-[#0b0c10] text-gray-200 border border-[#21232d] rounded-lg overflow-hidden">
            <div className="flex flex-col flex-1 overflow-hidden">
                <TemplateToolbar state={state} controller={templateBrowserController} />
                <TemplateGrid state={state} controller={templateBrowserController} />
            </div>
            {state.selectedTemplate && (
                <div className="w-80 border-l border-[#21232d] bg-[#0f111a] flex-shrink-0 flex flex-col">
                    <PreviewPanel state={state} controller={templateBrowserController} />
                </div>
            )}
        </div>
    );
}
