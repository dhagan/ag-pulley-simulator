import React from 'react';
import { useSystemStore } from '../../store/useSystemStore';
import { ComponentType, Point, Rope } from '../../types';

export const FBDLayer: React.FC = () => {
    const system = useSystemStore((state) => state.system);
    const solverResult = useSystemStore((state) => state.solverResult);
    const showFBD = useSystemStore((state) => state.ui.showFBD);

    if (!showFBD) return null;

    const renderArrow = (start: Point, forceX: number, forceY: number, color: string, label: string, id: string) => {
        // Scale factor to make forces visible
        const scale = 2;
        const end = {
            x: start.x + forceX * scale,
            y: start.y + forceY * scale  // Y is already in SVG coordinates (down is positive)
        };

        const magnitude = Math.sqrt(forceX * forceX + forceY * forceY);
        if (magnitude < 0.1) return null;

        // Arrowhead logic
        const angle = Math.atan2(forceY, forceX);
        const headLen = 15;
        const headAngle = Math.PI / 6;

        const p1 = {
            x: end.x - headLen * Math.cos(angle - headAngle),
            y: end.y - headLen * Math.sin(angle - headAngle)
        };
        const p2 = {
            x: end.x - headLen * Math.cos(angle + headAngle),
            y: end.y - headLen * Math.sin(angle + headAngle)
        };

        return (
            <g key={`${id}-${label}`}>
                {/* Arrow stem with glow */}
                <line
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    stroke={color}
                    strokeWidth={3}
                    strokeOpacity={0.8}
                    filter="url(#glow)"
                />
                {/* Arrowhead */}
                <polygon
                    points={`${end.x},${end.y} ${p1.x},${p1.y} ${p2.x},${p2.y}`}
                    fill={color}
                    fillOpacity={0.9}
                />
                {/* Label with background */}
                <g>
                    <rect
                        x={end.x + 5}
                        y={end.y - 8}
                        width={label.length * 6 + 8}
                        height={16}
                        fill="rgba(0,0,0,0.7)"
                        rx={3}
                    />
                    <text
                        x={end.x + 9}
                        y={end.y + 4}
                        fill={color}
                        fontSize="11"
                        fontFamily="monospace"
                        fontWeight="bold"
                    >
                        {label}
                    </text>
                </g>
            </g>
        );
    };

    return (
        <g className="fbd-layer" style={{ pointerEvents: 'none' }}>
            {/* Define glow filter */}
            <defs>
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            {system.components.map((component) => {
                const forces: JSX.Element[] = [];

                // 1. Gravity (Masses) - pointing downward in SVG coordinates
                if (component.type === ComponentType.MASS) {
                    const weightNewtons = component.mass * system.gravity;
                    forces.push(renderArrow(
                        component.position,
                        0,
                        weightNewtons * 5,  // Positive Y = downward in SVG
                        '#ef4444',  // Red for weight
                        `W=${weightNewtons.toFixed(1)}N`,
                        component.id
                    )!);
                }

                // 2. Tension (Ropes connected to components)
                if (solverResult && component.type !== ComponentType.ROPE && component.type !== ComponentType.SPRING) {
                    // Find ropes connected to this component
                    const connectedRopes = system.components.filter(c =>
                        c.type === ComponentType.ROPE &&
                        (c.startNodeId === component.id || c.endNodeId === component.id)
                    ) as Rope[];

                    connectedRopes.forEach((rope, idx) => {
                        const tension = solverResult.tensions.get(rope.id) || 0;
                        if (tension > 0.1) {
                            // Determine which end of the rope we're at
                            const isStart = rope.startNodeId === component.id;

                            // Get the other component
                            const otherComponentId = isStart ? rope.endNodeId : rope.startNodeId;
                            const otherComponent = system.components.find(c => c.id === otherComponentId);

                            if (otherComponent) {
                                // Calculate direction TOWARD the other component (tension pulls)
                                const dx = otherComponent.position.x - component.position.x;
                                const dy = otherComponent.position.y - component.position.y;
                                const len = Math.sqrt(dx * dx + dy * dy);

                                if (len > 0) {
                                    // Normalize and scale by tension
                                    const fx = (dx / len) * tension;
                                    const fy = (dy / len) * tension;

                                    forces.push(renderArrow(
                                        component.position,
                                        fx,
                                        fy,
                                        '#22c55e',  // Green for tension
                                        `T${idx + 1}=${tension.toFixed(1)}N`,
                                        `${component.id}-rope-${rope.id}`
                                    )!);
                                }
                            }
                        }
                    });
                }

                return <g key={component.id}>{forces.filter(Boolean)}</g>;
            })}
        </g>
    );
};
