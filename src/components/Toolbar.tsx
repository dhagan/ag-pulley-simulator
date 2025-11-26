import React from 'react';
import { useSystemStore } from '../store/useSystemStore';
import { Tool } from '../types';
import { exportScenario, importScenario } from '../utils/scenario-io';

interface ToolbarProps {
    onToggleLeft?: () => void;
    onToggleRight?: () => void;
    mobilePanel?: 'none' | 'left' | 'right';
}

export const Toolbar: React.FC<ToolbarProps> = ({ onToggleLeft, onToggleRight }) => {
    const currentTool = useSystemStore((state) => state.ui.currentTool);
    const setTool = useSystemStore((state) => state.setTool);
    const toggleGrid = useSystemStore((state) => state.toggleGrid);
    const toggleSnapToGrid = useSystemStore((state) => state.toggleSnapToGrid);
    const toggleFBD = useSystemStore((state) => state.toggleFBD);
    const snapMassesToVertical = useSystemStore((state) => state.snapMassesToVertical);
    const showGrid = useSystemStore((state) => state.ui.showGrid);
    const showFBD = useSystemStore((state) => state.ui.showFBD);
    const snapToGrid = useSystemStore((state) => state.ui.canvas.snapToGrid);
    const reset = useSystemStore((state) => state.reset);
    const undo = useSystemStore((state) => state.undo);
    const hasHistory = useSystemStore((state) => state.history.length > 0);
    const system = useSystemStore((state) => state.system);
    const loadSystem = useSystemStore((state) => state.loadSystem);

    const handleExport = () => {
        const filename = prompt('Enter filename for export:', 'my_scenario.json');
        if (filename) {
            exportScenario(system, filename);
        }
    };

    const handleImport = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const scenario = await importScenario(file);
                if (scenario) {
                    loadSystem(scenario);
                }
            }
        };
        input.click();
    };

    const toolButtons = [
        { tool: Tool.SELECT, label: 'SEL', icon: '◆' },
        { tool: Tool.PAN, label: 'PAN', icon: '✋' },
        { tool: Tool.ADD_ANCHOR, label: 'ANC', icon: '▲' },
        { tool: Tool.ADD_PULLEY, label: 'PUL', icon: '◉' },
        { tool: Tool.ADD_PULLEY_BECKET, label: 'P+B', icon: '⊙' },
        { tool: Tool.ADD_SPRING_PULLEY, label: 'SPR', icon: '◎' },
        { tool: Tool.ADD_SPRING_PULLEY_BECKET, label: 'S+B', icon: '⊚' },
        { tool: Tool.ADD_MASS, label: 'MAS', icon: '■' },
        { tool: Tool.ADD_ROPE, label: 'ROP', icon: '─' },
        { tool: Tool.ADD_SPRING, label: 'SPG', icon: '≈' },
        { tool: Tool.ADD_FORCE, label: 'FRC', icon: '→' },
    ];

    return (
        <div
            className="glass"
            style={{
                padding: 'var(--spacing-sm)',
                display: 'flex',
                gap: 'var(--spacing-sm)',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderRadius: 0, // Technical look
                borderLeft: 'none',
                borderRight: 'none',
                borderTop: 'none',
            }}
        >
            {/* Left side - Title and Mobile Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                {/* Mobile Menu Toggle */}
                <button
                    className="mobile-only"
                    onClick={onToggleLeft}
                    style={{ display: 'none', padding: '4px 8px' }} // Hidden by default, shown via CSS media query
                >
                    ☰
                </button>

                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
                    <h1 style={{
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: 'var(--color-text-primary)',
                        margin: 0,
                        letterSpacing: '1px',
                    }}>
                        PULLEY.SYS
                    </h1>
                    <span style={{
                        fontSize: '0.6rem',
                        color: 'var(--color-accent-blue)',
                        fontFamily: 'var(--font-mono)',
                    }}>
                        v1.6.1 // ENG_MODE
                    </span>
                </div>
            </div>

            {/* Center - Scrollable Tools */}
            <div style={{
                display: 'flex',
                gap: 'var(--spacing-xs)',
                alignItems: 'center',
                overflowX: 'auto',
                maxWidth: '100%',
                paddingBottom: '2px', // For scrollbar
                scrollbarWidth: 'none', // Firefox
            }} className="hide-scrollbar">

                {toolButtons.map(({ tool, label, icon }) => (
                    <button
                        key={tool}
                        className={currentTool === tool ? 'selected' : ''}
                        onClick={() => setTool(tool)}
                        title={label}
                        style={{
                            minWidth: '40px',
                            padding: '6px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.7rem',
                            gap: '2px',
                        }}
                    >
                        <span style={{ fontSize: '1.2em' }}>{icon}</span>
                        <span className="text-xs font-mono" style={{ display: 'none' }}>{label}</span>
                    </button>
                ))}

                <div style={{ width: '1px', height: '24px', background: 'var(--color-border)', margin: '0 4px', flexShrink: 0 }} />

                <button onClick={toggleGrid} className={showGrid ? 'selected' : ''} title="Toggle Grid">
                    #
                </button>
                <button onClick={toggleSnapToGrid} className={snapToGrid ? 'selected' : ''} title="Snap to Grid">
                    ⧉
                </button>
                <button onClick={snapMassesToVertical} title="Align Masses">
                    📐
                </button>
                <button onClick={toggleFBD} className={showFBD ? 'selected' : ''} title="Free Body Diagram">
                    FBD
                </button>
            </div>

            {/* Right side - Actions and Mobile Toggle */}
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
                <div className="desktop-only" style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    <button onClick={undo} disabled={!hasHistory} style={{ opacity: hasHistory ? 1 : 0.5 }}>
                        ⏪
                    </button>
                    <button onClick={handleExport} title="Save">💾</button>
                    <button onClick={handleImport} title="Load">📁</button>
                    <button onClick={reset} style={{ color: 'var(--color-accent-red)', borderColor: 'var(--color-accent-red)' }}>
                        RST
                    </button>
                </div>

                {/* Mobile Data Toggle */}
                <button
                    className="mobile-only"
                    onClick={onToggleRight}
                    style={{ display: 'none', padding: '4px 8px' }}
                >
                    DATA
                </button>
            </div>

            <style>{`
                @media (max-width: 768px) {
                    .mobile-only { display: block !important; }
                    .desktop-only { display: none !important; }
                    .hide-scrollbar::-webkit-scrollbar { display: none; }
                }
            `}</style>
        </div>
    );
};
