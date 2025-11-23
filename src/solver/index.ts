import { SystemState, SolverResult } from '../types';
import { buildGraph, validateGraph } from '../utils/graph-builder';
import { buildEquationSystem, validateEquationSystem } from './equation-builder';
import { solveLinearSystem, validateSolution } from './matrix-solver';

export function solvePulleySystem(system: SystemState): SolverResult {
    console.log('🔍 SOLVER: Starting');

    // Validate that all nodes are connected
    const unattachedComponents = system.components.filter(c => {
        if (c.type === 'anchor' || c.type === 'pulley' || c.type === 'mass') {
            const isConnected = system.components.some(other => 
                (other.type === 'rope' || other.type === 'spring') &&
                (other.startNodeId === c.id || other.endNodeId === c.id)
            );
            return !isConnected;
        }
        return false;
    });

    if (unattachedComponents.length > 0) {
        const names = unattachedComponents.map(c => `${c.type} (${c.id})`);
        console.error('❌ SOLVER: Unattached components', names);
        return {
            tensions: new Map(),
            segmentTensions: new Map(),
            springForces: new Map(),
            reactionForces: new Map(),
            displacements: new Map(),
            totalRopeLength: 0,
            ropeSegmentAnalysis: new Map(),
            solved: false,
            error: `Unattached components: ${names.join(', ')}. All anchors, pulleys, and masses must be connected by ropes or springs.`,
        };
    }

    const graph = buildGraph(system);
    console.log('🔍 SOLVER: Graph built', { nodes: graph.nodes.size, edges: graph.edges.size });

    const graphValidation = validateGraph(graph);
    if (!graphValidation.valid) {
        console.error('❌ SOLVER: Graph invalid', graphValidation.errors);
        return {
            tensions: new Map(),
            segmentTensions: new Map(),
            springForces: new Map(),
            reactionForces: new Map(),
            displacements: new Map(),
            totalRopeLength: 0,
            ropeSegmentAnalysis: new Map(),
            solved: false,
            error: `Graph validation failed: ${graphValidation.errors.join(', ')}`,
        };
    }

    const eqSystem = buildEquationSystem(graph, system);
    console.log('🔍 SOLVER: Equations built', { unknowns: eqSystem.unknowns.length, equations: eqSystem.A.length });

    const eqValidation = validateEquationSystem(eqSystem);
    if (!eqValidation.valid) {
        console.error('❌ SOLVER: Equations invalid', eqValidation.error);
        return {
            tensions: new Map(),
            segmentTensions: new Map(),
            springForces: new Map(),
            reactionForces: new Map(),
            displacements: new Map(),
            totalRopeLength: 0,
            ropeSegmentAnalysis: new Map(),
            solved: false,
            error: eqValidation.error,
        };
    }

    const solverResult = solveLinearSystem(eqSystem);
    if (!solverResult.solved) {
        console.error('❌ SOLVER: Linear solve failed', solverResult.error);
        return {
            tensions: new Map(),
            segmentTensions: new Map(),
            springForces: new Map(),
            reactionForces: new Map(),
            displacements: new Map(),
            totalRopeLength: 0,
            ropeSegmentAnalysis: new Map(),
            solved: false,
            error: `Solver failed: ${solverResult.error}`,
        };
    }

    const solutionValidation = validateSolution(solverResult.solution, eqSystem.unknowns);

    const tensions = new Map<string, number>();
    const springForces = new Map<string, number>();

    solverResult.solution.forEach((value, index) => {
        const varName = eqSystem.unknowns[index];
        if (varName.startsWith('T_')) {
            tensions.set(varName.substring(2), value);
        } else if (varName.startsWith('F_spring_')) {
            springForces.set(varName.substring(9), value);
        }
    });

    let totalRopeLength = 0;
    system.components.forEach((c) => {
        if (c.type === 'rope') {
            totalRopeLength += c.length;
        }
    });

    const pulleyCount = system.components.filter(c => c.type === 'pulley').length;
    const mechanicalAdvantage = pulleyCount > 0 ? pulleyCount + 1 : undefined;

    console.log('✅ SOLVER: Success!', { tensions: Array.from(tensions.entries()) });

    return {
        tensions,
        segmentTensions: new Map(),
        springForces,
        reactionForces: new Map(),
        displacements: new Map(),
        totalRopeLength,
        mechanicalAdvantage,
        ropeSegmentAnalysis: new Map(),
        solved: true,
        error: solutionValidation.warnings.length > 0 ? `Warning: ${solutionValidation.warnings.join(', ')}` : undefined,
    };
}
