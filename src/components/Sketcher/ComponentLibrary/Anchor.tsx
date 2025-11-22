import React from 'react';
import { Anchor as AnchorType } from '../../../types';

interface AnchorProps {
    anchor: AnchorType;
    isSelected: boolean;
    onClick: () => void;
}

export const Anchor: React.FC<AnchorProps> = ({ anchor, isSelected, onClick }) => {
    const size = 15;

    return (
        <g
            onClick={onClick}
            style={{ cursor: 'pointer' }}
            className="anchor"
        >
            {/* Triangle pointing down (like a fixed wall mount) */}
            <polygon
                points={`${anchor.position.x},${anchor.position.y - size} 
                 ${anchor.position.x - size},${anchor.position.y + size} 
                 ${anchor.position.x + size},${anchor.position.y + size}`}
                fill="var(--color-anchor)"
                stroke={isSelected ? 'var(--color-accent-cyan)' : 'var(--color-anchor)'}
                strokeWidth={isSelected ? 3 : 2}
                opacity={0.9}
            />

            {/* Hatching to indicate fixed point */}
            <line
                x1={anchor.position.x - size * 1.5}
                y1={anchor.position.y + size}
                x2={anchor.position.x + size * 1.5}
                y2={anchor.position.y + size}
                stroke="var(--color-anchor)"
                strokeWidth={2}
            />

            {/* Selection circle */}
            {isSelected && (
                <circle
                    cx={anchor.position.x}
                    cy={anchor.position.y}
                    r={size * 1.5}
                    fill="none"
                    stroke="var(--color-accent-cyan)"
                    strokeWidth={1}
                    strokeDasharray="3,3"
                />
            )}
        </g>
    );
};
