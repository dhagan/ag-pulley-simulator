import React from 'react';
import { useSystemStore } from '../../store/useSystemStore';

interface GridProps {
    gridSize: number;
    viewBox: { x: number; y: number; width: number; height: number };
}

export const Grid: React.FC<GridProps> = ({ gridSize, viewBox }) => {
    const showGrid = useSystemStore((state) => state.ui.showGrid);

    if (!showGrid) return null;

    // Calculate visible grid range
    const startX = Math.floor(viewBox.x / gridSize) * gridSize;
    const endX = Math.ceil((viewBox.x + viewBox.width) / gridSize) * gridSize;
    const startY = Math.floor(viewBox.y / gridSize) * gridSize;
    const endY = Math.ceil((viewBox.y + viewBox.height) / gridSize) * gridSize;

    const lines: JSX.Element[] = [];

    // Vertical lines
    for (let x = startX; x <= endX; x += gridSize) {
        const isMajor = x % (gridSize * 5) === 0;
        lines.push(
            <line
                key={`v-${x}`}
                x1={x}
                y1={viewBox.y}
                x2={x}
                y2={viewBox.y + viewBox.height}
                stroke={isMajor ? 'var(--color-grid-major)' : 'var(--color-grid)'}
                strokeWidth={isMajor ? 0.5 : 0.3}
            />
        );
    }

    // Horizontal lines
    for (let y = startY; y <= endY; y += gridSize) {
        const isMajor = y % (gridSize * 5) === 0;
        lines.push(
            <line
                key={`h-${y}`}
                x1={viewBox.x}
                y1={y}
                x2={viewBox.x + viewBox.width}
                y2={y}
                stroke={isMajor ? 'var(--color-grid-major)' : 'var(--color-grid)'}
                strokeWidth={isMajor ? 0.5 : 0.3}
            />
        );
    }

    return <g className="grid">{lines}</g>;
};
