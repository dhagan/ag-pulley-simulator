import React from 'react';
import { useAnimatorStore } from './store';

/**
 * Animator Controls Component
 * Provides playback controls for animation
 */

export const AnimatorControls: React.FC = () => {
    const animation = useAnimatorStore(state => state.animation);
    const play = useAnimatorStore(state => state.play);
    const pause = useAnimatorStore(state => state.pause);
    const reset = useAnimatorStore(state => state.reset);
    const setTime = useAnimatorStore(state => state.setTime);
    const setDuration = useAnimatorStore(state => state.setDuration);
    
    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTime(parseFloat(e.target.value));
    };
    
    const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDuration(parseFloat(e.target.value));
    };
    
    const formatTime = (seconds: number): string => {
        return seconds.toFixed(2) + 's';
    };
    
    return (
        <div 
            className="glass"
            style={{
                padding: 'var(--spacing-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-sm)',
                borderRadius: 'var(--radius-md)',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                    Animator
                </h3>
                <div 
                    style={{
                        fontSize: '0.75rem',
                        padding: '2px 8px',
                        background: 'rgba(59, 130, 246, 0.2)',
                        border: '1px solid var(--color-accent-blue)',
                        borderRadius: '12px',
                        color: 'var(--color-accent-blue)'
                    }}
                >
                    BETA
                </div>
            </div>
            
            {/* Playback Controls */}
            <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                <button
                    onClick={reset}
                    disabled={animation.currentTime === 0}
                    style={{
                        padding: '8px 12px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--color-text)',
                        cursor: 'pointer',
                        fontSize: '18px',
                    }}
                    title="Reset"
                >
                    ⏮
                </button>
                
                {animation.isPlaying ? (
                    <button
                        onClick={pause}
                        style={{
                            flex: 1,
                            padding: '8px 16px',
                            background: 'var(--color-accent-orange)',
                            border: 'none',
                            borderRadius: 'var(--radius-sm)',
                            color: 'white',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '14px',
                        }}
                    >
                        ⏸ Pause
                    </button>
                ) : (
                    <button
                        onClick={play}
                        disabled={animation.currentTime >= animation.duration}
                        style={{
                            flex: 1,
                            padding: '8px 16px',
                            background: 'var(--color-accent-green)',
                            border: 'none',
                            borderRadius: 'var(--radius-sm)',
                            color: 'white',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '14px',
                        }}
                    >
                        ▶ Play
                    </button>
                )}
            </div>
            
            {/* Timeline Scrubber */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                    <span>{formatTime(animation.currentTime)}</span>
                    <span>{formatTime(animation.duration)}</span>
                </div>
                
                <input
                    type="range"
                    min={0}
                    max={animation.duration}
                    step={0.01}
                    value={animation.currentTime}
                    onChange={handleTimeChange}
                    style={{
                        width: '100%',
                        cursor: 'pointer',
                    }}
                />
            </div>
            
            {/* Duration Control */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', fontSize: '0.875rem' }}>
                <label style={{ color: 'var(--color-text-secondary)' }}>Duration:</label>
                <input
                    type="number"
                    min={0.1}
                    max={30}
                    step={0.5}
                    value={animation.duration}
                    onChange={handleDurationChange}
                    style={{
                        width: '60px',
                        padding: '4px 8px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--color-text)',
                        fontSize: '0.875rem',
                    }}
                />
                <span style={{ color: 'var(--color-text-secondary)' }}>s</span>
            </div>
            
            {/* Degrees of Freedom */}
            {animation.degreesOfFreedom.length > 0 && (
                <div style={{ marginTop: 'var(--spacing-xs)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                        Degrees of Freedom: {animation.degreesOfFreedom.length}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {animation.degreesOfFreedom.map(dof => (
                            <div 
                                key={dof.id}
                                style={{
                                    fontSize: '0.75rem',
                                    padding: '4px 8px',
                                    background: 'rgba(255, 255, 255, 0.02)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius-sm)',
                                    fontFamily: 'monospace'
                                }}
                            >
                                {dof.type}: {dof.componentId.substring(0, 20)}...
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Info */}
            <div style={{ 
                fontSize: '0.75rem', 
                color: 'var(--color-text-secondary)',
                marginTop: 'var(--spacing-xs)',
                padding: 'var(--spacing-xs)',
                background: 'rgba(59, 130, 246, 0.05)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: 'var(--radius-sm)',
            }}>
                💡 Drag components to create animations. The system will maintain rope constraints.
            </div>
        </div>
    );
};
