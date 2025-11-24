import { create } from 'zustand';
import {
    Component,
    SystemState,
    Tool,
    UIState,
    SolverResult,
    ComponentType,
    Anchor,
    Pulley,
    Mass,
    Rope,
} from '../types';
import { generateId, distance } from '../utils/math';
import { buildGraph } from '../utils/graph-builder';
import { solvePulleySystem } from '../modules/solver';

interface SystemStore {
    system: SystemState;
    solverResult: SolverResult | null;
    history: SystemState[];
    ui: UIState;
    ropeStartNodeId: string | null;

    addComponent: (component: Component) => void;
    removeComponent: (id: string) => void;
    updateComponent: (id: string, updates: Partial<Component>) => void;
    selectComponent: (id: string | null) => void;
    setTool: (tool: Tool) => void;
    setZoom: (zoom: number) => void;
    setViewBox: (x: number, y: number, width: number, height: number) => void;
    toggleGrid: () => void;
    toggleSnapToGrid: () => void;
    toggleShowForces: () => void;
    toggleFBD: () => void;
    toggleLabels: () => void;
    setRopeStartNode: (nodeId: string | null) => void;
    updateGraph: () => void;
    solve: () => void;
    reset: () => void;
    undo: () => void;
    createTestSystem: () => void;
    createSimpleTest: () => void;
    createTestScenario: (scenarioNum: number) => void;
}

const initialSystemState: SystemState = {
    components: [],
    graph: { nodes: new Map(), edges: new Map(), ropeSegments: new Map() },
    constraints: [],
    gravity: 9.81,
};

const initialUIState: UIState = {
    currentTool: Tool.SELECT,
    selectedComponentId: null,
    canvas: {
        viewBox: { x: -400, y: -300, width: 800, height: 600 },
        gridSize: 20,
        snapToGrid: true,
        zoom: 1,
    },
    showGrid: true,
    showForces: true,
    showFBD: false,
    showLabels: true,
    animationEnabled: false,
};

