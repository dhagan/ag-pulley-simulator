import { SystemState, SolverResult, RopeAnalysis } from '../../types';
import { buildGraph, validateGraph } from '../../utils/graph-builder';
import { buildEquationSystem, validateEquationSystem } from '../../solver/equation-builder';
import { solveLinearSystem, validateSolution } from '../../solver/matrix-solver';
import { calculateTotalRopeLength } from './rope-router';

/**
 * Enhanced Pulley System Solver
 * Analytical solver for static equilibrium with smart rope routing
 */
export function solvePulleySystem(system: SystemState): SolverResult {
    console.log('🔍 PSAT SOLVER: Starting analysis');

    // Build graph with smart rope routing
    const graph = buildGraph(system);
    console.log('🔍 PSAT SOLVER: Graph built', {
        nodes: graph.nodes.size,
        edges: graph.edges.size,
        ropeSegments: graph.ropeSegments.size
    });

    // Validate graph structure
    const graphValidation = validateGraph(graph, system);
    if (!graphValidation.valid) {
        console.error('❌ PSAT SOLVER: Graph invalid', graphValidation.errors);
        return createErrorResult(`Graph validation failed: ${graphValidation.errors.join(', ')}`);
    }

    // Build equation system
    const eqSystem = buildEquationSystem(graph, system);
    console.log('🔍 PSAT SOLVER: Equations built', {
        unknowns: eqSystem.unknowns.length,
        equations: eqSystem.A.length
    });

    // Log equations for debugging
    logEquationSystem(eqSystem);

    // Validate equation system
    const eqValidation = validateEquationSystem(eqSystem);
    if (!eqValidation.valid) {
        console.error('❌ PSAT SOLVER: Equations invalid', eqValidation.error);
        return createErrorResult(eqValidation.error || 'Unknown validation error');
    }

    // Solve linear system Ax = b
    const solverResult = solveLinearSystem(eqSystem);
    if (!solverResult.solved) {
        console.error('❌ PSAT SOLVER: Linear solve failed', solverResult.error);
        return createErrorResult(`Solver failed: ${solverResult.error}`);
    }

    // Validate solution (check for negative tensions, etc.)
    const solutionValidation = validateSolution(solverResult.solution, eqSystem.unknowns);

    // Extract results
    const tensions = new Map<string, number>();
    const segmentTensions = new Map<string, number>();
    const springForces = new Map<string, number>();
    const displacements = new Map<string, any>();

    // Reconstruct rope chains to map chain tensions back to individual ropes
    const ropeChains = new Map<string, string>(); // ropeId -> chainId

    // Helper to find root of a rope in the union-find structure
    const findChain = (ropeId: string): string => {
        if (!ropeChains.has(ropeId)) {
            ropeChains.set(ropeId, ropeId);
        }
        if (ropeChains.get(ropeId) === ropeId) return ropeId;
        const root = findChain(ropeChains.get(ropeId)!);
        ropeChains.set(ropeId, root);
        return root;
    };

    // Helper to merge two chains
    const unionChains = (rope1: string, rope2: string) => {
        const root1 = findChain(rope1);
        const root2 = findChain(rope2);
        if (root1 !== root2) {
            ropeChains.set(root2, root1);
        }
    };

    // Initialize all ropes
    graph.edges.forEach(edge => {
        if (edge.type === 'rope') findChain(edge.id);
    });

    // Connect ropes passing over pulleys (same logic as builder)
    graph.nodes.forEach(node => {
        const pulleyComponent = system.components.find(c => c.id === node.id && (c.type === 'pulley' || c.type === 'pulley_becket'));
        if (pulleyComponent) {
            const connectedRopes: string[] = [];
            graph.edges.forEach(edge => {
                if (edge.type === 'rope' && (edge.startNodeId === node.id || edge.endNodeId === node.id)) {
                    connectedRopes.push(edge.id);
                }
            });
            if (connectedRopes.length === 2) {
                unionChains(connectedRopes[0], connectedRopes[1]);
            }
        }
    });

    // Map chain tensions to ropes
    solverResult.solution.forEach((value, index) => {
        const varName = eqSystem.unknowns[index];

        if (varName.startsWith('T_chain_')) {
            const chainId = varName.substring(8); // Remove 'T_chain_'

            // Find all ropes belonging to this chain
            graph.edges.forEach(edge => {
                if (edge.type === 'rope') {
                    const root = findChain(edge.id);
                    if (root === chainId) {
                        tensions.set(edge.id, value);

                        // Set segment tensions
                        const segments = graph.ropeSegments.get(edge.id);
                        if (segments) {
                            segments.forEach((_seg, segIdx) => {
                                segmentTensions.set(`${edge.id}_seg${segIdx}`, value);
                            });
                        }
                    }
                }
            });
        } else if (varName.startsWith('T_')) {
            // Fallback for non-chained ropes (if any)
            const ropeId = varName.substring(2);
            tensions.set(ropeId, value);
            const segments = graph.ropeSegments.get(ropeId);
            if (segments) {
                segments.forEach((_seg, segIdx) => {
                    segmentTensions.set(`${ropeId}_seg${segIdx}`, value);
                });
            }
        } else if (varName.startsWith('F_spring_')) {
            springForces.set(varName.substring(9), value);
        } else if (varName.startsWith('dx_') || varName.startsWith('dy_')) {
            const nodeId = varName.substring(3);
            if (!displacements.has(nodeId)) {
                displacements.set(nodeId, { x: 0, y: 0 });
            }
            if (varName.startsWith('dx_')) {
                displacements.get(nodeId).x = value;
            } else {
                displacements.get(nodeId).y = value;
            }
        }
    });

    // Calculate rope analysis
    const ropeSegmentAnalysis = new Map<string, RopeAnalysis>();
    graph.ropeSegments.forEach((segments, ropeId) => {
        const tension = tensions.get(ropeId) || 0;
        const totalLength = calculateTotalRopeLength(segments);
        const wrapsAroundPulleys = segments
            .filter(seg => seg.wrapsAroundPulleyId)
            .map(seg => seg.wrapsAroundPulleyId!);

        ropeSegmentAnalysis.set(ropeId, {
            ropeId,
            segments,
            totalLength,
            tension,
            wrapsAroundPulleys
        });
    });

    // Calculate total rope length
    let totalRopeLength = 0;
    ropeSegmentAnalysis.forEach(analysis => {
        totalRopeLength += analysis.totalLength;
    });

    // Calculate mechanical advantage
    const mechanicalAdvantage = calculateMechanicalAdvantage(
        system,
        tensions,
        ropeSegmentAnalysis
    );

    console.log('✅ PSAT SOLVER: Success!', {
        tensions: Array.from(tensions.entries()),
        mechanicalAdvantage
    });

    return {
        tensions,
        segmentTensions,
        springForces,
        reactionForces: new Map(),
        displacements,
        totalRopeLength,
        mechanicalAdvantage,
        ropeSegmentAnalysis,
        solved: true,
        error: solutionValidation.warnings.length > 0
            ? `Warning: ${solutionValidation.warnings.join(', ')}`
            : undefined,
        equationSystem: eqSystem
    };
}

