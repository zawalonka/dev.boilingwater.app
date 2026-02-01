# Accessibility Overhaul - Detailed TODO

> **Status:** NOT STARTED  
> **Scope:** WCAG 2.1 Level AA compliance across entire React application  
> **Estimated Effort:** 40-50 hours comprehensive; 6-8 hours for quick wins  
> **Priority:** CRITICAL - Currently inaccessible for keyboard and screen reader users  
> **Audit Date:** 2026-02-01

---

## 📋 ACCESSIBILITY AUDIT SUMMARY

**Current State:** ❌ **Not Accessible**
- Game scene entirely mouse/touch-dependent (no keyboard access)
- Form inputs lack label associations
- Status updates not announced to screen readers
- Color contrast insufficient in several areas
- Modal/dialog semantics missing
- Focus management non-existent

**Impact:** Users relying on keyboard navigation or screen readers cannot use the app.

---

## 🔴 PHASE 1: CRITICAL QUICK WINS (6-8 hours) — HIGHEST PRIORITY

These fixes enable basic screen reader and keyboard navigation. Start here.

### 1.1 Form Input Labels
**Files:** `src/components/ControlPanel.jsx`, `src/components/RoomControls.jsx`

- [ ] **Location search input** (line ~386)
  - [ ] Add `<label htmlFor="location-input">Location/Altitude:</label>`
  - [ ] Add `id="location-input"` to input element
  - [ ] Remove placeholder-as-label pattern; keep placeholder as hint
  
- [ ] **Manual altitude input** (line ~414)
  - [ ] Add `<label htmlFor="altitude-input">Altitude (meters):</label>`
  - [ ] Add `id="altitude-input"` to input element
  
- [ ] **Fluid/substance selector dropdown**
  - [ ] Add `<label htmlFor="substance-select">Select Substance:</label>`
  - [ ] Add `id="substance-select"` to select element
  
- [ ] **RoomControls selectors** (AC setpoint, air handler mode, etc.)
  - [ ] Add labels for all dropdown selects
  - [ ] Ensure each has matching `id` and `for` attributes

### 1.2 ARIA Live Regions for Status Updates
**Files:** `src/components/ControlPanel.jsx`, `src/components/GameScene.jsx`

- [ ] **Temperature display**
  - [ ] Wrap temperature/status region in `<div aria-live="polite" aria-atomic="true">`
  - [ ] Announce when water reaches boiling point
  - Example: `<div aria-live="polite">{temperature}°C{isBoiling && " - BOILING!"}</div>`

- [ ] **Boiling detection alert**
  - [ ] Add `aria-live="assertive"` (urgent) when boiling detected
  - [ ] Announce "Water is boiling" immediately

- [ ] **Location error messages**
  - [ ] Move error text into `aria-live="polite"` region
  - [ ] Add `aria-invalid="true"` to input when error occurs

- [ ] **Experiment status messages**
  - [ ] Wrap all status/alert displays in `aria-live` regions
  - [ ] Tutorial completion, level unlocks, etc. should be announced

### 1.3 Modal/Dialog Semantics
**Files:** `src/components/ControlPanel.jsx` (location popup), potential modals in GameScene

- [ ] **Location selection popup**
  - [ ] Replace DIV with semantic `<dialog>` element
  - [ ] Add `aria-modal="true"` (for browser support)
  - [ ] Add `aria-labelledby="dialog-title"` pointing to modal title
  - [ ] Implement focus trap (trap Tab key within modal)
  - [ ] Close on Escape key
  - Example:
    ```jsx
    <dialog open aria-modal="true" aria-labelledby="location-title">
      <h2 id="location-title">Select Location</h2>
      {/* content */}
    </dialog>
    ```

- [ ] **Scorecard modal** (when boiling completes)
  - [ ] Use `<dialog>` element
  - [ ] Focus trap + Escape to close

### 1.4 Icon Button Labels
**Files:** `src/components/ControlPanel.jsx`, `src/components/GameScene.jsx`

