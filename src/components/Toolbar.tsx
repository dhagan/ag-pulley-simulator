import React from 'react';
import { useSystemStore } from '../store/useSystemStore';
import { Tool } from '../types';

export const Toolbar: React.FC = () => {
    const currentTool = useSystemStore((state) => state.ui.currentTool);
    const setTool = useSystemStore((state) => state.setTool);
    const toggleGrid = useSystemStore((state) => state.toggleGrid);
    const toggleSnapToGrid = useSystemStore((state) => state.toggleSnapToGrid);
    const toggleFBD = useSystemStore((state) => state.toggleFBD);
    const showGrid = useSystemStore((state) => state.ui.showGrid);
    const showFBD = useSystemStore((state) => state.ui.showFBD);
    const snapToGrid = useSystemStore((state) => state.ui.canvas.snapToGrid);
    const reset = useSystemStore((state) => state.reset);
    const undo = useSystemStore((state) => state.undo);
    const createTestSystem = useSystemStore((state) => state.createTestSystem);
    const hasHistory = useSystemStore((state) => state.history.length > 0);

    const toolButtons = [
        { tool: Tool.SELECT, label: 'Select', icon: '⬆️' },
        { tool: Tool.PAN, label: 'Pan', icon: '✋' },
        { tool: Tool.ADD_ANCHOR, label: 'Anchor', icon: '📌' },
        { tool: Tool.ADD_PULLEY, label: 'Pulley', icon: '⚙️' },
        { tool: Tool.ADD_MASS, label: 'Mass', icon: '📦' },
        { tool: Tool.ADD_ROPE, label: 'Rope', icon: '🪢' },
        { tool: Tool.ADD_SPRING, label: 'Spring', icon: '🌀' },
        { tool: Tool.ADD_FORCE, label: 'Force', icon: '➡️' },
    ];

    return (
        <div
            className="glass"
            style={{
                padding: 'var(--spacing-md)',
                display: 'flex',
                gap: 'var(--spacing-sm)',
                flexWrap: 'wrap',
                alignItems: 'center',
            }}
        >
            <div style={{ display: 'flex', gap: 'var(--spacing-xs)', flexWrap: 'wrap' }}>
                {toolButtons.map(({ tool, label, icon }) => (
                    <button
                        key={tool}
                        className={currentTool === tool ? 'selected' : ''}
                        onClick={() => setTool(tool)}
                        title={label}
                        style={{
                            minWidth: '80px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-xs)',
                            justifyContent: 'center',
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
                <button onClick={toggleFBD} className={showFBD ? 'selected' : ''} title="Show Free Body Diagrams">
                    FBD {showFBD ? '✓' : '✗'}
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
                className="primary"
                onClick={createTestSystem}
                title="Create a simple test system and solve it"
            >
                🧪 Test
            </button>

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
    );
};
