import { Point, RopeSegment, Pulley, SystemState } from '../../types';

/**
 * Smart Rope Routing Algorithm
 * Detects intermediate pulleys and generates segment-based rope paths
 */

export interface PulleyIntersection {
    pulley: Pulley;
    distance: number;
    intersectionPoint: Point;
    tangentEntry: Point;
    tangentExit: Point;
}

/**
 * Main function: Calculate all segments for a rope from start to end
 * considering intermediate pulleys it wraps around
 */
export function calculateRopeSegments(
    startPoint: Point,
    endPoint: Point,
    system: SystemState,
    _ropeId: string
): RopeSegment[] {
    const pulleys = system.components.filter(c => c.type === 'pulley') as Pulley[];
    
    // Find all pulleys that intersect with the direct path
    const intersectingPulleys = findIntermediatePulleys(startPoint, endPoint, pulleys);
    
    if (intersectingPulleys.length === 0) {
        // Simple direct line segment
        return [{
            start: startPoint,
            end: endPoint,
            type: 'line',
            length: distance(startPoint, endPoint)
        }];
    }
    
    // Sort pulleys by distance from start
    intersectingPulleys.sort((a, b) => a.distance - b.distance);
    
    // Build segments: start -> pulley1 -> pulley2 -> ... -> end
    return buildSegmentsWithPulleys(startPoint, endPoint, intersectingPulleys);
}

/**
 * Find all pulleys that the rope path intersects
 */
function findIntermediatePulleys(
    start: Point,
    end: Point,
    pulleys: Pulley[]
): PulleyIntersection[] {
    const intersections: PulleyIntersection[] = [];
    
    for (const pulley of pulleys) {
        const intersection = checkLineCircleIntersection(
            start,
            end,
            pulley.position,
            pulley.radius
        );
        
        if (intersection.intersects) {
            // Calculate tangent points for rope wrapping
            const tangents = calculateTangentPointsForRope(
                start,
                end,
                pulley
            );
            
            if (tangents) {
                intersections.push({
                    pulley,
                    distance: distance(start, pulley.position),
                    intersectionPoint: intersection.point!,
                    tangentEntry: tangents.entry,
                    tangentExit: tangents.exit
                });
            }
        }
    }
    
    return intersections;
}

/**
 * Check if a line segment intersects with a circle
 */
function checkLineCircleIntersection(
    lineStart: Point,
    lineEnd: Point,
    circleCenter: Point,
    circleRadius: number
): { intersects: boolean; point?: Point } {
    // Vector from line start to end
    const dx = lineEnd.x - lineStart.x;
    const dy = lineEnd.y - lineStart.y;
    
    // Vector from line start to circle center
    const fx = lineStart.x - circleCenter.x;
    const fy = lineStart.y - circleCenter.y;
    
    // Quadratic equation coefficients for line-circle intersection
    const a = dx * dx + dy * dy;
    const b = 2 * (fx * dx + fy * dy);
    const c = (fx * fx + fy * fy) - circleRadius * circleRadius;
    
    const discriminant = b * b - 4 * a * c;
    
    if (discriminant < 0) {
        return { intersects: false };
    }
    
    // Check if intersection points are within line segment
    const t1 = (-b - Math.sqrt(discriminant)) / (2 * a);
    const t2 = (-b + Math.sqrt(discriminant)) / (2 * a);
    
    if ((t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1)) {
        // Use the first intersection point within segment
        const t = (t1 >= 0 && t1 <= 1) ? t1 : t2;
        return {
            intersects: true,
            point: {
                x: lineStart.x + t * dx,
                y: lineStart.y + t * dy
            }
        };
    }
    
    // Check if the closest point on line to circle is within segment
    const closestT = Math.max(0, Math.min(1, -b / (2 * a)));
    const closestPoint = {
        x: lineStart.x + closestT * dx,
        y: lineStart.y + closestT * dy
    };
    const distToCenter = distance(closestPoint, circleCenter);
    
    if (distToCenter <= circleRadius * 1.1) { // 10% tolerance for near-misses
        return { intersects: true, point: closestPoint };
    }
    
    return { intersects: false };
}

/**
 * Calculate entry and exit tangent points for rope wrapping around a pulley
 */
function calculateTangentPointsForRope(
    ropeStart: Point,
    ropeEnd: Point,
    pulley: Pulley
): { entry: Point; exit: Point } | null {
    // Calculate tangent from rope start to pulley
    const tangentsFromStart = calculateTangentFromPointToCircle(
        ropeStart,
        pulley.position,
        pulley.radius
    );
    
    // Calculate tangent from pulley to rope end
    const tangentsToEnd = calculateTangentFromPointToCircle(
        ropeEnd,
        pulley.position,
        pulley.radius
    );
    
    if (!tangentsFromStart || !tangentsToEnd) {
        return null;
    }
    
    // Choose the appropriate tangent pair (shortest path)
    // Try all combinations and pick shortest total path
    let minLength = Infinity;
    let bestEntry: Point = tangentsFromStart[0];
    let bestExit: Point = tangentsToEnd[0];
    
    for (const entry of tangentsFromStart) {
        for (const exit of tangentsToEnd) {
            const arcLength = calculateArcLength(
                entry,
                exit,
                pulley.position,
                pulley.radius
            );
            const totalLength = 
                distance(ropeStart, entry) + 
                arcLength + 
                distance(exit, ropeEnd);
            
            if (totalLength < minLength) {
                minLength = totalLength;
                bestEntry = entry;
                bestExit = exit;
            }
        }
    }
    
    return { entry: bestEntry, exit: bestExit };
}

