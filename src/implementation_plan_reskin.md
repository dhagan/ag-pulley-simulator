---
title: Engineering Reskin & Mobile Optimization Plan
description: Plan to reskin the application with an engineering aesthetic and improve usability on small screens.
---

# Goals
1.  **Engineering Aesthetic**: "Blueprint" / "CAD" style. High contrast, sharp edges, technical typography.
2.  **Small Format Usability**: Responsive layout, collapsible panels, touch-friendly targets.

# 1. Design System Update (CSS)
-   **Colors**:
    -   Background: Deep Slate/Blueprint Blue (`#1e293b` or darker).
    -   Grid: Fine lines, distinct major/minor grid.
    -   Text: Monospace for data (`JetBrains Mono`, `Consolas`).
    -   Accents: Safety Orange, Signal Blue, Neon Green.
-   **UI Elements**:
    -   Remove border-radius (Sharp edges).
    -   Borders: 1px solid high-contrast.
    -   Shadows: Minimal or removed (flat design).
    -   Glassmorphism: Replace with solid semi-transparent technical backgrounds.

# 2. Layout Refactor (App.tsx)
-   **Responsive Grid**:
    -   Desktop: `[Left Panel (300px)] [Canvas (Flex)] [Right Panel (350px)]`
    -   Mobile/Tablet: `[Header/Toolbar] [Canvas] [Bottom Nav/Overlays]`
-   **Panel Management**:
    -   Implement `PanelManager` or simple state to toggle visibility of Left/Right panels on small screens.
    -   Add "Hamburger" or "Menu" button for mobile.

# 3. Component Updates
-   **Toolbar**:
    -   Desktop: Top bar (current).
    -   Mobile: Floating Action Button (FAB) or Bottom Bar? Or scrollable top bar.
    -   Style: Square buttons, clear icons, active state = inverted colors.
-   **Canvas**:
    -   Update Grid rendering (in `Grid.tsx` or CSS) to match blueprint style.
    -   Update Component colors (in `index.css` variables).
-   **ResultsPanel**:
    -   "Data Log" style. Monospace font.
    -   Compact view for mobile.
-   **PropertyEditor**:
    -   Technical form controls.

# 4. Implementation Steps
1.  **Update `index.css`**: Define new variables and global styles.
2.  **Refactor `App.tsx`**: Replace inline layout with responsive CSS classes. Add toggle state for panels.
3.  **Update `Toolbar.tsx`**: Improve responsiveness.
4.  **Verify**: Check on mobile viewport size.