- [ ] **Burner control buttons** (↑ ↓)
  - [ ] Add `aria-label="Increase heat"` and `aria-label="Decrease heat"`
  - [ ] Already has some labels; verify all buttons have them

- [ ] **Speed control buttons** (↑ ↓)
  - [ ] Add `aria-label="Speed up"` and `aria-label="Speed down"`

- [ ] **All icon-only buttons**
  - [ ] Audit every `<button>` that contains only a symbol/emoji
  - [ ] Add descriptive `aria-label` if missing

### 1.5 Color Contrast Fixes
**Files:** `src/styles/GameScene.css`, `src/styles/App.css`, `src/styles/ControlPanel.css`

**High Priority (critical text):**
- [ ] Header background + text contrast
  - Check current: appears to be dark on light (verify ratio)
  - Target: 4.5:1 for normal text, 3:1 for large text (18pt+)

- [ ] Status label text (temperature display, boiling indicator)
  - [ ] Check white/light text on colored backgrounds
  - [ ] Verify 4.5:1 contrast ratio

- [ ] Warning/error text colors
  - [ ] Yellow on light backgrounds (WCAG fail)
  - [ ] Change to darker color or darker background

**Tools:** Use WebAIM Contrast Checker (webaim.org/resources/contrastchecker/)

---

## 🟠 PHASE 2: KEYBOARD NAVIGATION & FOCUS (8-10 hours)

Enables full keyboard control of the UI and basic game controls.

### 2.1 Focus Indicators
**Files:** All CSS files (*.css)

- [ ] Add `:focus-visible` styles to all interactive elements
  - [ ] Buttons: add outline or ring effect
  - [ ] Inputs: add outline or shadow
  - [ ] Selects: add outline
  - [ ] Links: add outline
  
Example CSS:
```css
button:focus-visible,
input:focus-visible,
select:focus-visible {
  outline: 3px solid #0066ff;
  outline-offset: 2px;
}
```

- [ ] Test tab order through all controls
  - [ ] Tab key navigates in logical order
  - [ ] Burner controls → Speed controls → Substance selector → Location → Reset

### 2.2 Disabled State Accessibility
**Files:** `src/components/ControlPanel.jsx`, `src/components/RoomControls.jsx`

- [ ] **Disabled buttons**
  - [ ] Apply `disabled` attribute when button is unavailable
  - [ ] Add CSS `:disabled` selector with clear visual style
  - [ ] Ensure text contrast remains 4.5:1 when disabled
  
- [ ] **Disabled inputs**
  - [ ] Add `disabled` attribute to locked selectors (before tutorial complete)
  - [ ] Add CSS styling to show disabled state clearly
  - [ ] Add `aria-disabled="true"` (in addition to disabled attr) if it's just visually disabled

### 2.3 Keyboard Game Controls (Game Scene)
**Files:** `src/components/GameScene.jsx`

**Goal:** Allow keyboard-only users to play the game.

- [ ] **Pot dragging**
  - [ ] Add keyboard event handler: Arrow keys (←→) move pot left/right
  - [ ] `onKeyDown` listener in GameScene
  - [ ] Update pot position based on keypress
  - [ ] Provide visual feedback (focus indicator on draggable area)

- [ ] **Burner control**
  - [ ] +/- keys or W/S keys increase/decrease heat
  - [ ] 0 key = off, 1-9 keys = heat levels
  - [ ] Announce heat level via `aria-live` when changed

- [ ] **Speed control**
  - [ ] [ ] keys decrease/increase speed
  - [ ] Announce speed via `aria-live`

- [ ] **Game scene focus**
  - [ ] Add `role="application"` to main game container
  - [ ] Add `tabindex="0"` so it can receive focus
  - [ ] Add instructions: "Press arrow keys to move pot, +/- for heat, [ ] for speed"

### 2.4 Focus Management in Modals
**Files:** `src/components/ControlPanel.jsx`

- [ ] **Location modal**
  - [ ] On open: focus first input in modal
  - [ ] Tab within modal cycles through modal controls only (focus trap)
  - [ ] On close: restore focus to button that opened modal
  - [ ] Escape key closes modal
  
