import { Point } from '../types';

/**
 * Represents the tangent lines between two circles
 */
export interface TangentLines {
    external: {
        line1: { p1: Point; p2: Point };
        line2: { p1: Point; p2: Point };
    };
    internal: {
        line1: { p1: Point; p2: Point };
        line2: { p1: Point; p2: Point };
    } | null;
}

/**
 * Calculate the external tangent points between two circles
 * Used for routing ropes around pulleys
 */
export function calculateTangentPoints(
    center1: Point,
    radius1: number,
    center2: Point,
    radius2: number
): TangentLines | null {
    const dx = center2.x - center1.x;
    const dy = center2.y - center1.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Circles are too close or overlapping
    if (dist < Math.abs(radius1 - radius2)) {
        return null;
    }

    // External tangents
    const externalTangents = calculateExternalTangents(
        center1,
        radius1,
        center2,
        radius2,
        dist,
        dx,
        dy
    );

    // Internal tangents (only exist if circles don't overlap)
    let internalTangents = null;
    if (dist > radius1 + radius2) {
        internalTangents = calculateInternalTangents(
            center1,
            radius1,
            center2,
            radius2,
            dist,
            dx,
            dy
        );
    }

    return {
        external: externalTangents,
        internal: internalTangents,
    };
}

function calculateExternalTangents(
    center1: Point,
    radius1: number,
    center2: Point,
    radius2: number,
    dist: number,
    dx: number,
    dy: number
) {
    // Angle between circle centers
    const baseAngle = Math.atan2(dy, dx);

    // For equal radii
    if (Math.abs(radius1 - radius2) < 0.001) {
        const perpAngle = Math.PI / 2;
        return {
            line1: {
                p1: {
                    x: center1.x + radius1 * Math.cos(baseAngle + perpAngle),
                    y: center1.y + radius1 * Math.sin(baseAngle + perpAngle),
                },
                p2: {
                    x: center2.x + radius2 * Math.cos(baseAngle + perpAngle),
                    y: center2.y + radius2 * Math.sin(baseAngle + perpAngle),
                },
            },
            line2: {
                p1: {
                    x: center1.x + radius1 * Math.cos(baseAngle - perpAngle),
                    y: center1.y + radius1 * Math.sin(baseAngle - perpAngle),
                },
                p2: {
                    x: center2.x + radius2 * Math.cos(baseAngle - perpAngle),
                    y: center2.y + radius2 * Math.sin(baseAngle - perpAngle),
                },
            },
        };
    }

    // For different radii
    const radiusDiff = radius1 - radius2;
    const tangentAngle = Math.asin(radiusDiff / dist);

    const angle1 = baseAngle + tangentAngle;
    const angle2 = baseAngle - tangentAngle;

    return {
        line1: {
            p1: {
                x: center1.x + radius1 * Math.cos(angle1 + Math.PI / 2),
                y: center1.y + radius1 * Math.sin(angle1 + Math.PI / 2),
            },
            p2: {
                x: center2.x + radius2 * Math.cos(angle1 + Math.PI / 2),
                y: center2.y + radius2 * Math.sin(angle1 + Math.PI / 2),
            },
        },
        line2: {
            p1: {
                x: center1.x + radius1 * Math.cos(angle2 - Math.PI / 2),
                y: center1.y + radius1 * Math.sin(angle2 - Math.PI / 2),
            },
            p2: {
                x: center2.x + radius2 * Math.cos(angle2 - Math.PI / 2),
                y: center2.y + radius2 * Math.sin(angle2 - Math.PI / 2),
            },
        },
    };
}

function calculateInternalTangents(
    center1: Point,
    radius1: number,
    center2: Point,
    radius2: number,
    dist: number,
    dx: number,
    dy: number
) {
    const baseAngle = Math.atan2(dy, dx);
    const radiusSum = radius1 + radius2;
    const tangentAngle = Math.asin(radiusSum / dist);

    const angle1 = baseAngle + tangentAngle;
    const angle2 = baseAngle - tangentAngle;

    return {
        line1: {
            p1: {
                x: center1.x + radius1 * Math.cos(angle1 + Math.PI / 2),
                y: center1.y + radius1 * Math.sin(angle1 + Math.PI / 2),
            },
            p2: {
                x: center2.x - radius2 * Math.cos(angle1 + Math.PI / 2),
                y: center2.y - radius2 * Math.sin(angle1 + Math.PI / 2),
            },
        },
        line2: {
            p1: {
                x: center1.x + radius1 * Math.cos(angle2 - Math.PI / 2),
                y: center1.y + radius1 * Math.sin(angle2 - Math.PI / 2),
            },
            p2: {
                x: center2.x - radius2 * Math.cos(angle2 - Math.PI / 2),
                y: center2.y - radius2 * Math.sin(angle2 - Math.PI / 2),
            },
        },
    };
}

/**
 * Generate SVG path data for a rope segment
 */
export function generateRopePath(points: Point[]): string {
    if (points.length === 0) return '';

    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 1; i < points.length; i++) {
        path += ` L ${points[i].x} ${points[i].y}`;
    }

    return path;
}

/**
 * Calculate arc path around a pulley
 */
export function generateArcPath(
    center: Point,
    radius: number,
    startAngle: number,
    endAngle: number,
    direction: 'cw' | 'ccw' = 'cw'
): string {
    const start = {
        x: center.x + radius * Math.cos(startAngle),
        y: center.y + radius * Math.sin(startAngle),
    };

    const end = {
        x: center.x + radius * Math.cos(endAngle),
        y: center.y + radius * Math.sin(endAngle),
    };

    // Use largeArc flag only if angle difference is > 90 degrees (PI/2)
    // This prevents arcs from going over 180 degrees
    const largeArc = Math.abs(endAngle - startAngle) > Math.PI / 2 ? 1 : 0;
    const sweep = direction === 'cw' ? 1 : 0;

    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} ${sweep} ${end.x} ${end.y}`;
}
