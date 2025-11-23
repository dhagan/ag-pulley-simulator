import { Graph, EquationSystem, SystemState } from '../types';

export function buildEquationSystem(graph: Graph, system: SystemState): EquationSystem {
    const unknowns: string[] = [];
    const equations: number[][] = [];
    const constants: number[] = [];
    const unknownIndex = new Map<string, number>();

    // Add tension unknowns for each rope
    graph.edges.forEach((edge) => {
        if (edge.type === 'rope') {
            const tensionVar = `T_${edge.id}`;
            unknownIndex.set(tensionVar, unknowns.length);
            unknowns.push(tensionVar);
        }
    });

    // Add spring force unknowns
    graph.edges.forEach((edge) => {
        if (edge.type === 'spring') {
            const forceVar = `F_spring_${edge.id}`;
            unknownIndex.set(forceVar, unknowns.length);
            unknowns.push(forceVar);
        }
    });

    // For each non-fixed node, add force balance equations
    // Note: Fixed pulleys are treated as fixed nodes (no force balance needed)
    graph.nodes.forEach((node) => {
        if (!node.isFixed) {
            const eqX = new Array(unknowns.length).fill(0);
            let constX = 0;

            const eqY = new Array(unknowns.length).fill(0);
            let constY = -node.mass * system.gravity;

            // Find all edges connected to this node
            graph.edges.forEach((edge) => {
                const startNode = graph.nodes.get(edge.startNodeId);
                const endNode = graph.nodes.get(edge.endNodeId);
                if (!startNode || !endNode) return;

                const isStart = edge.startNodeId === node.id;
                const isEnd = edge.endNodeId === node.id;
                if (!isStart && !isEnd) return;

                let dirX: number, dirY: number;

                // For ropes, use tangent points if available (for pulleys)
                if (edge.type === 'rope') {
                    const segments = graph.ropeSegments.get(edge.id);
                    if (segments && segments.length > 0) {
                        // Get the first or last segment depending on which end of the rope this node is
                        const relevantSegment = isStart ? segments[0] : segments[segments.length - 1];
                        
                        // Calculate direction from the relevant segment endpoint to the node
                        if (isStart) {
                            // For start node, direction is from segment.start towards the rope
                            const dx = relevantSegment.end.x - relevantSegment.start.x;
                            const dy = relevantSegment.end.y - relevantSegment.start.y;
                            const length = Math.sqrt(dx * dx + dy * dy);
                            if (length === 0) return;
                            dirX = dx / length;
                            dirY = dy / length;
                        } else {
                            // For end node, direction is from the rope towards segment.end
                            const lastSeg = relevantSegment;
                            const dx = lastSeg.end.x - lastSeg.start.x;
                            const dy = lastSeg.end.y - lastSeg.start.y;
                            const length = Math.sqrt(dx * dx + dy * dy);
                            if (length === 0) return;
                            dirX = dx / length;
                            dirY = dy / length;
                        }
                    } else {
                        // Fallback to direct node-to-node direction
                        const dx = endNode.position.x - startNode.position.x;
                        const dy = endNode.position.y - startNode.position.y;
                        const length = Math.sqrt(dx * dx + dy * dy);
                        if (length === 0) return;
                        dirX = dx / length;
                        dirY = dy / length;
                    }
                } else {
                    // For springs and other edges, use direct node-to-node direction
                    const dx = endNode.position.x - startNode.position.x;
                    const dy = endNode.position.y - startNode.position.y;
                    const length = Math.sqrt(dx * dx + dy * dy);
                    if (length === 0) return;
                    dirX = dx / length;
                    dirY = dy / length;
                }

                if (edge.type === 'rope') {
                    const tensionIdx = unknownIndex.get(`T_${edge.id}`);
                    if (tensionIdx !== undefined) {
                        const sign = isStart ? 1 : -1;
                        eqX[tensionIdx] = sign * dirX;
                        eqY[tensionIdx] = sign * dirY;
                    }
                } else if (edge.type === 'spring') {
                    const forceIdx = unknownIndex.get(`F_spring_${edge.id}`);
                    if (forceIdx !== undefined) {
                        const sign = isStart ? 1 : -1;
                        eqX[forceIdx] = sign * dirX;
                        eqY[forceIdx] = sign * dirY;
                    }
                }
            });

            // Add external forces with Fx/Fy
            const forceComponents = system.components.filter(
                (c) => c.type === 'force_vector' && c.appliedToNodeId === node.id
            );

            forceComponents.forEach((forceComp) => {
                if (forceComp.type === 'force_vector') {
                    constX += forceComp.Fx;
                    constY += forceComp.Fy;
                }
            });

            // Add force balance equations: ΣF = 0
            // For each direction, only add if the force component is significant (> 1% of total)
            const maxCoeffX = Math.max(...eqX.map(c => Math.abs(c)), Math.abs(constX));
            const maxCoeffY = Math.max(...eqY.map(c => Math.abs(c)), Math.abs(constY));
            
            // Add X equation if there's meaningful X-direction force
            if (maxCoeffX > 1.0) {
                equations.push(eqX);
                constants.push(constX);
            }
            
            // Add Y equation if there's meaningful Y-direction force
            if (maxCoeffY > 1.0) {
                equations.push(eqY);
                constants.push(constY);
            }
        }
    });

    // Add pulley constraints: For massless, frictionless pulleys, tensions on both sides are equal
    graph.nodes.forEach((node) => {
        const pulleyComponent = system.components.find(c => c.id === node.id && (c.type === 'pulley' || c.type === 'spring_pulley' || c.type === 'pulley_becket' || c.type === 'spring_pulley_becket'));
        
        // Only fixed pulleys have equal tension constraint
        if (pulleyComponent && (pulleyComponent.type === 'pulley' || pulleyComponent.type === 'pulley_becket')) {
            // Find all ropes connected to this pulley
            const connectedRopes: string[] = [];
            graph.edges.forEach((edge) => {
                if (edge.type === 'rope' && (edge.startNodeId === node.id || edge.endNodeId === node.id)) {
                    connectedRopes.push(edge.id);
                }
            });

            // For each pair of ropes, add constraint T1 = T2 (or T1 - T2 = 0)
            if (connectedRopes.length === 2) {
                const eq = new Array(unknowns.length).fill(0);
                const idx1 = unknownIndex.get(`T_${connectedRopes[0]}`);
                const idx2 = unknownIndex.get(`T_${connectedRopes[1]}`);
                
                if (idx1 !== undefined && idx2 !== undefined) {
                    eq[idx1] = 1;
                    eq[idx2] = -1;
                    equations.push(eq);
                    constants.push(0);
                }
            }
        }
        
        // Spring pulleys are movable, no equal tension constraint
        // They're handled by force balance equations like masses
    });

    return { A: equations, b: constants, unknowns };
}

export function validateEquationSystem(eqSystem: EquationSystem): { valid: boolean; error?: string } {
    if (eqSystem.A.length === 0) {
        return { valid: false, error: 'No equations generated' };
    }

    if (eqSystem.A.length !== eqSystem.b.length) {
        return { valid: false, error: 'Equation count mismatch' };
    }

    const numUnknowns = eqSystem.unknowns.length;
    const numEquations = eqSystem.A.length;

    if (numEquations < numUnknowns) {
        return { valid: false, error: `Underdetermined system: ${numEquations} equations for ${numUnknowns} unknowns` };
    }

    // Allow overdetermined systems - they can be solved using least squares
    // if (numEquations > numUnknowns) {
    //     return { valid: false, error: `Overdetermined system: ${numEquations} equations for ${numUnknowns} unknowns` };
    // }

    return { valid: true };
}
