# Role
Act as a Senior Software Architect and Mathematical Modeling Expert.

# Objective
Design and implement a "Pulley System Analysis Tool" (PSAT). This is NOT a game or a standard physics simulation. It is an engineering analysis tool composed of three distinct modules: a Sketcher, an Animator, and a Solver.

# Technology Stack
- **Frontend**: React (TypeScript)
- **Rendering**: SVG (for high-precision technical drawing)
- **State Management**: Zustand or React Context
- **Math Library**: Math.js (for matrix operations and solving systems of equations)

# Core Requirements

## 1. The Sketcher (The "CAD" View)
Create a 2D interactive drawing canvas.
- **Grid System**: Infinite background grid with "Snap-to-Grid" functionality for precise component placement.
- **No Physics Engine**: Components must stay exactly where placed unless moved by the user. No gravity or collisions during sketching.
- **Component Library**:
  - **Anchor**: Fixed points (walls/ceilings).
  - **Pulley**: Fixed or movable wheels.
  - **Rope (Idealized)**: Massless, inextensible strings. Must support routing around pulleys.
  - **Spring**: Linear elastic elements with defined stiffness ($k$).
  - **Mass/Load**: Objects subject to gravity.
  - **Force Vector ($F_a$)**: User-applied external force vectors.
- **Data Structure**: The sketcher must maintain a graph representation of the system (Nodes = Pulleys/Anchors, Edges = Ropes/Springs) to facilitate the Solver step.

## 2. The Solver (The "Brain")
Instead of a time-stepped physics simulation, implement an analytical solver.
- **Equation Generation**: Automatically traverse the graph from the Sketcher to generate the system of static equilibrium equations ($\sum F = 0$, $\sum M = 0$) and geometric constraints (Rope Length $L = constant$).
- **Outputs**:
  - Calculate exact tension in every rope segment.
  - Calculate the total length of rope required.
  - Calculate reaction forces at anchors.
  - Solve for unknown displacements given a force, or unknown forces given a displacement.

## 3. The Animator (The "Visualizer")
- **Kinematic Animation**: Allow the user to drag a "Degree of Freedom" (e.g., pulling the rope end) and visually update the system geometry in real-time based on the geometric constraints.
- **Small Displacement**: Visualize how the system deforms under load (e.g., springs stretching) using the calculated results from the Solver.

# Implementation Steps
1. **Define the Data Model**: Create TypeScript interfaces for `Node`, `Link`, `Constraint`, and `SystemState`.
2. **Build the Canvas**: Implement the React SVG canvas with pan/zoom and snap-to-grid.
3. **Implement "Smart Routing"**: Write a utility that calculates the tangent lines between two circles (pulleys) to draw ropes correctly.
4. **Develop the Equation Builder**: Create a function that takes the current `SystemState` and returns a matrix of linear equations.

# Constraints
- Code must be modular and clean.
- Prioritize engineering accuracy over animation smoothness.
- Use SVG paths for drawing ropes to ensure smooth curves around pulleys.