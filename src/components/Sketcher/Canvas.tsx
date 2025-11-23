import React, { useRef, useState, MouseEvent, useEffect } from 'react';
import { useSystemStore } from '../../store/useSystemStore';
import { Grid } from './Grid';
import { Anchor } from './ComponentLibrary/Anchor';
import { Pulley } from './ComponentLibrary/Pulley';
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

        // Special handling for Rope tool - just switch to it
        if (type === ComponentType.ROPE) {
            setTool(Tool.ADD_ROPE);
        }
    };

    const handleMouseDown: React.MouseEventHandler<SVGSVGElement> = (e) => {
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
                        const ropeLength = distance(startComp.position, component.position);
                        const newRope: Component = {
                            id: generateId('rope'),
                            type: ComponentType.ROPE,
                            position: {
                                x: (startComp.position.x + component.position.x) / 2,
                                y: (startComp.position.y + component.position.y) / 2,
                            },
                            startNodeId: ropeStartNodeId,
                            endNodeId: component.id,
                            length: ropeLength,
                            segments: [{
                                start: startComp.position,
                                end: component.position,
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
            } else {
                selectComponent(component.id);
            }
        };

        switch (component.type) {
            case ComponentType.ANCHOR:
                return <Anchor key={component.id} anchor={component} isSelected={isSelected} onClick={() => onClick({} as MouseEvent)} />;
            case ComponentType.PULLEY:
                return <Pulley key={component.id} pulley={component} isSelected={isSelected} onClick={() => onClick({} as MouseEvent)} />;
            case ComponentType.MASS:
                return <Mass key={component.id} mass={component} isSelected={isSelected} onClick={() => onClick({} as MouseEvent)} />;
            case ComponentType.ROPE:
                return <Rope key={component.id} rope={component} isSelected={isSelected} onClick={() => onClick({} as MouseEvent)} />;
            case ComponentType.SPRING:
                const startNode = system.components.find(c => c.id === component.startNodeId);
                const endNode = system.components.find(c => c.id === component.endNodeId);
                if (!startNode || !endNode) return null;
                return (
                    <Spring
                        key={component.id}
                        spring={component}
                        isSelected={isSelected}
                        onClick={() => onClick({} as MouseEvent)}
                        startPos={startNode.position}
                        endPos={endNode.position}
                    />
                );
            case ComponentType.FORCE_VECTOR:
                return <ForceVector key={component.id} force={component} isSelected={isSelected} onClick={() => onClick({} as MouseEvent)} />;
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
                        padding: '8px',
                        borderRadius: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        minWidth: '150px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    }}
                >
                    <div style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>Add Component</div>
                    {[
                        { type: ComponentType.ANCHOR, label: 'Anchor', icon: '⚓' },
                        { type: ComponentType.PULLEY, label: 'Pulley', icon: '⭕' },
                        { type: ComponentType.MASS, label: 'Mass', icon: '⚖️' },
                        { type: ComponentType.ROPE, label: 'Rope Tool', icon: '〰️' },
                        { type: ComponentType.FORCE_VECTOR, label: 'Force', icon: '➡️' },
                    ].map((item) => (
                        <button
                            key={item.type}
                            onClick={() => handleAddFromMenu(item.type)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--color-text)',
                                padding: '6px 8px',
                                textAlign: 'left',
                                cursor: 'pointer',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '14px',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            <span>{item.icon}</span>
                            {item.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
