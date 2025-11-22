import React, { useRef, useState, MouseEvent, WheelEvent as ReactWheelEvent } from 'react';
import { useSystemStore } from '../../store/useSystemStore';
import { Grid } from './Grid';
import { Anchor } from './ComponentLibrary/Anchor';
import { Pulley } from './ComponentLibrary/Pulley';
import { Mass } from './ComponentLibrary/Mass';
import { Rope } from './ComponentLibrary/Rope';
import { Spring } from './ComponentLibrary/Spring';
import { ForceVector } from './ComponentLibrary/ForceVector';
import { ComponentType, Component, Tool, Point } from '../../types';
import { snapToGrid, generateId, distance } from '../../utils/math';

export const Canvas: React.FC = () => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState<Point>({ x: 0, y: 0 });

    const system = useSystemStore((state) => state.system);
    const ui = useSystemStore((state) => state.ui);
    const addComponent = useSystemStore((state) => state.addComponent);
    const selectComponent = useSystemStore((state) => state.selectComponent);
    const setViewBox = useSystemStore((state) => state.setViewBox);
    const ropeStartNodeId = useSystemStore((state) => state.ropeStartNodeId);
    const setRopeStartNode = useSystemStore((state) => state.setRopeStartNode);

    const { viewBox, gridSize, snapToGrid: shouldSnap } = ui.canvas;
    const { currentTool, selectedComponentId } = ui;

    const screenToSVG = (screenX: number, screenY: number): Point => {
        if (!svgRef.current) return { x: 0, y: 0 };

        const svg = svgRef.current;
        const pt = svg.createSVGPoint();
        pt.x = screenX;
        pt.y = screenY;

        const svgP = pt.matrixTransform(svg.getScreenCTM()!.inverse());
        return { x: svgP.x, y: svgP.y };
    };

    const handleCanvasClick = (e: MouseEvent<SVGSVGElement>) => {
        if (currentTool === Tool.SELECT || currentTool === Tool.PAN || currentTool === Tool.ADD_ROPE) return;

        const rect = svgRef.current?.getBoundingClientRect();
        if (!rect) return;

        let position = screenToSVG(e.clientX, e.clientY);

        if (shouldSnap) {
            position = snapToGrid(position, gridSize);
        }

        let newComponent: Component | null = null;

        switch (currentTool) {
            case Tool.ADD_ANCHOR:
                newComponent = {
                    id: generateId('anchor'),
                    type: ComponentType.ANCHOR,
                    position,
                    fixed: true,
                };
                break;

            case Tool.ADD_PULLEY:
                newComponent = {
                    id: generateId('pulley'),
                    type: ComponentType.PULLEY,
                    position,
                    radius: 30,
                    fixed: true,
                };
                break;

            case Tool.ADD_MASS:
                newComponent = {
                    id: generateId('mass'),
                    type: ComponentType.MASS,
                    position,
                    mass: 10,
                };
                break;

            case Tool.ADD_FORCE:
                newComponent = {
                    id: generateId('force'),
                    type: ComponentType.FORCE_VECTOR,
                    position,
                    Fx: 100,
                    Fy: 0,
                    appliedToNodeId: '',
                };
                break;
        }

        if (newComponent) {
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

        const handleMouseUp = () => {
            setIsPanning(false);
        };

        const handleWheel = (e: ReactWheelEvent<SVGSVGElement>) => {
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

            const onClick = () => {
                if (currentTool === Tool.ADD_ROPE) {
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
                                segments: [
                                    {
                                        start: startComp.position,
                                        end: component.position,
                                    },
                                ],
                            };

                            addComponent(newRope);
                            setRopeStartNode(null);
                            selectComponent(null);
                        }
                    }
                } else {
                    selectComponent(component.id);
                }
            };

            switch (component.type) {
                case ComponentType.ANCHOR:
                    return <Anchor key={component.id} anchor={component} isSelected={isSelected} onClick={onClick} />;

                case ComponentType.PULLEY:
                    return <Pulley key={component.id} pulley={component} isSelected={isSelected} onClick={onClick} />;

                case ComponentType.MASS:
                    return <Mass key={component.id} mass={component} isSelected={isSelected} onClick={onClick} />;

                case ComponentType.ROPE:
                    return <Rope key={component.id} rope={component} isSelected={isSelected} onClick={onClick} />;

                case ComponentType.SPRING:
                    const startNode = system.components.find(c => c.id === component.startNodeId);
                    const endNode = system.components.find(c => c.id === component.endNodeId);
                    if (!startNode || !endNode) return null;
                    return (
                        <Spring
                            key={component.id}
                            spring={component}
                            isSelected={isSelected}
                            onClick={onClick}
                            startPos={startNode.position}
                            endPos={endNode.position}
                        />
                    );

                case ComponentType.FORCE_VECTOR:
                    return <ForceVector key={component.id} force={component} isSelected={isSelected} onClick={onClick} />;

                default:
                    return null;
            }
        };

        return (
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                <svg
                    ref={svgRef}
                    width="100%"
                    height="100%"
                    viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
                    style={{
                        background: 'var(--color-bg-tertiary)',
                        cursor: isPanning ? 'grabbing' : currentTool === Tool.PAN ? 'grab' : 'crosshair',
                    }}
                    onClick={handleCanvasClick}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onWheel={handleWheel}
                >
                    <Grid gridSize={gridSize} viewBox={viewBox} />

                    {system.components.map(renderComponent)}

                    {ropeStartNodeId && currentTool === Tool.ADD_ROPE && (() => {
                        const startComp = system.components.find(c => c.id === ropeStartNodeId);
                        if (startComp) {
                            return (
                                <circle
                                    cx={startComp.position.x}
                                    cy={startComp.position.y}
                                    r={50}
                                    fill="none"
                                    stroke="var(--color-accent-cyan)"
                                    strokeWidth={2}
                                    strokeDasharray="8,4"
                                >
                                    <animate
                                        attributeName="r"
                                        from="40"
                                        to="60"
                                        dur="1s"
                                        repeatCount="indefinite"
                                    />
                                </circle>
                            );
                        }
                        return null;
                    })()}

                    <line x1={viewBox.x} y1={0} x2={viewBox.x + viewBox.width} y2={0} stroke="rgba(255,0,0,0.3)" strokeWidth={1} />
                    <line x1={0} y1={viewBox.y} x2={0} y2={viewBox.y + viewBox.height} stroke="rgba(0,255,0,0.3)" strokeWidth={1} />
                </svg>
            </div>
        );
    };
