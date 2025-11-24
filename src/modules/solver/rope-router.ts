import { Point, RopeSegment, SystemState } from '../../types';

/**
 * Simplified Rope Routing
 * All ropes render as straight lines (no arcs) until tangent/arc logic is perfected
 */

/**
 * Calculate rope segments - currently just returns a straight line
 */
export function calculateRopeSegments(
    startPoint: Point,
    endPoint: Point,
    _system: SystemState,
    _ropeId: string
): RopeSegment[] {
    return [{
        start: startPoint,
        end: endPoint,
        type: 'line',
        length: distance(startPoint, endPoint)
    }];
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
