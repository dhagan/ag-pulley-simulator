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

    // Handle both regular component IDs and becket node IDs
    const getNodePosition = (nodeId: string) => {
        // Check if it's a becket node
        if (nodeId.endsWith('_becket')) {
            const parentId = nodeId.replace('_becket', '');
            const parentComp = components.find(c => c.id === parentId);
            if (parentComp && 'radius' in parentComp) {
                return { x: parentComp.position.x, y: parentComp.position.y + parentComp.radius + 12 };
            }
        }
        // Regular component
        const comp = components.find(c => c.id === nodeId);
        return comp ? comp.position : null;
    };

    const startPos = getNodePosition(rope.startNodeId);
    const endPos = getNodePosition(rope.endNodeId);

    if (!startPos || !endPos) return null;

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
    
    // Fallback to simple line rendering
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
