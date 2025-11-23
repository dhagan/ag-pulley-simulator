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

                const dx = endNode.position.x - startNode.position.x;
                const dy = endNode.position.y - startNode.position.y;
                const length = Math.sqrt(dx * dx + dy * dy);
                if (length === 0) return;

                const dirX = dx / length;
                const dirY = dy / length;

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

            equations.push(eqX);
            constants.push(constX);
            equations.push(eqY);
            constants.push(constY);
        }
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

    if (numEquations > numUnknowns) {
        return { valid: false, error: `Overdetermined system: ${numEquations} equations for ${numUnknowns} unknowns` };
    }

    return { valid: true };
}
