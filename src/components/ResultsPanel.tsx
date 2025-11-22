import React from 'react';
import { useSystemStore } from '../store/useSystemStore';

export const ResultsPanel: React.FC = () => {
    const solverResult = useSystemStore((state) => state.solverResult);
    const solve = useSystemStore((state) => state.solve);
    const components = useSystemStore((state) => state.system.components);

    return (
        <div
            className="glass"
            style={{
                padding: 'var(--spacing-md)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-md)',
                overflowY: 'auto',
            }}
        >
            <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 'var(--spacing-sm)' }}>
                    Analysis Results
                </h2>
                <p className="text-sm text-secondary">
                    Design your pulley system and click Solve to analyze
                </p>
            </div>

            <button
                className="primary"
                onClick={solve}
                style={{
                    padding: 'var(--spacing-md)',
                    fontSize: '1rem',
                }}
            >
                🧮 Solve System
            </button>

            <div style={{ width: '100%', height: '1px', background: 'var(--color-border)' }} />

            {/* System Info */}
            <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--spacing-sm)' }}>
                    System Overview
                </h3>
                <div className="font-mono text-sm" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="text-secondary">Components:</span>
                        <span>{components.length}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="text-secondary">Ropes:</span>
                        <span>{components.filter(c => c.type === 'rope').length}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="text-secondary">Masses:</span>
                        <span>{components.filter(c => c.type === 'mass').length}</span>
                    </div>
                </div>
            </div>

            {/* Solver Results */}
            {solverResult && (
                <>
                    <div style={{ width: '100%', height: '1px', background: 'var(--color-border)' }} />

                    <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--spacing-sm)' }}>
                            {/* Mechanical Advantage */}
                            {solverResult.mechanicalAdvantage && (
                                <div className="glass" style={{
                                    padding: 'var(--spacing-sm)',
                                    background: 'rgba(59, 130, 246, 0.1)',
                                    border: '1px solid var(--color-accent-blue)',
                                }}>
                                    <div className="font-mono text-sm">
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Mechanical Advantage:</span>
                                            <span style={{ color: 'var(--color-accent-blue)', fontWeight: 'bold' }}>
                                                {solverResult.mechanicalAdvantage.toFixed(2)}x
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                    </div>
                    ) : (
                    <div style={{
                        padding: 'var(--spacing-md)',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid var(--color-accent-red)',
                        borderRadius: 'var(--radius-sm)',
                    }}>
                        <p className="text-sm" style={{ color: 'var(--color-accent-red)' }}>
                            {solverResult.error || 'Unable to solve system'}
                        </p>
                    </div>
                        )}
                </div>
        </>
    )
}

{/* Instructions */ }
{
    !solverResult && (
        <div style={{ marginTop: 'auto' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 'var(--spacing-xs)' }}>
                Quick Start
            </h3>
            <ol className="text-xs text-secondary" style={{ paddingLeft: 'var(--spacing-md)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                <li>Use Rope tool and click two components to connect them</li>
                <li>Click Test button for a sample system</li>
                <li>Click Solve to analyze forces</li>
            </ol>
        </div>
    )
}
        </div >
    );
};
