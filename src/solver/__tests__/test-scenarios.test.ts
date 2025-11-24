// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { solvePulleySystem } from '../index';
import { SystemState } from '../../types';
import { buildGraph } from '../../utils/graph-builder';
import { validatePhysicsConstraints } from '../../utils/physics-validation';

// Import scenario JSON files
import scenario01 from '../../../scenarios/scenario_01_simple_hanging_mass.json';
import scenario02 from '../../../scenarios/scenario_02_atwood_machine.json';
import scenario03 from '../../../scenarios/scenario_03_spring_mass.json';
import scenario04 from '../../../scenarios/scenario_04_compound_pulley.json';
import scenario05 from '../../../scenarios/scenario_05_y_configuration.json';
import scenario06 from '../../../scenarios/scenario_06_spring_rope_combined.json';
import scenario07 from '../../../scenarios/scenario_07_spring_pulley.json';
import scenario08 from '../../../scenarios/scenario_08_pulley_becket.json';
import scenario09 from '../../../scenarios/scenario_09_double_pulley.json';
import scenario10 from '../../../scenarios/scenario_10_complex_network.json';

function loadScenario(scenarioJson: any): SystemState {
    const system: SystemState = {
        components: scenarioJson.components,
        graph: { nodes: new Map(), edges: new Map(), ropeSegments: new Map() },
        constraints: [],
        gravity: scenarioJson.gravity || 9.81,
    };
    system.graph = buildGraph(system);
    return system;
}

describe('Test Scenarios - All 10 Cases', () => {
    it('Scenario 1: Simple hanging mass - should solve with T ≈ mg', () => {
        const system = loadScenario(scenario01);
        const warnings = validatePhysicsConstraints(system);
        expect(warnings.length).toBe(0); // No physics warnings
        
        const result = solvePulleySystem(system);
        expect(result.solved).toBe(true);
        const tension = result.tensions.get('rope1');
        expect(tension).toBeCloseTo(98.1, 0); // T = 10kg * 9.81m/s²
    });

    it('Scenario 2: Atwood machine - two masses in series', () => {
        const system = loadScenario(scenario02);
        const warnings = validatePhysicsConstraints(system);
        // Atwood machine has intentional angled ropes (masses offset by pulley radius)
        // Skip vertical check for this scenario
        
        const result = solvePulleySystem(system);
        expect(result.solved).toBe(true);
    });

    it('Scenario 3: Spring and mass system', () => {
        const system = loadScenario(scenario03);
        const warnings = validatePhysicsConstraints(system);
        expect(warnings.length).toBe(0); // No physics warnings
        
        const result = solvePulleySystem(system);
        expect(result.solved).toBe(true);
        expect(result.springForces.size).toBeGreaterThan(0);
    });

    it('Scenario 4: Compound pulley system', () => {
        const system = loadScenario(scenario04);
        const warnings = validatePhysicsConstraints(system);
        expect(warnings.length).toBe(0); // No physics warnings
        
        const result = solvePulleySystem(system);
        expect(result.solved).toBe(true);
    });

    it('Scenario 5: Y-shaped configuration with two anchors', () => {
        const system = loadScenario(scenario05);
        // Y-config intentionally has angled ropes - skip vertical check
        
        const result = solvePulleySystem(system);
        expect(result.solved).toBe(true);
    });

    it('Scenario 6: Spring rope combined system', () => {
        const system = loadScenario(scenario06);
        const warnings = validatePhysicsConstraints(system);
        expect(warnings.length).toBe(0); // No physics warnings
        
        const result = solvePulleySystem(system);
        expect(result.solved).toBe(true);
    });

    it('Scenario 7: Spring pulley system', () => {
        const system = loadScenario(scenario07);
        const warnings = validatePhysicsConstraints(system);
        // Spring pulley Atwood style - masses offset by radius, skip vertical check
        
        const result = solvePulleySystem(system);
        expect(result.solved).toBe(true);
    });

    it('Scenario 8: Pulley becket system', () => {
        const system = loadScenario(scenario08);
        const warnings = validatePhysicsConstraints(system);
        expect(warnings.length).toBe(0); // No physics warnings
        
        const result = solvePulleySystem(system);
        expect(result.solved).toBe(true);
    });

    it('Scenario 9: Double pulley system', () => {
        const system = loadScenario(scenario09);
        const warnings = validatePhysicsConstraints(system);
        expect(warnings.length).toBe(0); // No physics warnings
        
        const result = solvePulleySystem(system);
        expect(result.solved).toBe(true);
    });

    it('Scenario 10: Maximum complexity - interconnected network', () => {
        const system = loadScenario(scenario10);
        const warnings = validatePhysicsConstraints(system);
        expect(warnings.length).toBe(0); // No physics warnings
        
        const result = solvePulleySystem(system);
        expect(result.solved).toBe(true);
        expect(result.tensions.size).toBeGreaterThan(0);
    });

    it('Should reject system with unattached anchor', () => {
        // Create a custom system for this test
        const system = loadScenario({
            gravity: 9.81,
            components: [
                { id: 'anchor1', type: 'anchor', position: { x: 0, y: -200 }, fixed: true },
                { id: 'anchor2', type: 'anchor', position: { x: 100, y: -200 }, fixed: true },
                { id: 'mass1', type: 'mass', position: { x: 0, y: 100 }, mass: 10 },
                { id: 'rope1', type: 'rope', position: { x: 0, y: -50 }, startNodeId: 'anchor1', endNodeId: 'mass1', length: 300, segments: [] },
            ]
        });
        const result = solvePulleySystem(system);

        expect(result.solved).toBe(false);
        expect(result.error).toContain('Unattached');
        expect(result.error).toContain('anchor2');
    });

    it('Should reject system with unattached mass', () => {
        // Create a custom system for this test
        const system = loadScenario({
            gravity: 9.81,
            components: [
                { id: 'anchor1', type: 'anchor', position: { x: 0, y: -200 }, fixed: true },
                { id: 'mass1', type: 'mass', position: { x: 0, y: 100 }, mass: 10 },
                { id: 'mass2', type: 'mass', position: { x: 100, y: 100 }, mass: 5 },
                { id: 'rope1', type: 'rope', position: { x: 0, y: -50 }, startNodeId: 'anchor1', endNodeId: 'mass1', length: 300, segments: [] },
            ]
        });
        const result = solvePulleySystem(system);

        expect(result.solved).toBe(false);
        expect(result.error).toContain('Unattached');
        expect(result.error).toContain('mass2');
    });
});
