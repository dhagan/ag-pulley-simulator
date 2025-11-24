import { SystemState } from '../types';
import { buildGraph } from './graph-builder';

// Import all scenario JSON files
import scenario01 from '../../scenarios/scenario_01_simple_hanging_mass.json';
import scenario02 from '../../scenarios/scenario_02_atwood_machine.json';
import scenario03 from '../../scenarios/scenario_03_spring_mass.json';
import scenario04 from '../../scenarios/scenario_04_compound_pulley.json';
import scenario05 from '../../scenarios/scenario_05_y_configuration.json';
import scenario06 from '../../scenarios/scenario_06_spring_rope_combined.json';
import scenario07 from '../../scenarios/scenario_07_spring_pulley.json';
import scenario08 from '../../scenarios/scenario_08_pulley_becket.json';
import scenario09 from '../../scenarios/scenario_09_double_pulley.json';
import scenario10 from '../../scenarios/scenario_10_complex_network.json';

const scenarios = [
    scenario01,
    scenario02,
    scenario03,
    scenario04,
    scenario05,
    scenario06,
    scenario07,
    scenario08,
    scenario09,
    scenario10,
];

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
 * Load a scenario by number (1-10)
 */
export function loadScenarioByNumber(num: number): SystemState | null {
    if (num < 1 || num > scenarios.length) {
        return null;
    }
    return loadScenario(scenarios[num - 1]);
}

/**
 * Get scenario metadata
 */
export function getScenarioInfo(num: number) {
    const scenario = scenarios[num - 1];
    return scenario ? {
        name: scenario.name,
        description: scenario.description,
        version: scenario.version,
    } : null;
}
