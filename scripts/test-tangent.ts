/**
 * Test tangent calculation manually
 */

// Simple test: point at (0, 100) below circle at (0, 0) with radius 30
const point = { x: 0, y: 100 };
const center = { x: 0, y: 0 };
const radius = 30;

const dx = point.x - center.x; // 0
const dy = point.y - center.y; // 100
const dist = Math.sqrt(dx * dx + dy * dy); // 100

const angleToCenterFromPoint = Math.atan2(dy, dx); // π/2 (90°, pointing down)
const offsetAngle = Math.asin(radius / dist); // asin(30/100) = asin(0.3) ≈ 0.3047 radians ≈ 17.46°

const tangent1Angle = angleToCenterFromPoint + (Math.PI / 2 - offsetAngle);
const tangent2Angle = angleToCenterFromPoint - (Math.PI / 2 - offsetAngle);

const tangent1 = {
    x: center.x + radius * Math.cos(tangent1Angle),
    y: center.y + radius * Math.sin(tangent1Angle)
};

const tangent2 = {
    x: center.x + radius * Math.cos(tangent2Angle),
    y: center.y + radius * Math.sin(tangent2Angle)
};

console.log('Point:', point);
console.log('Center:', center);
console.log('Radius:', radius);
console.log('Distance:', dist);
console.log('Angle to center (radians):', angleToCenterFromPoint, '(degrees:', angleToCenterFromPoint * 180 / Math.PI, ')');
console.log('Offset angle (radians):', offsetAngle, '(degrees:', offsetAngle * 180 / Math.PI, ')');
console.log('');
console.log('Tangent 1 angle:', tangent1Angle, '(degrees:', tangent1Angle * 180 / Math.PI, ')');
console.log('Tangent 1 point:', tangent1);
console.log('Distance from center:', Math.sqrt(tangent1.x ** 2 + tangent1.y ** 2), '(should be', radius, ')');
console.log('');
console.log('Tangent 2 angle:', tangent2Angle, '(degrees:', tangent2Angle * 180 / Math.PI, ')');
console.log('Tangent 2 point:', tangent2);
console.log('Distance from center:', Math.sqrt(tangent2.x ** 2 + tangent2.y ** 2), '(should be', radius, ')');
console.log('');

// Verify tangent line is actually tangent (perpendicular to radius)
const radialAngle1 = Math.atan2(tangent1.y, tangent1.x);
const lineAngle1 = Math.atan2(tangent1.y - point.y, tangent1.x - point.x);
const dotProduct1 = Math.cos(radialAngle1) * Math.cos(lineAngle1) + Math.sin(radialAngle1) * Math.sin(lineAngle1);
console.log('Dot product (should be ~0 for perpendicular):', dotProduct1);
