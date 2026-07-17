# MediaFactory Design Asset Library (LOCKED)

## IMPORTANT

The folder:

/assets/design/backgrounds/

contains the OFFICIAL MediaFactory SVG Background Library.

This folder currently contains 10 SVG files.

Example:

- midnight-flow-v2-01.svg
- midnight-flow-v2-02.svg
...
- midnight-flow-v2-10.svg

These SVG files are the ONLY approved background assets for the application.

---

## Rules

Gravity MUST NOT generate new random backgrounds.

Gravity MUST reuse one of the existing SVG backgrounds from this folder.

Each screen should simply choose the most appropriate SVG.

Examples:

Workspace Drawer
→ midnight-flow-v2-02.svg

Workspace Picker
→ midnight-flow-v2-05.svg

Workspace Wizard
→ midnight-flow-v2-01.svg

Dashboard
→ midnight-flow-v2-08.svg

Inspector
→ midnight-flow-v2-04.svg

Timeline
→ midnight-flow-v2-09.svg

Queue
→ midnight-flow-v2-03.svg

Settings
→ midnight-flow-v2-06.svg

Modal
→ midnight-flow-v2-07.svg

Render Panel
→ midnight-flow-v2-10.svg

These assignments may change later if a better composition exists.

However,

ALL backgrounds must come ONLY from this SVG library.

---

## Do NOT

Do NOT create procedural SVG.

Do NOT generate CSS vector backgrounds.

Do NOT generate SVG with code.

Do NOT invent new abstract backgrounds.

Do NOT mix different illustration styles.

Do NOT use stock gradients.

Do NOT use generic glass backgrounds.

---

## Reuse Policy

The same SVG may be reused by multiple screens.

Example:

Workspace Drawer
↓

midnight-flow-v2-02.svg

Workspace Settings
↓

midnight-flow-v2-02.svg

Workspace Picker
↓

midnight-flow-v2-05.svg

Inspector
↓

midnight-flow-v2-05.svg

Dashboard
↓

midnight-flow-v2-08.svg

There is NO requirement that every screen has a unique SVG.

Consistency is preferred over variety.

---

## Future Expansion

When additional SVG backgrounds are needed,

they MUST be added to this folder.

Gravity should never generate backgrounds inside components.

Instead:

1. Designer creates SVG.

2. SVG is added into:

/assets/design/backgrounds/

3. Gravity selects one of the approved SVGs.

---

## Permanent UI Language

These SVGs define the visual identity of MediaFactory.

Every future module:

M1

M2

M3

M4

M5

Dashboard

Workspace

Queue

Inspector

Timeline

Dialogs

Drawers

Settings

must follow this design language.

Do NOT introduce a different visual style in future modules.

The MediaFactory UI language is now considered LOCKED.

Every new screen should feel like it belongs to the same application.