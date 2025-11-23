// ============================================================================
// Component Types
// ============================================================================

export enum ComponentType {
    ANCHOR = 'anchor',
    PULLEY = 'pulley',
    ROPE = 'rope',
    SPRING = 'spring',
    MASS = 'mass',
    FORCE_VECTOR = 'force_vector',
}

export interface Point {
    x: number;
    y: number;
}

export interface BaseComponent {
    id: string;
    type: ComponentType;
    position: Point;
}

// Anchor: Fixed point (wall/ceiling)
export interface Anchor extends BaseComponent {
    type: ComponentType.ANCHOR;
    fixed: true;
}

// Pulley: Rotatable wheel
export interface Pulley extends BaseComponent {
    type: ComponentType.PULLEY;
    radius: number;
    fixed: boolean;
}

// Rope: Idealized massless, inextensible string
export interface Rope extends BaseComponent {
    type: ComponentType.ROPE;
    startNodeId: string;
    endNodeId: string;
    length: number;
    segments: RopeSegment[];
}

export interface RopeSegment {
    start: Point;
    end: Point;
    wrapsAroundPulleyId?: string;
}

// Spring: Linear elastic element
export interface Spring extends BaseComponent {
    type: ComponentType.SPRING;
    startNodeId: string;
    endNodeId: string;
    restLength: number;
    stiffness: number;
    currentLength: number;
}

// Mass: Object subject to gravity
export interface Mass extends BaseComponent {
    type: ComponentType.MASS;
    mass: number;
    connectedToRopeId?: string;
}

// Force Vector: External applied force
export interface ForceVector extends BaseComponent {
    type: ComponentType.FORCE_VECTOR;
    Fx: number; // Force in X direction (N)
    Fy: number; // Force in Y direction (N)
    appliedToNodeId: string;
}

export type Component = Anchor | Pulley | Rope | Spring | Mass | ForceVector;

// ============================================================================
// Graph Representation
// ============================================================================

export interface Node {
    id: string;
    componentId: string;
    position: Point;
    isFixed: boolean;
    mass: number;
}

export interface Edge {
    id: string;
    startNodeId: string;
    endNodeId: string;
    type: 'rope' | 'spring';
    length?: number;
    stiffness?: number;
    restLength?: number;
}

export interface Graph {
    nodes: Map<string, Node>;
    edges: Map<string, Edge>;
}

// ============================================================================
// Constraints
// ============================================================================

export interface RopeLengthConstraint {
    ropeId: string;
    totalLength: number;
}

export interface EquilibriumConstraint {
    nodeId: string;
    sumForcesX: number;
    sumForcesY: number;
}

// ============================================================================
// System State
// ============================================================================

export interface SystemState {
    components: Component[];
    graph: Graph;
    constraints: {
        ropeLengths: RopeLengthConstraint[];
        equilibrium: EquilibriumConstraint[];
    };
    gravity: number;
}

// ============================================================================
// Solver Types
// ============================================================================

export interface SolverResult {
    tensions: Map<string, number>;
    springForces: Map<string, number>;
    reactionForces: Map<string, Point>;
    displacements: Map<string, Point>;
    totalRopeLength: number;
    mechanicalAdvantage?: number;
    solved: boolean;
    error?: string;
}

export interface EquationSystem {
    A: number[][];
    b: number[];
    unknowns: string[];
}

// ============================================================================
// UI State
// ============================================================================

export enum Tool {
    SELECT = 'select',
    PAN = 'pan',
    ADD_ANCHOR = 'add_anchor',
    ADD_PULLEY = 'add_pulley',
    ADD_ROPE = 'add_rope',
    ADD_SPRING = 'add_spring',
    ADD_MASS = 'add_mass',
    ADD_FORCE = 'add_force',
}

export interface CanvasState {
    viewBox: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    gridSize: number;
    snapToGrid: boolean;
    zoom: number;
}

export interface UIState {
    currentTool: Tool;
    selectedComponentId: string | null;
    canvas: CanvasState;
    showGrid: boolean;
    showForces: boolean;
    showFBD: boolean;
    animationEnabled: boolean;
}

