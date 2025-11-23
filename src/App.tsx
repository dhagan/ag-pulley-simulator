import './styles/index.css';
import { Canvas } from './components/Sketcher/Canvas';
import { Toolbar } from './components/Toolbar';
import { ResultsPanel } from './components/ResultsPanel';
import { PropertyEditor } from './components/PropertyEditor';
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
            {/* Header */}
            <header
                className="glass"
                style={{
                    padding: 'var(--spacing-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <div>
                    <h1
                        style={{
                            fontSize: '1.5rem',
                            fontWeight: 700,
                            background: 'linear-gradient(135deg, var(--color-accent-blue), var(--color-accent-cyan))',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}
                    >
                        Pulley System Analysis Tool
                    </h1>
                    <p className="text-sm text-secondary">
                        Engineering Analysis • Analytical Solver • SVG Precision
                    </p>
                </div>

                <div className="font-mono text-xs text-muted">
                    v2.0.0-alpha • PSAT
                </div>
            </header>

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
                {/* Left Sidebar - Properties & Animation */}
                <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 'var(--spacing-md)',
                    overflowY: 'auto'
                }}>
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
