# Localization / Internationalization (i18n) TODO

> **Status:** PLANNING — Depends on Accessibility Phase 1 completion  
> **Target First Language:** Spanish (es)  
> **Estimated Effort:** 30-40 hours (architecture + Spanish translation)  
> **Priority:** DEFERRED — After accessibility adds complete UI string set

---

## 📋 OVERVIEW

Enable Boiling Water to support multiple languages. Start with a robust architecture that makes adding new languages trivial.

**Why After Accessibility:**
- Accessibility improvements will add new strings (aria-labels, keyboard hints, sr-only descriptions)
- Better to build localization infrastructure once with the final, complete string set
- Avoids translating strings twice

**Scope:** Game UI, wiki content, substance descriptions, errors/alerts, experiment instructions

---

## 🏗️ ARCHITECTURE

### File Structure
**Location:** `public/locales/`

```
public/locales/
├── en.json          # English (default/master)
├── es.json          # Spanish
├── fr.json          # French (future)
└── de.json          # German (future)
```

### Key Naming Conventions

**Hierarchical structure** for maintainability:
```json
{
  "game": {
    "title": "Boiling Water",
    "subtitle": "Learn Physics Through Interactive Simulation",
    "controls": {
      "burner": "Burner",
      "burner_up": "Increase Heat",
      "burner_down": "Decrease Heat"
    }
  },
  "experiment": {
    "boiling_water": "Boiling Water",
    "altitude_effect": "Altitude's Effect on Boiling Point",
    "different_fluids": "Different Substances"
  },
  "room": {
    "ac_unit": "Air Conditioner",
    "air_handler": "Air Handler"
  },
  "error": {
    "location_not_found": "Location not found. Try another search.",
    "invalid_altitude": "Altitude must be between -430m and 11,000m"
  }
}
```

**Naming rules:**
- `snake_case` for keys (all lowercase, underscores for spaces)
- Hierarchical organization (objects nested by feature area)
- English text as default values
- Comments for context (translator notes)

---

## 🔧 IMPLEMENTATION TASKS

### Phase 1: Architecture (10-12 hours)

- [ ] **Localization Hook/Context**
  - [ ] Create `src/hooks/useLocalization.js` OR `src/contexts/LocalizationContext.jsx`
  - [ ] Load locale JSON files dynamically (e.g., `import en from 'public/locales/en.json'`)
  - [ ] Provide `t(key)` function: `t('game.title')` → "Boiling Water"
  - [ ] Support fallback to English if translation missing
  - [ ] Return current language + function to switch language

- [ ] **Locale Persistence**
  - [ ] Save selected language to localStorage on change
  - [ ] Load saved language on app startup
  - [ ] Default to browser language if available, else English

- [ ] **Create Master English Localization File**
  - [ ] Extract all hardcoded strings from React components
  - [ ] Create `public/locales/en.json` with all game strings
  - [ ] Organize hierarchically (game, experiment, room, error, etc.)
  - [ ] Include context comments for translators

- [ ] **Language Picker UI**
  - [ ] Add language selector to Header.jsx (top-right corner)
  - [ ] Display flag emoji or language code (ES, EN, FR, DE)
  - [ ] Wire to locale context to switch language
  - [ ] Show selected language indicator

### Phase 2: String Integration (15-18 hours)

- [ ] **Replace Hardcoded Strings in Components**
  - [ ] `src/components/Header.jsx` — Navigation labels, dropdowns
  - [ ] `src/components/ControlPanel.jsx` — Temperature, timer, location labels
  - [ ] `src/components/GameScene.jsx` — Pot, burner, steam labels
  - [ ] `src/components/RoomControls.jsx` — AC, air handler labels
  - [ ] Verify all UI strings use `t()` function

- [ ] **Update Experiment Data**
  - [ ] Move experiment names/descriptions to localization
  - [ ] `EXPERIMENTS` in `src/constants/workshops.js` should reference i18n keys
  - [ ] Example: `name: 'experiment.boiling_water'` → rendered via `t()`

- [ ] **Update Error Messages**
  - [ ] Location search errors: "Location not found"
  - [ ] Altitude validation: "Altitude must be between -430m and 11,000m"
  - [ ] Physics errors: "Boiling point calculation outside verified range"
  - [ ] All errors should use `t('error.key')`

- [ ] **Update Substance Descriptions**
  - [ ] Substance names (water, ethanol, acetone, etc.)
  - [ ] Phase state names (solid, liquid, gas)
  - [ ] Safety notes, uses, properties
  - [ ] Consider: Keep educational notes in English for now, localize later

### Phase 3: Spanish Localization (8-10 hours)

- [ ] **Create Spanish Translation File**
  - [ ] `public/locales/es.json` with all strings from en.json
  - [ ] Professional translation (not machine translation)
  - [ ] Consider hiring a translator for educational accuracy

- [ ] **Verify Spanish Rendering**
  - [ ] Test all UI components in Spanish
  - [ ] Check text overflow/layout issues (Spanish text is ~10-30% longer)
  - [ ] Verify RTL support not needed (Spanish is LTR)
  - [ ] Test special characters (á, é, í, ó, ú, ñ)

### Phase 4: QA & Documentation (5-6 hours)

- [ ] **Testing**
  - [ ] Switch language via UI → verify all strings update
  - [ ] Refresh page → verify language persists (localStorage)
  - [ ] Test fallback (remove one key → verify English shows)
  - [ ] Test on mobile (language picker visible, not crowded)

