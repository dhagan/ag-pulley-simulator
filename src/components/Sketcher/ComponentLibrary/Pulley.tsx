import React from 'react';
import { Pulley as PulleyType } from '../../../types';
import { useSystemStore } from '../../../store/useSystemStore';

interface PulleyProps {
    pulley: PulleyType;
    isSelected: boolean;
    onClick: () => void;
}

export const Pulley: React.FC<PulleyProps> = ({ pulley, isSelected, onClick }) => {
    const showLabels = useSystemStore((state) => state.ui.showLabels);
    const system = useSystemStore((state) => state.system);

    // Calculate rope wrapping arc
    const renderRopeArc = () => {
        // Find connected ropes
        const connectedRopes = system.components.filter(c =>
            c.type === 'rope' && (c.startNodeId === pulley.id || c.endNodeId === pulley.id)
        );

        if (connectedRopes.length < 2) return null;

        // Get tangent points from graph
        const tangentAngles: number[] = [];
        let avgRopeDirX = 0;
        let avgRopeDirY = 0;

        connectedRopes.forEach(rope => {
            const segments = system.graph.ropeSegments.get(rope.id);
            if (segments && segments.length > 0) {
                // Find which end connects to this pulley
                let tangentPoint = { x: 0, y: 0 };
                let isStart = rope.startNodeId === pulley.id;

                // If rope.startNodeId is pulley, the segment START is the tangent
                // If rope.endNodeId is pulley, the segment END is the tangent
                // BUT ropeSegments might be ordered differently? 
                // Usually segment[0] is start->end.

                if (isStart) {
                    tangentPoint = segments[0].start;
                    // Rope goes AWAY from pulley
                    avgRopeDirX += segments[0].end.x - segments[0].start.x;
                    avgRopeDirY += segments[0].end.y - segments[0].start.y;
                } else {
                    const lastSeg = segments[segments.length - 1];
                    tangentPoint = lastSeg.end;
                    // Rope goes AWAY from pulley (vector is start-end relative to pulley?)
                    // No, rope comes TO pulley. Vector away is start-end reversed.
                    avgRopeDirX += lastSeg.start.x - lastSeg.end.x;
                    avgRopeDirY += lastSeg.start.y - lastSeg.end.y;
                }

                const dx = tangentPoint.x - pulley.position.x;
                const dy = tangentPoint.y - pulley.position.y;
                tangentAngles.push(Math.atan2(dy, dx));
            }
        });

        if (tangentAngles.length < 2) return null;

        // Sort angles to find the span
        // We only handle 2 ropes for now (standard pulley)
        const a1 = tangentAngles[0];
        const a2 = tangentAngles[1];

        // Determine which way to wrap
        // The wrap should be on the side OPPOSITE to the ropes
        // Avg rope dir angle
        const avgAngle = Math.atan2(avgRopeDirY, avgRopeDirX);

        // Check midpoint of arc 1 (counter-clockwise from a1 to a2)
        // We want the arc that does NOT contain the avgAngle

        // Normalize angles to 0-2PI
        const norm = (a: number) => (a + 2 * Math.PI) % (2 * Math.PI);
        const na1 = norm(a1);
        const na2 = norm(a2);
        const nAvg = norm(avgAngle);

        // Calculate two possible arcs
        // Arc 1: na1 to na2 (CCW)
        let diff1 = na2 - na1;
        if (diff1 < 0) diff1 += 2 * Math.PI;

        // Arc 2: na2 to na1 (CCW)
        let diff2 = na1 - na2;
        if (diff2 < 0) diff2 += 2 * Math.PI;

        // Check if nAvg is inside Arc 1
        // To check if X is between A and B (CCW): (X-A) % 2PI < (B-A) % 2PI
        let relAvg = nAvg - na1;
        if (relAvg < 0) relAvg += 2 * Math.PI;

        const avgInArc1 = relAvg < diff1;

        let startAngle, endAngle, largeArcFlag;

        // We want the arc that does NOT contain the average rope direction
        if (avgInArc1) {
            // Draw Arc 2 (na2 to na1)
            startAngle = na2;
            endAngle = na1;
            largeArcFlag = diff2 > Math.PI ? 1 : 0;
        } else {
            // Draw Arc 1 (na1 to na2)
            startAngle = na1;
            endAngle = na2;
            largeArcFlag = diff1 > Math.PI ? 1 : 0;
        }

        const x1 = pulley.position.x + pulley.radius * Math.cos(startAngle);
        const y1 = pulley.position.y + pulley.radius * Math.sin(startAngle);
        const x2 = pulley.position.x + pulley.radius * Math.cos(endAngle);
        const y2 = pulley.position.y + pulley.radius * Math.sin(endAngle);

        const pathData = `M ${x1} ${y1} A ${pulley.radius} ${pulley.radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;

        return (
            <path
                d={pathData}
                fill="none"
                stroke="var(--color-rope)" // Use rope color
                strokeWidth={2}
            />
        );
    };

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

            {/* Rope Wrap Arc */}
            {renderRopeArc()}

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

            {/* Fixed indicator (always shown for fixed pulleys) */}
            <rect
                x={pulley.position.x - 8}
                y={pulley.position.y - pulley.radius - 15}
                width={16}
                height={10}
                fill="var(--color-anchor)"
                stroke="var(--color-anchor)"
                strokeWidth={1}
            />

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
                    y={pulley.position.y + pulley.radius + 20}
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
