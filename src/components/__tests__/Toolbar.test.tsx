// @ts-nocheck
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Toolbar } from '../Toolbar';
import { useSystemStore } from '../../store/useSystemStore';
import { Tool } from '../../types';

// Mock the store
vi.mock('../../store/useSystemStore');

describe('Toolbar', () => {
    const mockSetTool = vi.fn();
    const mockToggleGrid = vi.fn();
    const mockToggleSnapToGrid = vi.fn();
    const mockToggleFBD = vi.fn();
    const mockReset = vi.fn();
    const mockUndo = vi.fn();
    const mockCreateTestSystem = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useSystemStore as any).mockImplementation((selector: any) =>
            selector({
                ui: {
                    currentTool: Tool.SELECT,
                    showGrid: true,
                    showFBD: false,
                    canvas: { snapToGrid: true },
                },
                history: [],
                setTool: mockSetTool,
                toggleGrid: mockToggleGrid,
                toggleSnapToGrid: mockToggleSnapToGrid,
                toggleFBD: mockToggleFBD,
                reset: mockReset,
                undo: mockUndo,
                createTestSystem: mockCreateTestSystem,
            })
        );
    });

    it('renders all tool buttons', () => {
        render(<Toolbar />);
        expect(screen.getByText(/Select/i)).toBeInTheDocument();
        expect(screen.getByText(/Pan/i)).toBeInTheDocument();
        expect(screen.getByText(/Anchor/i)).toBeInTheDocument();
        expect(screen.getByText(/Pulley/i)).toBeInTheDocument();
        expect(screen.getByText(/Mass/i)).toBeInTheDocument();
        expect(screen.getByText(/Rope/i)).toBeInTheDocument();
        expect(screen.getByText(/Spring/i)).toBeInTheDocument();
        expect(screen.getByText(/Force/i)).toBeInTheDocument();
    });

    it('highlights the current tool', () => {
        render(<Toolbar />);
        const selectButton = screen.getByText(/Select/i).closest('button');
        expect(selectButton).toHaveClass('selected');
    });

    it('calls setTool when a tool button is clicked', () => {
        render(<Toolbar />);
        const pulleyButton = screen.getByText(/Pulley/i);
        fireEvent.click(pulleyButton);
        expect(mockSetTool).toHaveBeenCalledWith(Tool.ADD_PULLEY);
    });

    it('toggles grid visibility', () => {
        render(<Toolbar />);
        const gridButton = screen.getByText(/Grid/i);
        fireEvent.click(gridButton);
        expect(mockToggleGrid).toHaveBeenCalled();
    });

    it('toggles snap to grid', () => {
        render(<Toolbar />);
        const snapButton = screen.getByText(/Snap/i);
        fireEvent.click(snapButton);
        expect(mockToggleSnapToGrid).toHaveBeenCalled();
    });

    it('toggles FBD display', () => {
        render(<Toolbar />);
        const fbdButton = screen.getByText(/FBD/i);
        fireEvent.click(fbdButton);
        expect(mockToggleFBD).toHaveBeenCalled();
    });

    it('creates test system', () => {
        render(<Toolbar />);
        const testButton = screen.getByText(/Test/i);
        fireEvent.click(testButton);
        expect(mockCreateTestSystem).toHaveBeenCalled();
    });

    it('resets the system', () => {
        render(<Toolbar />);
        const resetButton = screen.getByText(/Reset/i);
        fireEvent.click(resetButton);
        expect(mockReset).toHaveBeenCalled();
    });

    it('enables undo button when history exists', () => {
        (useSystemStore as any).mockImplementation((selector: any) =>
            selector({
                ui: { currentTool: Tool.SELECT, showGrid: true, showFBD: false, canvas: { snapToGrid: true } },
                history: [{}],
                setTool: mockSetTool,
                toggleGrid: mockToggleGrid,
                toggleSnapToGrid: mockToggleSnapToGrid,
                toggleFBD: mockToggleFBD,
                reset: mockReset,
                undo: mockUndo,
                createTestSystem: mockCreateTestSystem,
            })
        );
        render(<Toolbar />);
        const undoButton = screen.getByText(/Undo/i).closest('button');
        expect(undoButton).not.toBeDisabled();
    });
});