export const useSystemStore = create<SystemStore>((set, get) => ({
    system: initialSystemState,
    solverResult: null,
    history: [],
    ui: initialUIState,
    ropeStartNodeId: null,

    addComponent: (component) => {
        set((state) => ({
            history: [...state.history, state.system],
            system: { ...state.system, components: [...state.system.components, component] },
        }));
        get().updateGraph();
    },

    removeComponent: (id) => {
        set((state) => ({
            history: [...state.history, state.system],
            system: { ...state.system, components: state.system.components.filter((c) => c.id !== id) },
            ui: { ...state.ui, selectedComponentId: state.ui.selectedComponentId === id ? null : state.ui.selectedComponentId },
        }));
        get().updateGraph();
    },

    updateComponent: (id, updates) => {
        set((state) => ({
            history: [...state.history, state.system],
            system: { ...state.system, components: state.system.components.map((c) => c.id === id ? { ...c, ...updates } as Component : c) },
        }));
        get().updateGraph();
    },

    selectComponent: (id) => set((state) => ({ ui: { ...state.ui, selectedComponentId: id } })),

    setTool: (tool) => set((state) => ({ ui: { ...state.ui, currentTool: tool }, ropeStartNodeId: null })),

    setZoom: (zoom) => set((state) => ({ ui: { ...state.ui, canvas: { ...state.ui.canvas, zoom: Math.max(0.1, Math.min(5, zoom)) } } })),

    setViewBox: (x, y, width, height) => set((state) => ({ ui: { ...state.ui, canvas: { ...state.ui.canvas, viewBox: { x, y, width, height } } } })),

    toggleGrid: () => set((state) => ({ ui: { ...state.ui, showGrid: !state.ui.showGrid } })),

    toggleSnapToGrid: () => set((state) => ({ ui: { ...state.ui, canvas: { ...state.ui.canvas, snapToGrid: !state.ui.canvas.snapToGrid } } })),

    toggleShowForces: () => set((state) => ({ ui: { ...state.ui, showForces: !state.ui.showForces } })),

    toggleFBD: () => set((state) => ({ ui: { ...state.ui, showFBD: !state.ui.showFBD } })),

    toggleLabels: () => set((state) => ({ ui: { ...state.ui, showLabels: !state.ui.showLabels } })),

    setRopeStartNode: (nodeId) => set({ ropeStartNodeId: nodeId }),

    updateGraph: () => {
        set((state) => ({ system: { ...state.system, graph: buildGraph(get().system) } }));
    },

    solve: () => {
        console.log('🔍 SOLVE: Starting...');
        get().updateGraph();
        const system = get().system;
        console.log('🔍 Components:', system.components.map(c => ({ id: c.id, type: c.type })));
        const result = solvePulleySystem(system);
        console.log('🔍 Result:', { solved: result.solved, error: result.error, tensions: Array.from(result.tensions.entries()) });
        set({ solverResult: result });
        if (result.solved) {
            console.log('✅ Solved!');
        } else {
            console.error('❌ Failed:', result.error);
        }
    },

    undo: () => {
        set((state) => {
            const history = [...state.history];
            const prev = history.pop();
            return prev ? { system: prev, history, solverResult: null } : state;
        });
    },

    createTestScenario: (scenarioNum: number) => {
        const scenarios = [
            // Scenario 1: Simple hanging mass
            () => {
                const components: Component[] = [
                    { id: generateId('anchor'), type: ComponentType.ANCHOR, position: { x: 0, y: -200 }, fixed: true },
                    { id: generateId('mass'), type: ComponentType.MASS, position: { x: 0, y: 100 }, mass: 10 },
                ];
                const anchor = components[0];
                const mass = components[1];
                components.push({
                    id: generateId('rope'),
                    type: ComponentType.ROPE,
                    position: { x: 0, y: -50 },
                    startNodeId: anchor.id,
                    endNodeId: mass.id,
                    length: 300,
                    segments: [{ start: anchor.position, end: mass.position, type: 'line', length: 300 }],
                });
                return components;
            },
            // Scenario 2: Atwood machine (two masses over fixed pulley)
            () => {
                const components: Component[] = [
                    { id: generateId('pulley'), type: ComponentType.PULLEY, position: { x: 0, y: -200 }, radius: 30, fixed: true },
                    { id: generateId('mass'), type: ComponentType.MASS, position: { x: -150, y: 100 }, mass: 5 },
                    { id: generateId('mass'), type: ComponentType.MASS, position: { x: 150, y: 100 }, mass: 10 },
                ];
                const pulley = components[0];
                const mass1 = components[1];
                const mass2 = components[2];
                components.push(
                    { id: generateId('rope'), type: ComponentType.ROPE, position: { x: -75, y: -50 }, startNodeId: mass1.id, endNodeId: pulley.id, length: 200, segments: [] },
                    { id: generateId('rope'), type: ComponentType.ROPE, position: { x: 75, y: -50 }, startNodeId: pulley.id, endNodeId: mass2.id, length: 200, segments: [] }
                );
                return components;
            },
            // Scenario 3: Spring and mass system
            () => {
                const components: Component[] = [
                    { id: generateId('anchor'), type: ComponentType.ANCHOR, position: { x: 0, y: -200 }, fixed: true },
                    { id: generateId('mass'), type: ComponentType.MASS, position: { x: 0, y: 0 }, mass: 5 },
                ];
                const anchor = components[0];
                const mass = components[1];
                components.push({
                    id: generateId('spring'),
                    type: ComponentType.SPRING,
                    position: { x: 0, y: -100 },
                    startNodeId: anchor.id,
                    endNodeId: mass.id,
                    restLength: 150,
                    stiffness: 100,
                    currentLength: 200,
                });
                return components;
            },
            // Scenario 4: Two masses on spring
            () => {
                const components: Component[] = [
                    { id: generateId('anchor'), type: ComponentType.ANCHOR, position: { x: 0, y: -200 }, fixed: true },
                    { id: generateId('mass'), type: ComponentType.MASS, position: { x: 0, y: 0 }, mass: 8 },
                    { id: generateId('mass'), type: ComponentType.MASS, position: { x: 0, y: 150 }, mass: 12 },
                ];
                const anchor = components[0];
                const mass1 = components[1];
                const mass2 = components[2];
                components.push(
                    { id: generateId('spring'), type: ComponentType.SPRING, position: { x: 0, y: -100 }, startNodeId: anchor.id, endNodeId: mass1.id, restLength: 150, stiffness: 100, currentLength: 200 },
                    { id: generateId('rope'), type: ComponentType.ROPE, position: { x: 0, y: 75 }, startNodeId: mass1.id, endNodeId: mass2.id, length: 150, segments: [] }
                );
                return components;
            },
            // Scenario 5: Y-shaped configuration
            () => {
                const components: Component[] = [
                    { id: generateId('anchor'), type: ComponentType.ANCHOR, position: { x: -150, y: -200 }, fixed: true },
                    { id: generateId('anchor'), type: ComponentType.ANCHOR, position: { x: 150, y: -200 }, fixed: true },
                    { id: generateId('mass'), type: ComponentType.MASS, position: { x: 0, y: 100 }, mass: 15 },
                ];
                const anchor1 = components[0];
                const anchor2 = components[1];
                const mass = components[2];
                components.push(
                    { id: generateId('rope'), type: ComponentType.ROPE, position: { x: -75, y: -50 }, startNodeId: anchor1.id, endNodeId: mass.id, length: 250, segments: [] },
                    { id: generateId('rope'), type: ComponentType.ROPE, position: { x: 75, y: -50 }, startNodeId: anchor2.id, endNodeId: mass.id, length: 250, segments: [] }
                );
                return components;
            },
            // Scenario 6: Horizontal force application
            () => {
                const components: Component[] = [
                    { id: generateId('anchor'), type: ComponentType.ANCHOR, position: { x: -200, y: 0 }, fixed: true },
                    { id: generateId('mass'), type: ComponentType.MASS, position: { x: 0, y: 0 }, mass: 8 },
                ];
                const anchor = components[0];
                const mass = components[1];
                components.push(
                    { id: generateId('rope'), type: ComponentType.ROPE, position: { x: -100, y: 0 }, startNodeId: anchor.id, endNodeId: mass.id, length: 200, segments: [] },
                    { id: generateId('force'), type: ComponentType.FORCE_VECTOR, position: { x: 0, y: 0 }, Fx: 50, Fy: 0, appliedToNodeId: mass.id }
                );
                return components;
            },
            // Scenario 7: Spring Pulley with two masses
            () => {
                const components: Component[] = [
                    { id: generateId('spring_pulley'), type: ComponentType.SPRING_PULLEY, position: { x: 0, y: 0 }, radius: 30, stiffness: 50, restLength: 100, currentLength: 100, axis: 'vertical' },
                    { id: generateId('mass'), type: ComponentType.MASS, position: { x: -100, y: 150 }, mass: 8 },
                    { id: generateId('mass'), type: ComponentType.MASS, position: { x: 100, y: 150 }, mass: 12 },
                ];
                const springPulley = components[0];
                const mass1 = components[1];
                const mass2 = components[2];
                components.push(
                    { id: generateId('rope'), type: ComponentType.ROPE, position: { x: -50, y: 75 }, startNodeId: mass1.id, endNodeId: springPulley.id, length: 180, segments: [] },
                    { id: generateId('rope'), type: ComponentType.ROPE, position: { x: 50, y: 75 }, startNodeId: springPulley.id, endNodeId: mass2.id, length: 180, segments: [] }
                );
                return components;
            },
            // Scenario 8: Pulley with becket
            () => {
                const components: Component[] = [
                    { id: generateId('pulley_becket'), type: ComponentType.PULLEY_BECKET, position: { x: 0, y: -100 }, radius: 30, fixed: true },
                    { id: generateId('mass'), type: ComponentType.MASS, position: { x: -80, y: 100 }, mass: 10 },
                    { id: generateId('mass'), type: ComponentType.MASS, position: { x: 80, y: 100 }, mass: 8 },
                ];
                const pulleyBecket = components[0];
                const mass1 = components[1];
                const mass2 = components[2];
                components.push(
                    { id: generateId('rope'), type: ComponentType.ROPE, position: { x: -40, y: 0 }, startNodeId: mass1.id, endNodeId: pulleyBecket.id, length: 220, segments: [] },
                    { id: generateId('rope'), type: ComponentType.ROPE, position: { x: 40, y: 0 }, startNodeId: pulleyBecket.id, endNodeId: mass2.id, length: 220, segments: [] }
                );
                return components;
            },
            // Scenario 9: Double pulley system
            () => {
                const components: Component[] = [
                    { id: generateId('anchor'), type: ComponentType.ANCHOR, position: { x: -150, y: -200 }, fixed: true },
                    { id: generateId('pulley'), type: ComponentType.PULLEY, position: { x: 0, y: -200 }, radius: 30, fixed: true },
                    { id: generateId('pulley'), type: ComponentType.PULLEY, position: { x: 150, y: -200 }, radius: 30, fixed: true },
                    { id: generateId('mass'), type: ComponentType.MASS, position: { x: 0, y: 100 }, mass: 12 },
                ];
                const anchor = components[0];
                const pulley1 = components[1];
                const pulley2 = components[2];
                const mass = components[3];
                components.push(
                    { id: generateId('rope'), type: ComponentType.ROPE, position: { x: -75, y: -200 }, startNodeId: anchor.id, endNodeId: pulley1.id, length: 150, segments: [] },
                    { id: generateId('rope'), type: ComponentType.ROPE, position: { x: 0, y: -50 }, startNodeId: pulley1.id, endNodeId: mass.id, length: 300, segments: [] },
                    { id: generateId('rope'), type: ComponentType.ROPE, position: { x: 75, y: -200 }, startNodeId: pulley2.id, endNodeId: mass.id, length: 300, segments: [] }
                );
                return components;
            },
            // Scenario 10: Complex spring-mass-pulley system
            () => {
                const components: Component[] = [
                    { id: generateId('anchor'), type: ComponentType.ANCHOR, position: { x: 0, y: -250 }, fixed: true },
                    { id: generateId('pulley'), type: ComponentType.PULLEY, position: { x: 0, y: -100 }, radius: 30, fixed: true },
                    { id: generateId('mass'), type: ComponentType.MASS, position: { x: -100, y: 100 }, mass: 6 },
                    { id: generateId('mass'), type: ComponentType.MASS, position: { x: 100, y: 100 }, mass: 9 },
                ];
                const anchor = components[0];
                const pulley = components[1];
                const mass1 = components[2];
                const mass2 = components[3];
                components.push(
                    { id: generateId('spring'), type: ComponentType.SPRING, position: { x: 0, y: -175 }, startNodeId: anchor.id, endNodeId: pulley.id, restLength: 100, stiffness: 150, currentLength: 150 },
                    { id: generateId('rope'), type: ComponentType.ROPE, position: { x: -50, y: 0 }, startNodeId: pulley.id, endNodeId: mass1.id, length: 200, segments: [] },
                    { id: generateId('rope'), type: ComponentType.ROPE, position: { x: 50, y: 0 }, startNodeId: pulley.id, endNodeId: mass2.id, length: 200, segments: [] }
                );
                return components;
            },
            // Scenario 10: Maximum complexity - interconnected network
            () => {
                const components: Component[] = [
                    { id: generateId('anchor'), type: ComponentType.ANCHOR, position: { x: -200, y: -200 }, fixed: true },
                    { id: generateId('anchor'), type: ComponentType.ANCHOR, position: { x: 200, y: -200 }, fixed: true },
                    { id: generateId('pulley'), type: ComponentType.PULLEY, position: { x: 0, y: -150 }, radius: 30, fixed: true },
                    { id: generateId('mass'), type: ComponentType.MASS, position: { x: -150, y: 50 }, mass: 4 },
                    { id: generateId('mass'), type: ComponentType.MASS, position: { x: 0, y: 100 }, mass: 8 },
                    { id: generateId('mass'), type: ComponentType.MASS, position: { x: 150, y: 50 }, mass: 6 },
                ];
                const anchor1 = components[0];
                const anchor2 = components[1];
                const pulley = components[2];
                const mass1 = components[3];
                const mass2 = components[4];
                const mass3 = components[5];
                components.push(
                    { id: generateId('rope'), type: ComponentType.ROPE, position: { x: -100, y: -175 }, startNodeId: anchor1.id, endNodeId: pulley.id, length: 150, segments: [] },
                    { id: generateId('rope'), type: ComponentType.ROPE, position: { x: 100, y: -175 }, startNodeId: anchor2.id, endNodeId: pulley.id, length: 150, segments: [] },
                    { id: generateId('spring'), type: ComponentType.SPRING, position: { x: -75, y: -50 }, startNodeId: pulley.id, endNodeId: mass1.id, restLength: 150, stiffness: 120, currentLength: 200 },
                    { id: generateId('rope'), type: ComponentType.ROPE, position: { x: 0, y: -25 }, startNodeId: pulley.id, endNodeId: mass2.id, length: 250, segments: [] },
                    { id: generateId('rope'), type: ComponentType.ROPE, position: { x: 75, y: -50 }, startNodeId: pulley.id, endNodeId: mass3.id, length: 200, segments: [] },
                    { id: generateId('force'), type: ComponentType.FORCE_VECTOR, position: { x: 0, y: 100 }, Fx: 30, Fy: -20, appliedToNodeId: mass2.id }
                );
                return components;
            },
        ];

        const components = scenarios[scenarioNum - 1]();
        set((state) => ({
            history: [...state.history, state.system],
            system: { ...state.system, components },
        }));
        get().updateGraph();
        setTimeout(() => get().solve(), 500);
    },

    createTestSystem: () => {
        const components: Component[] = [];

        // Fixed pulley at the top center
        const fixedPulley: Pulley = {
            id: generateId('pulley'),
            type: ComponentType.PULLEY,
            position: { x: 0, y: -200 },
            radius: 30,
            fixed: true,
        };
        components.push(fixedPulley);

        // Mass 1 hanging on the left side
        const mass1: Mass = {
            id: generateId('mass'),
            type: ComponentType.MASS,
            position: { x: -150, y: 100 },
            mass: 5,
        };
        components.push(mass1);

        // Mass 2 hanging on the right side (heavier)
        const mass2: Mass = {
            id: generateId('mass'),
            type: ComponentType.MASS,
            position: { x: 150, y: 100 },
            mass: 10,
        };
        components.push(mass2);

        // Rope 1: Mass1 to Pulley
        const rope1: Rope = {
            id: generateId('rope'),
            type: ComponentType.ROPE,
            position: { x: -75, y: -50 },
            startNodeId: mass1.id,
            endNodeId: fixedPulley.id,
            length: distance(mass1.position, fixedPulley.position),
            segments: [{
                start: mass1.position,
                end: fixedPulley.position,
                type: 'line' as const,
                length: distance(mass1.position, fixedPulley.position)
            }],
        };
        components.push(rope1);

        // Rope 2: Pulley to Mass2
        const rope2: Rope = {
            id: generateId('rope'),
            type: ComponentType.ROPE,
            position: { x: 75, y: -50 },
            startNodeId: fixedPulley.id,
            endNodeId: mass2.id,
            length: distance(fixedPulley.position, mass2.position),
            segments: [{
                start: fixedPulley.position,
                end: mass2.position,
                type: 'line' as const,
                length: distance(fixedPulley.position, mass2.position)
            }],
        };
        components.push(rope2);

        set((state) => ({
            history: [...state.history, state.system],
            system: { ...state.system, components },
        }));

        get().updateGraph();
        setTimeout(() => get().solve(), 500);
    },

    createSimpleTest: () => {
        const components: Component[] = [];

        // Anchor at the top
        const anchor: Anchor = {
            id: generateId('anchor'),
            type: ComponentType.ANCHOR,
            position: { x: 0, y: -200 },
            fixed: true,
        };
        components.push(anchor);

        // Mass hanging directly below
        const mass: Mass = {
            id: generateId('mass'),
            type: ComponentType.MASS,
            position: { x: 0, y: 100 },
            mass: 10,
        };
        components.push(mass);

        // A rope connecting them
        const rope: Rope = {
            id: generateId('rope'),
            type: ComponentType.ROPE,
            position: { x: 0, y: -50 },
            startNodeId: anchor.id,
            endNodeId: mass.id,
            length: distance(anchor.position, mass.position),
            segments: [{
                start: anchor.position,
                end: mass.position,
                type: 'line' as const,
                length: distance(anchor.position, mass.position)
            }],
        };
        components.push(rope);

        set((state) => ({
            history: [...state.history, state.system],
            system: { ...state.system, components },
        }));

        get().updateGraph();
        setTimeout(() => get().solve(), 500);
    },

    reset: () => {
        set({ system: initialSystemState, solverResult: null, history: [], ui: { ...initialUIState }, ropeStartNodeId: null });
    },
}));
