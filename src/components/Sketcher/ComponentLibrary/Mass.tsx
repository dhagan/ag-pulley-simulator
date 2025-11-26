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
            {/* Main body - square with sharp corners */}
            <rect
                x={mass.position.x - width / 2}
                y={mass.position.y - height / 2}
                width={width}
                height={height}
                fill="rgba(16, 185, 129, 0.15)"
                stroke="var(--color-mass)"
                strokeWidth={2.5}
                rx={0}
            />

            {/* Cross-hatch grid pattern */}
            {/* Vertical lines */}
            <line
                x1={mass.position.x - width / 6}
                y1={mass.position.y - height / 2}
                x2={mass.position.x - width / 6}
                y2={mass.position.y + height / 2}
                stroke="var(--color-mass)"
                strokeWidth={0.5}
                opacity={0.4}
            />
            <line
                x1={mass.position.x + width / 6}
                y1={mass.position.y - height / 2}
                x2={mass.position.x + width / 6}
                y2={mass.position.y + height / 2}
                stroke="var(--color-mass)"
                strokeWidth={0.5}
                opacity={0.4}
            />
            {/* Horizontal lines */}
            <line
                x1={mass.position.x - width / 2}
                y1={mass.position.y - height / 6}
                x2={mass.position.x + width / 2}
                y2={mass.position.y - height / 6}
                stroke="var(--color-mass)"
                strokeWidth={0.5}
                opacity={0.4}
            />
            <line
                x1={mass.position.x - width / 2}
                y1={mass.position.y + height / 6}
                x2={mass.position.x + width / 2}
                y2={mass.position.y + height / 6}
                stroke="var(--color-mass)"
                strokeWidth={0.5}
                opacity={0.4}
            />

            {/* Center of mass indicator */}
            <circle
                cx={mass.position.x}
                cy={mass.position.y}
                r={3}
                fill="var(--color-mass)"
                opacity={0.8}
            />
            <circle
                cx={mass.position.x}
                cy={mass.position.y}
                r={6}
                fill="none"
                stroke="var(--color-mass)"
                strokeWidth={1}
                opacity={0.6}
            />

            {/* Mass label */}
            <text
                x={mass.position.x}
                y={mass.position.y - 12}
                textAnchor="middle"
                fill="var(--color-mass)"
                fontSize="11"
                fontWeight="bold"
                fontFamily="var(--font-mono)"
            >
                {mass.mass}kg
            </text>

            {/* Selection box */}
            {isSelected && (
                <rect
                    x={mass.position.x - width / 2 - 4}
                    y={mass.position.y - height / 2 - 4}
                    width={width + 8}
                    height={height + 8}
                    fill="none"
                    stroke="var(--color-accent-cyan)"
                    strokeWidth={2}
                    strokeDasharray="5,5"
                    rx={0}
                />
            )}

            {/* ID label */}
            {showLabels && (
                <text
                    x={mass.position.x}
                    y={mass.position.y + height / 2 + 15}
                    textAnchor="middle"
                    fill="var(--color-text-secondary)"
                    fontSize="9"
                    fontFamily="monospace"
                >
                    {mass.id}
                </text>
            )}
        </g>
    );
};