- [ ] **Documentation**
  - [ ] Add "How to Add a New Language" guide
  - [ ] Document key naming conventions
  - [ ] Create translation checklist (all keys translated)
  - [ ] List any keys that should NOT be translated (technical terms, proper nouns)

- [ ] **Translation Workflow**
  - [ ] Create GitHub issue template for translation requests
  - [ ] Document review process (verify accuracy, completeness)
  - [ ] Set up contributor credit tracking

---

## 📝 MASTER ENGLISH LOCALIZATION STRUCTURE

**Example `public/locales/en.json`:**

```json
{
  "_meta": {
    "language": "English",
    "languageCode": "en",
    "lastUpdated": "2026-02-02",
    "translator": "Boiling Water Team"
  },

  "game": {
    "title": "Boiling Water",
    "subtitle": "Learn Physics Through Interactive Simulation",
    "status": "Pre-Alpha"
  },

  "header": {
    "level": "Level:",
    "experiment": "Experiment:",
    "workshop": "Workshop:",
    "menu": "Menu"
  },

  "controls": {
    "burner": "Burner",
    "burner_up": "Increase Heat",
    "burner_down": "Decrease Heat",
    "burner_off": "Off",
    "speed": "Speed:",
    "timer": "Timer:",
    "timer_start": "Start Timer",
    "timer_pause": "Pause Timer",
    "timer_reset": "Reset Timer"
  },

  "experiment": {
    "boiling_water": "Boiling Water",
    "altitude_effect": "Altitude's Effect on Boiling Point",
    "different_fluids": "Different Substances",
    "dangerous_liquids": "Dangerous Liquids"
  },

  "location": {
    "search": "Search for a Location (Worldwide)",
    "enter_manually": "Enter Altitude Manually",
    "placeholder": "City, landmark, or place (Death Valley, Mt Everest, Tokyo)",
    "altitude_label": "Altitude (meters)",
    "set_location": "📍 Set Your Location",
    "determining": "Determining altitude from location..."
  },

  "substance": {
    "label": "Substance:",
    "water": "Water",
    "ethanol": "Ethanol",
    "acetone": "Acetone",
    "ammonia": "Ammonia"
  },

  "room": {
    "ac_unit": "AC Unit:",
    "air_handler": "Air Handler:",
    "ac_setpoint": "AC Setpoint:",
    "decrease": "Decrease",
    "increase": "Increase"
  },

  "temperature": {
    "label": "Temperature:",
    "celsius": "°C",
    "fahrenheit": "°F"
  },

  "error": {
    "location_not_found": "Location not found. Try another search.",
    "invalid_altitude": "Altitude must be between -430m and 11,000m.",
    "boiling_point_extrapolated": "Boiling point calculation outside verified range. Results are estimated.",
    "substance_not_available": "Substance not available in this experiment."
  },

  "success": {
    "boiling_detected": "🎉 Boiling detected!",
    "experiment_complete": "Experiment complete!"
  }
}
```

---

## 🚀 IMPLEMENTATION ORDER

1. **Build infrastructure first** (hook, context, localStorage)
2. **Extract English strings** into en.json
3. **Integrate strings** into components
4. **Add language picker**
5. **Create Spanish translation**
6. **Test thoroughly**
7. **Document translation process**

---

## 📋 TRANSLATION CHECKLIST

Before releasing a new language:

- [ ] All keys in en.json have translations in {lang}.json
- [ ] No missing keys (use key name as fallback → obvious placeholder)
- [ ] No untranslated English text hardcoded in components
- [ ] Text layout verified (no overflow, readability OK)
- [ ] Special characters render correctly
- [ ] Translated strings contextually accurate (not just machine translation)
- [ ] Cultural appropriateness verified (no offensive idioms, etc.)
- [ ] Contributor credit recorded

---

## 🌍 FUTURE LANGUAGES

**Planned (Post-Spanish):**
- French (fr) — Educational reach in francophone countries
- German (de) — Strong physics education culture
- Portuguese (pt) — Large Spanish-speaking audience overlap
- Mandarin Chinese (zh) — Massive education market
- Japanese (ja) — High-quality STEM education interest

**Criteria for adding languages:**
- >100K speakers in developed nations
- Strong STEM education infrastructure
- Community translation offer (avoid machine translation)
- At least 5 volunteers for translation + review

---

## 💬 TRANSLATOR NOTES

**Common Translation Pitfalls to Avoid:**

1. **Don't translate technical terms**
   - "Boiling point" (física: "punto de ebullición")
   - "Burner" (cocina: "quemador")
   - Keep consistency with scientific textbooks

2. **Watch for text expansion**
   - English: "Altitude" (8 chars)
   - Spanish: "Altitud" (7 chars) ✓ (good)
   - German: "Höhe über dem Meeresspiegel" (too long!)
   - Test in UI after translation

3. **Avoid colloquialisms**
   - Example: "Crank up the heat" → Use formal "Increase heat"
   - Educational tone, not casual chat

4. **Verify scientific accuracy**
   - Some translations lose precision
   - Example: "boiling point" vs "bullición point" (wrong)
   - Consult NIST, IUPAC for official terms

5. **Context matters**
   - "Temperature" in experiment vs. "room temperature"
   - Translator should understand physics context

---

## 🔗 RELATED DOCS

- [ACCESSIBILITY_TODO.md](ACCESSIBILITY_TODO.md) — Accessibility strings that localization depends on
- [TODO.md](TODO.md) — Main project priorities
- [COMPLETED_TODOS.md](COMPLETED_TODOS.md) — Finished work

---

**Last Updated:** 2026-02-02  
**Status:** Ready for implementation after Accessibility Phase 1

