import React from 'react';
import { useSystemStore } from '../store/useSystemStore';
import { Tool } from '../types';

export const Toolbar: React.FC = () => {
    const currentTool = useSystemStore((state) => state.ui.currentTool);
    const setTool = useSystemStore((state) => state.setTool);
    const toggleGrid = useSystemStore((state) => state.toggleGrid);
    const toggleSnapToGrid = useSystemStore((state) => state.toggleSnapToGrid);
    const toggleFBD = useSystemStore((state) => state.toggleFBD);
    const toggleLabels = useSystemStore((state) => state.toggleLabels);
    const snapMassesToVertical = useSystemStore((state) => state.snapMassesToVertical);
    const showGrid = useSystemStore((state) => state.ui.showGrid);
    const showFBD = useSystemStore((state) => state.ui.showFBD);
    const showLabels = useSystemStore((state) => state.ui.showLabels);
    const snapToGrid = useSystemStore((state) => state.ui.canvas.snapToGrid);
    const reset = useSystemStore((state) => state.reset);
    const undo = useSystemStore((state) => state.undo);
    const hasHistory = useSystemStore((state) => state.history.length > 0);

    const toolButtons = [
        { tool: Tool.SELECT, label: 'Sel', icon: '⬆️' },
        { tool: Tool.PAN, label: 'Pan', icon: '✋' },
        { tool: Tool.ADD_ANCHOR, label: 'Anchor', icon: '📌' },
        { tool: Tool.ADD_PULLEY, label: 'Pulley', icon: '⚙️' },
        { tool: Tool.ADD_PULLEY_BECKET, label: 'P+Becket', icon: '🪝' },
        { tool: Tool.ADD_SPRING_PULLEY, label: 'Spr-P', icon: '🔧' },
        { tool: Tool.ADD_SPRING_PULLEY_BECKET, label: 'SP+Becket', icon: '⚙️' },
        { tool: Tool.ADD_MASS, label: 'Mass', icon: '📦' },
        { tool: Tool.ADD_ROPE, label: 'Rope', icon: '🪢' },
        { tool: Tool.ADD_SPRING, label: 'Spring', icon: '🌀' },
        { tool: Tool.ADD_FORCE, label: 'Force', icon: '➡️' },
    ];

    return (
        <div
            className="glass"
            style={{
                padding: 'var(--spacing-sm)',
                display: 'flex',
                gap: 'var(--spacing-sm)',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}
        >
            {/* Left side - Title and Version */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                <h1 style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, var(--color-accent-blue), var(--color-accent-cyan))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    margin: 0,
                }}>
                    Pulley Solver
                </h1>
                <div style={{
                    padding: '4px 8px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid var(--color-accent-blue)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.75rem',
                    color: 'var(--color-accent-blue)',
                    fontWeight: 600,
                }}>
                    v1.4.0
                </div>
            </div>

            {/* Right side - Tools and controls */}
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 'var(--spacing-xs)', flexWrap: 'wrap' }}>
                {toolButtons.map(({ tool, label, icon }) => (
                    <button
                        key={tool}
                        className={currentTool === tool ? 'selected' : ''}
                        onClick={() => setTool(tool)}
                        title={label}
                        style={{
                            minWidth: '60px',
                            padding: '4px 8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                        }}
                    >
                        <span>{icon}</span>
                        <span className="text-sm">{label}</span>
                    </button>
                ))}
            </div>

            <div
                style={{
                    width: '2px',
                    height: '30px',
                    background: 'var(--color-border)',
                    margin: '0 var(--spacing-sm)',
                }}
            />

            <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                <button onClick={toggleGrid} className={showGrid ? 'selected' : ''}>
                    Grid {showGrid ? '✓' : '✗'}
                </button>
                <button onClick={toggleSnapToGrid} className={snapToGrid ? 'selected' : ''}>
                    Snap {snapToGrid ? '✓' : '✗'}
                </button>
                <button onClick={snapMassesToVertical} title="Snap masses to hang vertically from pulleys/anchors">
                    📐 Align
                </button>
                <button onClick={toggleFBD} className={showFBD ? 'selected' : ''} title="Show Free Body Diagrams">
                    FBD {showFBD ? '✓' : '✗'}
                </button>
                <button onClick={toggleLabels} className={showLabels ? 'selected' : ''} title="Show Component Labels">
                    Labels {showLabels ? '✓' : '✗'}
                </button>
            </div>

            <div
                style={{
                    width: '2px',
                    height: '30px',
                    background: 'var(--color-border)',
                    margin: '0 var(--spacing-sm)',
                }}
            />

            <button
                onClick={undo}
                disabled={!hasHistory}
                title="Undo last action"
                style={{
                    opacity: hasHistory ? 1 : 0.5,
                    cursor: hasHistory ? 'pointer' : 'not-allowed',
                }}
            >
                ⏪ Undo
            </button>

            <button onClick={reset} style={{ background: 'var(--color-accent-red)', color: 'white' }}>
                Reset
            </button>
            </div>
        </div>
    );
};
