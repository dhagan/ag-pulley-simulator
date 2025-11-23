import React from 'react';
import { useSystemStore } from '../store/useSystemStore';

export const TestScenarios: React.FC = () => {
    const createTestScenario = useSystemStore((state) => state.createTestScenario);

    const scenarios = [
        { num: 1, label: 'Simple Hanging Mass', desc: 'Single mass on rope', icon: '⚖️' },
        { num: 2, label: 'Atwood Machine', desc: 'Two masses over pulley', icon: '⚙️' },
        { num: 3, label: 'Spring & Mass', desc: 'Mass on spring', icon: '🌀' },
        { num: 4, label: 'Spring-Rope Chain', desc: 'Two masses, spring & rope', icon: '🔗' },
        { num: 5, label: 'Y-Configuration', desc: 'Mass suspended by two ropes', icon: '🔺' },
        { num: 6, label: 'Horizontal Force', desc: 'Applied force scenario', icon: '➡️' },
        { num: 7, label: 'Series Masses', desc: 'Three masses in chain', icon: '📦' },
        { num: 8, label: 'Double Pulley', desc: 'Two pulleys system', icon: '⚙️⚙️' },
        { num: 9, label: 'Spring-Pulley Mix', desc: 'Complex mixed system', icon: '🔧' },
        { num: 10, label: 'Maximum Complexity', desc: 'Full interconnected network', icon: '🕸️' },
    ];

    return (
        <div
            className="glass"
            style={{
                padding: 'var(--spacing-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-sm)',
                overflowY: 'auto',
            }}
        >
            <h3
                style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    margin: 0,
                    marginBottom: 'var(--spacing-xs)',
                    color: 'var(--color-accent-cyan)',
                }}
            >
                🧪 Test Scenarios
            </h3>

            {scenarios.map((test) => (
                <button
                    key={test.num}
                    onClick={() => createTestScenario(test.num)}
                    style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--color-text)',
                        padding: 'var(--spacing-sm)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        gap: 'var(--spacing-sm)',
                        alignItems: 'flex-start',
                        transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                        e.currentTarget.style.borderColor = 'var(--color-accent-blue)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                        e.currentTarget.style.borderColor = 'var(--color-border)';
                    }}
                >
                    <div style={{ fontSize: '1.5rem', lineHeight: 1 }}>{test.icon}</div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '2px' }}>
                            {test.num}. {test.label}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                            {test.desc}
                        </div>
                    </div>
                </button>
            ))}
        </div>
    );
};