/**
 * Create error result
 */
function createErrorResult(error: string): SolverResult {
    return {
        tensions: new Map(),
        segmentTensions: new Map(),
        springForces: new Map(),
        reactionForces: new Map(),
        displacements: new Map(),
        totalRopeLength: 0,
        ropeSegmentAnalysis: new Map(),
        solved: false,
        error
    };
}

/**
 * Calculate mechanical advantage of the system
 */
function calculateMechanicalAdvantage(
    system: SystemState,
    _tensions: Map<string, number>,
    ropeAnalysis: Map<string, RopeAnalysis>
): number | undefined {
    // Find input and output forces
    const masses = system.components.filter(c => c.type === 'mass');
    if (masses.length === 0) return undefined;

    // Simple calculation: count number of rope segments supporting the load
    let supportingSegments = 0;
    ropeAnalysis.forEach(analysis => {
        if (analysis.tension > 0) {
            supportingSegments += analysis.segments.filter(s => s.type === 'line').length;
        }
    });

    // Mechanical advantage approximation
    const pulleyCount = system.components.filter(c => c.type === 'pulley').length;
    return pulleyCount > 0 ? pulleyCount + 1 : undefined;
}

/**
 * Log equation system for debugging
 */
function logEquationSystem(eqSystem: any): void {
    console.log('📊 Equation System:');
    console.log('Unknowns:', eqSystem.unknowns);

    eqSystem.A.forEach((row: number[], i: number) => {
        const terms = row
            .map((coeff, j) => {
                if (Math.abs(coeff) < 0.001) return null;
                const sign = coeff >= 0 ? '+' : '';
                return `${sign}${coeff.toFixed(2)}·${eqSystem.unknowns[j]}`;
            })
            .filter(Boolean)
            .join(' ');

        console.log(`  Eq ${i}: ${terms} = ${eqSystem.b[i].toFixed(2)}`);
    });
}
