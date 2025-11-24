// ============================================================================
// Component Types
// ============================================================================

export enum ComponentType {
    ANCHOR = 'anchor',
    PULLEY = 'pulley',
    PULLEY_BECKET = 'pulley_becket',
    SPRING_PULLEY = 'spring_pulley',
    SPRING_PULLEY_BECKET = 'spring_pulley_becket',
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

// Pulley: Fixed rotatable wheel (ideal, frictionless)
export interface Pulley extends BaseComponent {
    type: ComponentType.PULLEY;
    radius: number;
    fixed: true; // Always fixed to wall/ceiling
}

// Pulley with Becket: Fixed pulley with attachment point for load
export interface PulleyBecket extends BaseComponent {
    type: ComponentType.PULLEY_BECKET;
    radius: number;
    fixed: true; // Always fixed to wall/ceiling
    becketAttachmentId?: string; // Optional ID of component attached to becket
}

// Spring Pulley: Pulley mounted on a spring
export interface SpringPulley extends BaseComponent {
    type: ComponentType.SPRING_PULLEY;
    radius: number;
    stiffness: number; // Spring constant (N/m)
    restLength: number; // Spring rest length (px)
    currentLength: number; // Current spring length (px)
    axis: 'horizontal' | 'vertical'; // Direction of spring compression
}

// Spring Pulley with Becket: Spring-mounted pulley with attachment point
export interface SpringPulleyBecket extends BaseComponent {
    type: ComponentType.SPRING_PULLEY_BECKET;
    radius: number;
    stiffness: number; // Spring constant (N/m)
    restLength: number; // Spring rest length (px)
    currentLength: number; // Current spring length (px)
    axis: 'horizontal' | 'vertical'; // Direction of spring compression
    becketAttachmentId?: string; // Optional ID of component attached to becket
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
    type: 'line' | 'arc';
    wrapsAroundPulleyId?: string;
    arcCenter?: Point;
    arcRadius?: number;
    arcStartAngle?: number;
    arcEndAngle?: number;
    length: number;
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

export type Component = Anchor | Pulley | PulleyBecket | SpringPulley | SpringPulleyBecket | Rope | Spring | Mass | ForceVector;

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
    ropeSegments: Map<string, RopeSegment[]>; // ropeId -> segments
}

// ============================================================================
// Constraints
// ============================================================================

export interface RopeLengthConstraint {
    ropeId: string;
    totalLength: number;
    segments: string[]; // segment IDs that make up this rope
}

export interface EquilibriumConstraint {
    nodeId: string;
    sumForcesX: number;
    sumForcesY: number;
}

export interface PulleyTorqueConstraint {
    pulleyId: string;
    ropeIds: string[]; // ropes that wrap around this pulley
}

export interface Constraint {
    id: string;
    type: 'rope_length' | 'equilibrium' | 'pulley_torque';
    data: RopeLengthConstraint | EquilibriumConstraint | PulleyTorqueConstraint;
}

// ============================================================================
// System State
// ============================================================================

export interface SystemState {
    components: Component[];
    graph: Graph;
    constraints: Constraint[];
    gravity: number;
    timestamp?: number; // For animation
}

// ============================================================================
// Solver Types
// ============================================================================

export interface SolverResult {
    tensions: Map<string, number>; // ropeId -> tension
    segmentTensions: Map<string, number>; // segmentId -> tension
    springForces: Map<string, number>;
    reactionForces: Map<string, Point>;
    displacements: Map<string, Point>;
    totalRopeLength: number;
    mechanicalAdvantage?: number;
    ropeSegmentAnalysis: Map<string, RopeAnalysis>; // ropeId -> analysis
    solved: boolean;
    error?: string;
    equationSystem?: EquationSystem; // For debugging/educational display
}

export interface RopeAnalysis {
    ropeId: string;
    segments: RopeSegment[];
    totalLength: number;
    tension: number;
    wrapsAroundPulleys: string[];
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
    ADD_PULLEY_BECKET = 'add_pulley_becket',
    ADD_SPRING_PULLEY = 'add_spring_pulley',
    ADD_SPRING_PULLEY_BECKET = 'add_spring_pulley_becket',
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
    showLabels: boolean;
    animationEnabled: boolean;
}

// ============================================================================
// Animator Types
// ============================================================================

export interface AnimationState {
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    frames: AnimationFrame[];
    degreesOfFreedom: DegreeOfFreedom[];
}

export interface AnimationFrame {
    time: number;
    componentPositions: Map<string, Point>;
    ropeSegments: Map<string, RopeSegment[]>;
}

export interface DegreeOfFreedom {
    id: string;
    type: 'rope_end' | 'movable_pulley' | 'mass';
    componentId: string;
    initialPosition: Point;
    currentPosition: Point;
    constraints: string[]; // constraint IDs that govern this DOF
}

