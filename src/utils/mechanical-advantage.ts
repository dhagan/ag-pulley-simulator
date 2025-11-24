import { SystemState, Component, ComponentType, SolverResult } from '../types';

/**
 * Calculate mechanical advantage (purchase) for a pulley system
 * Mechanical Advantage = Load Force / Effort Force
 * 
 * For pulley systems:
 * - Simple fixed pulley: MA = 1 (changes direction only)
 * - Movable pulley: MA = 2
 * - Compound systems: MA = 2^n where n is number of supporting ropes
 */

export interface MechanicalAdvantageResult {
    mechanicalAdvantage: number;
    effortForce: number; // Force required to lift the load
    loadForce: number; // Weight of the load
    velocityRatio: number; // How much rope must be pulled to lift load 1 unit
    explanation: string;
    components: {
        loadMass?: Component;
        effortPoint?: Component;
        supportingRopes: number;
        pulleyConfiguration: string;
    };
}

/**
 * Calculate mechanical advantage for a pulley system
 * Identifies the load (heaviest mass) and effort point (rope connected to anchor)
 */
export function calculateMechanicalAdvantage(
    system: SystemState,
    solverResult: SolverResult
): MechanicalAdvantageResult | null {
    // Find all masses
    const masses = system.components.filter(c => c.type === ComponentType.MASS);
    if (masses.length === 0) {
        return null;
    }

    // Find the load (heaviest mass)
    const loadMass = masses.reduce((heaviest, current) => 
        current.type === ComponentType.MASS && heaviest.type === ComponentType.MASS
            ? (current.mass > heaviest.mass ? current : heaviest)
            : current
    );

    if (loadMass.type !== ComponentType.MASS) {
        return null;
    }

    const loadForce = loadMass.mass * system.gravity;

    // Find effort point - typically the rope connected to an anchor or where force is applied
    // Look for the rope with the least tension (effort rope)
    let effortRope: Component | null = null;
    let minTension = Infinity;

    system.components.forEach(c => {
        if (c.type === ComponentType.ROPE) {
            const tension = solverResult.tensions.get(c.id);
            if (tension !== undefined && tension < minTension) {
                // Check if this rope connects to an anchor (effort point)
                const startComp = system.components.find(comp => comp.id === c.startNodeId);
                const endComp = system.components.find(comp => comp.id === c.endNodeId);
                
                if (startComp?.type === ComponentType.ANCHOR || endComp?.type === ComponentType.ANCHOR) {
                    minTension = tension;
                    effortRope = c;
                }
            }
        }
    });

    // Count supporting ropes (ropes directly connected to the load)
    const ropesSupportingLoad = system.components.filter(c => {
        if (c.type !== ComponentType.ROPE) return false;
        return c.startNodeId === loadMass.id || c.endNodeId === loadMass.id;
    }).length;

    // Estimate mechanical advantage
    let mechanicalAdvantage: number;
    let explanation: string;
    let pulleyConfiguration: string;

    // Count fixed and movable pulleys
    const fixedPulleys = system.components.filter(c => 
        (c.type === ComponentType.PULLEY || c.type === ComponentType.PULLEY_BECKET) && 
        'fixed' in c && c.fixed
    ).length;

    const movablePulleys = system.components.filter(c => 
        c.type === ComponentType.SPRING_PULLEY || c.type === ComponentType.SPRING_PULLEY_BECKET
    ).length;

    if (ropesSupportingLoad === 0) {
        mechanicalAdvantage = 1;
        explanation = "No mechanical advantage - no rope system detected";
        pulleyConfiguration = "None";
    } else if (ropesSupportingLoad === 1 && fixedPulleys === 1 && movablePulleys === 0) {
        mechanicalAdvantage = 1;
        explanation = "Simple fixed pulley: Changes direction only, MA = 1";
        pulleyConfiguration = "Fixed pulley";
    } else {
        // Calculate based on number of supporting ropes
        mechanicalAdvantage = ropesSupportingLoad;
        
        if (movablePulleys > 0) {
            pulleyConfiguration = `${fixedPulleys} fixed, ${movablePulleys} movable pulley(s)`;
            explanation = `Compound system with ${ropesSupportingLoad} supporting ropes, MA ≈ ${mechanicalAdvantage}`;
        } else {
            pulleyConfiguration = `${fixedPulleys} fixed pulley(s)`;
            explanation = `${ropesSupportingLoad} supporting ropes, MA ≈ ${mechanicalAdvantage}`;
        }
    }

    const effortForce = effortRope && minTension !== Infinity ? minTension : loadForce / mechanicalAdvantage;
    const velocityRatio = mechanicalAdvantage; // For ideal pulleys, VR = MA

    return {
        mechanicalAdvantage,
        effortForce,
        loadForce,
        velocityRatio,
        explanation,
        components: {
            loadMass,
            effortPoint: effortRope || undefined,
            supportingRopes: ropesSupportingLoad,
            pulleyConfiguration,
        },
    };
}

/**
 * Calculate ideal mechanical advantage for common pulley configurations
 */
export function getIdealMechanicalAdvantage(config: string): number {
    const configs: Record<string, number> = {
        'fixed': 1,
        'movable': 2,
        'block_and_tackle_2': 2,
        'block_and_tackle_3': 3,
        'block_and_tackle_4': 4,
        'compound_2': 4, // 2 movable pulleys
        'compound_3': 6, // 3 movable pulleys
    };
    return configs[config] || 1;
}
