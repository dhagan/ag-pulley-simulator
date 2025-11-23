// @ts-nocheck
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PropertyEditor } from '../PropertyEditor';
import { useSystemStore } from '../../store/useSystemStore';
import { ComponentType } from '../../types';

vi.mock('../../store/useSystemStore');

describe('PropertyEditor', () => {
    const mockUpdateComponent = vi.fn();
    const mockRemoveComponent = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows "No component selected" when nothing is selected', () => {
        (useSystemStore as any).mockImplementation((selector: any) =>
            selector({
                system: { components: [] },
                ui: { selectedComponentId: null },
                updateComponent: mockUpdateComponent,
                removeComponent: mockRemoveComponent,
            })
        );
        render(<PropertyEditor />);
        expect(screen.getByText(/No component selected/i)).toBeInTheDocument();
    });

    it('displays mass properties when mass is selected', () => {
        const mass = {
            id: 'mass1',
            type: ComponentType.MASS,
            position: { x: 0, y: 0 },
            mass: 10,
        };
        (useSystemStore as any).mockImplementation((selector: any) =>
            selector({
                system: { components: [mass] },
                ui: { selectedComponentId: 'mass1' },
                updateComponent: mockUpdateComponent,
                removeComponent: mockRemoveComponent,
            })
        );
        render(<PropertyEditor />);
        expect(screen.getByText(/Mass Properties/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Mass \(kg\)/i)).toHaveValue(10);
    });

    it('updates mass value when input changes', () => {
        const mass = {
            id: 'mass1',
            type: ComponentType.MASS,
            position: { x: 0, y: 0 },
            mass: 10,
        };
        (useSystemStore as any).mockImplementation((selector: any) =>
            selector({
                system: { components: [mass] },
                ui: { selectedComponentId: 'mass1' },
                updateComponent: mockUpdateComponent,
                removeComponent: mockRemoveComponent,
            })
        );
        render(<PropertyEditor />);
        const massInput = screen.getByLabelText(/Mass \(kg\)/i);
        fireEvent.change(massInput, { target: { value: '15' } });
        fireEvent.blur(massInput);
        expect(mockUpdateComponent).toHaveBeenCalledWith('mass1', { mass: 15 });
    });

    it('displays pulley properties when pulley is selected', () => {
        const pulley = {
            id: 'pulley1',
            type: ComponentType.PULLEY,
            position: { x: 0, y: 0 },
            radius: 30,
            fixed: true,
        };
        (useSystemStore as any).mockImplementation((selector: any) =>
            selector({
                system: { components: [pulley] },
                ui: { selectedComponentId: 'pulley1' },
                updateComponent: mockUpdateComponent,
                removeComponent: mockRemoveComponent,
            })
        );
        render(<PropertyEditor />);
        expect(screen.getByText(/Pulley Properties/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Radius/i)).toHaveValue(30);
    });

    it('deletes component when delete button clicked', () => {
        const mass = {
            id: 'mass1',
            type: ComponentType.MASS,
            position: { x: 0, y: 0 },
            mass: 10,
        };
        (useSystemStore as any).mockImplementation((selector: any) =>
            selector({
                system: { components: [mass] },
                ui: { selectedComponentId: 'mass1' },
                updateComponent: mockUpdateComponent,
                removeComponent: mockRemoveComponent,
            })
        );
        render(<PropertyEditor />);
        const deleteButton = screen.getByText(/Delete/i);
        fireEvent.click(deleteButton);
        expect(mockRemoveComponent).toHaveBeenCalledWith('mass1');
    });
});
