import { SystemState, Point, Component, SolverResult } from '../../types';

/**
 * Kinematic Animation System
 * Updates geometry based on constraint satisfaction (rope inextensibility)
 */

/**
 * Update system positions when a degree of freedom is moved
 * Maintains rope length constraints
 */
export function updateSystemKinematics(
    system: SystemState,
    movedComponentId: string,
    newPosition: Point,
    _solverResult: SolverResult | null
): SystemState {
    // Clone system
    const updatedComponents = system.components.map(c => 
        c.id === movedComponentId ? { ...c, position: newPosition } : { ...c }
    );
    
    // Find all ropes connected to the moved component
    const connectedRopes = updatedComponents.filter(c => 
        c.type === 'rope' && 
        (c.startNodeId === movedComponentId || c.endNodeId === movedComponentId)
    );
    
    // For each connected rope, adjust other endpoint to maintain length
    connectedRopes.forEach(rope => {
        if (rope.type !== 'rope') return;
        
        const otherEndId = rope.startNodeId === movedComponentId 
            ? rope.endNodeId 
            : rope.startNodeId;
        
        const otherEndComponent = updatedComponents.find(c => c.id === otherEndId);
        
        if (otherEndComponent && !isFixed(otherEndComponent)) {
            // Calculate new position maintaining rope length
            const newOtherPos = calculateConstrainedPosition(
                newPosition,
                otherEndComponent.position,
                rope.length
            );
            
            // Update the other component
            const idx = updatedComponents.findIndex(c => c.id === otherEndId);
            if (idx >= 0) {
                updatedComponents[idx] = {
                    ...updatedComponents[idx],
                    position: newOtherPos
                };
            }
        }
    });
    
    return {
        ...system,
        components: updatedComponents,
        timestamp: Date.now()
    };
}

/**
 * Calculate constrained position maintaining distance
 */
function calculateConstrainedPosition(
    anchor: Point,
    current: Point,
    targetDistance: number
): Point {
    const dx = current.x - anchor.x;
    const dy = current.y - anchor.y;
    const currentDist = Math.sqrt(dx * dx + dy * dy);
    
    if (currentDist === 0) {
        return { x: anchor.x + targetDistance, y: anchor.y };
    }
    
    const scale = targetDistance / currentDist;
    
    return {
        x: anchor.x + dx * scale,
        y: anchor.y + dy * scale
    };
}

/**
 * Check if component is fixed
 */
function isFixed(component: Component): boolean {
    if (component.type === 'anchor') return true;
    if (component.type === 'pulley') return component.fixed;
    return false;
}

/**
 * Animate small displacement from equilibrium
 * Shows spring deformation under load
 */
export function animateDisplacement(
    system: SystemState,
    solverResult: SolverResult,
    time: number,
    amplitude: number = 1.0
): SystemState {
    if (!solverResult.solved) return system;
    
    // Apply sinusoidal displacement to visualize equilibrium
    const phase = Math.sin(time * 2 * Math.PI / 2); // 2 second period
    
    const updatedComponents = system.components.map(c => {
        const displacement = solverResult.displacements.get(c.id);
        
        if (displacement) {
            return {
                ...c,
                position: {
                    x: c.position.x + displacement.x * phase * amplitude,
                    y: c.position.y + displacement.y * phase * amplitude
                }
            };
        }
        
        return c;
    });
    
    return {
        ...system,
        components: updatedComponents,
        timestamp: Date.now()
    };
}

/**
 * Generate animation frames for rope pulling simulation
 */
export function generatePullingAnimation(
    system: SystemState,
    solverResult: SolverResult,
    pulledComponentId: string,
    pullDirection: Point,
    pullDistance: number,
    numFrames: number = 60
): SystemState[] {
    const frames: SystemState[] = [];
    
    for (let i = 0; i <= numFrames; i++) {
        const t = i / numFrames;
        const displacement = {
            x: pullDirection.x * pullDistance * t,
            y: pullDirection.y * pullDistance * t
        };
        
        const pulledComponent = system.components.find(c => c.id === pulledComponentId);
        if (!pulledComponent) continue;
        
        const newPosition = {
            x: pulledComponent.position.x + displacement.x,
            y: pulledComponent.position.y + displacement.y
        };
        
        const frameState = updateSystemKinematics(
            system,
            pulledComponentId,
            newPosition,
            solverResult
        );
        
        frames.push(frameState);
    }
    
    return frames;
}

/**
 * Calculate velocity of a point based on rope constraint
 */
export function calculateVelocity(
    _system: SystemState,
    _componentId: string,
    inputVelocity: Point,
    solverResult: SolverResult | null
): Point {
    // Simplified: velocity scaled by mechanical advantage
    const ma = solverResult?.mechanicalAdvantage || 1;
    
    return {
        x: inputVelocity.x / ma,
        y: inputVelocity.y / ma
    };
}
