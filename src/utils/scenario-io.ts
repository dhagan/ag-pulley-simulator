/**
 * Import/Export functionality for scenarios
 */
import { SystemState } from '../types';

/**
 * Export current system state as a JSON file
 */
export function exportScenario(system: SystemState, filename: string): void {
    // Ensure filename has .json extension
    if (!filename.endsWith('.json')) {
        filename += '.json';
    }

    // Create scenario object
    const scenario = {
        version: "1.4.0",
        name: filename.replace('.json', ''),
        description: `Exported scenario - ${new Date().toLocaleString()}`,
        gravity: system.gravity,
        components: system.components
    };

    // Convert to JSON with pretty printing
    const json = JSON.stringify(scenario, null, 2);

    // Create blob and download
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

/**
 * Import scenario from a JSON file
 */
export async function importScenario(file: File): Promise<SystemState | null> {
    try {
        const text = await file.text();
        const scenario = JSON.parse(text);

        // Validate scenario structure
        if (!scenario.components || !Array.isArray(scenario.components)) {
            alert('Invalid scenario file: missing components array');
            return null;
        }

        // Create system state from scenario
        const system: SystemState = {
            components: scenario.components,
            gravity: scenario.gravity || 9.81,
            graph: {
                nodes: new Map(),
                edges: new Map(),
                ropeSegments: new Map()
            },
            constraints: []
        };

        return system;
    } catch (error) {
        alert(`Error importing scenario: ${error}`);
        return null;
    }
}
