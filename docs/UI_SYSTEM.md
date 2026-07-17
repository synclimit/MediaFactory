# UI System: MediaFactory

## Layout Architecture
MediaFactory uses a static, full-screen desktop layout designed to maximize workspace efficiency and maintain workflow visibility.

### Layout Core Components
- **No Sidebar Navigation**: The application rejects multi-page/sidebar style navigation. Everything is presented in a unified single-window layout.
- **Static Full-Screen Desktop Layout**: Fixed to viewport dimensions. No window resizing should cause elements to overflow or break.
- **Top Mode Selector**: A persistent horizontal bar at the top of the interface allowing users to switch between Mode 1, Mode 2, and Mode 3.
- **Main Workspace**: The central panel containing inputs, settings, and controls specific to the active mode.
- **Persistent Queue Panel**: A dedicated section of the screen displaying real-time job execution queue, current task status, and terminal log output.
- **Right-Side Profile Drawer**: A slide-out or fixed drawer on the right side of the screen for managing processing profiles and configuration presets.
- **Internal Panel Scrolling Only**: The main viewport itself never scrolls. Scrollbars are confined strictly to individual panels (e.g., the Queue Panel, Workspace Forms, or Log Output views) to ensure standard control controls remain anchored in view.

## Mockup Layout Diagram
```
+-----------------------------------------------------------------------+
|                       Top Mode Selector (1 | 2 | 3)                   |
+---------------------------------------+-------------------------------+
|                                       |                               |
|                                       |  Right-Side Profile Drawer    |
|            Main Workspace             |  (Presets, Options, Paths)    |
|       (Inputs & Configuration)        |                               |
|        [Internal Scroll ONLY]         |     [Internal Scroll ONLY]    |
|                                       |                               |
+---------------------------------------+-------------------------------+
|                       Persistent Queue Panel                          |
|         (Active Jobs, Progress, Local Log Outputs) [Internal Scroll]  |
+-----------------------------------------------------------------------+
```
