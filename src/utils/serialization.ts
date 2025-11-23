import { SystemState, Component, ComponentType } from '../types';

/**
 * ObjGraph - JSON serializable representation of the pulley system
 */
export interface ObjGraph {
    version: string;
    name: string;
    description?: string;
    gravity: number;
    components: ComponentData[];
}

export interface ComponentData {
    id: string;
    type: ComponentType;
    position: { x: number; y: number };
    [key: string]: any; // Additional properties based on component type
}

/**
 * Convert SystemState to ObjGraph JSON format
 */
export function serializeSystem(system: SystemState, name: string = 'Untitled', description?: string): ObjGraph {
    const components: ComponentData[] = system.components.map(component => {
        const data: ComponentData = {
            id: component.id,
            type: component.type,
            position: { ...component.position },
        };

        // Add type-specific properties
        switch (component.type) {
            case ComponentType.PULLEY:
                data.radius = component.radius;
                data.fixed = component.fixed;
                break;
            case ComponentType.PULLEY_BECKET:
                data.radius = component.radius;
                data.fixed = component.fixed;
                if (component.becketAttachmentId) {
                    data.becketAttachmentId = component.becketAttachmentId;
                }
                break;
            case ComponentType.SPRING_PULLEY:
                data.radius = component.radius;
                data.stiffness = component.stiffness;
                data.restLength = component.restLength;
                data.currentLength = component.currentLength;
                data.axis = component.axis;
                break;
            case ComponentType.SPRING_PULLEY_BECKET:
                data.radius = component.radius;
                data.stiffness = component.stiffness;
                data.restLength = component.restLength;
                data.currentLength = component.currentLength;
                data.axis = component.axis;
                if (component.becketAttachmentId) {
                    data.becketAttachmentId = component.becketAttachmentId;
                }
                break;
            case ComponentType.MASS:
                data.mass = component.mass;
                break;
            case ComponentType.ROPE:
                data.startNodeId = component.startNodeId;
                data.endNodeId = component.endNodeId;
                data.length = component.length;
                break;
            case ComponentType.SPRING:
                data.startNodeId = component.startNodeId;
                data.endNodeId = component.endNodeId;
                data.restLength = component.restLength;
                data.stiffness = component.stiffness;
                data.currentLength = component.currentLength;
                break;
            case ComponentType.FORCE_VECTOR:
                data.Fx = component.Fx;
                data.Fy = component.Fy;
                data.appliedToNodeId = component.appliedToNodeId;
                break;
            case ComponentType.ANCHOR:
                data.fixed = component.fixed;
                break;
        }

        return data;
    });

    return {
        version: '1.3.0',
        name,
        description,
        gravity: system.gravity,
        components,
    };
}

/**
 * Convert ObjGraph JSON to SystemState
 */
export function deserializeSystem(objGraph: ObjGraph): SystemState {
    const components: Component[] = objGraph.components.map(data => {
        const base = {
            id: data.id,
            type: data.type,
            position: { ...data.position },
        };

        switch (data.type) {
            case ComponentType.ANCHOR:
                return { ...base, type: ComponentType.ANCHOR, fixed: true };
            case ComponentType.PULLEY:
                return { ...base, type: ComponentType.PULLEY, radius: data.radius || 30, fixed: true };
            case ComponentType.PULLEY_BECKET:
                return { 
                    ...base, 
                    type: ComponentType.PULLEY_BECKET, 
                    radius: data.radius || 30, 
                    fixed: true,
                    becketAttachmentId: data.becketAttachmentId 
                };
            case ComponentType.SPRING_PULLEY:
                return {
                    ...base,
                    type: ComponentType.SPRING_PULLEY,
                    radius: data.radius || 30,
                    stiffness: data.stiffness || 100,
                    restLength: data.restLength || 100,
                    currentLength: data.currentLength || 100,
                    axis: data.axis || 'vertical',
                };
            case ComponentType.SPRING_PULLEY_BECKET:
                return {
                    ...base,
                    type: ComponentType.SPRING_PULLEY_BECKET,
                    radius: data.radius || 30,
                    stiffness: data.stiffness || 100,
                    restLength: data.restLength || 100,
                    currentLength: data.currentLength || 100,
                    axis: data.axis || 'vertical',
                    becketAttachmentId: data.becketAttachmentId,
                };
            case ComponentType.MASS:
                return { ...base, type: ComponentType.MASS, mass: data.mass || 10 };
            case ComponentType.ROPE:
                return {
                    ...base,
                    type: ComponentType.ROPE,
                    startNodeId: data.startNodeId,
                    endNodeId: data.endNodeId,
                    length: data.length || 100,
                    segments: [],
                };
            case ComponentType.SPRING:
                return {
                    ...base,
                    type: ComponentType.SPRING,
                    startNodeId: data.startNodeId,
                    endNodeId: data.endNodeId,
                    restLength: data.restLength || 100,
                    stiffness: data.stiffness || 100,
                    currentLength: data.currentLength || 100,
                };
            case ComponentType.FORCE_VECTOR:
                return {
                    ...base,
                    type: ComponentType.FORCE_VECTOR,
                    Fx: data.Fx || 0,
                    Fy: data.Fy || 0,
                    appliedToNodeId: data.appliedToNodeId,
                };
            default:
                throw new Error(`Unknown component type: ${data.type}`);
        }
    });

    return {
        components,
        graph: { nodes: new Map(), edges: new Map(), ropeSegments: new Map() },
        constraints: [],
        gravity: objGraph.gravity || 9.81,
    };
}

/**
 * Save ObjGraph to JSON file (browser download)
 */
export function downloadObjGraph(objGraph: ObjGraph): void {
    const json = JSON.stringify(objGraph, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${objGraph.name.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Load ObjGraph from JSON file
 */
export function loadObjGraphFromFile(file: File): Promise<ObjGraph> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const objGraph = JSON.parse(e.target?.result as string);
                resolve(objGraph);
            } catch (error) {
                reject(new Error('Invalid JSON file'));
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}