Example implementation pattern:
```jsx
useEffect(() => {
  if (showLocationPopup) {
    // Focus first input
    document.getElementById('location-input').focus()
  }
}, [showLocationPopup])

// In dialog keydown handler:
const handleKeyDown = (e) => {
  if (e.key === 'Escape') handleLocationClose()
  if (e.key === 'Tab') {
    // Trap focus within modal
    manageFocusWithinModal(e)
  }
}
```

### 2.5 Skip Links
**Files:** `src/components/Header.jsx`, `src/App.jsx`

- [ ] Add "Skip to game" link at very top of page
  - [ ] Hidden by default, visible on focus
  - [ ] Allows keyboard users to bypass header navigation
  - [ ] Link to `<main>` or game container

CSS:
```css
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #000;
  color: #fff;
  padding: 8px;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
```

---

## 🟡 PHASE 3: SEMANTIC HTML & WCAG LEVEL AA (10-12 hours)

Comprehensive semantic improvements for full WCAG 2.1 Level AA compliance.

### 3.1 Semantic Structure
**Files:** All component JSX files

- [ ] **Status display in ControlPanel**
  - [ ] Convert from DIV+SPAN to `<dl>` (definition list)
  - Example:
    ```jsx
    <dl>
      <dt>Water Temperature:</dt>
      <dd>{temperature}°C</dd>
      <dt>Time on Flame:</dt>
      <dd>{timeOnFlame}s</dd>
    </dl>
    ```

- [ ] **Room environment stats** (if displayed)
  - [ ] Use `<dl>` or `<table>` instead of DIVs
  - [ ] If table, add caption: `<caption>Room Environment Status</caption>`

- [ ] **Heading hierarchy**
  - [ ] Verify all headers use proper `<h1>`, `<h2>`, `<h3>` tags
  - [ ] No skipped levels (e.g., `<h1>` directly to `<h3>`)
  - [ ] Only one `<h1>` per page

### 3.2 ARIA Descriptions & Help Text
**Files:** All component JSX files

- [ ] **Form field help text**
  - [ ] Add `aria-describedby` linking inputs to help text
  - [ ] Example:
    ```jsx
    <label htmlFor="altitude">Altitude:</label>
    <input id="altitude" aria-describedby="altitude-help" />
    <span id="altitude-help">Negative = below sea level</span>
    ```

- [ ] **Control descriptions**
  - [ ] Burner control: "Increase or decrease the heater power from 0 to 5000 watts"
  - [ ] Speed control: "Change simulation speed from 1x to 65536x (pause to normal gameplay)"
  - [ ] Substance selector: "Choose water, ethanol, acetone, ammonia, or saltwater"

- [ ] **Room controls**
  - [ ] AC setpoint: "Set target room temperature from 15°C to 28°C"
  - [ ] Air handler: "Choose filtration mode: off, low, medium, or high"

### 3.3 Error Handling
**Files:** `src/components/ControlPanel.jsx`

- [ ] **Location search errors**
  - [ ] Add `aria-invalid="true"` to input when error
  - [ ] Link input to error message with `aria-describedby="error-location"`
  - [ ] Example:
    ```jsx
    <input
      id="location"
      aria-invalid={hasError}
      aria-describedby="location-error"
    />
    {hasError && <span id="location-error" role="alert">Location not found</span>}
    ```

- [ ] **Validation messages**
  - [ ] Use `role="alert"` for error announcements
  - [ ] Screen reader announces error immediately

### 3.4 Image Alt Text
**Files:** `src/components/GameScene.jsx`

- [ ] **Pot images**
  - [ ] "Boiling pot.png": alt="Pot full of boiling water"
  - [ ] "Empty pot.png": alt="Empty pot, waiting to be filled"
  - [ ] "Counter.png": alt="Kitchen counter with stovetop"
  - [ ] "Flame.png": alt="Blue flame from burner (heat intensity visual)"

- [ ] **Verify all background images**
  - [ ] Check if any are decorative-only (can use alt="")
  - [ ] Check if any convey meaning (need proper alt text)

### 3.5 Heading Hierarchy Review
**Files:** All JSX files

