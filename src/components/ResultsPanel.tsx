import React, { useState } from 'react';
import { useSystemStore } from '../store/useSystemStore';
import { buildGraph } from '../utils/graph-builder';
import { buildEquationSystem } from '../solver/equation-builder';
import { calculateMechanicalAdvantage } from '../utils/mechanical-advantage';
import { validatePhysicsConstraints } from '../utils/physics-validation';

export const ResultsPanel: React.FC = () => {
    const solverResult = useSystemStore((state) => state.solverResult);
    const solve = useSystemStore((state) => state.solve);
    const components = useSystemStore((state) => state.system.components);
    const system = useSystemStore((state) => state.system);
    const [showEquations, setShowEquations] = useState(false);

    // Validate physics constraints
    const physicsWarnings = validatePhysicsConstraints(system);

    // Build equation system for display
    let equationSystem: any = null;
    let graph: any = null;
    try {
        graph = buildGraph(system);
        equationSystem = buildEquationSystem(graph, system);
    } catch (e) {
        console.error('Error building equations:', e);
    }

    const numUnknowns = equationSystem?.unknowns?.length || 0;
    const numEquations = equationSystem?.A?.length || 0;
    const isOverdetermined = numEquations > numUnknowns;
    const isUnderdetermined = numEquations < numUnknowns;

    // Calculate mechanical advantage if system is solved
    const mechanicalAdvantage = solverResult.solved ? calculateMechanicalAdvantage(system, solverResult) : null;

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

            {/* Physics Warnings */}
            {physicsWarnings.length > 0 && (
                <div style={{
                    padding: 'var(--spacing-sm)',
                    background: 'rgba(251, 191, 36, 0.1)',
                    border: '1px solid rgba(251, 191, 36, 0.3)',
                    borderRadius: 'var(--radius-md)',
                }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 'var(--spacing-xs)', color: 'rgb(251, 191, 36)' }}>
                        ⚠️ Physics Warnings
                    </div>
                    {physicsWarnings.map((warning, idx) => (
                        <div key={idx} style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
                            {warning.message}
                        </div>
                    ))}
                </div>
            )}

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

            {/* Equation System Diagnostics */}
            {equationSystem && (
                <>
                    <div style={{ width: '100%', height: '1px', background: 'var(--color-border)' }} />
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-sm)' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>
                                Equation System
                            </h3>
                            <button
                                onClick={() => setShowEquations(!showEquations)}
                                style={{
                                    background: 'transparent',
                                    border: '1px solid var(--color-border)',
                                    color: 'var(--color-text)',
                                    padding: '4px 8px',
                                    cursor: 'pointer',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem',
                                }}
                            >
                                {showEquations ? 'Hide' : 'Show'} Details
                            </button>
                        </div>

                        <div className="font-mono text-sm" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span className="text-secondary">Unknowns:</span>
                                <span>{numUnknowns}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span className="text-secondary">Equations:</span>
                                <span style={{ color: isOverdetermined ? 'var(--color-accent-cyan)' : isUnderdetermined ? 'var(--color-accent-red)' : 'inherit' }}>
                                    {numEquations}
                                </span>
                            </div>
                            {isOverdetermined && (
                                <div style={{
                                    padding: '8px',
                                    background: 'rgba(6, 182, 212, 0.1)',
                                    border: '1px solid var(--color-accent-cyan)',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem'
                                }}>
                                    ℹ️ OVERDETERMINED: {numEquations - numUnknowns} extra equation(s) - using least squares
                                </div>
                            )}
                            {isUnderdetermined && (
                                <div style={{
                                    padding: '8px',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid var(--color-accent-red)',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem'
                                }}>
                                    ⚠️ UNDERDETERMINED: Need {numUnknowns - numEquations} more equation(s)
                                </div>
                            )}
                        </div>

                        {showEquations && equationSystem && (
                            <div style={{ marginTop: 'var(--spacing-sm)', fontSize: '0.7rem' }}>
                                <div style={{ marginBottom: 'var(--spacing-xs)' }}>
                                    <strong>Unknowns:</strong>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                                        {equationSystem.unknowns.map((u: string, i: number) => (
                                            <span key={i} style={{
                                                background: 'rgba(59, 130, 246, 0.2)',
                                                padding: '2px 6px',
                                                borderRadius: '3px',
                                                fontFamily: 'monospace'
                                            }}>
                                                {u}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ marginTop: 'var(--spacing-sm)' }}>
                                    <strong>Equations (A·x = b):</strong>
                                    <div style={{
                                        marginTop: '4px',
                                        maxHeight: '200px',
                                        overflowY: 'auto',
                                        fontFamily: 'monospace',
                                        fontSize: '0.65rem',
                                        background: 'rgba(0,0,0,0.3)',
                                        padding: '8px',
                                        borderRadius: '4px'
                                    }}>
                                        {equationSystem.A.map((row: number[], i: number) => (
                                            <div key={i} style={{ marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'auto' }}>
                                                {row.map((coef, j) => {
                                                    if (Math.abs(coef) < 0.001) return null;
                                                    const sign = coef > 0 && row.slice(0, j).some(c => Math.abs(c) >= 0.001) ? '+ ' : '';
                                                    return (
                                                        <span key={j}>
                                                            {sign}{coef.toFixed(2)}·{equationSystem.unknowns[j]}{' '}
                                                        </span>
                                                    );
                                                }).filter(Boolean).length > 0 ? (
                                                    <>
                                                        {row.map((coef, j) => {
                                                            if (Math.abs(coef) < 0.001) return null;
                                                            const sign = coef > 0 && row.slice(0, j).some(c => Math.abs(c) >= 0.001) ? '+ ' : '';
                                                            return (
                                                                <span key={j}>
                                                                    {sign}{coef.toFixed(2)}·{equationSystem.unknowns[j]}{' '}
                                                                </span>
                                                            );
                                                        })}
                                                        = {equationSystem.b[i].toFixed(2)}
                                                    </>
                                                ) : (
                                                    <span style={{ color: 'var(--color-text-secondary)' }}>
                                                        0 = {equationSystem.b[i].toFixed(2)}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

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
                                {/* Mechanical Advantage */}
                                {mechanicalAdvantage && (
                                    <div style={{
                                        padding: 'var(--spacing-md)',
                                        background: 'rgba(34, 197, 94, 0.1)',
                                        border: '1px solid var(--color-accent-green)',
                                        borderRadius: 'var(--radius-md)',
                                    }}>
                                        <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 'var(--spacing-sm)', color: 'var(--color-accent-green)' }}>
                                            ⚙️ Mechanical Advantage (Purchase)
                                        </h4>
                                        <div className="font-mono text-sm" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span className="text-secondary">MA Ratio:</span>
                                                <span style={{ fontWeight: 600, color: 'var(--color-accent-green)' }}>
                                                    {mechanicalAdvantage.mechanicalAdvantage.toFixed(2)}:1
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span className="text-secondary">Load Force:</span>
                                                <span>{mechanicalAdvantage.loadForce.toFixed(2)} N</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span className="text-secondary">Effort Force:</span>
                                                <span>{mechanicalAdvantage.effortForce.toFixed(2)} N</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span className="text-secondary">Velocity Ratio:</span>
                                                <span>{mechanicalAdvantage.velocityRatio.toFixed(2)}:1</span>
                                            </div>
                                            <div style={{ marginTop: 'var(--spacing-xs)', paddingTop: 'var(--spacing-xs)', borderTop: '1px solid var(--color-border)' }}>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                                    {mechanicalAdvantage.explanation}
                                                </div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                                                    {mechanicalAdvantage.components.pulleyConfiguration}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

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
