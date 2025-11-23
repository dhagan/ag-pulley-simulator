import React from 'react';
import { useSystemStore } from '../store/useSystemStore';
import { ComponentType } from '../types';

/**
 * Property Editor Panel
 * Allows editing component properties (mass, radius, stiffness, etc.)
 */

export const PropertyEditor: React.FC = () => {
    const selectedComponentId = useSystemStore(state => state.ui.selectedComponentId);
    const components = useSystemStore(state => state.system.components);
    const updateComponent = useSystemStore(state => state.updateComponent);
    const removeComponent = useSystemStore(state => state.removeComponent);
    
    const selectedComponent = components.find(c => c.id === selectedComponentId);
    
    if (!selectedComponent) {
        return (
            <div className="glass" style={{ padding: 'var(--spacing-md)' }}>
                <p className="text-sm text-secondary">
                    Select a component to edit its properties
                </p>
            </div>
        );
    }
    
    const handleDelete = () => {
        if (selectedComponentId) {
            removeComponent(selectedComponentId);
        }
    };
    
    return (
        <div 
            className="glass"
            style={{
                padding: 'var(--spacing-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-md)',
            }}
        >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                    Properties
                </h3>
                <button
                    onClick={handleDelete}
                    style={{
                        padding: '4px 12px',
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid var(--color-accent-red)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--color-accent-red)',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                    }}
                    title="Delete component"
                >
                    🗑 Delete
                </button>
            </div>
            
            {/* Component Type Badge */}
            <div style={{
                padding: '8px 12px',
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid var(--color-accent-blue)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}>
                <span style={{ fontWeight: 600, color: 'var(--color-accent-blue)' }}>
                    {getComponentIcon(selectedComponent.type)} {getComponentTypeName(selectedComponent.type)}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>
                    {selectedComponent.id.substring(0, 12)}...
                </span>
            </div>
            
            {/* Component-specific properties */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                <PropertyField label="ID" value={selectedComponent.id} readOnly />
                
                <PropertyField 
                    label="Position X" 
                    value={selectedComponent.position.x.toFixed(1)} 
                    type="number"
                    onChange={(val) => updateComponent(selectedComponent.id, {
                        position: { ...selectedComponent.position, x: parseFloat(val) || 0 }
                    })}
                />
                
                <PropertyField 
                    label="Position Y" 
                    value={selectedComponent.position.y.toFixed(1)} 
                    type="number"
                    onChange={(val) => updateComponent(selectedComponent.id, {
                        position: { ...selectedComponent.position, y: parseFloat(val) || 0 }
                    })}
                />
                
                {selectedComponent.type === ComponentType.MASS && (
                    <PropertyField 
                        label="Mass (kg)" 
                        value={selectedComponent.mass.toString()} 
                        type="number"
                        min={0.1}
                        step={0.5}
                        onChange={(val) => updateComponent(selectedComponent.id, {
                            mass: parseFloat(val) || 1
                        })}
                    />
                )}
                
                {selectedComponent.type === ComponentType.PULLEY && (
                    <>
                        <PropertyField 
                            label="Radius" 
                            value={selectedComponent.radius.toString()} 
                            type="number"
                            min={10}
                            step={5}
                            onChange={(val) => updateComponent(selectedComponent.id, {
                                radius: parseFloat(val) || 20
                            })}
                        />
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                            <input
                                type="checkbox"
                                checked={selectedComponent.fixed}
                                onChange={(e) => updateComponent(selectedComponent.id, {
                                    fixed: e.target.checked
                                })}
                                style={{ cursor: 'pointer' }}
                            />
                            <label style={{ fontSize: '0.875rem', cursor: 'pointer' }}>
                                Fixed Position
                            </label>
                        </div>
                    </>
                )}
                
                {selectedComponent.type === ComponentType.SPRING && (
                    <>
                        <PropertyField 
                            label="Stiffness (N/m)" 
                            value={selectedComponent.stiffness.toString()} 
                            type="number"
                            min={1}
                            step={10}
                            onChange={(val) => updateComponent(selectedComponent.id, {
                                stiffness: parseFloat(val) || 100
                            })}
                        />
                        
                        <PropertyField 
                            label="Rest Length" 
                            value={selectedComponent.restLength.toString()} 
                            type="number"
                            min={10}
                            step={10}
                            onChange={(val) => updateComponent(selectedComponent.id, {
                                restLength: parseFloat(val) || 100
                            })}
                        />
                    </>
                )}
                
                {selectedComponent.type === ComponentType.FORCE_VECTOR && (
                    <>
                        <PropertyField 
                            label="Force X (N)" 
                            value={selectedComponent.Fx.toString()} 
                            type="number"
                            step={10}
                            onChange={(val) => updateComponent(selectedComponent.id, {
                                Fx: parseFloat(val) || 0
                            })}
                        />
                        
                        <PropertyField 
                            label="Force Y (N)" 
                            value={selectedComponent.Fy.toString()} 
                            type="number"
                            step={10}
                            onChange={(val) => updateComponent(selectedComponent.id, {
                                Fy: parseFloat(val) || 0
                            })}
                        />
                    </>
                )}
                
                {selectedComponent.type === ComponentType.ROPE && (
                    <>
                        <PropertyField 
                            label="Length" 
                            value={selectedComponent.length.toFixed(1)} 
                            readOnly
                        />
                        
                        <PropertyField 
                            label="Start Node" 
                            value={selectedComponent.startNodeId.substring(0, 15) + '...'} 
                            readOnly
                        />
                        
                        <PropertyField 
                            label="End Node" 
                            value={selectedComponent.endNodeId.substring(0, 15) + '...'} 
                            readOnly
                        />
                    </>
                )}
            </div>
            
            {/* Keyboard Shortcuts */}
            <div style={{
                marginTop: 'var(--spacing-sm)',
                padding: 'var(--spacing-xs)',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                color: 'var(--color-text-secondary)'
            }}>
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>Shortcuts</div>
                <div>Delete: <kbd>Del</kbd> or <kbd>Backspace</kbd></div>
                <div>Duplicate: <kbd>Ctrl+D</kbd></div>
            </div>
        </div>
    );
};

// Helper component for property fields
const PropertyField: React.FC<{
    label: string;
    value: string;
    type?: string;
    readOnly?: boolean;
    min?: number;
    max?: number;
    step?: number;
    onChange?: (value: string) => void;
}> = ({ label, value, type = 'text', readOnly = false, min, max, step, onChange }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                {label}
            </label>
            <input
                type={type}
                value={value}
                readOnly={readOnly}
                min={min}
                max={max}
                step={step}
                onChange={(e) => onChange?.(e.target.value)}
                style={{
                    padding: '6px 10px',
                    background: readOnly ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    color: readOnly ? 'var(--color-text-secondary)' : 'var(--color-text)',
                    fontSize: '0.875rem',
                    fontFamily: type === 'number' ? 'monospace' : 'inherit',
                    cursor: readOnly ? 'not-allowed' : 'text',
                }}
            />
        </div>
    );
};

// Helper functions
function getComponentTypeName(type: ComponentType): string {
    const names: Record<ComponentType, string> = {
        [ComponentType.ANCHOR]: 'Anchor',
        [ComponentType.PULLEY]: 'Pulley',
        [ComponentType.MASS]: 'Mass',
        [ComponentType.ROPE]: 'Rope',
        [ComponentType.SPRING]: 'Spring',
        [ComponentType.FORCE_VECTOR]: 'Force Vector',
    };
    return names[type] || type;
}

function getComponentIcon(type: ComponentType): string {
    const icons: Record<ComponentType, string> = {
        [ComponentType.ANCHOR]: '⚓',
        [ComponentType.PULLEY]: '⭕',
        [ComponentType.MASS]: '⚖️',
        [ComponentType.ROPE]: '〰️',
        [ComponentType.SPRING]: '〜',
        [ComponentType.FORCE_VECTOR]: '➡️',
    };
    return icons[type] || '📦';
}
