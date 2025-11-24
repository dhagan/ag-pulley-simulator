/**
 * Generate all test scenarios with correct physics and geometry
 * Key principle: Masses hang VERTICALLY on their side - no crossing
 */

interface Point {
    x: number;
    y: number;
}

interface Component {
    id: string;
    type: string;
    position: Point;
    [key: string]: any;
}

interface Scenario {
    version: string;
    name: string;
    description: string;
    gravity: number;
    components: Component[];
}

function distance(p1: Point, p2: Point): number {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

// Scenario 1: Simple hanging mass with balancing force
function generateScenario01(): Scenario {
    const anchor: Point = { x: 0, y: -200 };
    const mass: Point = { x: 0, y: 100 };
    const massValue = 10;
    const massWeight = massValue * 9.81;
    
    return {
        version: "1.4.0",
        name: "Scenario_1_Simple_Hanging_Mass",
        description: "Single mass hanging vertically from anchor with balancing force",
        gravity: 9.81,
        components: [
            {
                id: "anchor1",
                type: "anchor",
                position: anchor,
                fixed: true
            },
            {
                id: "mass1",
                type: "mass",
                position: mass,
                mass: massValue
            },
            {
                id: "rope1",
                type: "rope",
                position: { x: 0, y: (anchor.y + mass.y) / 2 },
                startNodeId: "anchor1",
                endNodeId: "mass1",
                length: distance(anchor, mass)
            },
            {
                id: "force1",
                type: "force_vector",
                position: mass,
                Fx: 0,
                Fy: massWeight,
                appliedToNodeId: "mass1"
            }
        ]
    };
}

// Scenario 2: Atwood machine - TWO separate ropes, PERFECTLY vertical
function generateScenario02(): Scenario {
    const pulley: Point = { x: 0, y: 0 };
    const pulleyRadius = 30;
    
    // Masses DIRECTLY below pulley (x=0) for perfect vertical alignment
    const mass1: Point = { x: 0, y: 200 };
    const mass2: Point = { x: 0, y: 200 };
    
    // But wait - both masses can't be at same position!
    // For Atwood, we need separate pulleys OR accept slight angle
    // Let's use TWO pulleys, each with vertical rope
    
    return {
        version: "1.4.0",
        name: "Scenario_2_Atwood_Machine",
        description: "Atwood machine: two pulleys, each with perfectly vertical rope",
        gravity: 9.81,
        components: [
            {
                id: "pulley1",
                type: "pulley",
                position: { x: -100, y: 0 },
                radius: pulleyRadius,
                fixed: true
            },
            {
                id: "pulley2",
                type: "pulley",
                position: { x: 100, y: 0 },
                radius: pulleyRadius,
                fixed: true
            },
            {
                id: "mass1",
                type: "mass",
                position: { x: -100, y: 200 },
                mass: 5
            },
            {
                id: "mass2",
                type: "mass",
                position: { x: 100, y: 200 },
                mass: 10
            },
            {
                id: "rope1",
                type: "rope",
                position: { x: -100, y: 100 },
                startNodeId: "mass1",
                endNodeId: "pulley1",
                length: 200
            },
            {
                id: "rope2",
                type: "rope",
                position: { x: 100, y: 100 },
                startNodeId: "pulley2",
                endNodeId: "mass2",
                length: 200
            }
        ]
    };
}

// Scenario 3: Spring and mass
function generateScenario03(): Scenario {
    const anchor: Point = { x: 0, y: -200 };
    const mass: Point = { x: 0, y: 0 };
    
    return {
        version: "1.4.0",
        name: "Scenario_3_Spring_Mass",
        description: "Mass suspended vertically by spring",
        gravity: 9.81,
        components: [
            {
                id: "anchor1",
                type: "anchor",
                position: anchor,
                fixed: true
            },
            {
                id: "mass1",
                type: "mass",
                position: mass,
                mass: 5
            },
            {
                id: "spring1",
                type: "spring",
                position: { x: 0, y: (anchor.y + mass.y) / 2 },
                startNodeId: "anchor1",
                endNodeId: "mass1",
                restLength: 150,
                stiffness: 100,
                currentLength: distance(anchor, mass)
            }
        ]
    };
}

// Scenario 4: Compound pulley - all vertical
function generateScenario04(): Scenario {
    const anchor: Point = { x: 0, y: -200 };
    const pulley: Point = { x: 0, y: -100 };
    const mass: Point = { x: 0, y: 100 };
    
    return {
        version: "1.4.0",
        name: "Scenario_4_Compound_Pulley",
        description: "Compound pulley: anchor-pulley-mass all vertically aligned",
        gravity: 9.81,
        components: [
            {
                id: "anchor1",
                type: "anchor",
                position: anchor,
                fixed: true
            },
            {
                id: "pulley1",
                type: "pulley",
                position: pulley,
                radius: 30,
                fixed: true
            },
            {
                id: "mass1",
                type: "mass",
                position: mass,
                mass: 20
            },
            {
                id: "rope1",
                type: "rope",
                position: { x: 0, y: (anchor.y + pulley.y) / 2 },
                startNodeId: "anchor1",
                endNodeId: "pulley1",
                length: distance(anchor, pulley)
            },
            {
                id: "rope2",
                type: "rope",
                position: { x: 0, y: (pulley.y + mass.y) / 2 },
                startNodeId: "pulley1",
                endNodeId: "mass1",
                length: distance(pulley, mass)
            }
        ]
    };
}

// Scenario 5: Y-configuration (intentionally angled)
function generateScenario05(): Scenario {
    const anchor1: Point = { x: -150, y: -200 };
    const anchor2: Point = { x: 150, y: -200 };
    const mass: Point = { x: 0, y: 100 };
    
    return {
        version: "1.4.0",
        name: "Scenario_5_Y_Configuration",
        description: "Y-shaped: two anchors supporting one mass (intentional angles)",
        gravity: 9.81,
        components: [
            {
                id: "anchor1",
                type: "anchor",
                position: anchor1,
                fixed: true
            },
            {
                id: "anchor2",
                type: "anchor",
                position: anchor2,
                fixed: true
            },
            {
                id: "mass1",
                type: "mass",
                position: mass,
                mass: 15
            },
            {
                id: "rope1",
                type: "rope",
                position: { x: (anchor1.x + mass.x) / 2, y: (anchor1.y + mass.y) / 2 },
                startNodeId: "anchor1",
                endNodeId: "mass1",
                length: distance(anchor1, mass)
            },
            {
                id: "rope2",
                type: "rope",
                position: { x: (anchor2.x + mass.x) / 2, y: (anchor2.y + mass.y) / 2 },
                startNodeId: "anchor2",
                endNodeId: "mass1",
                length: distance(anchor2, mass)
            }
        ]
    };
}

// Scenario 6: Spring and rope combined (vertical chain)
function generateScenario06(): Scenario {
    const anchor: Point = { x: 0, y: -200 };
    const mass1: Point = { x: 0, y: 0 };
    const mass2: Point = { x: 0, y: 150 };
    
    return {
        version: "1.4.0",
        name: "Scenario_6_Spring_Rope_Combined",
        description: "Vertical chain: anchor-spring-mass1-rope-mass2",
        gravity: 9.81,
        components: [
            {
                id: "anchor1",
                type: "anchor",
                position: anchor,
                fixed: true
            },
            {
                id: "mass1",
                type: "mass",
                position: mass1,
                mass: 6
            },
            {
                id: "mass2",
                type: "mass",
                position: mass2,
                mass: 12
            },
            {
                id: "spring1",
                type: "spring",
                position: { x: 0, y: (anchor.y + mass1.y) / 2 },
                startNodeId: "anchor1",
                endNodeId: "mass1",
                restLength: 150,
                stiffness: 100,
                currentLength: distance(anchor, mass1)
            },
            {
                id: "rope1",
                type: "rope",
                position: { x: 0, y: (mass1.y + mass2.y) / 2 },
                startNodeId: "mass1",
                endNodeId: "mass2",
                length: distance(mass1, mass2)
            }
        ]
    };
}

// Scenario 7: Spring pulley - masses on opposite sides, vertical drops
function generateScenario07(): Scenario {
    const springPulley: Point = { x: 0, y: 0 };
    const pulleyRadius = 30;
    
    const mass1: Point = { x: -100, y: 150 };
    const mass2: Point = { x: 100, y: 150 };
    
    return {
        version: "1.4.0",
        name: "Scenario_7_Spring_Pulley",
        description: "Spring pulley with masses hanging vertically on opposite sides",
        gravity: 9.81,
        components: [
            {
                id: "springPulley1",
                type: "spring_pulley",
                position: springPulley,
                radius: pulleyRadius,
                stiffness: 50,
                restLength: 100,
                currentLength: 100,
                axis: "vertical"
            },
            {
                id: "mass1",
                type: "mass",
                position: mass1,
                mass: 8
            },
            {
                id: "mass2",
                type: "mass",
                position: mass2,
                mass: 12
            },
            {
                id: "rope1",
                type: "rope",
                position: { x: mass1.x, y: 75 },
                startNodeId: "mass1",
                endNodeId: "springPulley1",
                length: 200
            },
            {
                id: "rope2",
                type: "rope",
                position: { x: mass2.x, y: 75 },
                startNodeId: "springPulley1",
                endNodeId: "mass2",
                length: 200
            }
        ]
    };
}

// Scenario 8: Pulley becket - vertical chain
function generateScenario08(): Scenario {
    const pulley: Point = { x: 0, y: -100 };
    const mass1: Point = { x: 0, y: 150 };
    const mass2: Point = { x: 0, y: 250 };
    
    return {
        version: "1.4.0",
        name: "Scenario_8_Pulley_Becket",
        description: "Pulley becket with vertical chain of masses",
        gravity: 9.81,
        components: [
            {
                id: "pulleyBecket1",
                type: "pulley_becket",
                position: pulley,
                radius: 30,
                fixed: true
            },
            {
                id: "mass1",
                type: "mass",
                position: mass1,
                mass: 10
            },
            {
                id: "mass2",
                type: "mass",
                position: mass2,
                mass: 8
            },
            {
                id: "rope1",
                type: "rope",
                position: { x: 0, y: 25 },
                startNodeId: "pulleyBecket1",
                endNodeId: "mass1",
                length: distance(pulley, mass1)
            },
            {
                id: "rope2",
                type: "rope",
                position: { x: 0, y: 200 },
                startNodeId: "mass1",
                endNodeId: "mass2",
                length: distance(mass1, mass2)
            }
        ]
    };
}

// Scenario 9: Double pulley - two separate vertical systems
function generateScenario09(): Scenario {
    const pulley1: Point = { x: -100, y: -200 };
    const pulley2: Point = { x: 100, y: -200 };
    
    const mass1: Point = { x: -100, y: 150 };
    const mass2: Point = { x: 100, y: 150 };
    
    return {
        version: "1.4.0",
        name: "Scenario_9_Double_Pulley",
        description: "Two independent pulley systems, each with vertical drops",
        gravity: 9.81,
        components: [
            {
                id: "pulley1",
                type: "pulley",
                position: pulley1,
                radius: 30,
                fixed: true
            },
            {
                id: "pulley2",
                type: "pulley",
                position: pulley2,
                radius: 30,
                fixed: true
            },
            {
                id: "mass1",
                type: "mass",
                position: mass1,
                mass: 6
            },
            {
                id: "mass2",
                type: "mass",
                position: mass2,
                mass: 9
            },
            {
                id: "rope1",
                type: "rope",
                position: { x: mass1.x, y: -25 },
                startNodeId: "mass1",
                endNodeId: "pulley1",
                length: distance(mass1, pulley1)
            },
            {
                id: "rope2",
                type: "rope",
                position: { x: mass2.x, y: -25 },
                startNodeId: "pulley2",
                endNodeId: "mass2",
                length: distance(pulley2, mass2)
            }
        ]
    };
}

// Scenario 10: Complex network - vertical connections
function generateScenario10(): Scenario {
    const anchor1: Point = { x: -100, y: -150 };
    const pulley1: Point = { x: 0, y: -100 };
    const mass1: Point = { x: -100, y: 100 };
    const mass2: Point = { x: 0, y: 150 };
    
    return {
        version: "1.4.0",
        name: "Scenario_10_Complex_Network",
        description: "Complex network with vertical connections",
        gravity: 9.81,
        components: [
            {
                id: "anchor1",
                type: "anchor",
                position: anchor1,
                fixed: true
            },
            {
                id: "pulley1",
                type: "pulley",
                position: pulley1,
                radius: 30,
                fixed: true
            },
            {
                id: "mass1",
                type: "mass",
                position: mass1,
                mass: 10
            },
            {
                id: "mass2",
                type: "mass",
                position: mass2,
                mass: 8
            },
            {
                id: "spring1",
                type: "spring",
                position: { x: -100, y: (anchor1.y + mass1.y) / 2 },
                startNodeId: "anchor1",
                endNodeId: "mass1",
                restLength: 150,
                stiffness: 60,
                currentLength: distance(anchor1, mass1)
            },
            {
                id: "rope1",
                type: "rope",
                position: { x: 0, y: 25 },
                startNodeId: "pulley1",
                endNodeId: "mass2",
                length: distance(pulley1, mass2)
            }
        ]
    };
}

// Scenario 11: Spring pulley becket - Atwood style with spring support
function generateScenario11(): Scenario {
    const springPulleyBecket: Point = { x: 0, y: 0 };
    const pulleyRadius = 30;
    
    const mass1: Point = { x: -100, y: 150 };
    const mass2: Point = { x: 100, y: 150 };
    
    return {
        version: "1.4.0",
        name: "Scenario_11_Spring_Pulley_Becket",
        description: "Spring pulley becket with masses on opposite sides",
        gravity: 9.81,
        components: [
            {
                id: "springPulleyBecket1",
                type: "spring_pulley_becket",
                position: springPulleyBecket,
                radius: pulleyRadius,
                stiffness: 50,
                restLength: 100,
                currentLength: 100,
                axis: "vertical",
                fixed: true
            },
            {
                id: "mass1",
                type: "mass",
                position: mass1,
                mass: 8
            },
            {
                id: "mass2",
                type: "mass",
                position: mass2,
                mass: 12
            },
            {
                id: "rope1",
                type: "rope",
                position: { x: mass1.x, y: 75 },
                startNodeId: "mass1",
                endNodeId: "springPulleyBecket1",
                length: 200
            },
            {
                id: "rope2",
                type: "rope",
                position: { x: mass2.x, y: 75 },
                startNodeId: "springPulleyBecket1",
                endNodeId: "mass2",
                length: 200
            }
        ]
    };
}

// Generate all scenarios
const scenarios = [
    generateScenario01(),
    generateScenario02(),
    generateScenario03(),
    generateScenario04(),
    generateScenario05(),
    generateScenario06(),
    generateScenario07(),
    generateScenario08(),
    generateScenario09(),
    generateScenario10(),
    generateScenario11()
];

// Write to files
import * as fs from 'fs';
import * as path from 'path';

const scenariosDir = path.resolve(process.cwd(), 'scenarios');

scenarios.forEach((scenario, index) => {
    const filename = `scenario_${String(index + 1).padStart(2, '0')}_${scenario.name.toLowerCase().replace(/scenario_\d+_/g, '')}.json`;
    const filepath = path.join(scenariosDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(scenario, null, 2));
    console.log(`✅ Generated: ${filename}`);
});

console.log('\n🎯 All 11 scenarios generated successfully!');
console.log('📋 Key principle: Masses hang VERTICALLY on their side - no rope crossing!');
