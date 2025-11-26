import { SystemState, ComponentType } from '../types';

/**
 * Validate pulley system physics constraints
 */
export interface ValidationWarning {
    severity: 'warning' | 'error' | 'info';
    message: string;
    componentIds: string[];
}

/**
 * Check for common physics issues in pulley systems
 */
export function validatePhysicsConstraints(system: SystemState): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    // Check for non-vertical ropes in simple pulley systems
    const pulleys = system.components.filter(c =>
        c.type === ComponentType.PULLEY || c.type === ComponentType.PULLEY_BECKET
    );

    // Check for non-vertical ropes in simple pulley systems
    pulleys.forEach(pulley => {
        const connectedRopes = system.components.filter(c =>
            c.type === ComponentType.ROPE &&
            (c.startNodeId === pulley.id || c.endNodeId === pulley.id)
        );

        connectedRopes.forEach(rope => {
            if (rope.type !== ComponentType.ROPE) return;

            const otherEndId = rope.startNodeId === pulley.id ? rope.endNodeId : rope.startNodeId;
            const otherEnd = system.components.find(c => c.id === otherEndId);

            if (otherEnd && otherEnd.type === ComponentType.MASS) {
                // Get rope segments from graph to find the actual tangent point
                const segments = system.graph.ropeSegments.get(rope.id);

                if (segments && segments.length > 0) {
                    let segmentVector: { x: number, y: number } | null = null;

                    // Find the segment connected to the mass
                    if (rope.startNodeId === otherEnd.id) {
                        // Rope starts at mass, so first segment starts at mass
                        const firstSeg = segments[0];
                        segmentVector = {
                            x: firstSeg.end.x - firstSeg.start.x,
                            y: firstSeg.end.y - firstSeg.start.y
                        };
                    } else {
                        // Rope ends at mass, so last segment ends at mass
                        const lastSeg = segments[segments.length - 1];
                        segmentVector = {
                            x: lastSeg.start.x - lastSeg.end.x, // Vector pointing UP from mass
                            y: lastSeg.start.y - lastSeg.end.y
                        };
                    }

                    if (segmentVector) {
                        // Calculate angle from vertical (assuming Y is down, so vertical is (0, -1) or (0, 1))
                        // We want the angle of the rope relative to the vertical axis.
                        // Ideally, the rope goes straight up from the mass.
                        // So we compare the vector pointing UP from the mass to the vector (0, -1).

                        // dx is horizontal distance, dy is vertical distance
                        const dx = Math.abs(segmentVector.x);
                        const dy = Math.abs(segmentVector.y);

                        if (dy > 0) {
                            const angle = Math.atan2(dx, dy) * (180 / Math.PI);

                            if (angle > 5) { // More than 5 degrees from vertical
                                warnings.push({
                                    severity: 'warning',
                                    message: `Rope ${rope.id.substring(0, 8)}... is ${angle.toFixed(1)}° from vertical. For accurate static analysis, ropes supporting masses should be vertical (≤5°).`,
                                    componentIds: [rope.id, pulley.id, otherEnd.id],
                                });
                            }
                        }
                    }
                }
            }
        });
    });

    // Check for masses with horizontal displacement in simple systems
    const masses = system.components.filter(c => c.type === ComponentType.MASS);
    const ropes = system.components.filter(c => c.type === ComponentType.ROPE);

    if (pulleys.length === 1 && masses.length === 2 && ropes.length === 2) {
        // This looks like an Atwood machine - check alignment
        const pulley = pulleys[0];
        const radius = (pulley as any).radius || 0; // Cast to any to access radius if it exists

        masses.forEach(mass => {
            const dx = Math.abs(mass.position.x - pulley.position.x);
            // Check if aligned with tangent (radius) or center (0)
            // For Atwood, it should be aligned with radius
            const offsetFromTangent = Math.abs(dx - radius);

            if (offsetFromTangent > 10 && dx > 10) {
                // If not aligned with tangent AND not aligned with center (just in case)
                warnings.push({
                    severity: 'info',
                    message: `Atwood machine detected: Mass ${mass.id} should be vertically aligned with pulley tangent (radius ${radius}px). Current offset from center: ${dx.toFixed(0)}px`,
                    componentIds: [mass.id, pulley.id],
                });
            }
        });
    }

    return warnings;
}

/**
 * Auto-align masses vertically under pulleys for Atwood machines
 */
export function autoAlignAtwoodMachine(system: SystemState): SystemState {
    const pulleys = system.components.filter(c =>
        c.type === ComponentType.PULLEY || c.type === ComponentType.PULLEY_BECKET
    );

    const masses = system.components.filter(c => c.type === ComponentType.MASS);
    const ropes = system.components.filter(c => c.type === ComponentType.ROPE);

    // Only auto-align if this looks like an Atwood machine
    if (pulleys.length !== 1 || masses.length !== 2 || ropes.length !== 2) {
        return system;
    }

    const pulley = pulleys[0];
    const newComponents = [...system.components];

    // Align masses vertically under pulley
    masses.forEach((mass, index) => {
        const massIndex = newComponents.findIndex(c => c.id === mass.id);
        if (massIndex >= 0) {
            // Position masses on left and right sides of pulley
            const offset = index === 0 ? -100 : 100; // 100px to left or right
            newComponents[massIndex] = {
                ...mass,
                position: {
                    x: pulley.position.x + offset,
                    y: mass.position.y, // Keep same Y position
                },
            };
        }
    });

    return {
        ...system,
        components: newComponents,
    };
}
