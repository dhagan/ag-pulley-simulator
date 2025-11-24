import { Point, RopeSegment, Pulley, SpringPulley, PulleyBecket, SpringPulleyBecket, SystemState } from '../../types';

/**
 * Smart Rope Routing Algorithm
 * Detects intermediate pulleys and generates segment-based rope paths
 */

export interface PulleyIntersection {
    pulley: Pulley | SpringPulley | PulleyBecket | SpringPulleyBecket;
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
    ropeId: string
): RopeSegment[] {
    // Check if start or end is a pulley and adjust to circumference
    let adjustedStart = startPoint;
    let adjustedEnd = endPoint;

    const rope = system.components.find(c => c.id === ropeId && c.type === 'rope');
    if (rope && rope.type === 'rope') {
        const startComp = system.components.find(c => c.id === rope.startNodeId || c.id === rope.startNodeId.replace('_becket', ''));
        const endComp = system.components.find(c => c.id === rope.endNodeId || c.id === rope.endNodeId.replace('_becket', ''));

        // Check if connecting to becket points
        const startIsBecket = rope.startNodeId.endsWith('_becket');
        const endIsBecket = rope.endNodeId.endsWith('_becket');

        // Only adjust to pulley circumference if NOT connecting to becket
        if (!startIsBecket && (startComp?.type === 'pulley' || startComp?.type === 'spring_pulley' || startComp?.type === 'pulley_becket' || startComp?.type === 'spring_pulley_becket') && 'radius' in startComp) {
            const angle = Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x);
            adjustedStart = {
                x: startPoint.x + startComp.radius * Math.cos(angle),
                y: startPoint.y + startComp.radius * Math.sin(angle)
            };
        }

        if (!endIsBecket && (endComp?.type === 'pulley' || endComp?.type === 'spring_pulley' || endComp?.type === 'pulley_becket' || endComp?.type === 'spring_pulley_becket') && 'radius' in endComp) {
            const angle = Math.atan2(startPoint.y - endPoint.y, startPoint.x - endPoint.x);
            adjustedEnd = {
                x: endPoint.x + endComp.radius * Math.cos(angle),
                y: endPoint.y + endComp.radius * Math.sin(angle)
            };
        }
    }

    // Get all pulleys but exclude ones we're directly connected to via becket
    const pulleys = system.components.filter(c => {
        const isPulley = c.type === 'pulley' || c.type === 'spring_pulley' || c.type === 'pulley_becket' || c.type === 'spring_pulley_becket';
        if (!isPulley || !rope || rope.type !== 'rope') return isPulley;
        
        // Exclude pulley if rope connects to its becket
        const connectedToBecket = rope.startNodeId === `${c.id}_becket` || rope.endNodeId === `${c.id}_becket`;
        return !connectedToBecket;
    }) as (Pulley | SpringPulley | PulleyBecket | SpringPulleyBecket)[];
    
    // Find all pulleys that intersect with the direct path
    const intersectingPulleys = findIntermediatePulleys(adjustedStart, adjustedEnd, pulleys);
    
    if (intersectingPulleys.length === 0) {
        // Simple direct line segment with adjusted endpoints
        return [{
            start: adjustedStart,
            end: adjustedEnd,
            type: 'line',
            length: distance(adjustedStart, adjustedEnd)
        }];
    }
    
    // Sort pulleys by distance from start
    intersectingPulleys.sort((a, b) => a.distance - b.distance);
    
    // Build segments: start -> pulley1 -> pulley2 -> ... -> end
    return buildSegmentsWithPulleys(adjustedStart, adjustedEnd, intersectingPulleys);
}

/**
 * Find all pulleys that the rope path intersects
 */
function findIntermediatePulleys(
    start: Point,
    end: Point,
    pulleys: (Pulley | SpringPulley | PulleyBecket | SpringPulleyBecket)[]
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
    pulley: Pulley | SpringPulley | PulleyBecket | SpringPulleyBecket
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
    
    // Determine which side of pulley each point is on (relative to pulley center)
    const startSide = ropeStart.x - pulley.position.x;
    const endSide = ropeEnd.x - pulley.position.x;
    
    // Choose tangent points that keep rope on correct side of pulley
    // For each tangent point, check if it's on the same side as the rope endpoint
    let bestEntry: Point;
    let bestExit: Point;
    
    // Select entry tangent: choose the one on the same side as ropeStart
    if (Math.abs((tangentsFromStart[0].x - pulley.position.x) - startSide) < 
        Math.abs((tangentsFromStart[1].x - pulley.position.x) - startSide)) {
        bestEntry = tangentsFromStart[0];
    } else {
        bestEntry = tangentsFromStart[1];
    }
    
    // Select exit tangent: choose the one on the same side as ropeEnd
    if (Math.abs((tangentsToEnd[0].x - pulley.position.x) - endSide) < 
        Math.abs((tangentsToEnd[1].x - pulley.position.x) - endSide)) {
        bestExit = tangentsToEnd[0];
    } else {
        bestExit = tangentsToEnd[1];
    }
    
    return { entry: bestEntry, exit: bestExit };
}

