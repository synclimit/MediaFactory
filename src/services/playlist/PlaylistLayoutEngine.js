class PlaylistLayoutEngine {
    static calculate(tracks, config) {
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
        const numbering = config.numbering || 'normal';
        const align = config.align?.toLowerCase() || 'left';
        
        // Calculate Gaps and Offsets
        const columnGap = config.columnGap || 100;
        const rowGap = config.gap || 0;
        const totalWidth = config.width || 800;
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
            const number = i + 1;
            
            let displayTitle = rawTitle;
            let displayRight = null;

            if (numbering === 'normal') {
                displayTitle = `${number}. ${rawTitle}`;
            } else if (numbering === 'right-number') {
                displayTitle = rawTitle;
                displayRight = `${number}`;
            } else if (numbering === 'none') {
                displayTitle = rawTitle;
            }

            const item = { 
                id: track.id || `t-${i}`, 
                title: rawTitle, 
                displayTitle, 
                displayRight, 
                globalIndex: i,
                align
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
