import React from 'react';
import { Pulley as PulleyType } from '../../../types';

interface PulleyProps {
    pulley: PulleyType;
    isSelected: boolean;
    onClick: () => void;
}

export const Pulley: React.FC<PulleyProps> = ({ pulley, isSelected, onClick }) => {
    return (
        <g
            onClick={onClick}
            style={{ cursor: 'pointer' }}
            className="pulley"
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
                fill={pulley.fixed ? 'var(--color-anchor)' : 'var(--color-pulley)'}
            />

            {/* Fixed indicator (if fixed pulley) */}
            {pulley.fixed && (
                <rect
                    x={pulley.position.x - 8}
                    y={pulley.position.y - pulley.radius - 15}
                    width={16}
                    height={10}
                    fill="var(--color-anchor)"
                    stroke="var(--color-anchor)"
                    strokeWidth={1}
                />
            )}

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
        </g>
    );
};
