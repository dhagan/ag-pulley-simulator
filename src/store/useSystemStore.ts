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
import { loadScenarioByNumber } from '../utils/scenario-loader';

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
    snapMassesToVertical: () => void;
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

    snapMassesToVertical: () => {
        set((state) => {
            const { components } = state.system;
            const updatedComponents = components.map(comp => {
                if (comp.type !== ComponentType.MASS) return comp;
                
                // Find ropes/springs connected to this mass
                const connections = components.filter(c => {
                    if (c.type !== ComponentType.ROPE && c.type !== ComponentType.SPRING) return false;
                    return (c as any).startNodeId === comp.id || (c as any).endNodeId === comp.id;
                });
                
                if (connections.length === 0) return comp;
                
                // Find pulley/anchor this mass is connected to
                for (const conn of connections) {
                    const otherNodeId = (conn as any).startNodeId === comp.id ? (conn as any).endNodeId : (conn as any).startNodeId;
                    const otherNode = components.find(c => c.id === otherNodeId);
                    
                    if (otherNode && (
                        otherNode.type === ComponentType.PULLEY ||
                        otherNode.type === ComponentType.PULLEY_BECKET ||
                        otherNode.type === ComponentType.SPRING_PULLEY ||
                        otherNode.type === ComponentType.SPRING_PULLEY_BECKET ||
                        otherNode.type === ComponentType.ANCHOR
                    )) {
                        // Snap mass to be directly below the pulley/anchor on the side it's currently on
                        const massX = comp.position.x;
                        const nodeX = otherNode.position.x;
                        const radius = 'radius' in otherNode ? (otherNode.radius || 0) : 0;
                        
                        // If mass is significantly offset, keep it on that side
                        // Otherwise snap to vertical
                        let newX = nodeX;
                        if (Math.abs(massX - nodeX) > radius / 2) {
                            // Mass is on a side, snap to +/- radius
                            newX = massX < nodeX ? nodeX - radius : nodeX + radius;
                        }
                        
                        return { ...comp, position: { ...comp.position, x: newX } };
                    }
                }
                
                return comp;
            });
            
            return {
                history: [...state.history, state.system],
                system: { ...state.system, components: updatedComponents }
            };
        });
        get().updateGraph();
    },

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
        // Load from JSON file using scenario loader utility
        const loadedSystem = loadScenarioByNumber(scenarioNum);
        if (!loadedSystem) {
            console.error(`Scenario ${scenarioNum} not found`);
            return;
        }
        
        set((state) => ({
            history: [...state.history, state.system],
            system: loadedSystem,
        }));
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