- [ ] **Audit current structure**
  - [ ] Note current headings in each file
  - [ ] Identify any skipped levels or duplicate `<h1>`
  
- [ ] **Example audit:**
  - `Header.jsx`: Should have no h1 (header, not main content)
  - `ControlPanel.jsx`: Check for proper nesting if using headings
  - `GameScene.jsx`: If it has headings, verify hierarchy

### 3.6 Table Markup
**Files:** Components that display tabular data

- [ ] **Equipment comparison** (if added later)
  - [ ] Use `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<td>`
  - [ ] Add `<caption>` describing table content
  - [ ] Add `scope="col"` to header cells

---

## 🟢 PHASE 4: TESTING & EDGE CASES (6-8 hours)

Validation and refinement with actual assistive technologies.

### 4.1 Screen Reader Testing
**Tools:** NVDA (free, Windows), JAWS (paid, most common)

- [ ] **Test with NVDA**
  - [ ] Download NVDA (https://www.nvaccess.org/)
  - [ ] Navigate app with Tab key (follow focus)
  - [ ] Verify all labels are announced
  - [ ] Verify `aria-live` regions are announced
  - [ ] Verify button purposes are clear
  - [ ] Test modal: can focus trap be achieved? Does Escape close it?
  - [ ] Listen for any missing descriptions

- [ ] **Game scene keyboard navigation**
  - [ ] Arrow keys move pot (NVDA announces new position)
  - [ ] +/- keys change heat (announce new level)
  - [ ] Verify game is playable via keyboard only

- [ ] **Form navigation**
  - [ ] Tab through location, altitude, substance selectors
  - [ ] Try entering location → Tab to Find button → activate
  - [ ] Error message is announced when location not found

### 4.2 Keyboard-Only Testing
**No mouse/touchpad, keyboard only**

- [ ] **Navigation flow**
  - [ ] Home → Tab to game scene → Arrow keys to move pot → OK
  - [ ] Level selector → Shift+Tab back to header → OK
  - [ ] Speed controls → Shift+Tab back to game → OK

- [ ] **Modal interaction**
  - [ ] Tab into location input → Type city → Tab to Search → Enter → Modal appears
  - [ ] Tab cycles through modal buttons → Escape closes → Focus returns to button

- [ ] **Game completion**
  - [ ] Play entire experiment (boiling water) with keyboard only
  - [ ] Should be fully functional end-to-end

### 4.3 Lighthouse Accessibility Audit
**Chrome DevTools**

- [ ] Open app in Chrome
- [ ] DevTools → Lighthouse → Accessibility
- [ ] Run audit
- [ ] Target: Score ≥ 90 (ideally 95+)
- [ ] Fix any reported issues

### 4.4 Browser Compatibility
**Test across browsers**

- [ ] **Chrome/Edge**
  - [ ] Focus styles visible
  - [ ] Keyboard events work
  - [ ] ARIA attributes recognized

- [ ] **Firefox**
  - [ ] Same checks as Chrome
  - [ ] Focus management works

- [ ] **Safari**
  - [ ] Dialog element supported? (may need polyfill)
  - [ ] aria-modal works?

### 4.5 Edge Cases
**Handle accessibility in specific scenarios**

- [ ] **Tutorial flow**
  - [ ] First-time user with screen reader → gets instruction announced
  - [ ] Level unlock → announcement "Level 2 unlocked"

- [ ] **Error states**
  - [ ] Invalid altitude input → error message announced
  - [ ] Location not found → retry available and announced

- [ ] **State transitions**
  - [ ] Water reaches boiling → announced loudly (aria-live="assertive")
  - [ ] Experiment completes → scorecard modal appears with focus trapped

- [ ] **Equipment locked state**
  - [ ] AC controls disabled before L1E4 → disabled attribute present
  - [ ] Reason announced via aria-label or aria-describedby

---

## 📊 TESTING CHECKLIST

### Before Marking Phase Complete

- [ ] Run `npm run build` — no console errors
- [ ] Lighthouse score ≥ 90 (or all critical issues fixed)
- [ ] axe DevTools scan — 0 critical issues, <5 warnings
- [ ] NVDA test — app fully navigable and understandable
- [ ] Keyboard-only test — can complete tutorial boil
- [ ] Tab order — logical and intuitive
- [ ] Color contrast — all text ≥ 4.5:1 (or 3:1 for large)
- [ ] Focus indicators — visible on all interactive elements
- [ ] Modal behavior — focus trap works, Escape closes

---

## 🧰 TOOLS & RESOURCES

### Browser Extensions
- **axe DevTools** — Scan for accessibility violations (free)
- **WAVE** — Visual accessibility feedback (free)
- **Lighthouse** — Chrome DevTools built-in (free)
- **Color Contrast Analyzer** — TPG (free)

### Screen Readers (Testing)
- **NVDA** — Free, Windows, excellent (https://www.nvaccess.org/)
- **JAWS** — Paid, Windows, industry standard
- **VoiceOver** — Built-in, macOS/iOS
- **TalkBack** — Built-in, Android

### WCAG References
- **WCAG 2.1** — https://www.w3.org/WAI/WCAG21/quickref/
- **WAI-ARIA Practices** — https://www.w3.org/WAI/ARIA/apg/
- **MDN: Web Accessibility** — https://developer.mozilla.org/en-US/docs/Web/Accessibility

### Example Repos
- **Accessible React** — https://github.com/a11y-101/
- **WAI-ARIA Examples** — https://www.w3.org/WAI/ARIA/apg/patterns/

---

## 📝 NOTES FOR DEVELOPERS

### Key Decisions

1. **Game as Application, Not Document**
   - Game scene uses `role="application"` because it requires custom keyboard controls (not standard Web controls)
   - This tells screen readers: "User interaction here is non-standard, listen for custom announcements"

2. **ARIA Live vs Alert**
   - `aria-live="polite"` — wait for user to pause, then announce (temperature updates)
   - `aria-live="assertive"` — interrupt immediately (boiling detected!)
   - `role="alert"` — same as assertive, specific for alerts

3. **Focus Trap in Modal**
   - Catch `Tab` key, determine if focus is on last element
   - If so, set focus back to first element (circular trap)
   - Escape key always closes modal

4. **Color Contrast**
   - Normal text: 4.5:1 ratio (WCAG AA)
   - Large text (18pt+): 3:1 ratio (WCAG AA)
   - Graphics/UI: 3:1 ratio (WCAG AA)
   - Use WebAIM Contrast Checker for precise values

5. **Keyboard Shortcuts for Game**
   - Arrow keys: Move pot (discoverable, intuitive)
   - +/−: Adjust heat (secondary labeling clear)
   - [ ]: Adjust speed (less intuitive, but documented)
   - Minimize custom shortcuts; leverage Web standard patterns

---

## 🔗 DEPENDENCIES

- **No new npm packages required**
- Use built-in React event handlers and HTML APIs
- Use native `<dialog>` element (IE 11 not supported, but acceptable for educational app)
- No third-party a11y libraries needed initially

---

## 📌 SUCCESS CRITERIA

**Phase 1 Complete:** 
- All form inputs have labels
- Status updates announced via aria-live
- Modals are semantic dialogs with focus management
- Icon buttons have aria-label
- Color contrast ≥ 4.5:1 on critical text

**Phase 2 Complete:**
- All buttons/inputs have `:focus-visible` styles
- Tab order is logical
- Game playable via keyboard (arrow keys, +/−, [ ])
- Modals trap focus, Escape closes

**Phase 3 Complete:**
- WCAG 2.1 Level AA compliant
- All semantic HTML in place
- ARIA descriptions linked
- Error handling accessible

**Phase 4 Complete:**
- NVDA fully usable
- Keyboard-only play tested
- Lighthouse score ≥ 90
- Zero critical axe violations

---

**Estimated Timeline:** 40-50 hours (comprehensive), 6-8 hours (quick wins Phase 1)  
**Team Size:** 1 developer recommended (familiar with codebase)  
**Complexity:** Medium (requires understanding of ARIA, focus management, keyboard events)

