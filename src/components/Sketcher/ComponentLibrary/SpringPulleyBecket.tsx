import React from 'react';
import { SpringPulleyBecket as SpringPulleyBecketType } from '../../../types';
import { useSystemStore } from '../../../store/useSystemStore';

interface SpringPulleyBecketProps {
    pulley: SpringPulleyBecketType;
    isSelected: boolean;
    onClick: () => void;
}

export const SpringPulleyBecket: React.FC<SpringPulleyBecketProps> = ({ pulley, isSelected, onClick }) => {
    const { position, radius, axis, currentLength } = pulley;
    const showLabels = useSystemStore((state) => state.ui.showLabels);
    
    // Calculate spring attachment point
    const springStart = { ...position };
    if (axis === 'vertical') {
        springStart.y -= currentLength;
    } else {
        springStart.x -= currentLength;
    }
    
    // Generate spring coil path
    const generateSpringPath = () => {
        const coils = 8;
        const coilWidth = 10;
        const length = currentLength;
        const segmentLength = length / coils;
        
        let path = `M ${springStart.x} ${springStart.y}`;
        
        if (axis === 'vertical') {
            for (let i = 0; i < coils; i++) {
                const y = springStart.y + i * segmentLength;
                const midY = y + segmentLength / 2;
                const endY = y + segmentLength;
                const x1 = springStart.x + (i % 2 === 0 ? coilWidth : -coilWidth);
                path += ` L ${x1} ${midY} L ${springStart.x} ${endY}`;
            }
        } else {
            for (let i = 0; i < coils; i++) {
                const x = springStart.x + i * segmentLength;
                const midX = x + segmentLength / 2;
                const endX = x + segmentLength;
                const y1 = springStart.y + (i % 2 === 0 ? coilWidth : -coilWidth);
                path += ` L ${midX} ${y1} L ${endX} ${springStart.y}`;
            }
        }
        
        return path;
    };
    
    return (
        <g
            onClick={onClick}
            style={{ cursor: 'pointer' }}
            className="spring-pulley-becket"
        >
            {/* Fixed mount point */}
            <rect
                x={springStart.x - 8}
                y={springStart.y - 8}
                width={16}
                height={16}
                fill="var(--color-anchor)"
                stroke="var(--color-border)"
                strokeWidth={2}
            />
            
            {/* Spring coil */}
            <path
                d={generateSpringPath()}
                stroke="var(--color-spring)"
                strokeWidth={2}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            
            {/* Main pulley wheel */}
            <circle
                cx={position.x}
                cy={position.y}
                r={radius}
                fill="rgba(59, 130, 246, 0.1)"
                stroke="var(--color-pulley)"
                strokeWidth={3}
            />

            {/* Inner circle to show depth */}
            <circle
                cx={position.x}
                cy={position.y}
                r={radius * 0.7}
                fill="none"
                stroke="var(--color-pulley)"
                strokeWidth={1}
                opacity={0.4}
            />

            {/* Center axle */}
            <circle
                cx={position.x}
                cy={position.y}
                r={3}
                fill="var(--color-pulley)"
            />

            {/* Becket attachment point (hook at bottom) */}
            <g>
                <circle
                    cx={position.x}
                    cy={position.y + radius + 8}
                    r={4}
                    fill="var(--color-mass)"
                    stroke="var(--color-border)"
                    strokeWidth={1}
                />
                <path
                    d={`M ${position.x},${position.y + radius + 5} 
                        L ${position.x},${position.y + radius + 12}`}
                    stroke="var(--color-mass)"
                    strokeWidth={2}
                />
            </g>

            {/* Selection highlight */}
            {isSelected && (
                <circle
                    cx={position.x}
                    cy={position.y}
                    r={radius + 5}
                    fill="none"
                    stroke="var(--color-selected)"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                />
            )}

            {/* ID label */}
            {showLabels && (
                <text
                    x={position.x}
                    y={position.y + radius + 30}
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
