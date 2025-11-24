/**
 * Validate all scenarios and report geometry problems
 */
import { loadScenarioByNumber } from '../src/utils/scenario-loader';
import { validatePhysicsConstraints } from '../src/utils/physics-validation';

console.log('🔍 Validating all scenarios for geometry problems...\n');

for (let i = 1; i <= 11; i++) {
    const system = loadScenarioByNumber(i);
    if (!system) {
        console.log(`❌ Scenario ${i}: Failed to load`);
        continue;
    }
    
    const warnings = validatePhysicsConstraints(system);
    
    if (warnings.length === 0) {
        console.log(`✅ Scenario ${i}: No geometry problems`);
    } else {
        console.log(`⚠️  Scenario ${i}: ${warnings.length} problem(s):`);
        warnings.forEach(warning => {
            const msg = typeof warning === 'string' ? warning : JSON.stringify(warning, null, 2);
            console.log(`   - ${msg}`);
        });
    }
}

console.log('\n💡 Use the "Align Masses to Grid" button to fix geometry problems!');
