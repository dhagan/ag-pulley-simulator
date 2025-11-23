import { SystemState, SolverResult, RopeAnalysis } from '../../types';
import { buildGraph, validateGraph } from '../../utils/graph-builder';
import { buildEquationSystem, validateEquationSystem } from './equation-builder';
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
    const graphValidation = validateGraph(graph);
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

    solverResult.solution.forEach((value, index) => {
        const varName = eqSystem.unknowns[index];
        if (varName.startsWith('T_')) {
            const ropeId = varName.substring(2);
            tensions.set(ropeId, value);
            
            // All segments of this rope have the same tension
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
