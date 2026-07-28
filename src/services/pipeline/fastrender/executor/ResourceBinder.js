export class ResourceBinder {
    bind(commands) {
        const bindings = {};
        for (let cmd of commands) {
            if (cmd.resourceReference) {
                // Dummy binding logic for Phase 13
                bindings[cmd.resourceReference] = 'D:\\MediaFactory\\resources\\' + cmd.resourceReference + '.mp4';
                if (cmd.resourceReference === 'MISSING_RESOURCE_TEST') {
                    throw new Error('Missing Resource');
                }
            }
        }
        return bindings;
    }
}