/**
 * Calculate tangent points from an external point to a circle
 */
function calculateTangentFromPointToCircle(
    point: Point,
    circleCenter: Point,
    circleRadius: number
): [Point, Point] | null {
    const dx = point.x - circleCenter.x;
    const dy = point.y - circleCenter.y;
    const distSquared = dx * dx + dy * dy;
    const radiusSquared = circleRadius * circleRadius;
    
    // Point is inside circle
    if (distSquared < radiusSquared) {
        return null;
    }
    
    const dist = Math.sqrt(distSquared);
    const angle = Math.atan2(dy, dx);
    
    // Angle offset for tangent
    const tangentAngle = Math.asin(circleRadius / dist);
    
    const tangent1 = {
        x: circleCenter.x + circleRadius * Math.cos(angle + tangentAngle + Math.PI / 2),
        y: circleCenter.y + circleRadius * Math.sin(angle + tangentAngle + Math.PI / 2)
    };
    
    const tangent2 = {
        x: circleCenter.x + circleRadius * Math.cos(angle - tangentAngle - Math.PI / 2),
        y: circleCenter.y + circleRadius * Math.sin(angle - tangentAngle - Math.PI / 2)
    };
    
    return [tangent1, tangent2];
}

/**
 * Build rope segments including arcs around pulleys
 */
function buildSegmentsWithPulleys(
    start: Point,
    end: Point,
    pulleys: PulleyIntersection[]
): RopeSegment[] {
    const segments: RopeSegment[] = [];
    let currentPoint = start;
    
    for (let i = 0; i < pulleys.length; i++) {
        const pulley = pulleys[i];
        
        // Segment from current point to pulley entry tangent
        segments.push({
            start: currentPoint,
            end: pulley.tangentEntry,
            type: 'line',
            length: distance(currentPoint, pulley.tangentEntry)
        });
        
        // Arc segment wrapping around pulley
        const arcAngles = calculateArcAngles(
            pulley.tangentEntry,
            pulley.tangentExit,
            pulley.pulley.position
        );
        
        segments.push({
            start: pulley.tangentEntry,
            end: pulley.tangentExit,
            type: 'arc',
            wrapsAroundPulleyId: pulley.pulley.id,
            arcCenter: pulley.pulley.position,
            arcRadius: pulley.pulley.radius,
            arcStartAngle: arcAngles.startAngle,
            arcEndAngle: arcAngles.endAngle,
            length: calculateArcLength(
                pulley.tangentEntry,
                pulley.tangentExit,
                pulley.pulley.position,
                pulley.pulley.radius
            )
        });
        
        currentPoint = pulley.tangentExit;
    }
    
    // Final segment from last pulley to end
    segments.push({
        start: currentPoint,
        end: end,
        type: 'line',
        length: distance(currentPoint, end)
    });
    
    return segments;
}

/**
 * Calculate arc angles for wrapping around pulley
 */
function calculateArcAngles(
    entry: Point,
    exit: Point,
    center: Point
): { startAngle: number; endAngle: number } {
    const startAngle = Math.atan2(entry.y - center.y, entry.x - center.x);
    const endAngle = Math.atan2(exit.y - center.y, exit.x - center.x);
    
    return { startAngle, endAngle };
}

/**
 * Calculate arc length on circle
 */
function calculateArcLength(
    start: Point,
    end: Point,
    center: Point,
    radius: number
): number {
    const angle1 = Math.atan2(start.y - center.y, start.x - center.x);
    const angle2 = Math.atan2(end.y - center.y, end.x - center.x);
    
    let angleDiff = angle2 - angle1;
    
    // Normalize to [0, 2π]
    if (angleDiff < 0) angleDiff += 2 * Math.PI;
    if (angleDiff > 2 * Math.PI) angleDiff -= 2 * Math.PI;
    
    // Choose shorter arc
    if (angleDiff > Math.PI) {
        angleDiff = 2 * Math.PI - angleDiff;
    }
    
    return radius * angleDiff;
}

/**
 * Calculate Euclidean distance between two points
 */
function distance(p1: Point, p2: Point): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate total rope length including all segments
 */
export function calculateTotalRopeLength(segments: RopeSegment[]): number {
    return segments.reduce((total, segment) => total + segment.length, 0);
}

/**
 * Generate SVG path data for rope segments
 */
export function generateRopePathFromSegments(segments: RopeSegment[]): string {
    if (segments.length === 0) return '';
    
    let path = `M ${segments[0].start.x} ${segments[0].start.y}`;
    
    for (const segment of segments) {
        if (segment.type === 'line') {
            path += ` L ${segment.end.x} ${segment.end.y}`;
        } else if (segment.type === 'arc' && segment.arcCenter && segment.arcRadius) {
            // Calculate arc parameters
            const startAngle = segment.arcStartAngle!;
            const endAngle = segment.arcEndAngle!;
            const angleDiff = Math.abs(endAngle - startAngle);
            
            const largeArc = angleDiff > Math.PI ? 1 : 0;
            const sweep = endAngle > startAngle ? 1 : 0;
            
            path += ` A ${segment.arcRadius} ${segment.arcRadius} 0 ${largeArc} ${sweep} ${segment.end.x} ${segment.end.y}`;
        }
    }
    
    return path;
}
