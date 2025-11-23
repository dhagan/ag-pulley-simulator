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
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= pulleyRadius) {
        return {
            x: pulleyPos.x + (dx / distance) * pulleyRadius,
            y: pulleyPos.y + (dy / distance) * pulleyRadius,
        };
    }

    const L = distance;
    const d = (pulleyRadius * pulleyRadius) / L;
    const h = Math.sqrt(pulleyRadius * pulleyRadius - d * d);

    const ux = dx / L;
    const uy = dy / L;

    const px = -uy;
    const py = ux;

    const t1x = pulleyPos.x + d * ux + h * px;
    const t1y = pulleyPos.y + d * uy + h * py;

    const t2x = pulleyPos.x + d * ux - h * px;
    const t2y = pulleyPos.y + d * uy - h * py;

    // Choose tangent with smaller angle deviation from straight line
    const angle1 = Math.atan2(t1y - pulleyPos.y, t1x - pulleyPos.x);
    const angle2 = Math.atan2(t2y - pulleyPos.y, t2x - pulleyPos.x);
    const targetAngle = Math.atan2(dy, dx);

    const diff1 = Math.abs(angle1 - targetAngle);
    const diff2 = Math.abs(angle2 - targetAngle);

    return diff1 < diff2 ? { x: t1x, y: t1y } : { x: t2x, y: t2y };
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
    
    // Fallback to simple line rendering
    let startPos = startComp.position;
    let endPos = endComp.position;

    if (startComp.type === ComponentType.PULLEY && 'radius' in startComp) {
        startPos = getPulleyTangentPoint(startComp.position, startComp.radius, endPos);
    }

    if (endComp.type === ComponentType.PULLEY && 'radius' in endComp) {
        endPos = getPulleyTangentPoint(endComp.position, endComp.radius, startPos);
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
