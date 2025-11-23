// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { buildEquationSystem, validateEquationSystem } from '../equation-builder';
import { ComponentType, SystemState } from '../../types';

describe('Equation Builder', () => {
    it('generates equations for simple hanging mass', () => {
        const system: SystemState = {
            components: [
                {
                    id: 'anchor1',
                    type: ComponentType.ANCHOR,
                    position: { x: 0, y: -200 },
                    fixed: true,
                },
                {
                    id: 'mass1',
                    type: ComponentType.MASS,
                    position: { x: 0, y: 100 },
                    mass: 10,
                },
                {
                    id: 'rope1',
                    type: ComponentType.ROPE,
                    position: { x: 0, y: -50 },
                    startNodeId: 'anchor1',
                    endNodeId: 'mass1',
                    length: 300,
                    segments: [],
                },
            ],
            graph: {
                nodes: new Map([
                    ['anchor1', { id: 'anchor1', componentId: 'anchor1', position: { x: 0, y: -200 }, isFixed: true, mass: 0 }],
                    ['mass1', { id: 'mass1', componentId: 'mass1', position: { x: 0, y: 100 }, isFixed: false, mass: 10 }],
                ]),
                edges: new Map([
                    ['rope1', { id: 'rope1', startNodeId: 'anchor1', endNodeId: 'mass1', type: 'rope', length: 300 }],
                ]),
                ropeSegments: new Map(),
            },
            constraints: [],
            gravity: 9.81,
        };

        const eqSystem = buildEquationSystem(system.graph, system);

        expect(eqSystem.unknowns).toEqual(['T_rope1']);
        expect(eqSystem.A.length).toBeGreaterThan(0);
        expect(eqSystem.b.length).toEqual(eqSystem.A.length);
    });

    it('validates square equation system', () => {
        const eqSystem = {
            A: [[1, 0], [0, 1]],
            b: [10, 20],
            unknowns: ['T1', 'T2'],
        };

        const validation = validateEquationSystem(eqSystem);
        expect(validation.valid).toBe(true);
    });

    it('rejects underdetermined system', () => {
        const eqSystem = {
            A: [[1, 0]],
            b: [10],
            unknowns: ['T1', 'T2'],
        };

        const validation = validateEquationSystem(eqSystem);
        expect(validation.valid).toBe(false);
        expect(validation.error).toContain('Underdetermined');
    });

    it('generates pulley constraint for fixed pulley', () => {
        const system: SystemState = {
            components: [
                {
                    id: 'pulley1',
                    type: ComponentType.PULLEY,
                    position: { x: 0, y: -200 },
                    radius: 30,
                    fixed: true,
                },
                {
                    id: 'mass1',
                    type: ComponentType.MASS,
                    position: { x: -150, y: 100 },
                    mass: 5,
                },
                {
                    id: 'mass2',
                    type: ComponentType.MASS,
                    position: { x: 150, y: 100 },
                    mass: 10,
                },
                {
                    id: 'rope1',
                    type: ComponentType.ROPE,
                    position: { x: 0, y: 0 },
                    startNodeId: 'mass1',
                    endNodeId: 'pulley1',
                    length: 200,
                    segments: [],
                },
                {
                    id: 'rope2',
                    type: ComponentType.ROPE,
                    position: { x: 0, y: 0 },
                    startNodeId: 'pulley1',
                    endNodeId: 'mass2',
                    length: 200,
                    segments: [],
                },
            ],
            graph: {
                nodes: new Map([
                    ['pulley1', { id: 'pulley1', componentId: 'pulley1', position: { x: 0, y: -200 }, isFixed: true, mass: 0 }],
                    ['mass1', { id: 'mass1', componentId: 'mass1', position: { x: -150, y: 100 }, isFixed: false, mass: 5 }],
                    ['mass2', { id: 'mass2', componentId: 'mass2', position: { x: 150, y: 100 }, isFixed: false, mass: 10 }],
                ]),
                edges: new Map([
                    ['rope1', { id: 'rope1', startNodeId: 'mass1', endNodeId: 'pulley1', type: 'rope', length: 200 }],
                    ['rope2', { id: 'rope2', startNodeId: 'pulley1', endNodeId: 'mass2', type: 'rope', length: 200 }],
                ]),
                ropeSegments: new Map(),
            },
            constraints: [],
            gravity: 9.81,
        };

        const eqSystem = buildEquationSystem(system.graph, system);

        // Should have T1 and T2 as unknowns
        expect(eqSystem.unknowns).toContain('T_rope1');
        expect(eqSystem.unknowns).toContain('T_rope2');
        
        // Should have constraint equation T1 - T2 = 0
        const constraintEq = eqSystem.A.find((row, idx) => 
            row.every((val, i) => 
                (i === 0 && val === 1) || 
                (i === 1 && val === -1) || 
                val === 0
            ) && eqSystem.b[idx] === 0
        );
        expect(constraintEq).toBeDefined();
    });
});
