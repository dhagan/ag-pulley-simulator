import './styles/index.css';
import { Canvas } from './components/Sketcher/Canvas';
import { Toolbar } from './components/Toolbar';
import { ResultsPanel } from './components/ResultsPanel';

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
                    v1.0.0
                </div>
            </header>

            {/* Toolbar */}
            <Toolbar />

            {/* Main Content */}
            <div
                style={{
                    flex: 1,
                    display: 'grid',
                    gridTemplateColumns: '1fr 350px',
                    gap: 'var(--spacing-md)',
                    minHeight: 0,
                }}
            >
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
