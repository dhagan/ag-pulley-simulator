import { describe, it, expect } from 'vitest';
import { validatePhysicsConstraints } from '../../utils/physics-validation';
import { SystemState, ComponentType } from '../../types';

describe('Physics Validation - Scenarios', () => {
    it('All scenario JSON files should have no physics warnings', () => {
        // Test each scenario to ensure no physics warnings
        const scenarios = [
            {
                name: 'Scenario 1: Simple hanging mass',
                system: {
                    gravity: 9.81,
                    components: [
                        { id: 'anchor1', type: ComponentType.ANCHOR, position: { x: 0, y: -200 }, fixed: true },
                        { id: 'mass1', type: ComponentType.MASS, position: { x: 0, y: 0 }, mass: 10 },
                        { id: 'rope1', type: ComponentType.ROPE, position: { x: 0, y: -100 }, startNodeId: 'anchor1', endNodeId: 'mass1', length: 200, segments: [] },
                    ]
                }
            },
            {
                name: 'Scenario 2: Atwood machine',
                system: {
                    gravity: 9.81,
                    components: [
                        { id: 'pulley1', type: ComponentType.PULLEY, position: { x: 0, y: 0 }, radius: 30, fixed: true },
                        { id: 'mass1', type: ComponentType.MASS, position: { x: 0, y: 200 }, mass: 5 },
                        { id: 'mass2', type: ComponentType.MASS, position: { x: 0, y: 300 }, mass: 10 },
                        { id: 'rope1', type: ComponentType.ROPE, position: { x: 0, y: 100 }, startNodeId: 'pulley1', endNodeId: 'mass1', length: 200, segments: [] },
                        { id: 'rope2', type: ComponentType.ROPE, position: { x: 0, y: 250 }, startNodeId: 'mass1', endNodeId: 'mass2', length: 100, segments: [] },
                    ]
                }
            },
            {
                name: 'Scenario 3: Spring and mass',
                system: {
                    gravity: 9.81,
                    components: [
                        { id: 'anchor1', type: ComponentType.ANCHOR, position: { x: 0, y: -200 }, fixed: true },
                        { id: 'mass1', type: ComponentType.MASS, position: { x: 0, y: 0 }, mass: 5 },
                        { id: 'spring1', type: ComponentType.SPRING, position: { x: 0, y: -100 }, startNodeId: 'anchor1', endNodeId: 'mass1', restLength: 150, stiffness: 100, currentLength: 200 },
                    ]
                }
            },
            {
                name: 'Scenario 7: Three masses in series',
                system: {
                    gravity: 9.81,
                    components: [
                        { id: 'anchor1', type: ComponentType.ANCHOR, position: { x: 0, y: -200 }, fixed: true },
                        { id: 'mass1', type: ComponentType.MASS, position: { x: 0, y: -50 }, mass: 3 },
                        { id: 'mass2', type: ComponentType.MASS, position: { x: 0, y: 50 }, mass: 5 },
                        { id: 'mass3', type: ComponentType.MASS, position: { x: 0, y: 150 }, mass: 7 },
                        { id: 'rope1', type: ComponentType.ROPE, position: { x: 0, y: -125 }, startNodeId: 'anchor1', endNodeId: 'mass1', length: 150, segments: [] },
                        { id: 'rope2', type: ComponentType.ROPE, position: { x: 0, y: 0 }, startNodeId: 'mass1', endNodeId: 'mass2', length: 100, segments: [] },
                        { id: 'rope3', type: ComponentType.ROPE, position: { x: 0, y: 100 }, startNodeId: 'mass2', endNodeId: 'mass3', length: 100, segments: [] },
                    ]
                }
            },
            {
                name: 'Scenario 9: Double pulley',
                system: {
                    gravity: 9.81,
                    components: [
                        { id: 'pulley1', type: ComponentType.PULLEY, position: { x: -100, y: -200 }, radius: 30, fixed: true },
                        { id: 'pulley2', type: ComponentType.PULLEY, position: { x: 100, y: -200 }, radius: 30, fixed: true },
                        { id: 'mass1', type: ComponentType.MASS, position: { x: -100, y: 150 }, mass: 6 },
                        { id: 'mass2', type: ComponentType.MASS, position: { x: 100, y: 150 }, mass: 9 },
                        { id: 'rope1', type: ComponentType.ROPE, position: { x: -100, y: -50 }, startNodeId: 'mass1', endNodeId: 'pulley1', length: 300, segments: [] },
                        { id: 'rope2', type: ComponentType.ROPE, position: { x: 100, y: -50 }, startNodeId: 'pulley2', endNodeId: 'mass2', length: 300, segments: [] },
                    ]
                }
            },
            {
                name: 'Scenario 10: Complex network',
                system: {
                    gravity: 9.81,
                    components: [
                        { id: 'pulley1', type: ComponentType.PULLEY, position: { x: 0, y: -100 }, radius: 30, fixed: true },
                        { id: 'mass1', type: ComponentType.MASS, position: { x: -100, y: 100 }, mass: 10 },
                        { id: 'mass2', type: ComponentType.MASS, position: { x: 0, y: 150 }, mass: 8 },
                        { id: 'anchor1', type: ComponentType.ANCHOR, position: { x: -100, y: -150 }, fixed: true },
                        { id: 'spring1', type: ComponentType.SPRING, position: { x: -100, y: -50 }, startNodeId: 'anchor1', endNodeId: 'mass1', restLength: 150, stiffness: 60, currentLength: 200 },
                        { id: 'rope1', type: ComponentType.ROPE, position: { x: 0, y: 0 }, startNodeId: 'mass2', endNodeId: 'pulley1', length: 200, segments: [] },
                    ]
                }
            }
        ];

        scenarios.forEach(scenario => {
            const warnings = validatePhysicsConstraints(scenario.system as SystemState);
            
            // Filter out only error-level warnings (not info)
            const errors = warnings.filter(w => w.severity === 'error' || w.severity === 'warning');
            
            if (errors.length > 0) {
                console.error(`${scenario.name} has physics warnings:`, errors.map(w => w.message));
            }
            
            expect(errors.length).toBe(0);
        });
    });

    it('Should detect non-vertical rope from mass to pulley', () => {
        const system = {
            gravity: 9.81,
            components: [
                { id: 'pulley1', type: ComponentType.PULLEY, position: { x: 0, y: 0 }, radius: 30, fixed: true },
                { id: 'mass1', type: ComponentType.MASS, position: { x: 100, y: 100 }, mass: 10 },
                { id: 'rope1', type: ComponentType.ROPE, position: { x: 50, y: 50 }, startNodeId: 'mass1', endNodeId: 'pulley1', length: 141, segments: [] },
            ]
        } as SystemState;

        const warnings = validatePhysicsConstraints(system);
        expect(warnings.length).toBeGreaterThan(0);
        expect(warnings.some(w => w.message.includes('from vertical'))).toBe(true);
    });

    it('Should not warn for vertical ropes', () => {
        const system = {
            gravity: 9.81,
            components: [
                { id: 'anchor1', type: ComponentType.ANCHOR, position: { x: 0, y: 0 }, fixed: true },
                { id: 'mass1', type: ComponentType.MASS, position: { x: 0, y: 200 }, mass: 10 },
                { id: 'rope1', type: ComponentType.ROPE, position: { x: 0, y: 100 }, startNodeId: 'anchor1', endNodeId: 'mass1', length: 200, segments: [] },
            ]
        } as SystemState;

        const warnings = validatePhysicsConstraints(system);
        const verticalWarnings = warnings.filter(w => w.message.includes('from vertical'));
        expect(verticalWarnings.length).toBe(0);
    });

    it('Should allow slightly angled ropes (< 5 degrees)', () => {
        const system = {
            gravity: 9.81,
            components: [
                { id: 'pulley1', type: ComponentType.PULLEY, position: { x: 0, y: 0 }, radius: 30, fixed: true },
                { id: 'mass1', type: ComponentType.MASS, position: { x: 5, y: 100 }, mass: 10 }, // ~2.9 degrees
                { id: 'rope1', type: ComponentType.ROPE, position: { x: 2.5, y: 50 }, startNodeId: 'pulley1', endNodeId: 'mass1', length: 100, segments: [] },
            ]
        } as SystemState;

        const warnings = validatePhysicsConstraints(system);
        const verticalWarnings = warnings.filter(w => w.message.includes('from vertical'));
        expect(verticalWarnings.length).toBe(0);
    });
});
