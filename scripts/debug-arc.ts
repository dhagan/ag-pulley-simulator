/**
 * Debug arc rendering by checking a specific case
 */

// Test case: Mass at (-30, 200), pulley at (0, 0), radius 30
const mass1 = { x: -30, y: 200 };
const pulley = { x: 0, y: 0 };
const radius = 30;

// Calculate tangent point from mass1 to pulley
const dx = mass1.x - pulley.x; // -30
const dy = mass1.y - pulley.y; // 200
const dist = Math.sqrt(dx * dx + dy * dy);
const angleToPoint = Math.atan2(dy, dx);
const anglePCT = Math.asin(radius / dist);

const tangentAngle1 = angleToPoint + (Math.PI / 2 - anglePCT);
const tangentAngle2 = angleToPoint - (Math.PI / 2 - anglePCT);

const tangent1 = {
    x: pulley.x + radius * Math.cos(tangentAngle1),
    y: pulley.y + radius * Math.sin(tangentAngle1)
};

const tangent2 = {
    x: pulley.x + radius * Math.cos(tangentAngle2),
    y: pulley.y + radius * Math.sin(tangentAngle2)
};

console.log('Mass1 position:', mass1);
console.log('Pulley position:', pulley);
console.log('Distance:', dist);
console.log('Angle to point (deg):', angleToPoint * 180 / Math.PI);
console.log('');
console.log('Tangent 1 angle (deg):', tangentAngle1 * 180 / Math.PI);
console.log('Tangent 1 point:', tangent1);
console.log('Tangent 1 is on LEFT side:', tangent1.x < pulley.x);
console.log('');
console.log('Tangent 2 angle (deg):', tangentAngle2 * 180 / Math.PI);
console.log('Tangent 2 point:', tangent2);
console.log('Tangent 2 is on LEFT side:', tangent2.x < pulley.x);
console.log('');

// For Atwood: mass1 on left should use the LEFT tangent point
const entryPoint = tangent1.x < tangent2.x ? tangent1 : tangent2;
console.log('Entry point (should be on LEFT):', entryPoint);

// Now simulate mass2 on right
const mass2 = { x: 30, y: 200 };
const dx2 = mass2.x - pulley.x;
const dy2 = mass2.y - pulley.y;
const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
const angleToPoint2 = Math.atan2(dy2, dx2);
const anglePCT2 = Math.asin(radius / dist2);

const exitAngle1 = angleToPoint2 + (Math.PI / 2 - anglePCT2);
const exitAngle2 = angleToPoint2 - (Math.PI / 2 - anglePCT2);

const exit1 = {
    x: pulley.x + radius * Math.cos(exitAngle1),
    y: pulley.y + radius * Math.sin(exitAngle1)
};

const exit2 = {
    x: pulley.x + radius * Math.cos(exitAngle2),
    y: pulley.y + radius * Math.sin(exitAngle2)
};

console.log('\nMass2 position:', mass2);
console.log('Exit 1 point:', exit1, 'is on RIGHT:', exit1.x > pulley.x);
console.log('Exit 2 point:', exit2, 'is on RIGHT:', exit2.x > pulley.x);

const exitPoint = exit1.x > exit2.x ? exit1 : exit2;
console.log('Exit point (should be on RIGHT):', exitPoint);

// Now calculate the arc
console.log('\n--- ARC CALCULATION ---');
console.log('Entry angle:', Math.atan2(entryPoint.y - pulley.y, entryPoint.x - pulley.x) * 180 / Math.PI);
console.log('Exit angle:', Math.atan2(exitPoint.y - pulley.y, exitPoint.x - pulley.x) * 180 / Math.PI);

const entryAngle = Math.atan2(entryPoint.y - pulley.y, entryPoint.x - pulley.x);
const exitAngleCalc = Math.atan2(exitPoint.y - pulley.y, exitPoint.x - pulley.x);

// Normalize to [-π, π]
const normalizeAngle = (a: number) => {
    while (a > Math.PI) a -= 2 * Math.PI;
    while (a <= -Math.PI) a += 2 * Math.PI;
    return a;
};

const normEntry = normalizeAngle(entryAngle);
const normExit = normalizeAngle(exitAngleCalc);
let angleDiff = normExit - normEntry;

if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

console.log('Normalized entry:', normEntry * 180 / Math.PI);
console.log('Normalized exit:', normExit * 180 / Math.PI);
console.log('Angle diff:', angleDiff * 180 / Math.PI);
console.log('Sweep direction:', angleDiff > 0 ? 'counter-clockwise (0)' : 'clockwise (1)');
console.log('Large arc:', Math.abs(angleDiff) > Math.PI ? 1 : 0);

console.log('\nSVG Arc command:');
console.log(`A ${radius} ${radius} 0 ${Math.abs(angleDiff) > Math.PI ? 1 : 0} ${angleDiff > 0 ? 0 : 1} ${exitPoint.x} ${exitPoint.y}`);
