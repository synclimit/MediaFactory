class PresetManager {
    applyPreset(editorState, presetName) {
        // Breaking News, Business, Sports, Modern, Glass, Minimal, Bold
        const layerManager = editorState._layerManager; 
        
        if (presetName === 'Breaking News') {
            const headline = editorState.layers.find(l => l.id === 'headline');
            if (headline) {
                headline.properties.color = '#FFFFFF';
                headline.properties.backgroundColor = '#FF0000';
                headline.properties.fontSize = 32;
                headline.properties.fontWeight = 'bold';
            }
        }
        else if (presetName === 'Glass') {
            const bg = editorState.layers.find(l => l.id === 'background');
            if (bg) {
                bg.properties.opacity = 0.5;
                bg.properties.blur = '10px';
            }
        }
        
        editorState.isModified = true;
    }
}
module.exports = PresetManager;