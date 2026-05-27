# Kursa Design System

**Version 1.0** · Extracted from the Kursa app and landing page source

This document is the single source of truth for how Kursa looks and feels. Every section of the product — app, landing, emails — should import `kursa-design-system.css` and follow the rules here. Don't eyeball values. Don't hardcode hex codes. Always use the tokens.

---

## Table of Contents

1. [Philosophy](#1-philosophy)
2. [Setup](#2-setup)
3. [Colour Tokens](#3-colour-tokens)
4. [Typography](#4-typography)
5. [Spacing and Sizing](#5-spacing-and-sizing)
6. [Components](#6-components)
7. [Patterns and Conventions](#7-patterns-and-conventions)
8. [Do and Don't](#8-do-and-dont)

---

## 1. Philosophy

Kursa's visual identity is **editorial and precise**. The UI is designed to feel like a very well-made tool — not flashy, not minimal to the point of being sterile. Think: Bloomberg terminal meets a well-designed notebook.

Three properties define the aesthetic at a glance:

- **Warm paper whites** — not #FFFFFF clinical white. The background is `#FAFAF7`, a barely-warm off-white that feels like quality paper.
- **Near-black ink** — text is `#0A0A0A`, not pure black. Small but intentional.
- **Monospace as a design element** — JetBrains Mono is used extensively for metadata, timestamps, labels, and technical details. It's not just for code. It signals precision and system-ness.

The accent colour is a **deep forest green** expressed as an OKLCH value (`oklch(0.42 0.04 160)`). It is low-saturation and appears in very specific places: active state indicators, chosen paths, progress bars, and the Aria AI agent's online status. It should never be used decoratively.

---

## 2. Setup

### Import

Add this to the `<head>` of every HTML page:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="/path/to/kursa-design-system.css" />
```

In a React/Next.js project, import it in your root layout:

```js
import '@/styles/kursa-design-system.css';
```

### Fonts

| Font | Role | Weights used |
|---|---|---|
| **Inter** | All UI prose, headings, body | 300, 400, 500, 600, 700 |
| **JetBrains Mono** | Metadata, timestamps, badges, labels, paths | 400, 500 |

Apply monospace with the utility class `.mono` or via `font-family: var(--font-mono)`.

---

## 3. Colour Tokens

Never hardcode hex values in component styles. Always use these CSS variables.

### Backgrounds

| Token | Value | Use |
|---|---|---|
| `--bg` | `#FAFAF7` | Page canvas, sidebar, main background |
| `--bg-sub` | `#F4F3EE` | Inset areas, hover states, zebra rows |
| `--bg-sub-2` | `#EFEDE6` | Deeper inset (used sparingly) |
| `--surface` | `#FFFFFF` | Cards, modals, panels, inputs |

> **Rule:** Never use pure `#FFFFFF` as a page background. `--surface` is for cards that sit *on top of* the page background.

### Text

| Token | Value | Use |
|---|---|---|
| `--ink` | `#0A0A0A` | Primary headings, strong text, active labels |
| `--ink-2` | `#1F1E1B` | Body text, list items, paragraph content |
| `--ink-3` | `#3A3833` | Tertiary text, less important prose |
| `--mute` | `#6B6962` | Metadata, captions, helper text, timestamps |
| `--mute-2` | `#9A978F` | Placeholder text, disabled labels |
| `--mute-3` | `#B8B5AC` | Very faint — decorative text, divider labels |

### Borders

| Token | Value | Use |
|---|---|---|
| `--line` | `#E8E6E0` | Default card borders, section dividers |
| `--line-2` | `#DCDAD2` | Input outlines, table cell borders |
| `--line-3` | `#CFCCC2` | Focus rings, stronger dividers |

### Accent

| Token | Value | Use |
|---|---|---|
| `--accent` | `oklch(0.42 0.04 160)` | Active nav, chosen paths, progress fills, Aria online status |
| `--accent-soft` | 10% opacity | Chip backgrounds, hover fills, soft highlights |
| `--accent-line` | 35% opacity | Accent-coloured borders |

> **Rule:** Use `--accent` for one thing at a time per view. It should draw the eye to the most important active element on screen. If everything is accented, nothing is.

### Semantic

| Token | Value | Use |
|---|---|---|
| `--good` | `oklch(0.52 0.08 145)` | On-track signals, completed states |
| `--warn` | `oklch(0.60 0.10 60)` | In-progress, caution, soft alerts |

### Diff (Resume Studio)

| Token | Value | Use |
|---|---|---|
| `--diff-add` | `oklch(0.94 0.04 145)` | Added bullet background |
| `--diff-add-ink` | `oklch(0.38 0.07 145)` | Text colour inside added bullets |
| `--diff-del` | `oklch(0.94 0.04 30)` | Removed bullet background |
| `--diff-del-ink` | `oklch(0.45 0.10 30)` | Text colour inside removed bullets |

---

## 4. Typography

### Scale

| Token | Size | Use |
|---|---|---|
| `--text-xs` | 10.5px | Badges, timestamps, kbd hints, `·` separators |
| `--text-sm` | 11.5px | Metadata lines, captions |
| `--text-base` | 13px | Body text, list items, nav labels |
| `--text-md` | 14px | Comfortable reading body, field text |
| `--text-lg` | 15px | Card headings, role titles |
| `--text-xl` | 18px | Step numbers, subheadings |
| `--text-2xl` | 22px | In-page section titles |
| `--text-3xl` | 30px | Page `<h1>` |

For landing/marketing headings, use fluid sizing:
```css
font-size: clamp(34px, 4.2vw, 52px); /* section heading */
font-size: clamp(44px, 6.2vw, 76px); /* hero heading */
```

### Weights

| Token | Value | Use |
|---|---|---|
| `--weight-regular` | 400 | Body prose |
| `--weight-medium` | 500 | Labels, active nav, metadata with emphasis |
| `--weight-semi` | 600 | All headings, strong labels, brand |

### Letter spacing

| Token | Value | Use |
|---|---|---|
| `--tracking-tight` | `-0.02em` | `<h1>`, `<h2>`, large headings |
| `--tracking-tighter` | `-0.03em` | Hero-size headings only |
| `--tracking-mono` | `0.02em` | Section label eyebrows in monospace |

### Utility classes

```html
<!-- Apply monospace font -->
<span class="mono">path / to / page</span>

<!-- Eyebrow label above a section heading -->
<p class="eyebrow">01 · skill gap analysis</p>

<!-- Muted metadata (timestamps, paths, counts) -->
<span class="meta-text">updated · 2h ago</span>

<!-- Lede paragraph below a heading -->
<p class="lede">Most people react to their careers. This platform changes that.</p>
```

---

## 5. Spacing and Sizing

### Spacing scale

| Token | Value | Use |
|---|---|---|
| `--space-1` | 4px | Icon gaps, tight inline spacing |
| `--space-2` | 8px | Element gaps, button icon padding |
| `--space-3` | 12px | Compact row padding |
| `--space-4` | 16px | Card body padding |
| `--space-5` | 20px | Grid gaps, card gaps |
| `--space-6` | 24px | Larger section padding |
| `--space-7` | 28px | Page heading margin-bottom |
| `--space-8` | 32px | Content horizontal padding |
| `--space-10` | 40px | Section vertical spacing |

### Border radii

| Token | Value | Use |
|---|---|---|
| `--radius-sm` | 4px | kbd, tiny badge |
| `--radius-md` | 6px | chip, small button |
| `--radius-lg` | 8px | map node, role card, input |
| `--radius-xl` | 9px | status block, tag group |
| `--radius-2xl` | 11px | primary card (most cards) |
| `--radius-3xl` | 14px | large hero mock surfaces |
| `--radius-full` | 999px | pill |

### App shell dimensions

| Token | Value |
|---|---|
| `--sidebar-width` | 248px |
| `--topbar-height` | 53px |
| `--content-max` | 1180px |
| `--content-pad` | 32px |

---

## 6. Components

All components have base styles in `kursa-design-system.css`. Use the class names below directly. Only add section-specific CSS for layout or composition — never override token values.

### Button `.btn`

```html
<!-- Primary (filled dark) -->
<button class="btn">Generate resume</button>

<!-- Ghost (outlined) -->
<button class="btn ghost">Cancel</button>

<!-- Large -->
<button class="btn lg">Get started</button>

<!-- Small -->
<button class="btn sm ghost">Edit</button>
```

### Card `.card`

```html
<div class="card">
  <div class="card-head">
    <h3>Skill gap analysis</h3>
    <span class="meta">ranked by impact</span>
  </div>
  <div class="card-body">
    <!-- content -->
  </div>
</div>
```

### Chip `.chip`

```html
<!-- Default -->
<span class="chip mono">last refreshed · 2d</span>

<!-- Live indicator (pulsing dot) -->
<span class="chip live mono"><span class="dot"></span>aria · online</span>

<!-- Good / positive -->
<span class="chip good mono"><span class="dot"></span>on track</span>

<!-- Warning -->
<span class="chip warn mono"><span class="dot"></span>gap detected</span>

<!-- Accent (brand highlight) -->
<span class="chip accent mono">chosen path</span>
```

### Tag `.tag`

```html
<!-- Default metadata tag -->
<span class="tag">win</span>

<!-- Accent tag (Aria observations) -->
<span class="tag accent">aria</span>
```

### Keyboard shortcut `.kbd`

```html
<span class="kbd mono">⌘ K</span>
<span class="kbd mono">⌘ ↵</span>
```

### Pulse status dot `.pulse-dot`

```html
<span class="pulse-dot"></span>
```

The pulsing ring animation runs automatically via CSS. Use inside the sidebar status block and Aria topbar indicator.

### Skill bar `.skill-bar`

```html
<!-- Active skill, 5 filled segments -->
<span class="skill-bar">
  <i></i><i></i><i></i><i></i><i></i>
</span>

<!-- Dormant skill (faded segments) -->
<span class="skill-bar">
  <i class="faded"></i><i class="faded"></i><i class="faded"></i>
</span>

<!-- Skill being built (accent colour) -->
<span class="skill-bar">
  <i class="build"></i><i class="build"></i>
  <i class="off"></i><i class="off"></i><i class="off"></i>
</span>
```

### Fit pair `.fit-pair`

```html
<!-- Current fit score -->
<div class="fit-pair">
  <span class="lab">current</span>
  <span class="bar"><i style="width: 74%"></i></span>
  <b>74</b>
</div>

<!-- Strategic fit score (accent colour fill) -->
<div class="fit-pair strat">
  <span class="lab">strategic</span>
  <span class="bar"><i style="width: 92%"></i></span>
  <b>92</b>
</div>
```

### Message bubbles `.msg`

```html
<!-- Aria (agent) message -->
<div class="msg aria">
  <div class="who mono">aria · 14:02</div>
  <div class="body">Given your two-year goal...</div>
</div>

<!-- User message -->
<div class="msg user">
  <div class="body">Should I take the Ramp offer?</div>
</div>
```

### Suggestion chip `.sg`

```html
<span class="sg">How am I tracking against my goals?</span>
<span class="sg">Draft questions for the closing call</span>
```

### Diff lines

Apply directly to `<li>` elements inside a `.doc-pane` resume section:

```html
<li class="diff-add">Led a four-engineer effort to rebuild the payouts ledger...</li>
<li class="diff-del">Worked on the payouts team and helped improve reconciliation.</li>
```

### Mock window chrome `.mock`

Used in landing page product screenshots:

```html
<div class="mock">
  <div class="mhead">
    <div class="row">
      <div class="dots"><span></span><span></span><span></span></div>
      <span class="mono" style="font-size: 11px">kursa.app / home</span>
    </div>
    <span class="chip live mono"><span class="dot"></span>aria · online</span>
  </div>
  <div class="mbody">
    <!-- mock content -->
  </div>
</div>
```

### Empty state `.empty-state`

```html
<div class="empty-state">
  <h3>Nothing here yet</h3>
  <p>Once you activate a career path, your milestones will appear here.</p>
</div>
```

---

## 7. Patterns and Conventions

### Monospace is for metadata, not prose

JetBrains Mono signals "system" information — timestamps, counts, paths, keyboard shortcuts, status labels, and technical identifiers. It is **never** used for paragraph text, headings, or explanatory copy.

Examples of correct use:
- `updated · 2h ago`
- `kursa.app / skills`
- `12 curated · 0 noise`
- `⌘ K`
- `on-path` / `EM signal`

### Eyebrow labels

Section openers always use the eyebrow pattern:

```html
<p class="eyebrow">01 · skill gap</p>
<h2>What's standing between you and your target role</h2>
```

The number prefix (`01 ·`) is optional but used consistently in landing page sections.

### Border vs background for active state

Active sidebar items use a **border + background** combination, not just a background fill:

```css
.sb-item.on {
  background: var(--surface);
  color: var(--ink);
  border: 1px solid var(--line);
}
```

Never use a colour fill alone for active state. The border provides definition.

### Header background on cards and bars

Card headers, topbars, mock window chrome, and version bars always use `#FCFBF8` (slightly darker than `--bg`) rather than `--surface` or `--bg`:

```css
.card-head     { background: #FCFBF8; }
.version-bar   { background: #FCFBF8; }
.mock .mhead   { background: #FCFBF8; }
```

This is a deliberate step above the white card body to create hierarchy without a shadow.

### Dash border for secondary/dashed dividers

Dashed `border-bottom` is used for secondary rows within a list (as opposed to solid borders between major sections):

```css
border-bottom: 1px dashed var(--line);
```

Use solid `var(--line)` for major section breaks, dashed for row items within a section.

### Typography hierarchy inside a card

| Element | Token |
|---|---|
| Card heading (chead h3) | `--text-base`, `--weight-medium` |
| Card body primary text | `--text-base`, `--ink-2` |
| Card body metadata | `--text-xs`, `--mute`, `--font-mono` |

### Grid layouts

The app uses consistent two-column layouts throughout:

```css
/* Home, Skills, Journal — wide left, narrow right */
grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);

/* Path rail, Aria layout — fixed narrow left, flex right */
grid-template-columns: 240px minmax(0, 1fr);

/* Resume studio — equal halves */
grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
```

Always use `minmax(0, 1fr)` (not just `1fr`) in grid columns that contain text to prevent overflow.

### Sticky positioning

- **Sidebar:** `position: sticky; top: 0; height: 100vh`
- **Topbar:** `position: sticky; top: 0; z-index: 10` with frosted glass backdrop
- **Aria dock (home):** `position: fixed; bottom: 24px`

---

## 8. Do and Don't

### Colour

✅ **Do** use `--bg` for page backgrounds  
✅ **Do** use `--surface` for card and panel fills  
✅ **Do** use `--accent` for one focal element per view  
✅ **Do** use `--mute` for timestamps, metadata, and secondary labels  

❌ **Don't** use `#FFFFFF` as a page background  
❌ **Don't** use `--accent` decoratively or for hover fills  
❌ **Don't** hardcode any hex values in section CSS  
❌ **Don't** use pure `#000000` for text — use `--ink`  

### Typography

✅ **Do** use `--font-mono` for all metadata, timestamps, and technical labels  
✅ **Do** use negative letter-spacing (`--tracking-tight`) on all headings  
✅ **Do** use the `.eyebrow` pattern above section headings  

❌ **Don't** use JetBrains Mono for paragraph text or headings  
❌ **Don't** use bold weight for metadata — monospace carries the distinction  
❌ **Don't** mix font sizes outside the scale tokens  

### Components

✅ **Do** use `.chip.live` with a pulsing dot for real-time / online states  
✅ **Do** use `border: 1px dashed var(--line)` for secondary row dividers  
✅ **Do** use `#FCFBF8` for card headers and bar backgrounds  

❌ **Don't** create new button styles — use `.btn`, `.btn.ghost`, `.btn.sm`, `.btn.lg`  
❌ **Don't** add drop shadows to cards — use border `1px solid var(--line)` instead  
❌ **Don't** use rounded pills (`--radius-full`) for primary UI elements — only for specific pill-shaped badges  

### Spacing

✅ **Do** use spacing tokens for all padding and margin  
✅ **Do** use `gap` rather than margin between flex/grid children  

❌ **Don't** use arbitrary pixel values not in the spacing scale  
❌ **Don't** add `padding-bottom` to sections without accounting for the `120px` content bottom padding  

---

*Questions about the design system? Check the source files: `kursa-design-system.css` for tokens and base component styles, `app.css` in the app zip for screen-specific layout rules.*
