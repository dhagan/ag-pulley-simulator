import { SystemState, Graph, Node, Edge, ComponentType } from '../types';

/**
 * Build a graph representation from the current system state
 * Nodes represent connection points (anchors, pulleys, masses)
 * Edges represent ropes and springs
 */
export function buildGraph(system: SystemState): Graph {
    const nodes = new Map<string, Node>();
    const edges = new Map<string, Edge>();

    // Create nodes from components
    system.components.forEach((component) => {
        switch (component.type) {
            case ComponentType.ANCHOR:
                nodes.set(component.id, {
                    id: component.id,
                    componentId: component.id,
                    position: component.position,
                    isFixed: true,
                    mass: 0,
                });
                break;

            case ComponentType.PULLEY:
                nodes.set(component.id, {
                    id: component.id,
                    componentId: component.id,
                    position: component.position,
                    isFixed: component.fixed,
                    mass: component.fixed ? 0 : 0.5, // Assume movable pulleys have negligible mass
                });
                break;

            case ComponentType.MASS:
                nodes.set(component.id, {
                    id: component.id,
                    componentId: component.id,
                    position: component.position,
                    isFixed: false,
                    mass: component.mass,
                });
                break;
        }
    });

    // Create edges from ropes and springs
    system.components.forEach((component) => {
        if (component.type === ComponentType.ROPE) {
            edges.set(component.id, {
                id: component.id,
                startNodeId: component.startNodeId,
                endNodeId: component.endNodeId,
                type: 'rope',
                length: component.length,
            });
        } else if (component.type === ComponentType.SPRING) {
            edges.set(component.id, {
                id: component.id,
                startNodeId: component.startNodeId,
                endNodeId: component.endNodeId,
                type: 'spring',
                stiffness: component.stiffness,
                restLength: component.restLength,
            });
        }
    });

    return { nodes, edges };
}

/**
 * Validate that the graph is properly constructed
 */
export function validateGraph(graph: Graph): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for disconnected nodes
    graph.edges.forEach((edge) => {
        if (!graph.nodes.has(edge.startNodeId)) {
            errors.push(`Edge ${edge.id} references non-existent start node ${edge.startNodeId}`);
        }
        if (!graph.nodes.has(edge.endNodeId)) {
            errors.push(`Edge ${edge.id} references non-existent end node ${edge.endNodeId}`);
        }
    });

    // Check for floating masses (not connected to anything)
    graph.nodes.forEach((node) => {
        if (node.mass > 0 && !node.isFixed) {
            const hasConnections = Array.from(graph.edges.values()).some(
                (edge) => edge.startNodeId === node.id || edge.endNodeId === node.id
            );
            if (!hasConnections) {
                errors.push(`Node ${node.id} is a floating mass with no connections`);
            }
        }
    });

    return {
        valid: errors.length === 0,
        errors,
    };
}
