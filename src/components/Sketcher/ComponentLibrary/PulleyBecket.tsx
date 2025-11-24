import React from 'react';
import { PulleyBecket as PulleyBecketType } from '../../../types';
import { useSystemStore } from '../../../store/useSystemStore';

interface PulleyBecketProps {
    pulley: PulleyBecketType;
    isSelected: boolean;
    onClick: () => void;
}

export const PulleyBecket: React.FC<PulleyBecketProps> = ({ pulley, isSelected, onClick }) => {
    const showLabels = useSystemStore((state) => state.ui.showLabels);
    
    return (
        <g
            onClick={onClick}
            style={{ cursor: 'pointer' }}
            className="pulley-becket"
        >
            {/* Main pulley wheel */}
            <circle
                cx={pulley.position.x}
                cy={pulley.position.y}
                r={pulley.radius}
                fill="rgba(59, 130, 246, 0.1)"
                stroke="var(--color-pulley)"
                strokeWidth={3}
            />

            {/* Inner circle to show depth */}
            <circle
                cx={pulley.position.x}
                cy={pulley.position.y}
                r={pulley.radius * 0.7}
                fill="none"
                stroke="var(--color-pulley)"
                strokeWidth={1}
                opacity={0.4}
            />

            {/* Center axle */}
            <circle
                cx={pulley.position.x}
                cy={pulley.position.y}
                r={3}
                fill="var(--color-anchor)"
            />

            {/* Fixed indicator */}
            <rect
                x={pulley.position.x - 8}
                y={pulley.position.y - pulley.radius - 15}
                width={16}
                height={10}
                fill="var(--color-anchor)"
                stroke="var(--color-anchor)"
                strokeWidth={1}
            />

            {/* Becket attachment point (hook at bottom) */}
            <g>
                <circle
                    cx={pulley.position.x}
                    cy={pulley.position.y + pulley.radius + 8}
                    r={4}
                    fill="var(--color-mass)"
                    stroke="var(--color-border)"
                    strokeWidth={1}
                />
                <path
                    d={`M ${pulley.position.x},${pulley.position.y + pulley.radius + 5} 
                        L ${pulley.position.x},${pulley.position.y + pulley.radius + 12}`}
                    stroke="var(--color-mass)"
                    strokeWidth={2}
                />
            </g>

            {/* Selection circle */}
            {isSelected && (
                <circle
                    cx={pulley.position.x}
                    cy={pulley.position.y}
                    r={pulley.radius + 5}
                    fill="none"
                    stroke="var(--color-accent-cyan)"
                    strokeWidth={2}
                    strokeDasharray="5,5"
                />
            )}

            {/* ID label */}
            {showLabels && (
                <text
                    x={pulley.position.x}
                    y={pulley.position.y + pulley.radius + 25}
                    textAnchor="middle"
                    fill="var(--color-text-secondary)"
                    fontSize="10"
                    fontFamily="monospace"
                >
                    {pulley.id}
                </text>
            )}
        </g>
    );
};
