# UPDATE — MASTER_UI_DESIGN_LANGUAGE.md

---

# SECTION XX — Adaptive Fill Layout System

## Philosophy

MediaFactory is a desktop production application.

It is NOT a website.

It is NOT a mobile application.

Every workspace must maximize the available screen area while maintaining a clean, premium appearance.

The goal is:

> Every pixel should have a purpose.

This does NOT mean filling every area with controls.

Instead, layouts should intelligently distribute components to avoid large unused spaces.

---

# Core Principles

## 1. No Dead Space

Large empty areas are not allowed unless they intentionally improve readability.

If an area becomes empty:

- Expand nearby panels.
- Increase panel width.
- Increase panel height.
- Rearrange into multiple columns.
- Adapt the grid automatically.

The workspace should always feel balanced.

---

## 2. Adaptive Fill

Every page should automatically use available space.

Example:

Instead of:

Panel A

(empty)

Panel B

Use:

Panel A expands

or

Panel B expands

or

Panels become two columns.

---

## 3. Adaptive Columns

Single-column layouts should only be used when necessary.

Whenever possible:

Use two columns.

If space allows:

Use three columns.

Examples:

Mastering Controls

Instead of:

Bass

Treble

Limiter

Compressor

Use:

Bass            Treble

Limiter         Compressor

Stereo          Normalize

EQ              LUFS

This improves readability and uses horizontal desktop space efficiently.

---

## 4. Adaptive Cards

Cards should expand naturally.

Never create oversized margins around cards.

Cards should:

Fill available width.

Maintain equal height.

Wrap automatically.

Avoid isolated cards floating inside empty space.

---

## 5. Adaptive Panel Height

Panels should occupy available height intelligently.

If one panel has little content while another overflows:

Resize both panels proportionally.

Scrolling should occur inside the panel, not on the page.

---

## 6. Internal Scrolling Only

The root application window must never scroll.

Only individual panels may scroll.

Examples:

✓ Source Pool

✓ Asset Library

✓ Output Preview

✓ Queue

✓ Playlist

✓ Typography Library

✓ Template Browser

Never the entire workspace.

---

## 7. Responsive Workspace

The workspace should continuously rebalance itself.

Example:

Few controls

↓

Panels become wider.

Many controls

↓

Panels split into additional columns.

More preview items

↓

Cards wrap automatically.

No manual resizing should be required.

---

## 8. Professional Density

The interface should feel:

Dense enough to maximize productivity.

Open enough to remain comfortable.

Avoid:

Huge empty areas.

Excessive whitespace.

Oversized padding.

Tiny controls surrounded by unused space.

The goal is an efficient professional desktop workspace.

---

## 9. Progressive Expansion

Panels should appear progressively as the workflow advances.

Empty state:

Only required panels are visible.

After user action:

Additional panels fade in.

Existing panels resize smoothly.

The overall layout remains stable.

The workspace should evolve naturally instead of forcing users through wizard-style pages.

---

## 10. Consistency Across Modules

This Adaptive Fill Layout System applies globally.

Required modules:

✓ M1

✓ M2

✓ M3

✓ M4

✓ M5

✓ Channels

✓ Import

✓ Review

✓ Completed

✓ Render Queue

✓ Workspace Manager

✓ Template Manager

✓ Future modules

No module may ignore these layout rules.