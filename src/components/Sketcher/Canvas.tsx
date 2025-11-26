import React, { useRef, useState, MouseEvent, useEffect } from 'react';
import { useSystemStore } from '../../store/useSystemStore';
import { Grid } from './Grid';
import { Anchor } from './ComponentLibrary/Anchor';
import { Pulley } from './ComponentLibrary/Pulley';
import { PulleyBecket } from './ComponentLibrary/PulleyBecket';
import { SpringPulley } from './ComponentLibrary/SpringPulley';
import { SpringPulleyBecket } from './ComponentLibrary/SpringPulleyBecket';
import { Mass } from './ComponentLibrary/Mass';
import { Rope } from './ComponentLibrary/Rope';
import { Spring } from './ComponentLibrary/Spring';
import { ForceVector } from './ComponentLibrary/ForceVector';
import { FBDLayer } from './FBDLayer';
import { ComponentType, Component, Tool, Point } from '../../types';
import { snapToGrid, generateId, distance } from '../../utils/math';

export const Canvas: React.FC = () => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [isPanning, setIsPanning] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [draggedComponentId, setDraggedComponentId] = useState<string | null>(null);
    const [panStart, setPanStart] = useState<Point>({ x: 0, y: 0 });
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; visible: boolean }>({ x: 0, y: 0, visible: false });

    const system = useSystemStore((state) => state.system);
    const ui = useSystemStore((state) => state.ui);
    const addComponent = useSystemStore((state) => state.addComponent);
    const selectComponent = useSystemStore((state) => state.selectComponent);
    const updateComponent = useSystemStore((state) => state.updateComponent);
    const setViewBox = useSystemStore((state) => state.setViewBox);
    const ropeStartNodeId = useSystemStore((state) => state.ropeStartNodeId);
    const setRopeStartNode = useSystemStore((state) => state.setRopeStartNode);
    const setTool = useSystemStore((state) => state.setTool);

    const { viewBox, gridSize, snapToGrid: shouldSnap } = ui.canvas;
    const { currentTool, selectedComponentId } = ui;

    // Close context menu on click elsewhere
    useEffect(() => {
        const handleClick = () => setContextMenu(prev => ({ ...prev, visible: false }));
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    // Handle ESC key to cancel operations
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsDragging(false);
                setDraggedComponentId(null);
                setIsPanning(false);
                setRopeStartNode(null);
                if (currentTool === Tool.ADD_ROPE || currentTool === Tool.ADD_SPRING) {
                    setTool(Tool.SELECT);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentTool, setTool, setRopeStartNode]);

    const screenToSVG = (screenX: number, screenY: number): Point => {
        if (!svgRef.current) return { x: 0, y: 0 };
        const svg = svgRef.current;
        const pt = svg.createSVGPoint();
        pt.x = screenX;
        pt.y = screenY;
        const svgP = pt.matrixTransform(svg.getScreenCTM()!.inverse());
        return { x: svgP.x, y: svgP.y };
    };

    const handleContextMenu: React.MouseEventHandler<SVGSVGElement> = (e) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            visible: true
        });
    };

    const handleAddFromMenu = (type: ComponentType) => {
        const position = screenToSVG(contextMenu.x, contextMenu.y);
        let snappedPos = position;
        if (shouldSnap) {
            snappedPos = snapToGrid(position, gridSize);
        }

        let newComponent: Component | null = null;

        switch (type) {
            case ComponentType.ANCHOR:
                newComponent = {
                    id: generateId('anchor'),
                    type: ComponentType.ANCHOR,
                    position: snappedPos,
                    fixed: true,
                };
                break;
            case ComponentType.PULLEY:
                newComponent = {
                    id: generateId('pulley'),
                    type: ComponentType.PULLEY,
                    position: snappedPos,
                    radius: 30,
                    fixed: true,
                };
                break;
            case ComponentType.MASS:
                newComponent = {
                    id: generateId('mass'),
                    type: ComponentType.MASS,
                    position: snappedPos,
                    mass: 10,
                };
                break;
            case ComponentType.FORCE_VECTOR:
                newComponent = {
                    id: generateId('force'),
                    type: ComponentType.FORCE_VECTOR,
                    position: snappedPos,
                    Fx: 100,
                    Fy: 0,
                    appliedToNodeId: '',
                };
                break;
        }

        if (newComponent) {
            addComponent(newComponent);
            selectComponent(newComponent.id);
        }

        // Special handling for Rope and Spring tools - just switch to the tool
        if (type === ComponentType.ROPE) {
            setTool(Tool.ADD_ROPE);
        }
        if (type === ComponentType.SPRING) {
            setTool(Tool.ADD_SPRING);
        }

        setContextMenu({ ...contextMenu, visible: false });
    };

    const handleMouseDown: React.MouseEventHandler<SVGSVGElement> = (e) => {
        // Handle canvas clicks for adding components via toolbar tools
        if (e.button === 0 && e.target === e.currentTarget) {
            const position = screenToSVG(e.clientX, e.clientY);
            let snappedPos = position;
            if (shouldSnap) {
                snappedPos = snapToGrid(position, gridSize);
            }

            let newComponent: Component | null = null;

            switch (currentTool) {
                case Tool.ADD_ANCHOR:
                    newComponent = {
                        id: generateId('anchor'),
                        type: ComponentType.ANCHOR,
                        position: snappedPos,
                        fixed: true,
                    };
                    break;
                case Tool.ADD_PULLEY:
                    newComponent = {
                        id: generateId('pulley'),
                        type: ComponentType.PULLEY,
                        position: snappedPos,
                        radius: 30,
                        fixed: true,
                    };
                    break;
                case Tool.ADD_PULLEY_BECKET:
                    newComponent = {
                        id: generateId('pulley_becket'),
                        type: ComponentType.PULLEY_BECKET,
                        position: snappedPos,
                        radius: 30,
                        fixed: true,
                    };
                    break;
                case Tool.ADD_SPRING_PULLEY:
                    newComponent = {
                        id: generateId('spring_pulley'),
                        type: ComponentType.SPRING_PULLEY,
                        position: snappedPos,
                        radius: 30,
                        stiffness: 100,
                        restLength: 100,
                        currentLength: 100,
                        axis: 'vertical',
                    };
                    break;
                case Tool.ADD_SPRING_PULLEY_BECKET:
                    newComponent = {
                        id: generateId('spring_pulley_becket'),
                        type: ComponentType.SPRING_PULLEY_BECKET,
                        position: snappedPos,
                        radius: 30,
                        stiffness: 100,
                        restLength: 100,
                        currentLength: 100,
                        axis: 'vertical',
                    };
                    break;
                case Tool.ADD_MASS:
                    newComponent = {
                        id: generateId('mass'),
                        type: ComponentType.MASS,
                        position: snappedPos,
                        mass: 10,
                    };
                    break;
                case Tool.ADD_FORCE:
                    newComponent = {
                        id: generateId('force'),
                        type: ComponentType.FORCE_VECTOR,
                        position: snappedPos,
                        Fx: 100,
                        Fy: 0,
                        appliedToNodeId: '',
                    };
                    break;
            }

            if (newComponent) {
                addComponent(newComponent);
                selectComponent(newComponent.id);
                setTool(Tool.SELECT);
                return;
            }
        }

        // Left click (button 0) for panning or dragging
        if (e.button === 0 && currentTool === Tool.SELECT && !isDragging) {
            setIsPanning(true);
            setPanStart({ x: e.clientX, y: e.clientY });
        }
    };

    const handleMouseMove: React.MouseEventHandler<SVGSVGElement> = (e) => {
        if (isDragging && draggedComponentId) {
            const currentPos = screenToSVG(e.clientX, e.clientY);
            let newPos = currentPos;

            if (shouldSnap) {
                newPos = snapToGrid(currentPos, gridSize);
            }

            updateComponent(draggedComponentId, { position: newPos });
            return;
        }

        if (!isPanning) return;

        const dx = (e.clientX - panStart.x) * (viewBox.width / (svgRef.current?.clientWidth || 1));
        const dy = (e.clientY - panStart.y) * (viewBox.height / (svgRef.current?.clientHeight || 1));

        setViewBox(
            viewBox.x - dx,
            viewBox.y - dy,
            viewBox.width,
            viewBox.height
        );

        setPanStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp: React.MouseEventHandler<SVGSVGElement> = () => {
        setIsPanning(false);
        setIsDragging(false);
        setDraggedComponentId(null);
    };

    const handleWheel: React.WheelEventHandler<SVGSVGElement> = (e) => {
        e.preventDefault();
        const scaleFactor = e.deltaY > 0 ? 1.1 : 0.9;
        const newWidth = viewBox.width * scaleFactor;
        const newHeight = viewBox.height * scaleFactor;
        const mousePos = screenToSVG(e.clientX, e.clientY);
        const newX = mousePos.x - (mousePos.x - viewBox.x) * scaleFactor;
        const newY = mousePos.y - (mousePos.y - viewBox.y) * scaleFactor;
        setViewBox(newX, newY, newWidth, newHeight);
    };

    const renderComponent = (component: Component) => {
        const isSelected = component.id === selectedComponentId;

        const onClick = (e: MouseEvent) => {
            e.stopPropagation();

            if (currentTool === Tool.SELECT) {
                // Start dragging on mouse down for movable components
                if (component.type !== ComponentType.ROPE && component.type !== ComponentType.SPRING) {
                    setIsPanning(false); // Cancel panning if component clicked
                    setIsDragging(true);
                    setDraggedComponentId(component.id);
                }
                selectComponent(component.id);
            } else if (currentTool === Tool.ADD_ROPE) {
                if (!ropeStartNodeId) {
                    setRopeStartNode(component.id);
                    selectComponent(component.id);
                } else if (ropeStartNodeId !== component.id) {
                    const startComp = system.components.find(c => c.id === ropeStartNodeId);
                    if (startComp) {
                        // Get end position, optionally constrained
                        let endPos = component.position;

                        // Auto-align vertically if one end is a mass and the other is pulley/anchor
                        const startIsPulleyOrAnchor = startComp.type === ComponentType.PULLEY ||
                            startComp.type === ComponentType.PULLEY_BECKET ||
                            startComp.type === ComponentType.SPRING_PULLEY ||
                            startComp.type === ComponentType.SPRING_PULLEY_BECKET ||
                            startComp.type === ComponentType.ANCHOR;
                        const endIsPulleyOrAnchor = component.type === ComponentType.PULLEY ||
                            component.type === ComponentType.PULLEY_BECKET ||
                            component.type === ComponentType.SPRING_PULLEY ||
                            component.type === ComponentType.SPRING_PULLEY_BECKET ||
                            component.type === ComponentType.ANCHOR;
                        const startIsMass = startComp.type === ComponentType.MASS;
                        const endIsMass = component.type === ComponentType.MASS;

                        // If connecting mass to pulley/anchor, force vertical alignment
                        if ((startIsMass && endIsPulleyOrAnchor) || (endIsMass && startIsPulleyOrAnchor)) {
                            // Force vertical alignment - mass takes X position of pulley/anchor
                            if (startIsMass && endIsPulleyOrAnchor) {
                                // Start is mass, end is pulley/anchor - align mass to pulley X
                                updateComponent(startComp.id, { position: { x: endPos.x, y: startComp.position.y } });
                                // Re-fetch after update
                                const updatedStart = system.components.find(c => c.id === ropeStartNodeId);
                                if (updatedStart) {
                                    const ropeLength = distance(updatedStart.position, endPos);
                                    const newRope: Component = {
                                        id: generateId('rope'),
                                        type: ComponentType.ROPE,
                                        position: {
                                            x: (updatedStart.position.x + endPos.x) / 2,
                                            y: (updatedStart.position.y + endPos.y) / 2,
                                        },
                                        startNodeId: ropeStartNodeId,
                                        endNodeId: component.id,
                                        length: ropeLength,
                                        segments: [{
                                            start: updatedStart.position,
                                            end: endPos,
                                            type: 'line' as const,
                                            length: ropeLength
                                        }],
                                    };
                                    addComponent(newRope);
                                }
                            } else if (endIsMass && startIsPulleyOrAnchor) {
                                // End is mass, start is pulley/anchor - align mass to pulley X
                                endPos = { x: startComp.position.x, y: component.position.y };
                                updateComponent(component.id, { position: endPos });

                                const ropeLength = distance(startComp.position, endPos);
                                const newRope: Component = {
                                    id: generateId('rope'),
                                    type: ComponentType.ROPE,
                                    position: {
                                        x: (startComp.position.x + endPos.x) / 2,
                                        y: (startComp.position.y + endPos.y) / 2,
                                    },
                                    startNodeId: ropeStartNodeId,
                                    endNodeId: component.id,
                                    length: ropeLength,
                                    segments: [{
                                        start: startComp.position,
                                        end: endPos,
                                        type: 'line' as const,
                                        length: ropeLength
                                    }],
                                };
                                addComponent(newRope);
                            }
                            setRopeStartNode(null);
                            selectComponent(null);
                            setTool(Tool.SELECT);
                            return; // Exit early since we handled it
                        }

                        // If Shift key is held, snap to vertical or horizontal
                        if (e.shiftKey) {
                            const dx = Math.abs(component.position.x - startComp.position.x);
                            const dy = Math.abs(component.position.y - startComp.position.y);

                            // Snap to dominant axis
                            if (dx > dy) {
                                // Horizontal - keep Y same as start
                                endPos = { x: component.position.x, y: startComp.position.y };
                            } else {
                                // Vertical - keep X same as start
                                endPos = { x: startComp.position.x, y: component.position.y };
                            }

                            // Update component position to snapped position
                            updateComponent(component.id, { position: endPos });
                        }

                        const ropeLength = distance(startComp.position, endPos);
                        const newRope: Component = {
                            id: generateId('rope'),
                            type: ComponentType.ROPE,
                            position: {
                                x: (startComp.position.x + endPos.x) / 2,
                                y: (startComp.position.y + endPos.y) / 2,
                            },
                            startNodeId: ropeStartNodeId,
                            endNodeId: component.id,
                            length: ropeLength,
                            segments: [{
                                start: startComp.position,
                                end: endPos,
                                type: 'line' as const,
                                length: ropeLength
                            }],
                        };
                        addComponent(newRope);
                        setRopeStartNode(null);
                        selectComponent(null);
                        setTool(Tool.SELECT); // Reset tool after adding rope
                    }
                }
            } else if (currentTool === Tool.ADD_SPRING) {
                if (!ropeStartNodeId) {
                    setRopeStartNode(component.id);
                    selectComponent(component.id);
                } else if (ropeStartNodeId !== component.id) {
                    const startComp = system.components.find(c => c.id === ropeStartNodeId);
                    if (startComp) {
                        const springLength = distance(startComp.position, component.position);
                        const newSpring: Component = {
                            id: generateId('spring'),
                            type: ComponentType.SPRING,
                            position: {
                                x: (startComp.position.x + component.position.x) / 2,
                                y: (startComp.position.y + component.position.y) / 2,
                            },
                            startNodeId: ropeStartNodeId,
                            endNodeId: component.id,
                            restLength: springLength,
                            stiffness: 100,
                            currentLength: springLength,
                        };
                        addComponent(newSpring);
                        setRopeStartNode(null);
                        selectComponent(null);
                        setTool(Tool.SELECT); // Reset tool after adding spring
                    }
                }
            } else {
                selectComponent(component.id);
            }
        };

        // Create onClick handler wrapper (components expect no params, SVG handles event internally)
        const handleClick = () => {
            // Create a synthetic event for our onClick handler
            const syntheticEvent = new Event('click') as any;
            syntheticEvent.stopPropagation = () => { };
            onClick(syntheticEvent as MouseEvent);
        };

        switch (component.type) {
            case ComponentType.ANCHOR:
                return <Anchor key={component.id} anchor={component} isSelected={isSelected} onClick={handleClick} />;
            case ComponentType.PULLEY:
                return <Pulley key={component.id} pulley={component} isSelected={isSelected} onClick={handleClick} />;
            case ComponentType.PULLEY_BECKET:
                return <PulleyBecket key={component.id} pulley={component} isSelected={isSelected} onClick={handleClick} />;
            case ComponentType.SPRING_PULLEY:
                return <SpringPulley key={component.id} pulley={component} isSelected={isSelected} onClick={handleClick} />;
            case ComponentType.SPRING_PULLEY_BECKET:
                return <SpringPulleyBecket key={component.id} pulley={component} isSelected={isSelected} onClick={handleClick} />;
            case ComponentType.MASS:
                return <Mass key={component.id} mass={component} isSelected={isSelected} onClick={handleClick} />;
            case ComponentType.ROPE:
                return <Rope key={component.id} rope={component} isSelected={isSelected} onClick={handleClick} />;
            case ComponentType.SPRING:
                const startNodeSpring = system.components.find(c => c.id === component.startNodeId);
                const endNodeSpring = system.components.find(c => c.id === component.endNodeId);
                if (!startNodeSpring || !endNodeSpring) return null;
                return (
                    <Spring
                        key={component.id}
                        spring={component}
                        isSelected={isSelected}
                        onClick={handleClick}
                        startPos={startNodeSpring.position}
                        endPos={endNodeSpring.position}
                    />
                );
            case ComponentType.FORCE_VECTOR:
                return <ForceVector key={component.id} force={component} isSelected={isSelected} onClick={handleClick} />;
            default:
                return null;
        }
    };

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }} onContextMenu={(e) => e.preventDefault()}>
            <svg
                ref={svgRef}
                width="100%"
                height="100%"
                viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
                style={{
                    background: 'var(--color-bg-tertiary)',
                    cursor: isPanning ? 'grabbing' : 'default',
                }}
                onContextMenu={handleContextMenu}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
            >
                <Grid gridSize={gridSize} viewBox={viewBox} />
                {system.components.map(renderComponent)}

                {/* Render becket attachment points when adding rope/spring */}
                {(currentTool === Tool.ADD_ROPE || currentTool === Tool.ADD_SPRING) && system.components.map(component => {
                    if (component.type === ComponentType.PULLEY_BECKET || component.type === ComponentType.SPRING_PULLEY_BECKET) {
                        const becketNodeId = `${component.id}_becket`;
                        const becketPos = { x: component.position.x, y: component.position.y + component.radius + 12 };
                        const isSelected = ropeStartNodeId === becketNodeId;

                        return (
                            <g key={`${component.id}_becket_point`}>
                                <circle
                                    cx={becketPos.x}
                                    cy={becketPos.y}
                                    r={8}
                                    fill={isSelected ? 'var(--color-accent-cyan)' : 'var(--color-mass)'}
                                    stroke="var(--color-border)"
                                    strokeWidth={2}
                                    style={{ cursor: 'pointer' }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (currentTool === Tool.ADD_ROPE) {
                                            if (!ropeStartNodeId) {
                                                setRopeStartNode(becketNodeId);
                                            } else if (ropeStartNodeId !== becketNodeId) {
                                                const startNodeId = ropeStartNodeId;
                                                const startIsRegularComponent = system.components.find(c => c.id === startNodeId);
                                                const startIsBecket = startNodeId.endsWith('_becket');

                                                let startPos = becketPos;
                                                if (startIsRegularComponent) {
                                                    startPos = startIsRegularComponent.position;
                                                } else if (startIsBecket) {
                                                    const parentId = startNodeId.replace('_becket', '');
                                                    const parentComp = system.components.find(c => c.id === parentId);
                                                    if (parentComp && 'radius' in parentComp) {
                                                        startPos = { x: parentComp.position.x, y: parentComp.position.y + parentComp.radius + 12 };
                                                    }
                                                }

                                                const ropeLength = distance(startPos, becketPos);
                                                const newRope: Component = {
                                                    id: generateId('rope'),
                                                    type: ComponentType.ROPE,
                                                    position: {
                                                        x: (startPos.x + becketPos.x) / 2,
                                                        y: (startPos.y + becketPos.y) / 2,
                                                    },
                                                    startNodeId,
                                                    endNodeId: becketNodeId,
                                                    length: ropeLength,
                                                    segments: [{
                                                        start: startPos,
                                                        end: becketPos,
                                                        type: 'line' as const,
                                                        length: ropeLength
                                                    }],
                                                };
                                                addComponent(newRope);
                                                setRopeStartNode(null);
                                                setTool(Tool.SELECT);
                                            }
                                        }
                                    }}
                                />
                                {isSelected && (
                                    <circle
                                        cx={becketPos.x}
                                        cy={becketPos.y}
                                        r={12}
                                        fill="none"
                                        stroke="var(--color-accent-cyan)"
                                        strokeWidth={2}
                                        strokeDasharray="4 4"
                                        style={{ pointerEvents: 'none' }}
                                    />
                                )}
                            </g>
                        );
                    }
                    return null;
                })}

                <FBDLayer />

                {/* Rope creation preview */}
                {ropeStartNodeId && currentTool === Tool.ADD_ROPE && (() => {
                    const startComp = system.components.find(c => c.id === ropeStartNodeId);
                    if (startComp) {
                        return (
                            <circle
                                cx={startComp.position.x}
                                cy={startComp.position.y}
                                r={40}
                                fill="none"
                                stroke="var(--color-accent-cyan)"
                                strokeWidth={2}
                                strokeDasharray="8,4"
                                style={{ pointerEvents: 'none' }}
                            >
                                <animate attributeName="r" from="30" to="50" dur="1s" repeatCount="indefinite" />
                            </circle>
                        );
                    }
                    return null;
                })()}

                {/* Spring creation preview */}
                {ropeStartNodeId && currentTool === Tool.ADD_SPRING && (() => {
                    const startComp = system.components.find(c => c.id === ropeStartNodeId);
                    if (startComp) {
                        return (
                            <circle
                                cx={startComp.position.x}
                                cy={startComp.position.y}
                                r={40}
                                fill="none"
                                stroke="var(--color-spring)"
                                strokeWidth={2}
                                strokeDasharray="8,4"
                                style={{ pointerEvents: 'none' }}
                            >
                                <animate attributeName="r" from="30" to="50" dur="1s" repeatCount="indefinite" />
                            </circle>
                        );
                    }
                    return null;
                })()}
            </svg>

            {/* Context Menu */}
            {contextMenu.visible && (
                <div
                    className="glass"
                    style={{
                        position: 'fixed',
                        top: contextMenu.y,
                        left: contextMenu.x,
                        zIndex: 1000,
                        padding: '4px',
                        borderRadius: 0,
                        border: '1px solid var(--color-border)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                        minWidth: '140px',
                        boxShadow: 'var(--shadow-md)',
                        background: 'var(--color-surface)',
                    }}
                >
                    <div style={{
                        padding: '4px 8px',
                        fontSize: '0.7rem',
                        color: 'var(--color-text-secondary)',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        borderBottom: '1px solid var(--color-border)',
                        marginBottom: '4px'
                    }}>
                        ADD COMPONENT
                    </div>
                    {[
                        { type: ComponentType.ANCHOR, label: 'ANCHOR', icon: '▲' },
                        { type: ComponentType.PULLEY, label: 'PULLEY', icon: '◉' },
                        { type: ComponentType.PULLEY_BECKET, label: 'PULLEY+B', icon: '⊙' },
                        { type: ComponentType.SPRING_PULLEY, label: 'SPR-PULLEY', icon: '◎' },
                        { type: ComponentType.SPRING_PULLEY_BECKET, label: 'SPR-P+B', icon: '⊚' },
                        { type: ComponentType.MASS, label: 'MASS', icon: '■' },
                        { type: ComponentType.SPRING, label: 'SPRING', icon: '≈' },
                        { type: ComponentType.ROPE, label: 'ROPE', icon: '─' },
                        { type: ComponentType.FORCE_VECTOR, label: 'FORCE', icon: '→' },
                    ].map((item) => (
                        <button
                            key={item.type}
                            onClick={() => handleAddFromMenu(item.type)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--color-text-primary)',
                                padding: '6px 8px',
                                textAlign: 'left',
                                cursor: 'pointer',
                                borderRadius: 0,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '0.75rem',
                                fontFamily: 'var(--font-mono)',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'var(--color-surface-hover)';
                                e.currentTarget.style.color = 'var(--color-accent-blue)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = 'var(--color-text-primary)';
                            }}
                        >
                            <span style={{ width: '16px', textAlign: 'center' }}>{item.icon}</span>
                            {item.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
