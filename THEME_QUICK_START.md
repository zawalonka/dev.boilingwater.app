# Quick Theme Creation Guide

**For creating new themes quickly without reading all documentation.**

## 5-Minute Quickstart

### 1. Create Theme Folder & File

Create folder: `public/assets/themes/[yourThemeName]/`
Create file: `public/assets/themes/[yourThemeName]/theme.json`

```json
{
  "id": "your-theme-id",
  "name": "Your Theme Name",
  "scope": "workshop",
  "description": "Brief description",
  
  "colors": {
    "header_background": "#000000",
    "header_text": "#ffffff",
    "badge_background": "#ff0000",
    "button_primary": "#4CAF50",
    "button_hover": "#45a049",
    "panel_background": "#ffffff",
    "panel_text": "#333333",
    "panel_border": "#cccccc"
  },
  
  "images": {
    "background": "/assets/themes/your-theme/background.png",
    "pot_empty": "/assets/themes/your-theme/pot-empty.png",
    "pot_full": "/assets/themes/your-theme/pot-full.png",
    "flame": "/assets/themes/your-theme/flame.png"
  },
  
  "metadata": {
    "author": "Your Name",
    "version": "1.0.0",
    "createdDate": "2026-01-24"
  }
}
```

### 2. Create Asset Folder

Create: `public/assets/images/themes/your-theme/`

Place your 4 images here:
- **background.png** (MUST be exactly **1280×800 pixels**, no stretching)
- **pot-empty.png** (transparent PNG, any size)
- **pot-full.png** (transparent PNG, same size as pot-empty)
- **flame.png** (transparent PNG, ~60×100 pixels)

### 3. Test

Build and run: `npm run build && npm run preview`

That's it! Your theme is loaded automatically.

---

## Image Resizing (1-Liner)

If you have an original image you need to resize to 1280×800:

### Using ImageMagick
```bash
magick convert input.png -resize 1280x800! output.png
```

### Using Python
```python
from PIL import Image
img = Image.open('input.png')
img = img.resize((1280, 800))
img.save('output.png')
```

### Online Tool
[Bigjpg.com](https://bigjpg.com) or [Photopea.com](https://www.photopea.com)

---

## Color Ideas by Theme Type

### Chemistry Lab
```json
"colors": {
  "header_background": "#1a1a2e",
  "header_text": "#eee",
  "button_primary": "#0f3460",
  "button_hover": "#16213e",
  "water_color": "#00ff88",
  "flame_glow": "#ff6b00"
}
```

### Professional/Corporate
```json
"colors": {
  "header_background": "#2c3e50",
  "header_text": "#ecf0f1",
  "button_primary": "#3498db",
  "button_hover": "#2980b9",
  "water_color": "#5dade2",
  "flame_glow": "#f39c12"
}
```

### Playful/Colorful
```json
"colors": {
  "header_background": "#ff6b6b",
  "header_text": "#fff",
  "button_primary": "#4ecdc4",
  "button_hover": "#44a08d",
  "water_color": "#5f27cd",
  "flame_glow": "#ff9ff3"
}
```

### Minimal/Light
```json
"colors": {
  "header_background": "#ffffff",
  "header_text": "#333333",
  "button_primary": "#333333",
  "button_hover": "#555555",
  "water_color": "#b3d9ff",
  "flame_glow": "#ff9999"
}
```

---

## Workshop vs Level Themes

### Workshop Theme (applies to ALL levels in a workshop)
```json
{
  "id": "workshop_chemistry",
  "name": "Chemistry Lab",
  "scope": "workshop",
  "workshopId": "workshop_chem_101"
}
```

### Level-Specific Theme (override for ONE level)
```json
{
  "id": "workshop_chem_adv",
  "name": "Advanced Pressure Cooker",
  "scope": "level",
  "workshopId": "workshop_chem_101",
  "levelId": "level_5",
  "parentTheme": "workshop_chemistry"
}
```

---

## Common Mistakes

❌ **Mistake:** Background image is 1024×1024
```
✓ Fix: Resize to exactly 1280×800
```

❌ **Mistake:** Colors won't apply in the game
```
✓ Fix: Check JSON syntax is valid (use jsonlint.com)
✓ Fix: Verify colors are valid CSS values (#fff, rgba(...), etc.)
```

❌ **Mistake:** Images show broken link icon
```
✓ Fix: Ensure file paths in JSON match actual file locations
✓ Fix: Paths should be relative to public/ folder (/assets/...)
```

❌ **Mistake:** Theme doesn't load
```
✓ Fix: Check browser console (F12) for error messages
✓ Fix: Verify JSON file is in src/data/themes/[id].json
✓ Fix: Make sure all required fields are present
```

---

## File Checklist

Before deploying your theme:

- [ ] JSON file created: `public/assets/themes/[id]/theme.json`
- [ ] All required JSON fields present (id, name, colors, images, metadata)
- [ ] Background image: exactly **1280×800 pixels**
- [ ] Background file exists: `public/assets/themes/[id]/background.png`
- [ ] Pot empty image exists and is transparent PNG
- [ ] Pot full image exists, same size as pot empty
- [ ] Flame image exists (~60×100 pixels)
- [ ] JSON validates at [jsonlint.com](https://jsonlint.com/)
- [ ] All color values are valid CSS colors
- [ ] All image paths are correct and accessible
- [ ] Theme builds without errors: `npm run build`

---

## Advanced: Color Palette Generator

Use these tools to generate color schemes:

- [Coolors.co](https://coolors.co) - Random scheme generator
- [Material Design Color Tool](https://material.io/resources/color) - Professional palettes
- [Adobe Color](https://color.adobe.com) - Advanced color harmony
- [Contrast Ratio Checker](https://webaim.org/resources/contrastchecker/) - Accessibility

---

## Need Help?

1. **Read full docs:** `THEME_SYSTEM.md` in repo root
2. **Check classic theme:** `src/data/themes/classic.json` as reference
3. **Look at error messages:** `npm run build` will tell you what's wrong
4. **Inspect with DevTools:** F12 → Console tab shows theme loading info

---

## Support

For bugs or questions, check the error console (F12) and review THEME_SYSTEM.md for detailed reference.
