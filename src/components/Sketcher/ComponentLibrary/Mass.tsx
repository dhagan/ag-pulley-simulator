import React from 'react';
import { Mass as MassType } from '../../../types';
import { useSystemStore } from '../../../store/useSystemStore';

interface MassProps {
    mass: MassType;
    isSelected: boolean;
    onClick: () => void;
}

export const Mass: React.FC<MassProps> = ({ mass, isSelected, onClick }) => {
    const width = 40;
    const height = 40;
    const showLabels = useSystemStore((state) => state.ui.showLabels);

    return (
        <g
            onClick={onClick}
            style={{ cursor: 'pointer' }}
            className="mass"
        >
            {/* Main body */}
            <rect
                x={mass.position.x - width / 2}
                y={mass.position.y - height / 2}
                width={width}
                height={height}
                fill="rgba(16, 185, 129, 0.2)"
                stroke="var(--color-mass)"
                strokeWidth={2}
                rx={3}
            />

            {/* Diagonal pattern for visual depth */}
            <line
                x1={mass.position.x - width / 2}
                y1={mass.position.y - height / 2}
                x2={mass.position.x + width / 2}
                y2={mass.position.y + height / 2}
                stroke="var(--color-mass)"
                strokeWidth={1}
                opacity={0.3}
            />
            <line
                x1={mass.position.x + width / 2}
                y1={mass.position.y - height / 2}
                x2={mass.position.x - width / 2}
                y2={mass.position.y + height / 2}
                stroke="var(--color-mass)"
                strokeWidth={1}
                opacity={0.3}
            />

            {/* Mass label */}
            <text
                x={mass.position.x}
                y={mass.position.y + 5}
                textAnchor="middle"
                fill="var(--color-mass)"
                fontSize="12"
                fontWeight="bold"
                fontFamily="var(--font-mono)"
            >
                {mass.mass}kg
            </text>

            {/* Selection box */}
            {isSelected && (
                <rect
                    x={mass.position.x - width / 2 - 5}
                    y={mass.position.y - height / 2 - 5}
                    width={width + 10}
                    height={height + 10}
                    fill="none"
                    stroke="var(--color-accent-cyan)"
                    strokeWidth={2}
                    strokeDasharray="5,5"
                    rx={5}
                />
            )}

            {/* ID label */}
            {showLabels && (
                <text
                    x={mass.position.x}
                    y={mass.position.y + height / 2 + 20}
                    textAnchor="middle"
                    fill="var(--color-text-secondary)"
                    fontSize="10"
                    fontFamily="monospace"
                >
                    {mass.id}
                </text>
            )}
        </g>
    );
};
