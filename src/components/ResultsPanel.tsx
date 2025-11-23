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
                            Solver Results
                        </h3>

                        {solverResult.solved ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                                {/* Rope Analysis */}
                                {solverResult.ropeSegmentAnalysis && solverResult.ropeSegmentAnalysis.size > 0 && (
                                    <div>
                                        <h4 className="text-sm text-secondary" style={{ marginBottom: 'var(--spacing-xs)' }}>
                                            Rope Analysis
                                        </h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                                            {Array.from(solverResult.ropeSegmentAnalysis.values()).map((analysis) => (
                                                <div key={analysis.ropeId} className="glass" style={{
                                                    padding: 'var(--spacing-xs)',
                                                    background: 'rgba(255,255,255,0.02)',
                                                    border: '1px solid var(--color-border)'
                                                }}>
                                                    <div className="font-mono text-xs" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                        <div style={{ fontWeight: 'bold', color: 'var(--color-text)' }}>
                                                            {analysis.ropeId.substring(0, 20)}...
                                                        </div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                            <span className="text-muted">Segments:</span>
                                                            <span>{analysis.segments.length}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                            <span className="text-muted">Length:</span>
                                                            <span>{(analysis.totalLength / 10).toFixed(1)} m</span>
                                                        </div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                            <span className="text-muted">Tension:</span>
                                                            <span style={{ color: 'var(--color-rope)', fontWeight: 'bold' }}>
                                                                {analysis.tension.toFixed(1)} N
                                                            </span>
                                                        </div>
                                                        {analysis.wrapsAroundPulleys.length > 0 && (
                                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                <span className="text-muted">Pulleys:</span>
                                                                <span>{analysis.wrapsAroundPulleys.length}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Rope Info (Legacy fallback) */}
                                {(!solverResult.ropeSegmentAnalysis || solverResult.ropeSegmentAnalysis.size === 0) && components.filter(c => c.type === 'rope').length > 0 && (
                                    <div>
                                        <h4 className="text-sm text-secondary" style={{ marginBottom: 'var(--spacing-xs)' }}>
                                            Ropes
                                        </h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                                            {components.filter(c => c.type === 'rope').map((rope: any) => {
                                                const tension = solverResult.tensions.get(rope.id);
                                                return (
                                                    <div key={rope.id} className="glass" style={{
                                                        padding: 'var(--spacing-xs)',
                                                        background: 'rgba(255,255,255,0.02)',
                                                        border: '1px solid var(--color-border)'
                                                    }}>
                                                        <div className="font-mono text-xs" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                            <div style={{ fontWeight: 'bold', color: 'var(--color-text)' }}>{rope.id}</div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                <span className="text-muted">Length:</span>
                                                                <span>{(rope.length / 10).toFixed(1)} m</span>
                                                            </div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                <span className="text-muted">Tension:</span>
                                                                <span style={{ color: 'var(--color-rope)', fontWeight: 'bold' }}>
                                                                    {tension !== undefined ? `${tension.toFixed(1)} N` : '-'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Force Equations */}
                                <div>
                                    <h4 className="text-sm text-secondary" style={{ marginBottom: 'var(--spacing-xs)' }}>
                                        Force Equilibrium Equations
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                                        {components.filter(c => c.type === 'mass' || (c.type === 'pulley' && !(c as any).fixed)).map((comp: any) => (
                                            <div key={comp.id} className="glass" style={{
                                                padding: 'var(--spacing-xs)',
                                                background: 'rgba(255,255,255,0.02)',
                                                border: '1px solid var(--color-border)'
                                            }}>
                                                <div className="font-mono text-xs" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                    <div style={{ fontWeight: 'bold', color: 'var(--color-accent-blue)' }}>{comp.id}</div>
                                                    <div>ΣFx = 0</div>
                                                    <div>ΣFy = {comp.type === 'mass' ? `-${comp.mass}g` : '0'}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

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
            )}

            {/* Instructions */}
            {!solverResult && (
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
            )}
        </div>
    );
};
