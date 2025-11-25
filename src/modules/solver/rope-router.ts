import { Point, RopeSegment, SystemState, ComponentType } from '../../types';

/**
 * Simplified Rope Routing with Tangent Points
 * Ropes connect to pulleys at tangent points on circumference, not center
 */

/**
 * Calculate rope segments with proper tangent points for pulleys
 */
export function calculateRopeSegments(
    startPoint: Point,
    endPoint: Point,
    system: SystemState,
    ropeId: string
): RopeSegment[] {
    // Get the rope component to find what it connects to
    const rope = system.components.find(c => c.id === ropeId && c.type === ComponentType.ROPE);
    if (!rope || rope.type !== ComponentType.ROPE) {
        return [{
            start: startPoint,
            end: endPoint,
            type: 'line',
            length: distance(startPoint, endPoint)
        }];
    }

    // Check if start or end connects to a pulley
    const startComp = system.components.find(c => c.id === rope.startNodeId);
    const endComp = system.components.find(c => c.id === rope.endNodeId);

    let adjustedStart = startPoint;
    let adjustedEnd = endPoint;

    // If start is a pulley, calculate tangent point
    if (startComp && isPulley(startComp) && 'radius' in startComp) {
        adjustedStart = calculateTangentPoint(startPoint, endPoint, startComp.radius, endComp);
    }

    // If end is a pulley, calculate tangent point
    if (endComp && isPulley(endComp) && 'radius' in endComp) {
        adjustedEnd = calculateTangentPoint(endPoint, startPoint, endComp.radius, startComp);
    }

    return [{
        start: adjustedStart,
        end: adjustedEnd,
        type: 'line',
        length: distance(adjustedStart, adjustedEnd)
    }];
}

/**
 * Check if component is a pulley type
 */
function isPulley(component: any): boolean {
    return component.type === ComponentType.PULLEY ||
        component.type === ComponentType.SPRING_PULLEY ||
        component.type === ComponentType.PULLEY_BECKET ||
        component.type === ComponentType.SPRING_PULLEY_BECKET;
}

/**
 * Calculate true tangent point on pulley circumference
 * The tangent line from otherCenter that is perpendicular to the radius at the tangent point
 * Returns the tangent point that wraps around the bottom (for masses below)
 */
function calculateTangentPoint(
    pulleyCenter: Point,
    otherCenter: Point,
    radius: number,
    _otherComponent: any
): Point {
    const dx = otherCenter.x - pulleyCenter.x;
    const dy = otherCenter.y - pulleyCenter.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    console.log('Tangent calc:', {
        pulleyCenter,
        otherCenter,
        radius,
        dist,
        dx,
        dy
    });

    // If too close, just use radial direction
    if (dist < radius * 1.1) {
        const angle = Math.atan2(dy, dx);
        const result = {
            x: pulleyCenter.x + radius * Math.cos(angle),
            y: pulleyCenter.y + radius * Math.sin(angle)
        };
        console.log('Too close - using radial:', result);
        return result;
    }

    // Calculate true tangent point using geometry
    // The tangent makes a right angle with the radius at the tangent point

    // Angle from pulley center to other center
    const centerAngle = Math.atan2(dy, dx);

    // Angle offset for the tangent (forms right triangle)
    // sin(offset) = radius / distance
    const angleOffset = Math.asin(radius / dist);

    // External tangent: tangent point is perpendicular to radius
    // The angle to the tangent point is NOT centerAngle ± angleOffset
    // It's centerAngle ± (90° - angleOffset) because tangent is perpendicular
    const perpAngle = Math.PI / 2 - angleOffset;

    // Choose which side based on horizontal position
    const tangentAngle = dx >= 0
        ? centerAngle - perpAngle  // Right side - rotate clockwise from center line
        : centerAngle + perpAngle; // Left side - rotate counterclockwise from center line

    const result = {
        x: pulleyCenter.x + radius * Math.cos(tangentAngle),
        y: pulleyCenter.y + radius * Math.sin(tangentAngle)
    };

    console.log('Tangent result:', {
        centerAngle: centerAngle * 180 / Math.PI,
        angleOffset: angleOffset * 180 / Math.PI,
        tangentAngle: tangentAngle * 180 / Math.PI,
        result
    });

    return result;
}

/**
 * Generate SVG path from segments
 */
export function generateRopePathFromSegments(segments: RopeSegment[]): string {
    if (segments.length === 0) return '';

    let path = `M ${segments[0].start.x} ${segments[0].start.y}`;

    for (const segment of segments) {
        if (segment.type === 'line') {
            path += ` L ${segment.end.x} ${segment.end.y}`;
        }
        // Arc rendering disabled - straight lines only
    }

    return path;
}

/**
 * Helper: Calculate distance between two points
 */
function distance(p1: Point, p2: Point): number {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

/**
 * Calculate total rope length from segments
 */
export function calculateTotalRopeLength(segments: RopeSegment[]): number {
    return segments.reduce((total, segment) => total + segment.length, 0);
}
