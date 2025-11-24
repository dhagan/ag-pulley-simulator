import { SystemState } from '../types';
import { buildGraph } from './graph-builder';

// Dynamically import all scenario JSON files (any .json in scenarios folder)
const scenarioModules = import.meta.glob('../../scenarios/*.json');

// Cache loaded scenarios
const scenarioCache = new Map<number, any>();

/**
 * Load a scenario from JSON and convert to SystemState
 */
export function loadScenario(scenarioJson: any): SystemState {
    const system: SystemState = {
        components: scenarioJson.components,
        graph: { nodes: new Map(), edges: new Map(), ropeSegments: new Map() },
        constraints: [],
        gravity: scenarioJson.gravity || 9.81,
    };
    system.graph = buildGraph(system);
    return system;
}

/**
 * Load a scenario by number (1-N) - dynamically loaded
 */
export async function loadScenarioByNumber(num: number): Promise<SystemState | null> {
    // Check cache first
    if (scenarioCache.has(num)) {
        return loadScenario(scenarioCache.get(num));
    }

    // Get all paths sorted
    const paths = Object.keys(scenarioModules).sort();
    
    // Get the nth scenario (1-indexed)
    const scenarioPath = paths[num - 1];
    
    if (!scenarioPath) {
        console.warn(`Scenario ${num} not found (only ${paths.length} scenarios available)`);
        return null;
    }

    try {
        const module = await scenarioModules[scenarioPath]() as any;
        scenarioCache.set(num, module);
        return loadScenario(module);
    } catch (error) {
        console.error(`Failed to load scenario ${num}:`, error);
        return null;
    }
}

/**
 * Get scenario metadata
 */
export async function getScenarioInfo(num: number) {
    const paths = Object.keys(scenarioModules).sort();
    const scenarioPath = paths[num - 1];

    if (!scenarioPath) return null;

    try {
        const module = await scenarioModules[scenarioPath]() as any;
        return {
            name: module.name,
            description: module.description,
            version: module.version,
        };
    } catch {
        return null;
    }
}

/**
 * Get list of all available scenario numbers
 */
export function getAvailableScenarios(): number[] {
    const count = Object.keys(scenarioModules).length;
    return Array.from({ length: count }, (_, i) => i + 1);
}
