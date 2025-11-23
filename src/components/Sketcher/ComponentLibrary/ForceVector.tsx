import React from 'react';
import { ForceVector as ForceVectorType } from '../../../types';

interface ForceVectorProps {
    force: ForceVectorType;
    isSelected: boolean;
    onClick: () => void;
}

export const ForceVector: React.FC<ForceVectorProps> = ({ force, isSelected, onClick }) => {
    const scale = 0.5; // Scale factor for visualization

    // Calculate angle from components
    const angleRad = Math.atan2(-force.Fy, force.Fx); // Negative Fy because SVG Y is inverted

    const endX = force.position.x + force.Fx * scale;
    const endY = force.position.y - force.Fy * scale; // Negative because SVG Y is inverted

    // Arrowhead
    const arrowSize = 12;
    const arrowAngle = 25 * (Math.PI / 180);

    const arrow1X = endX - arrowSize * Math.cos(angleRad - arrowAngle);
    const arrow1Y = endY + arrowSize * Math.sin(angleRad - arrowAngle);
    const arrow2X = endX - arrowSize * Math.cos(angleRad + arrowAngle);
    const arrow2Y = endY + arrowSize * Math.sin(angleRad + arrowAngle);

    return (
        <g onClick={onClick} style={{ cursor: 'pointer' }} className="force-vector">
            {/* Force line */}
            <line
                x1={force.position.x}
                y1={force.position.y}
                x2={endX}
                y2={endY}
                stroke={isSelected ? 'var(--color-accent-cyan)' : 'var(--color-force)'}
                strokeWidth={isSelected ? 4 : 3}
                strokeLinecap="round"
            />

            {/* Arrowhead */}
            <polygon
                points={`${endX},${endY} ${arrow1X},${arrow1Y} ${arrow2X},${arrow2Y}`}
                fill={isSelected ? 'var(--color-accent-cyan)' : 'var(--color-force)'}
            />

            {/* Origin point */}
            <circle
                cx={force.position.x}
                cy={force.position.y}
                r={4}
                fill={isSelected ? 'var(--color-accent-cyan)' : 'var(--color-force)'}
            />

            {/* Label with Fx and Fy */}
            <text
                x={force.position.x + 15}
                y={force.position.y - 10}
                textAnchor="start"
                fill="var(--color-force)"
                fontSize="12"
                fontWeight="bold"
                fontFamily="var(--font-mono)"
            >
                Fx={force.Fx.toFixed(0)}N
            </text>
            <text
                x={force.position.x + 15}
                y={force.position.y + 5}
                textAnchor="start"
                fill="var(--color-force)"
                fontSize="12"
                fontWeight="bold"
                fontFamily="var(--font-mono)"
            >
                Fy={force.Fy.toFixed(0)}N
            </text>
        </g>
    );
};
