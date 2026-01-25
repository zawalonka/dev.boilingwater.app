/**
 * Aggressive image optimizer for theme assets (dev tooling only).
 * - Walks public/assets/themes/<themeId>/ for *.png images
 * - Backgrounds → convert to JPG (quality 75, no transparency needed)
 * - Pot/flame → keep PNG with heavy lossy compression
 * - Writes .optimized then renames to original filename
 * Usage: node scripts/optimize-images.js
 */
import sharp from 'sharp';
import { readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const THEMES_DIR = join(__dirname, '..', 'public', 'assets', 'themes');

async function optimizeImage(imagePath) {
  const filename = imagePath.split(/[\\/]/).pop();
  const isBackground = filename === 'background.png';
  
  console.log(`Optimizing ${filename}...`);
  
  const image = sharp(imagePath);
  const metadata = await image.metadata();
  
  let result;
  if (isBackground) {
    // Convert background PNG to JPG (no transparency needed)
    // Save as background.jpg in same directory
    const outputPath = imagePath.replace(/\.png$/i, '.jpg');
    await image
      .jpeg({
        quality: 75,
        mozjpeg: true,
        progressive: true
      })
      .toFile(outputPath + '.optimized');
    
    // Delete original PNG and rename JPG
    const fs = await import('fs');
    fs.renameSync(outputPath + '.optimized', outputPath);
    fs.unlinkSync(imagePath);
    
    const stats = fs.statSync(outputPath);
    console.log(`  ✓ Converted to JPG: ${(stats.size / 1024).toFixed(2)}KB`);
  } else {
    // Keep UI elements (pot, flame) as PNG with heavy compression
    await image
      .png({
        quality: 60,
        compressionLevel: 9,
        effort: 10
      })
      .toFile(imagePath + '.optimized');
    
    // Replace original with optimized
    const fs = await import('fs');
    fs.renameSync(imagePath + '.optimized', imagePath);
    
    const stats = fs.statSync(imagePath);
    console.log(`  ✓ PNG compressed: ${(stats.size / 1024).toFixed(2)}KB`);
  }
}

async function optimizeThemeImages() {
  const themes = await readdir(THEMES_DIR);
  
  for (const theme of themes) {
    const themePath = join(THEMES_DIR, theme);
    const files = await readdir(themePath);
    
    console.log(`\n📦 Theme: ${theme}`);
    
    for (const file of files) {
      if (file.endsWith('.png')) {
        await optimizeImage(join(themePath, file));
      }
    }
  }
  
  console.log('\n✨ All images optimized!');
}

optimizeThemeImages().catch(console.error);
