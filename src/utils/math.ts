import { Point } from '../types';

/**
 * Snap a point to the nearest grid position
 */
export function snapToGrid(point: Point, gridSize: number): Point {
    return {
        x: Math.round(point.x / gridSize) * gridSize,
        y: Math.round(point.y / gridSize) * gridSize,
    };
}

/**
 * Calculate distance between two points
 */
export function distance(p1: Point, p2: Point): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate angle between two points in radians
 */
export function angle(p1: Point, p2: Point): number {
    return Math.atan2(p2.y - p1.y, p2.x - p1.x);
}

/**
 * Convert degrees to radians
 */
export function degToRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
}

/**
 * Convert radians to degrees
 */
export function radToDeg(radians: number): number {
    return (radians * 180) / Math.PI;
}

/**
 * Generate a unique ID
 */
export function generateId(prefix: string = 'id'): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Add two vectors
 */
export function addVectors(v1: Point, v2: Point): Point {
    return {
        x: v1.x + v2.x,
        y: v1.y + v2.y,
    };
}

/**
 * Subtract two vectors (v1 - v2)
 */
export function subtractVectors(v1: Point, v2: Point): Point {
    return {
        x: v1.x - v2.x,
        y: v1.y - v2.y,
    };
}

/**
 * Scale a vector by a scalar
 */
export function scaleVector(v: Point, scalar: number): Point {
    return {
        x: v.x * scalar,
        y: v.y * scalar,
    };
}

/**
 * Normalize a vector to unit length
 */
export function normalize(v: Point): Point {
    const len = Math.sqrt(v.x * v.x + v.y * v.y);
    if (len === 0) return { x: 0, y: 0 };
    return {
        x: v.x / len,
        y: v.y / len,
    };
}

/**
 * Dot product of two vectors
 */
export function dot(v1: Point, v2: Point): number {
    return v1.x * v2.x + v1.y * v2.y;
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}
