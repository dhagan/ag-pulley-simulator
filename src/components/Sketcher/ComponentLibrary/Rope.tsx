import React from 'react';
import { Rope as RopeType, ComponentType } from '../../../types';
import { useSystemStore } from '../../../store/useSystemStore';
import { generateRopePathFromSegments } from '../../../modules/solver/rope-router';

interface RopeProps {
    rope: RopeType;
    isSelected: boolean;
    onClick: () => void;
}

function getPulleyTangentPoint(
    pulleyPos: { x: number; y: number },
    pulleyRadius: number,
    externalPoint: { x: number; y: number }
): { x: number; y: number } {
    const dx = externalPoint.x - pulleyPos.x;
    const dy = externalPoint.y - pulleyPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 0.01) {
        // Points are essentially the same, return point on circumference
        return { x: pulleyPos.x + pulleyRadius, y: pulleyPos.y };
    }

    // Calculate the point on the circumference along the line to external point
    const angle = Math.atan2(dy, dx);
    return {
        x: pulleyPos.x + pulleyRadius * Math.cos(angle),
        y: pulleyPos.y + pulleyRadius * Math.sin(angle)
    };
}

export const Rope: React.FC<RopeProps> = ({ rope, isSelected, onClick }) => {
    const system = useSystemStore((state) => state.system);
    const components = system.components;
    const ropeSegments = system.graph.ropeSegments;

    const startComp = components.find(c => c.id === rope.startNodeId);
    const endComp = components.find(c => c.id === rope.endNodeId);

    if (!startComp || !endComp) return null;

    // Use smart routing segments if available
    const segments = ropeSegments.get(rope.id);
    
    if (segments && segments.length > 0) {
        // Render using smart routing path
        const pathData = generateRopePathFromSegments(segments);
        
        return (
            <g onClick={onClick} style={{ cursor: 'pointer' }}>
                <path
                    d={pathData}
                    stroke={isSelected ? 'var(--color-accent-cyan)' : 'var(--color-rope)'}
                    strokeWidth={isSelected ? 4 : 3}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                
                {/* End points */}
                <circle cx={segments[0].start.x} cy={segments[0].start.y} r={3} fill="var(--color-rope)" />
                <circle 
                    cx={segments[segments.length - 1].end.x} 
                    cy={segments[segments.length - 1].end.y} 
                    r={3} 
                    fill="var(--color-rope)" 
                />
            </g>
        );
    }
    
    // Fallback to simple line rendering with tangent points
    let startPos = startComp.position;
    let endPos = endComp.position;

    // For pulleys, calculate tangent point on circumference
    if (startComp.type === ComponentType.PULLEY && 'radius' in startComp) {
        startPos = getPulleyTangentPoint(startComp.position, startComp.radius, endComp.position);
    }

    if (endComp.type === ComponentType.PULLEY && 'radius' in endComp) {
        endPos = getPulleyTangentPoint(endComp.position, endComp.radius, startComp.position);
    }

    return (
        <g onClick={onClick} style={{ cursor: 'pointer' }}>
            <line
                x1={startPos.x}
                y1={startPos.y}
                x2={endPos.x}
                y2={endPos.y}
                stroke={isSelected ? 'var(--color-accent-cyan)' : 'var(--color-rope)'}
                strokeWidth={isSelected ? 4 : 3}
                strokeLinecap="round"
            />

            <circle cx={startPos.x} cy={startPos.y} r={3} fill="var(--color-rope)" />
            <circle cx={endPos.x} cy={endPos.y} r={3} fill="var(--color-rope)" />
        </g>
    );
};
