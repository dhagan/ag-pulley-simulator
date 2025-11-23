import './styles/index.css';
import { Canvas } from './components/Sketcher/Canvas';
import { Toolbar } from './components/Toolbar';
import { ResultsPanel } from './components/ResultsPanel';
import { PropertyEditor } from './components/PropertyEditor';
import { TestScenarios } from './components/TestScenarios';
import { AnimatorControls } from './modules/animator';

function App() {
    return (
        <div
            style={{
                width: '100vw',
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-md)',
                padding: 'var(--spacing-md)',
            }}
        >
            {/* Toolbar */}
            <Toolbar />

            {/* Main Content */}
            <div
                style={{
                    flex: 1,
                    display: 'grid',
                    gridTemplateColumns: '300px 1fr 350px',
                    gap: 'var(--spacing-md)',
                    minHeight: 0,
                }}
            >
                {/* Left Sidebar - Test Scenarios & Properties */}
                <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    gap: 'var(--spacing-md)',
                    minHeight: 0,
                    overflowY: 'auto'
                }}>
                    <TestScenarios />
                    <PropertyEditor />
                    <AnimatorControls />
                </div>

                {/* Canvas */}
                <div className="glass" style={{ overflow: 'hidden' }}>
                    <Canvas />
                </div>

                {/* Results Panel */}
                <ResultsPanel />
            </div>
        </div>
    );
}

export default App;
