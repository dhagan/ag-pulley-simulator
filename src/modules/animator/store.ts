import { create } from 'zustand';
import { AnimationState, DegreeOfFreedom, AnimationFrame, Point } from '../../types';

/**
 * Animator Store
 * Manages animation state for kinematic visualization
 */

interface AnimatorStore {
    animation: AnimationState;
    
    // Actions
    play: () => void;
    pause: () => void;
    reset: () => void;
    setTime: (time: number) => void;
    addDegreeOfFreedom: (dof: DegreeOfFreedom) => void;
    updateDOFPosition: (dofId: string, position: Point) => void;
    setDuration: (duration: number) => void;
    addFrame: (frame: AnimationFrame) => void;
    clearFrames: () => void;
}

const initialAnimationState: AnimationState = {
    isPlaying: false,
    currentTime: 0,
    duration: 5, // 5 seconds default
    frames: [],
    degreesOfFreedom: []
};

export const useAnimatorStore = create<AnimatorStore>((set, get) => ({
    animation: initialAnimationState,
    
    play: () => {
        set((state) => ({
            animation: { ...state.animation, isPlaying: true }
        }));
        
        // Start animation loop
        const animate = () => {
            const state = get().animation;
            if (!state.isPlaying) return;
            
            const newTime = state.currentTime + 0.016; // ~60fps
            
            if (newTime >= state.duration) {
                // Loop or stop
                set((s) => ({
                    animation: { 
                        ...s.animation, 
                        isPlaying: false,
                        currentTime: state.duration 
                    }
                }));
            } else {
                set((s) => ({
                    animation: { ...s.animation, currentTime: newTime }
                }));
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    },
    
    pause: () => {
        set((state) => ({
            animation: { ...state.animation, isPlaying: false }
        }));
    },
    
    reset: () => {
        set((state) => ({
            animation: { ...state.animation, currentTime: 0, isPlaying: false }
        }));
    },
    
    setTime: (time: number) => {
        set((state) => ({
            animation: { 
                ...state.animation, 
                currentTime: Math.max(0, Math.min(time, state.animation.duration))
            }
        }));
    },
    
    addDegreeOfFreedom: (dof: DegreeOfFreedom) => {
        set((state) => ({
            animation: {
                ...state.animation,
                degreesOfFreedom: [...state.animation.degreesOfFreedom, dof]
            }
        }));
    },
    
    updateDOFPosition: (dofId: string, position: Point) => {
        set((state) => ({
            animation: {
                ...state.animation,
                degreesOfFreedom: state.animation.degreesOfFreedom.map(dof =>
                    dof.id === dofId ? { ...dof, currentPosition: position } : dof
                )
            }
        }));
    },
    
    setDuration: (duration: number) => {
        set((state) => ({
            animation: { ...state.animation, duration: Math.max(0.1, duration) }
        }));
    },
    
    addFrame: (frame: AnimationFrame) => {
        set((state) => ({
            animation: {
                ...state.animation,
                frames: [...state.animation.frames, frame]
            }
        }));
    },
    
    clearFrames: () => {
        set((state) => ({
            animation: { ...state.animation, frames: [] }
        }));
    }
}));
