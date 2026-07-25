import { useSyncExternalStore } from 'react';

class InteractionStore {
    constructor() {
        this.state = {
            isDragging: false,
            action: 'drag', // drag | resize
            id: null, // single id for now, could be array for multi-select
            subTarget: null,
            handle: '',
            startX: 0,
            startY: 0,
            origX: 0,
            origY: 0,
            origW: 0,
            origH: 0,
            dx: 0,
            dy: 0,
        };
        this.listeners = new Set();
    }

    subscribe = (listener) => {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    };

    getSnapshot = () => {
        return this.state;
    };

    setState = (partialState) => {
        let hasChanges = false;
        for (const key in partialState) {
            if (this.state[key] !== partialState[key]) {
                hasChanges = true;
                break;
            }
        }
        
        if (hasChanges) {
            this.state = { ...this.state, ...partialState };
            this.listeners.forEach(listener => listener());
        }
    };
    
    // Helper to calculate resolved transform for a given object ID
    resolveTransform = (obj) => {
        if (!this.state.isDragging || this.state.id !== obj.id) return obj;

        const { action, subTarget, origX, origY, origW, origH, dx, dy, handle } = this.state;
        
        if (action === 'drag') {
            if (subTarget && subTarget.startsWith('col_')) {
                const colIndex = parseInt(subTarget.split('_')[1], 10);
                const transformProp = colIndex === 0 ? 'leftTransform' : 'rightTransform';
                const currentTransform = obj[transformProp] || { x: 0, y: 0, scale: 1, rotation: 0, opacity: 100 };
                
                return { 
                    ...obj, 
                    [transformProp]: {
                        ...currentTransform,
                        x: origX + dx,
                        y: origY + dy
                    }
                };
            } else {
                return { ...obj, x: origX + dx, y: origY + dy };
            }
        } else if (action === 'resize') {
            let nx = origX, ny = origY, nw = origW, nh = origH;
            
            if (handle.includes('e')) nw = origW + dx;
            if (handle.includes('w')) { nw = origW - dx; nx = origX + dx; }
            if (handle.includes('s')) nh = origH + dy;
            if (handle.includes('n')) { nh = origH - dy; ny = origY + dy; }
            
            if (nw < 10) nw = 10;
            if (nh < 10) nh = 10;
            return { ...obj, x: nx, y: ny, width: nw, height: nh };
        }
        
        return obj;
    };
}

export const interactionStore = new InteractionStore();

export function useInteractionStore(selector = state => state) {
    const state = useSyncExternalStore(
        interactionStore.subscribe,
        interactionStore.getSnapshot
    );
    return selector(state);
}
