import React from 'react';
import { useSystemStore } from '../../store/useSystemStore';
import { ComponentType, Point, Rope } from '../../types';

export const FBDLayer: React.FC = () => {
    const system = useSystemStore((state) => state.system);
    const solverResult = useSystemStore((state) => state.solverResult);
    const showFBD = useSystemStore((state) => state.ui.showFBD);

    if (!showFBD || !solverResult || !solverResult.solved) return null;

    const renderArrow = (start: Point, vector: Point, color: string, label: string) => {
        const scale = 0.5; // Scale factor for vector length
        const end = {
            x: start.x + vector.x * scale,
            y: start.y - vector.y * scale // SVG Y is inverted
        };

        // Arrowhead logic
        const angle = Math.atan2(-vector.y, vector.x);
        const headLen = 10;
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
            <g key={`${label}-${start.x}-${start.y}`}>
                <line
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    stroke={color}
                    strokeWidth={2}
                />
                <polygon
                    points={`${end.x},${end.y} ${p1.x},${p1.y} ${p2.x},${p2.y}`}
                    fill={color}
                />
                <text
                    x={end.x + 10}
                    y={end.y}
                    fill={color}
                    fontSize="12"
                    fontFamily="monospace"
                    fontWeight="bold"
                >
                    {label}
                </text>
            </g>
        );
    };

    return (
        <g className="fbd-layer" style={{ pointerEvents: 'none' }}>
            {system.components.map((component) => {
                const forces: JSX.Element[] = [];

                // 1. Gravity (Masses)
                if (component.type === ComponentType.MASS) {
                    const weight = component.mass * system.gravity * 10; // Scale for visibility
                    forces.push(renderArrow(
                        component.position,
                        { x: 0, y: -weight },
                        'var(--color-accent-red)',
                        `mg=${(component.mass * system.gravity).toFixed(1)}N`
                    ));
                }

                // 2. Tension (Ropes connected to components)
                if (component.type !== ComponentType.ROPE) {
                    // Find ropes connected to this component
                    const connectedRopes = system.components.filter(c =>
                        c.type === ComponentType.ROPE &&
                        (c.startNodeId === component.id || c.endNodeId === component.id)
                    ) as Rope[];

                    connectedRopes.forEach(rope => {
                        const tension = solverResult.tensions.get(rope.id) || 0;
                        if (tension > 0.1) {
                            // Calculate direction vector towards the rope
                            const isStart = rope.startNodeId === component.id;
                            const otherEndPos = isStart
                                ? (rope.segments[0]?.end || component.position)
                                : (rope.segments[rope.segments.length - 1]?.start || component.position);

                            const dx = otherEndPos.x - component.position.x;
                            const dy = -(otherEndPos.y - component.position.y); // Invert Y for calculation
                            const len = Math.sqrt(dx * dx + dy * dy);

                            if (len > 0) {
                                const ux = dx / len;
                                const uy = dy / len;

                                forces.push(renderArrow(
                                    component.position,
                                    { x: ux * tension * 2, y: uy * tension * 2 }, // Scale tension for visibility
                                    'var(--color-accent-green)',
                                    `T=${tension.toFixed(1)}N`
                                ));
                            }
                        }
                    });
                }

                return <g key={component.id}>{forces}</g>;
            })}
        </g>
    );
};
