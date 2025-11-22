import { EquationSystem } from '../types';
import { all, create } from 'mathjs';

const math = create(all);

/**
 * Solve a system of linear equations Ax = b using math.js
 */
export function solveLinearSystem(
    eqSystem: EquationSystem
): { solution: number[]; solved: boolean; error?: string } {
    try {
        const { A, b } = eqSystem;

        if (A.length === 0 || A[0].length === 0) {
            return {
                solution: [],
                solved: false,
                error: 'Empty equation system',
            };
        }

        // Use math.js lusolve for solving Ax = b
        const solution = math.lusolve(A, b) as number[][];

        // lusolve returns [[x1], [x2], ...], flatten it
        const flatSolution = solution.map((row) => row[0]);

        return {
            solution: flatSolution,
            solved: true,
        };
    } catch (error) {
        return {
            solution: [],
            solved: false,
            error: error instanceof Error ? error.message : 'Unknown solver error',
        };
    }
}

/**
 * Check if a solution is physically valid
 * (e.g., all tensions should be positive for ropes)
 */
export function validateSolution(
    solution: number[],
    unknowns: string[]
): { valid: boolean; warnings: string[] } {
    const warnings: string[] = [];

    solution.forEach((value, index) => {
        const varName = unknowns[index];

        // Rope tensions should be positive (ropes can only pull, not push)
        if (varName.startsWith('T_') && value < 0) {
            warnings.push(`${varName} is negative (${value.toFixed(2)} N) - rope cannot push`);
        }

        // Check for NaN or Infinity
        if (!isFinite(value)) {
            warnings.push(`${varName} is not finite (${value})`);
        }
    });

    return {
        valid: warnings.length === 0,
        warnings,
    };
}
