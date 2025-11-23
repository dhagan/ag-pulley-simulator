// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { solveLinearSystem } from '../matrix-solver';

describe('Matrix Solver', () => {
    it('solves square system correctly', () => {
        const eqSystem = {
            A: [[2, 1], [1, 3]],
            b: [5, 8],
            unknowns: ['x', 'y'],
        };

        const result = solveLinearSystem(eqSystem);

        expect(result.solved).toBe(true);
        expect(result.solution[0]).toBeCloseTo(1, 5);
        expect(result.solution[1]).toBeCloseTo(3, 5);
    });

    it('solves overdetermined system using least squares', () => {
        const eqSystem = {
            A: [[1], [1], [1]],
            b: [2, 3, 4],
            unknowns: ['x'],
        };

        const result = solveLinearSystem(eqSystem);

        expect(result.solved).toBe(true);
        expect(result.solution[0]).toBeCloseTo(3, 1); // Average of 2, 3, 4
    });

    it('returns error for underdetermined system', () => {
        const eqSystem = {
            A: [[1, 2]],
            b: [5],
            unknowns: ['x', 'y'],
        };

        const result = solveLinearSystem(eqSystem);

        expect(result.solved).toBe(false);
        expect(result.error).toContain('Underdetermined');
    });

    it('solves vertical hanging mass (T = mg)', () => {
        // Equation: -T + mg = 0  =>  -T = -98.1  =>  T = 98.1
        const eqSystem = {
            A: [[-1]],
            b: [-98.1],
            unknowns: ['T'],
        };

        const result = solveLinearSystem(eqSystem);

        expect(result.solved).toBe(true);
        expect(result.solution[0]).toBeCloseTo(98.1, 1);
    });
});