/**
 * Calculate tangent points from an external point to a circle
 * Uses the correct geometric formula for external tangents
 * 
 * For external point P at distance d from center C with radius r:
 * 1. The tangent touches the circle at point T
 * 2. Triangle CPT is a right triangle with right angle at T
 * 3. sin(angle_PCT) = r/d, so angle_PCT = asin(r/d)
 * 4. The angle from C to T is: (angle from C to P) ± (π/2 - angle_PCT)
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
    const angleToPoint = Math.atan2(dy, dx); // Angle from center to external point
    
    // In the right triangle formed by C, P, and T:
    // The angle at C (angle_PCT) where sin(angle_PCT) = r/d
    const anglePCT = Math.asin(circleRadius / dist);
    
    // The tangent point T is at angle: angleToPoint ± (π/2 - anglePCT)
    // This is because the radius to T is perpendicular to the tangent line PT
    const tangent1Angle = angleToPoint + (Math.PI / 2 - anglePCT);
    const tangent2Angle = angleToPoint - (Math.PI / 2 - anglePCT);
    
    const tangent1 = {
        x: circleCenter.x + circleRadius * Math.cos(tangent1Angle),
        y: circleCenter.y + circleRadius * Math.sin(tangent1Angle)
    };
    
    const tangent2 = {
        x: circleCenter.x + circleRadius * Math.cos(tangent2Angle),
        y: circleCenter.y + circleRadius * Math.sin(tangent2Angle)
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
            // For arcs, we need to determine the sweep direction
            const startAngle = segment.arcStartAngle!;
            const endAngle = segment.arcEndAngle!;
            
            // Check if we're crossing from left to right (or vice versa) horizontally
            const startX = segment.start.x - segment.arcCenter.x;
            const endX = segment.end.x - segment.arcCenter.x;
            const crossingHorizontally = (startX < 0 && endX > 0) || (startX > 0 && endX < 0);
            
            // Normalize angles to [-π, π]
            const normalizeAngle = (a: number) => {
                while (a > Math.PI) a -= 2 * Math.PI;
                while (a <= -Math.PI) a += 2 * Math.PI;
                return a;
            };
            
            const normStart = normalizeAngle(startAngle);
            const normEnd = normalizeAngle(endAngle);
            
            // Calculate angular difference
            let angleDiff = normEnd - normStart;
            
            // If we're crossing horizontally (Atwood machine), force going over the top
            if (crossingHorizontally) {
                // Going from left to right: want positive diff (counter-clockwise over top)
                if (startX < 0 && endX > 0) {
                    if (angleDiff < 0) angleDiff += 2 * Math.PI;
                } 
                // Going from right to left: want negative diff (clockwise over top)
                else if (startX > 0 && endX < 0) {
                    if (angleDiff > 0) angleDiff -= 2 * Math.PI;
                }
            } else {
                // Not crossing - normalize to shortest path
                if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
            }
            
            const absAngleDiff = Math.abs(angleDiff);
            const largeArc = absAngleDiff > Math.PI ? 1 : 0;
            const sweep = angleDiff > 0 ? 0 : 1;
            
            // DJH: Debug logging for ALL arcs
            console.log('DJH Arc Debug:', {
                crossingHorizontally,
                start: segment.start,
                end: segment.end,
                center: segment.arcCenter,
                radius: segment.arcRadius,
                startAngle: startAngle * 180 / Math.PI,
                endAngle: endAngle * 180 / Math.PI,
                angleDiff: angleDiff * 180 / Math.PI,
                largeArc,
                sweep,
                svgCommand: `A ${segment.arcRadius} ${segment.arcRadius} 0 ${largeArc} ${sweep} ${segment.end.x} ${segment.end.y}`
            });
            
            path += ` A ${segment.arcRadius} ${segment.arcRadius} 0 ${largeArc} ${sweep} ${segment.end.x} ${segment.end.y}`;
        }
    }
    
    return path;
}
