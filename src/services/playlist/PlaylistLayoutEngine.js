class PlaylistLayoutEngine {
    static calculate(tracks, config, realtimeTrackIndex = -1) {
        if (!tracks || tracks.length === 0) {
            return {
                leftColumn: { tracks: [], x: 0 },
                rightColumn: { tracks: [], x: 0 },
                layout: 'single',
                metrics: { itemsPerColumn: 0, total: 0, columnWidth: 0, columnGap: 0, totalHeight: 0, rows: 0 }
            };
        }

        const columnsCount = config.columns || 1;
        const total = tracks.length;
        const itemsPerColumn = Math.ceil(total / columnsCount); // Auto Split
        const numbering = config.numbering || 'Numbers (1.)';
        const align = config.align?.toLowerCase() || 'left';
        
        // Calculate Gaps and Offsets
        const columnGap = config.columnGap || 100;
        const rowGap = config.gap || 0;
        let totalWidth = config.width || 800;
        if (typeof totalWidth === 'string' && totalWidth.includes('%')) {
            totalWidth = (parseFloat(totalWidth) / 100) * 1920;
        }
        
        const columnWidth = columnsCount === 1 ? totalWidth : (totalWidth - columnGap) / 2;
        
        const fontSize = config.fontSize || 24;
        const lineHeight = config.lineHeight || 1.5;
        const totalHeight = itemsPerColumn * (fontSize * lineHeight) + (itemsPerColumn - 1) * rowGap;

        // X Positions relative to center
        const leftX = columnsCount === 1 ? 0 : -(totalWidth / 4) - (columnGap / 4);
        const rightX = columnsCount === 1 ? 0 : (totalWidth / 4) + (columnGap / 4);

        const leftColumn = { tracks: [], x: leftX };
        const rightColumn = { tracks: [], x: rightX };

        tracks.forEach((track, i) => {
            const rawTitle = typeof track === 'string' ? track : track.title;
            const number = i + (config.startIndex || 1);
            
            let displayTitle = rawTitle;
            let displayRight = null;

            const activeIndicator = config.activeIndicator || 'Arrow (▶)';
            let indicatorText = '';
            if (activeIndicator === 'Arrow (▶)') indicatorText = '▶ ';
            else if (activeIndicator === 'Dot (•)') indicatorText = '• ';
            else if (activeIndicator === 'Line (|)') indicatorText = '| ';

            let numStr = '';
            if (numbering === 'Numbers (1.)') numStr = `${number}.`;
            else if (numbering === 'Roman (I.)') {
                const romanMap = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
                numStr = `${romanMap[number - 1] || number}.`;
            }

            let currentAlign = align;

            if (align === 'space between' && numStr) {
                displayTitle = `${(i + (config.startIndex || 1) - 1) === realtimeTrackIndex ? indicatorText : ''}${rawTitle}`;
                displayRight = numStr.replace('.', ''); // usually for right side, they just want the number itself
                currentAlign = 'left';
            } else if (align === 'split (mirrored)') {
                const isRightColumn = columnsCount > 1 && i >= itemsPerColumn;
                if (isRightColumn) {
                    displayTitle = `${(i + (config.startIndex || 1) - 1) === realtimeTrackIndex ? indicatorText : ''}${rawTitle}${numStr ? ' ' + numStr : ''}`;
                    currentAlign = 'right';
                } else {
                    displayTitle = `${(i + (config.startIndex || 1) - 1) === realtimeTrackIndex ? indicatorText : ''}${numStr ? numStr + ' ' : ''}${rawTitle}`;
                    currentAlign = 'left';
                }
            } else {
                displayTitle = `${(i + (config.startIndex || 1) - 1) === realtimeTrackIndex ? indicatorText : ''}${numStr ? numStr + ' ' : ''}${rawTitle}`;
            }

            const item = { 
                id: track.id || `t-${i}`, 
                title: rawTitle, 
                displayTitle, 
                displayRight,
                align: currentAlign,
                isActive: i === realtimeTrackIndex 
            };

            if (columnsCount === 1) {
                leftColumn.tracks.push(item);
            } else {
                if (i < itemsPerColumn) {
                    leftColumn.tracks.push(item);
                } else {
                    rightColumn.tracks.push(item);
                }
            }
        });

        return {
            leftColumn,
            rightColumn,
            layout: columnsCount === 1 ? 'single' : 'two-columns',
            metrics: { 
                itemsPerColumn, 
                total,
                columnWidth,
                columnGap,
                totalHeight,
                rows: itemsPerColumn
            }
        };
    }
}

export default PlaylistLayoutEngine;
