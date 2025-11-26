import { useState } from 'react';
import './styles/index.css';
import { Canvas } from './components/Sketcher/Canvas';
import { Toolbar } from './components/Toolbar';
import { ResultsPanel } from './components/ResultsPanel';
import { PropertyEditor } from './components/PropertyEditor';
import { TestScenarios } from './components/TestScenarios';
import { AnimatorControls } from './modules/animator';

function App() {
    const [mobilePanel, setMobilePanel] = useState<'none' | 'left' | 'right'>('none');

    const toggleLeft = () => setMobilePanel(prev => prev === 'left' ? 'none' : 'left');
    const toggleRight = () => setMobilePanel(prev => prev === 'right' ? 'none' : 'right');

    return (
        <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Toolbar */}
            <Toolbar onToggleLeft={toggleLeft} onToggleRight={toggleRight} mobilePanel={mobilePanel} />

            {/* Main Content */}
            <div className="app-layout">
                {/* Left Sidebar - Test Scenarios & Properties */}
                <div className={`sidebar-left ${mobilePanel === 'left' ? 'sidebar-visible' : ''}`} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--spacing-md)',
                    minHeight: 0,
                    overflowY: 'auto'
                }}>
                    {/* Mobile Close Button */}
                    <div className="mobile-only" style={{ display: mobilePanel === 'left' ? 'flex' : 'none', justifyContent: 'flex-end' }}>
                        <button onClick={() => setMobilePanel('none')}>Close</button>
                    </div>

                    <TestScenarios />
                    <PropertyEditor />
                    <AnimatorControls />
                </div>

                {/* Canvas */}
                <div className="glass" style={{ overflow: 'hidden', position: 'relative' }}>
                    <Canvas />
                </div>

                {/* Results Panel */}
                <div className={`sidebar-right ${mobilePanel === 'right' ? 'sidebar-visible' : ''}`} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 0,
                    overflowY: 'auto'
                }}>
                    {/* Mobile Close Button */}
                    <div className="mobile-only" style={{ display: mobilePanel === 'right' ? 'flex' : 'none', justifyContent: 'flex-end', marginBottom: '8px' }}>
                        <button onClick={() => setMobilePanel('none')}>Close</button>
                    </div>
                    <ResultsPanel />
                </div>
            </div>
        </div>
    );
}

export default App;
