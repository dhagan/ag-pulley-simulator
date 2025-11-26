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
            <div className="glass" style={{
                padding: 'var(--spacing-md)',
                borderRadius: 0,
                borderTop: 'none',
                borderBottom: 'none',
                borderLeft: 'none',
                height: '100%',
            }}>
                <div style={{
                    border: '1px dashed var(--color-border)',
                    padding: 'var(--spacing-md)',
                    textAlign: 'center',
                    color: 'var(--color-text-secondary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem'
                }}>
                    NO_SELECTION
                </div>
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
                borderRadius: 0,
                borderTop: 'none',
                borderBottom: 'none',
                borderLeft: 'none',
                height: '100%',
                overflowY: 'auto',
            }}
        >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    margin: 0,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    borderBottom: '1px solid var(--color-border)',
                    paddingBottom: '4px',
                    width: '100%'
                }}>
                    PROPERTIES
                </h3>
            </div>

            {/* Component Type Badge */}
            <div style={{
                padding: '8px 12px',
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid var(--color-accent-blue)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
            }}>
                <div style={{
                    fontWeight: 600,
                    color: 'var(--color-accent-blue)',
                    textTransform: 'uppercase',
                    fontSize: '0.8rem',
                    letterSpacing: '1px'
                }}>
                    {getComponentTypeName(selectedComponent.type)}
                </div>
                <div style={{
                    fontSize: '0.65rem',
                    color: 'var(--color-text-secondary)',
                    fontFamily: 'var(--font-mono)',
                    wordBreak: 'break-all'
                }}>
                    ID: {selectedComponent.id}
                </div>
            </div>

            {/* Component-specific properties */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>

                <PropertyField
                    label="POS_X"
                    value={selectedComponent.position.x.toFixed(1)}
                    type="number"
                    onChange={(val) => updateComponent(selectedComponent.id, {
                        position: { ...selectedComponent.position, x: parseFloat(val) || 0 }
                    })}
                />

                <PropertyField
                    label="POS_Y"
                    value={selectedComponent.position.y.toFixed(1)}
                    type="number"
                    onChange={(val) => updateComponent(selectedComponent.id, {
                        position: { ...selectedComponent.position, y: parseFloat(val) || 0 }
                    })}
                />

                {selectedComponent.type === ComponentType.MASS && (
                    <PropertyField
                        label="MASS (kg)"
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
                            label="RADIUS"
                            value={selectedComponent.radius.toString()}
                            type="number"
                            min={10}
                            step={5}
                            onChange={(val) => updateComponent(selectedComponent.id, {
                                radius: parseFloat(val) || 20
                            })}
                        />
                    </>
                )}

                {selectedComponent.type === ComponentType.SPRING_PULLEY && (
                    <>
                        <PropertyField
                            label="RADIUS"
                            value={selectedComponent.radius.toString()}
                            type="number"
                            min={10}
                            step={5}
                            onChange={(val) => updateComponent(selectedComponent.id, {
                                radius: parseFloat(val) || 20
                            })}
                        />

                        <PropertyField
                            label="K_STIFF (N/m)"
                            value={selectedComponent.stiffness.toString()}
                            type="number"
                            min={1}
                            step={10}
                            onChange={(val) => updateComponent(selectedComponent.id, {
                                stiffness: parseFloat(val) || 100
                            })}
                        />

                        <PropertyField
                            label="L_REST (px)"
                            value={selectedComponent.restLength.toString()}
                            type="number"
                            min={10}
                            step={10}
                            onChange={(val) => updateComponent(selectedComponent.id, {
                                restLength: parseFloat(val) || 100
                            })}
                        />

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{
                                fontSize: '0.7rem',
                                color: 'var(--color-text-secondary)',
                                fontWeight: 500,
                                fontFamily: 'var(--font-mono)'
                            }}>
                                SPRING_AXIS
                            </label>
                            <select
                                value={selectedComponent.axis}
                                onChange={(e) => updateComponent(selectedComponent.id, {
                                    axis: e.target.value as 'horizontal' | 'vertical'
                                })}
                                style={{
                                    padding: '6px 10px',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 0,
                                    color: 'var(--color-text)',
                                    fontSize: '0.8rem',
                                    fontFamily: 'var(--font-mono)',
                                    cursor: 'pointer',
                                }}
                            >
                                <option value="vertical">VERTICAL</option>
                                <option value="horizontal">HORIZONTAL</option>
                            </select>
                        </div>
                    </>
                )}

                {selectedComponent.type === ComponentType.PULLEY_BECKET && (
                    <>
                        <PropertyField
                            label="RADIUS"
                            value={selectedComponent.radius.toString()}
                            type="number"
                            min={10}
                            step={5}
                            onChange={(val) => updateComponent(selectedComponent.id, {
                                radius: parseFloat(val) || 20
                            })}
                        />
                    </>
                )}

                {selectedComponent.type === ComponentType.SPRING_PULLEY_BECKET && (
                    <>
                        <PropertyField
                            label="RADIUS"
                            value={selectedComponent.radius.toString()}
                            type="number"
                            min={10}
                            step={5}
                            onChange={(val) => updateComponent(selectedComponent.id, {
                                radius: parseFloat(val) || 20
                            })}
                        />

                        <PropertyField
                            label="K_STIFF (N/m)"
                            value={selectedComponent.stiffness.toString()}
                            type="number"
                            min={1}
                            step={10}
                            onChange={(val) => updateComponent(selectedComponent.id, {
                                stiffness: parseFloat(val) || 100
                            })}
                        />

                        <PropertyField
                            label="L_REST (px)"
                            value={selectedComponent.restLength.toString()}
                            type="number"
                            min={10}
                            step={10}
                            onChange={(val) => updateComponent(selectedComponent.id, {
                                restLength: parseFloat(val) || 100
                            })}
                        />

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{
                                fontSize: '0.7rem',
                                color: 'var(--color-text-secondary)',
                                fontWeight: 500,
                                fontFamily: 'var(--font-mono)'
                            }}>
                                SPRING_AXIS
                            </label>
                            <select
                                value={selectedComponent.axis}
                                onChange={(e) => updateComponent(selectedComponent.id, {
                                    axis: e.target.value as 'horizontal' | 'vertical'
                                })}
                                style={{
                                    padding: '6px 10px',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 0,
                                    color: 'var(--color-text)',
                                    fontSize: '0.8rem',
                                    fontFamily: 'var(--font-mono)',
                                    cursor: 'pointer',
                                }}
                            >
                                <option value="vertical">VERTICAL</option>
                                <option value="horizontal">HORIZONTAL</option>
                            </select>
                        </div>
                    </>
                )}

                {selectedComponent.type === ComponentType.SPRING && (
                    <>
                        <PropertyField
                            label="K_STIFF (N/m)"
                            value={selectedComponent.stiffness.toString()}
                            type="number"
                            min={1}
                            step={10}
                            onChange={(val) => updateComponent(selectedComponent.id, {
                                stiffness: parseFloat(val) || 100
                            })}
                        />

                        <PropertyField
                            label="L_REST"
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
                            label="FORCE_X (N)"
                            value={selectedComponent.Fx.toString()}
                            type="number"
                            step={10}
                            onChange={(val) => updateComponent(selectedComponent.id, {
                                Fx: parseFloat(val) || 0
                            })}
                        />

                        <PropertyField
                            label="FORCE_Y (N)"
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
                            label="LENGTH"
                            value={selectedComponent.length.toFixed(1)}
                            readOnly
                        />

                        <PropertyField
                            label="START_NODE"
                            value={selectedComponent.startNodeId.substring(0, 15) + '...'}
                            readOnly
                        />

                        <PropertyField
                            label="END_NODE"
                            value={selectedComponent.endNodeId.substring(0, 15) + '...'}
                            readOnly
                        />
                    </>
                )}
            </div>

            <button
                onClick={handleDelete}
                style={{
                    marginTop: 'var(--spacing-md)',
                    padding: '8px 12px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid var(--color-accent-red)',
                    borderRadius: 0,
                    color: 'var(--color-accent-red)',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    width: '100%',
                }}
                title="Delete component"
            >
                [ DELETE_COMPONENT ]
            </button>

            {/* Keyboard Shortcuts */}
            <div style={{
                marginTop: 'auto',
                padding: 'var(--spacing-sm)',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--color-border)',
                borderRadius: 0,
                fontSize: '0.7rem',
                color: 'var(--color-text-secondary)',
                fontFamily: 'var(--font-mono)'
            }}>
                <div style={{ fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase' }}>Shortcuts</div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>DELETE</span>
                    <span>DEL / BKSP</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>DUPLICATE</span>
                    <span>CTRL+D</span>
                </div>
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
            <label style={{
                fontSize: '0.7rem',
                color: 'var(--color-text-secondary)',
                fontWeight: 500,
                fontFamily: 'var(--font-mono)'
            }}>
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
                    borderRadius: 0,
                    color: readOnly ? 'var(--color-text-secondary)' : 'var(--color-text)',
                    fontSize: '0.8rem',
                    fontFamily: 'var(--font-mono)',
                    cursor: readOnly ? 'not-allowed' : 'text',
                }}
            />
        </div>
    );
};

// Helper functions
function getComponentTypeName(type: ComponentType): string {
    const names: Record<ComponentType, string> = {
        [ComponentType.ANCHOR]: 'ANCHOR',
        [ComponentType.PULLEY]: 'PULLEY',
        [ComponentType.PULLEY_BECKET]: 'PULLEY+BECKET',
        [ComponentType.SPRING_PULLEY]: 'SPRING_PULLEY',
        [ComponentType.SPRING_PULLEY_BECKET]: 'SPR_PULLEY+B',
        [ComponentType.MASS]: 'MASS',
        [ComponentType.ROPE]: 'ROPE',
        [ComponentType.SPRING]: 'SPRING',
        [ComponentType.FORCE_VECTOR]: 'FORCE_VECTOR',
    };
    return names[type] || type;
}

