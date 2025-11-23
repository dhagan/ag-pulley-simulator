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
    setRopeStartNode: (nodeId: string | null) => void;
    updateGraph: () => void;
    solve: () => void;
    reset: () => void;
    undo: () => void;
    createTestSystem: () => void;
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

    createTestSystem: () => {
        const components: Component[] = [];

        const pulley: Pulley = {
            id: generateId('pulley'),
            type: ComponentType.PULLEY,
            position: { x: 0, y: -250 },
            radius: 30,
            fixed: true,  // Changed to fixed to avoid overconstrained system
        };
        components.push(pulley);

        const anchor: Anchor = {
            id: generateId('anchor'),
            type: ComponentType.ANCHOR,
            position: { x: 100, y: 250 },
            fixed: true,
        };
        components.push(anchor);

        const mass: Mass = {
            id: generateId('mass'),
            type: ComponentType.MASS,
            position: { x: -100, y: 250 },
            mass: 10,
        };
        components.push(mass);

        const rope1: Rope = {
            id: generateId('rope'),
            type: ComponentType.ROPE,
            position: { x: -50, y: 0 },
            startNodeId: mass.id,
            endNodeId: pulley.id,
            length: distance(mass.position, pulley.position),
            segments: [{
                start: mass.position,
                end: pulley.position,
                type: 'line' as const,
                length: distance(mass.position, pulley.position)
            }],
        };
        components.push(rope1);

        const rope2: Rope = {
            id: generateId('rope'),
            type: ComponentType.ROPE,
            position: { x: 50, y: 0 },
            startNodeId: pulley.id,
            endNodeId: anchor.id,
            length: distance(pulley.position, anchor.position),
            segments: [{
                start: pulley.position,
                end: anchor.position,
                type: 'line' as const,
                length: distance(pulley.position, anchor.position)
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

    reset: () => {
        set({ system: initialSystemState, solverResult: null, history: [], ui: { ...initialUIState }, ropeStartNodeId: null });
    },
}));
