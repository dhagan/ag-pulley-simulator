import React, { useEffect, useState } from 'react';
import { useSystemStore } from '../store/useSystemStore';

interface ScenarioInfo {
    num: number;
    name: string;
    description: string;
    icon: string;
}

// Use Vite's glob import to load all scenario files (any .json in scenarios folder)
const scenarioModules = import.meta.glob('../../scenarios/*.json');

export const TestScenarios: React.FC = () => {
    const createTestScenario = useSystemStore((state) => state.createTestScenario);
    const [scenarios, setScenarios] = useState<ScenarioInfo[]>([]);

    useEffect(() => {
        const loadScenarios = async () => {
            console.log('Scenario modules found:', Object.keys(scenarioModules));
            const scenarioList: ScenarioInfo[] = [];
            
            // Load all scenario files
            const paths = Object.keys(scenarioModules).sort();
            
            if (paths.length === 0) {
                console.warn('No scenario files found!');
            }
            
            let scenarioNum = 1;
            for (const path of paths) {
                try {
                    const module = await scenarioModules[path]() as any;
                    
                    // Extract filename for display
                    const filename = path.split('/').pop()?.replace('.json', '') || `Scenario ${scenarioNum}`;
                    
                    scenarioList.push({
                        num: scenarioNum++,
                        name: module.name || filename,
                        description: module.description || '',
                        icon: getIconForScenario(scenarioNum - 1)
                    });
                } catch (error) {
                    console.warn(`Failed to load scenario from ${path}:`, error);
                }
            }
            
            setScenarios(scenarioList);
        };
        
        loadScenarios();
    }, []);

    const getIconForScenario = (num: number): string => {
        const icons: Record<number, string> = {
            1: '⚖️', 2: '⚙️', 3: '🌀', 4: '🔗', 5: '🔺',
            6: '➡️', 7: '📦', 8: '⚙️⚙️', 9: '🔧', 10: '🕸️', 11: '🪝'
        };
        return icons[num] || '📋';
    };

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

            {scenarios.length === 0 && (
                <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', textAlign: 'center', padding: 'var(--spacing-md)' }}>
                    Loading scenarios...
                </div>
            )}

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
                            {test.num}. {test.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                            {test.description}
                        </div>
                    </div>
                </button>
            ))}
        </div>
    );
};
