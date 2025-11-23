import { SystemState, Graph, Node, Edge, ComponentType, RopeSegment } from '../types';
import { calculateRopeSegments } from '../modules/solver/rope-router';

/**
 * Build a graph representation from the current system state
 * Nodes represent connection points (anchors, pulleys, masses)
 * Edges represent ropes and springs
 */
export function buildGraph(system: SystemState): Graph {
    const nodes = new Map<string, Node>();
    const edges = new Map<string, Edge>();
    const ropeSegments = new Map<string, RopeSegment[]>();

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
                    isFixed: true, // Fixed pulleys are always fixed
                    mass: 0,
                });
                break;

            case ComponentType.PULLEY_BECKET:
                // Main pulley node
                nodes.set(component.id, {
                    id: component.id,
                    componentId: component.id,
                    position: component.position,
                    isFixed: true, // Fixed pulleys with becket are always fixed
                    mass: 0,
                });
                // Becket attachment point (below the pulley)
                nodes.set(`${component.id}_becket`, {
                    id: `${component.id}_becket`,
                    componentId: component.id,
                    position: { x: component.position.x, y: component.position.y + component.radius + 12 },
                    isFixed: true, // Becket is rigidly attached to pulley
                    mass: 0,
                });
                break;

            case ComponentType.SPRING_PULLEY:
                nodes.set(component.id, {
                    id: component.id,
                    componentId: component.id,
                    position: component.position,
                    isFixed: false, // Spring pulleys can move
                    mass: 0.5, // Small mass for the pulley itself
                });
                break;

            case ComponentType.SPRING_PULLEY_BECKET:
                // Main pulley node
                nodes.set(component.id, {
                    id: component.id,
                    componentId: component.id,
                    position: component.position,
                    isFixed: false, // Spring pulleys can move
                    mass: 0.5, // Small mass for the pulley itself
                });
                // Becket attachment point (below the pulley)
                nodes.set(`${component.id}_becket`, {
                    id: `${component.id}_becket`,
                    componentId: component.id,
                    position: { x: component.position.x, y: component.position.y + component.radius + 12 },
                    isFixed: false, // Becket moves with the spring pulley
                    mass: 0, // No additional mass for becket point
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
            const startNode = nodes.get(component.startNodeId);
            const endNode = nodes.get(component.endNodeId);
            
            if (startNode && endNode) {
                // Calculate smart rope segments with pulley detection
                const segments = calculateRopeSegments(
                    startNode.position,
                    endNode.position,
                    system,
                    component.id
                );
                
                ropeSegments.set(component.id, segments);
                
                // Calculate total length from segments
                const totalLength = segments.reduce((sum, seg) => sum + seg.length, 0);
                
                edges.set(component.id, {
                    id: component.id,
                    startNodeId: component.startNodeId,
                    endNodeId: component.endNodeId,
                    type: 'rope',
                    length: totalLength,
                });
            }
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

    // Add internal springs for spring pulleys
    system.components.forEach((component) => {
        if (component.type === ComponentType.SPRING_PULLEY || component.type === ComponentType.SPRING_PULLEY_BECKET) {
            // Create virtual anchor point where spring is mounted
            const anchorId = `${component.id}_anchor`;
            const anchorPos = { ...component.position };
            
            // Adjust anchor position based on axis
            if (component.axis === 'vertical') {
                anchorPos.y -= component.restLength;
            } else {
                anchorPos.x -= component.restLength;
            }
            
            nodes.set(anchorId, {
                id: anchorId,
                componentId: component.id,
                position: anchorPos,
                isFixed: true,
                mass: 0,
            });
            
            // Add spring edge between anchor and pulley
            edges.set(`${component.id}_spring`, {
                id: `${component.id}_spring`,
                startNodeId: anchorId,
                endNodeId: component.id,
                type: 'spring',
                stiffness: component.stiffness,
                restLength: component.restLength,
            });
        }
    });

    return { nodes, edges, ropeSegments };
}

/**
 * Validate that the graph is properly constructed
 */
export function validateGraph(graph: Graph, system: SystemState): { valid: boolean; errors: string[] } {
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

    // Check that pulleys have exactly 2 rope connections (but becket points are separate)
    graph.nodes.forEach((_node, nodeId) => {
        // Skip virtual anchor nodes and becket nodes
        if (nodeId.endsWith('_anchor') || nodeId.endsWith('_becket')) return;
        
        const component = system.components.find(c => c.id === nodeId);
        if (component && (component.type === ComponentType.PULLEY || component.type === ComponentType.SPRING_PULLEY || component.type === ComponentType.PULLEY_BECKET || component.type === ComponentType.SPRING_PULLEY_BECKET)) {
            const ropeConnections = Array.from(graph.edges.values()).filter(
                (edge) => edge.type === 'rope' && (edge.startNodeId === nodeId || edge.endNodeId === nodeId)
            );
            if (ropeConnections.length !== 2) {
                errors.push(`Pulley ${nodeId} must have exactly 2 rope connections (has ${ropeConnections.length}). Becket is separate.`);
            }
        }
    });

    return {
        valid: errors.length === 0,
        errors,
    };
}
