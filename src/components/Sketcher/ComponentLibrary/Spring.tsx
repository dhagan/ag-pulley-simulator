import React from 'react';
import { Spring as SpringType } from '../../../types';
import { distance } from '../../../utils/math';

interface SpringProps {
    spring: SpringType;
    isSelected: boolean;
    onClick: () => void;
    startPos: { x: number; y: number };
    endPos: { x: number; y: number };
}

export const Spring: React.FC<SpringProps> = ({ spring, isSelected, onClick, startPos, endPos }) => {
    const numCoils = 8;
    const coilWidth = 8;

    // Calculate spring path
    const dx = endPos.x - startPos.x;
    const dy = endPos.y - startPos.y;
    const length = distance(startPos, endPos);
    const angle = Math.atan2(dy, dx);

    // Generate zigzag path
    const points: string[] = [`${startPos.x},${startPos.y}`];

    for (let i = 0; i <= numCoils; i++) {
        const t = i / numCoils;
        const x = startPos.x + dx * t;
        const y = startPos.y + dy * t;

        // Perpendicular offset for zigzag
        const perpX = -Math.sin(angle) * coilWidth * (i % 2 === 0 ? 1 : -1);
        const perpY = Math.cos(angle) * coilWidth * (i % 2 === 0 ? 1 : -1);

        points.push(`${x + perpX},${y + perpY}`);
    }

    points.push(`${endPos.x},${endPos.y}`);

    const pathData = `M ${points.join(' L ')}`;

    // Calculate compression/extension
    const restLength = spring.restLength;
    const currentLength = spring.currentLength || length;
    const strain = (currentLength - restLength) / restLength;
    const isCompressed = strain < 0;
    const isExtended = strain > 0;

    let color = 'var(--color-spring)';
    if (isCompressed) color = 'var(--color-accent-blue)';
    if (isExtended) color = 'var(--color-accent-orange)';

    return (
        <g
            onClick={onClick}
            style={{ cursor: 'pointer' }}
            className="spring"
        >
            {/* Spring path */}
            <path
                d={pathData}
                fill="none"
                stroke={isSelected ? 'var(--color-accent-cyan)' : color}
                strokeWidth={isSelected ? 3 : 2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {/* End caps */}
            <circle cx={startPos.x} cy={startPos.y} r={3} fill={color} />
            <circle cx={endPos.x} cy={endPos.y} r={3} fill={color} />

            {/* Stiffness label */}
            <text
                x={(startPos.x + endPos.x) / 2}
                y={(startPos.y + endPos.y) / 2 - 10}
                textAnchor="middle"
                fill="var(--color-text-secondary)"
                fontSize="10"
                fontFamily="var(--font-mono)"
            >
                k={spring.stiffness}
            </text>
        </g>
    );
};
