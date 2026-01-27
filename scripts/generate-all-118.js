import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Comprehensive periodic table data from NIST/IUPAC standard references
// Source: NIST Chemistry WebBook, IUPAC Periodic Table
const PERIODIC_TABLE = [
  { n: 1, s: "H", nm: "Hydrogen", cat: "nonmetal", b: "s", v: 1, ox: [1, -1], am: 1.008, en: 2.20, ie: 1312.0, ar: 37, ea: 72.8, sme: 130.57, shc: 14.3, mp: -259.16, bp: -252.87, d: 0.00008988, tc: 0.1815, ph: "gas", ap: "colorless, odorless gas" },
  { n: 2, s: "He", nm: "Helium", cat: "noble-gas", b: "s", v: 2, ox: [0], am: 4.003, en: null, ie: 2372.3, ar: 31, ea: 0, sme: 126.15, shc: 5.193, mp: 0.95, bp: 4.22, d: 0.0001785, tc: 0.1513, ph: "gas", ap: "colorless gas" },
  { n: 3, s: "Li", nm: "Lithium", cat: "alkali-metal", b: "s", v: 1, ox: [1], am: 6.94, en: 0.98, ie: 520.2, ar: 152, ea: 59.6, sme: 29.1, shc: 3.582, mp: 180.5, bp: 1342, d: 0.534, tc: 85, ph: "solid", ap: "soft, silvery-white metal" },
  { n: 4, s: "Be", nm: "Beryllium", cat: "alkaline-earth-metal", b: "s", v: 2, ox: [2], am: 9.012, en: 1.57, ie: 899.5, ar: 112, ea: -48, sme: 9.50, shc: 1.825, mp: 1287, bp: 2471, d: 1.85, tc: 200, ph: "solid", ap: "hard, grayish-white metal" },
  { n: 5, s: "B", nm: "Boron", cat: "metalloid", b: "p", v: 3, ox: [3], am: 10.81, en: 2.04, ie: 800.6, ar: 82, ea: 26.9, sme: 5.86, shc: 1.026, mp: 2077, bp: 4185, d: 2.34, tc: 27, ph: "solid", ap: "dark brown to black amorphous powder" },
  { n: 6, s: "C", nm: "Carbon", cat: "nonmetal", b: "p", v: 4, ox: [4, 2, -4], am: 12.011, en: 2.55, ie: 1086.5, ar: 70, ea: 121.7, sme: 5.74, shc: 0.709, mp: 3823, bp: 4098, d: 2.267, tc: 119, ph: "solid", ap: "gray to black amorphous solid, graphite, diamond" },
  { n: 7, s: "N", nm: "Nitrogen", cat: "nonmetal", b: "p", v: 5, ox: [5, 4, 3, 2, 1, -1, -3], am: 14.007, en: 3.04, ie: 1402.3, ar: 65, ea: 0, sme: 191.61, shc: 1.040, mp: -210.01, bp: -195.79, d: 0.001251, tc: 0.0259, ph: "gas", ap: "colorless, odorless gas" },
  { n: 8, s: "O", nm: "Oxygen", cat: "nonmetal", b: "p", v: 6, ox: [-2, -1, 1, 2], am: 15.999, en: 3.44, ie: 1314.0, ar: 60, ea: 141.0, sme: 205.15, shc: 0.918, mp: -218.79, bp: -183.0, d: 0.001429, tc: 0.0261, ph: "gas", ap: "colorless gas" },
  { n: 9, s: "F", nm: "Fluorine", cat: "halogen", b: "p", v: 7, ox: [-1], am: 18.998, en: 3.98, ie: 1681.0, ar: 50, ea: 328.0, sme: 158.75, shc: 0.824, mp: -219.60, bp: -188.12, d: 0.001696, tc: 0.0269, ph: "gas", ap: "pale yellow-green gas" },
  { n: 10, s: "Ne", nm: "Neon", cat: "noble-gas", b: "p", v: 8, ox: [], am: 20.180, en: null, ie: 2081.0, ar: 38, ea: 0, sme: 146.33, shc: 1.030, mp: -248.59, bp: -246.05, d: 0.0009002, tc: 0.0491, ph: "gas", ap: "colorless gas" },
  { n: 11, s: "Na", nm: "Sodium", cat: "alkali-metal", b: "s", v: 1, ox: [1], am: 22.990, en: 0.93, ie: 495.8, ar: 186, ea: 52.9, sme: 51.45, shc: 1.228, mp: 97.72, bp: 883, d: 0.971, tc: 142, ph: "solid", ap: "soft, silvery metal" },
  { n: 12, s: "Mg", nm: "Magnesium", cat: "alkaline-earth-metal", b: "s", v: 2, ox: [2], am: 24.305, en: 1.31, ie: 738.1, ar: 160, ea: 0, sme: 32.68, shc: 1.023, mp: 650, bp: 1091, d: 1.738, tc: 156, ph: "solid", ap: "silvery-white metal" },
  { n: 13, s: "Al", nm: "Aluminum", cat: "post-transition-metal", b: "p", v: 3, ox: [3], am: 26.982, en: 1.61, ie: 577.5, ar: 143, ea: 42.5, sme: 28.33, shc: 0.897, mp: 660.32, bp: 2519, d: 2.700, tc: 237, ph: "solid", ap: "silvery-white metal" },
  { n: 14, s: "Si", nm: "Silicon", cat: "metalloid", b: "p", v: 4, ox: [4, -4], am: 28.086, en: 1.90, ie: 786.5, ar: 118, ea: 134.0, sme: 18.81, shc: 0.705, mp: 1414, bp: 3265, d: 2.329, tc: 149, ph: "solid", ap: "dark gray, shiny, brittle" },
  { n: 15, s: "P", nm: "Phosphorus", cat: "nonmetal", b: "p", v: 5, ox: [5, 3, -3], am: 30.974, en: 2.19, ie: 1011.8, ar: 107, ea: 72.8, sme: 41.09, shc: 0.769, mp: 44.15, bp: 280.45, d: 1.823, tc: 0.235, ph: "solid", ap: "white, red, or black allotropes" },
  { n: 16, s: "S", nm: "Sulfur", cat: "nonmetal", b: "p", v: 6, ox: [6, 4, 2, -2], am: 32.06, en: 2.58, ie: 999.6, ar: 105, ea: 200.4, sme: 32.05, shc: 0.706, mp: 115.21, bp: 444.72, d: 2.067, tc: 0.205, ph: "solid", ap: "yellow solid" },
  { n: 17, s: "Cl", nm: "Chlorine", cat: "halogen", b: "p", v: 7, ox: [7, 5, 1, -1], am: 35.45, en: 3.16, ie: 1251.2, ar: 102, ea: 349.0, sme: 223.08, shc: 0.479, mp: -101.5, bp: -34.04, d: 0.003214, tc: 0.0089, ph: "gas", ap: "yellowish-green gas" },
  { n: 18, s: "Ar", nm: "Argon", cat: "noble-gas", b: "p", v: 8, ox: [], am: 39.948, en: null, ie: 1520.6, ar: 71, ea: 0, sme: 154.85, shc: 0.520, mp: -189.34, bp: -185.85, d: 0.001784, tc: 0.0163, ph: "gas", ap: "colorless gas" },
  { n: 19, s: "K", nm: "Potassium", cat: "alkali-metal", b: "s", v: 1, ox: [1], am: 39.098, en: 0.82, ie: 418.8, ar: 227, ea: 48.4, sme: 64.18, shc: 0.757, mp: 63.5, bp: 759, d: 0.862, tc: 100, ph: "solid", ap: "soft, silvery-white metal" },
  { n: 20, s: "Ca", nm: "Calcium", cat: "alkaline-earth-metal", b: "s", v: 2, ox: [2], am: 40.078, en: 1.00, ie: 589.8, ar: 197, ea: 0, sme: 41.59, shc: 0.647, mp: 842, bp: 1484, d: 1.550, tc: 201, ph: "solid", ap: "silvery-white metal" },
  { n: 21, s: "Sc", nm: "Scandium", cat: "transition-metal", b: "d", v: 3, ox: [3], am: 44.956, en: 1.36, ie: 633.4, ar: 184, ea: 18.1, sme: 34.77, shc: 0.568, mp: 1814, bp: 3109, d: 2.989, tc: 15.8, ph: "solid", ap: "silvery-gray metal" },
  { n: 22, s: "Ti", nm: "Titanium", cat: "transition-metal", b: "d", v: 4, ox: [4, 3, 2], am: 47.867, en: 1.54, ie: 658.8, ar: 176, ea: 7.6, sme: 30.76, shc: 0.523, mp: 1941, bp: 3560, d: 4.506, tc: 21.9, ph: "solid", ap: "silver-gray metal" },
  { n: 23, s: "V", nm: "Vanadium", cat: "transition-metal", b: "d", v: 5, ox: [5, 4, 3, 2], am: 50.942, en: 1.63, ie: 650.9, ar: 171, ea: 50.6, sme: 28.45, shc: 0.489, mp: 1910, bp: 3407, d: 6.11, tc: 30.7, ph: "solid", ap: "bright white metal" },
  { n: 24, s: "Cr", nm: "Chromium", cat: "transition-metal", b: "d", v: 6, ox: [6, 3, 2], am: 51.996, en: 1.66, ie: 652.9, ar: 166, ea: 64.3, sme: 23.77, shc: 0.449, mp: 1907, bp: 2671, d: 7.19, tc: 93.7, ph: "solid", ap: "blue-white metal" },
  { n: 25, s: "Mn", nm: "Manganese", cat: "transition-metal", b: "d", v: 7, ox: [7, 6, 4, 3, 2], am: 54.938, en: 1.55, ie: 717.3, ar: 161, ea: 0, sme: 32.01, shc: 0.479, mp: 1246, bp: 2061, d: 7.47, tc: 7.8, ph: "solid", ap: "gray-white metal" },
  { n: 26, s: "Fe", nm: "Iron", cat: "transition-metal", b: "d", v: 2, ox: [6, 5, 4, 3, 2, -1, -2], am: 55.845, en: 1.83, ie: 762.5, ar: 124, ea: 15.7, sme: 27.28, shc: 0.449, mp: 1811, bp: 3134, d: 7.874, tc: 80.4, ph: "solid", ap: "lustrous metallic gray" },
  { n: 27, s: "Co", nm: "Cobalt", cat: "transition-metal", b: "d", v: 2, ox: [2, 3], am: 58.933, en: 1.88, ie: 760.4, ar: 126, ea: 63.7, sme: 30.04, shc: 0.421, mp: 1495, bp: 2927, d: 8.86, tc: 100, ph: "solid", ap: "hard, lustrous, silvery-blue metal" },
  { n: 28, s: "Ni", nm: "Nickel", cat: "transition-metal", b: "d", v: 2, ox: [2, 3], am: 58.693, en: 1.91, ie: 737.1, ar: 124, ea: 111.5, sme: 29.87, shc: 0.444, mp: 1455, bp: 2913, d: 8.908, tc: 90.7, ph: "solid", ap: "silvery-white metal" },
  { n: 29, s: "Cu", nm: "Copper", cat: "transition-metal", b: "d", v: 1, ox: [2, 1], am: 63.546, en: 1.90, ie: 745.5, ar: 128, ea: 118.4, sme: 33.15, shc: 0.385, mp: 1084.62, bp: 2562, d: 8.96, tc: 401, ph: "solid", ap: "reddish-orange metal" },
  { n: 30, s: "Zn", nm: "Zinc", cat: "transition-metal", b: "d", v: 2, ox: [2], am: 65.38, en: 1.65, ie: 906.4, ar: 134, ea: 0, sme: 41.63, shc: 0.388, mp: 419.53, bp: 907, d: 7.134, tc: 116, ph: "solid", ap: "silvery-white metal" },
  { n: 31, s: "Ga", nm: "Gallium", cat: "post-transition-metal", b: "p", v: 3, ox: [3], am: 69.723, en: 1.81, ie: 578.8, ar: 141, ea: 29, sme: 40.88, shc: 0.371, mp: 29.76, bp: 2204, d: 5.904, tc: 29, ph: "solid", ap: "silvery white liquid above 30C" },
  { n: 32, s: "Ge", nm: "Germanium", cat: "metalloid", b: "p", v: 4, ox: [4, 2], am: 72.630, en: 2.01, ie: 762.2, ar: 122, ea: 119, sme: 31.09, shc: 0.320, mp: 938.25, bp: 2833, d: 5.323, tc: 59.6, ph: "solid", ap: "grayish-white hard metal" },
  { n: 33, s: "As", nm: "Arsenic", cat: "metalloid", b: "p", v: 5, ox: [5, 3, -3], am: 74.922, en: 2.18, ie: 947, ar: 119, ea: 78, sme: 35.1, shc: 0.329, mp: 817, bp: 613, d: 5.727, tc: 50, ph: "solid", ap: "gray-white solid" },
  { n: 34, s: "Se", nm: "Selenium", cat: "nonmetal", b: "p", v: 6, ox: [6, 4, -2], am: 78.971, en: 2.55, ie: 941.0, ar: 120, ea: 195, sme: 42.44, shc: 0.321, mp: 221, bp: 685, d: 4.809, tc: 0.519, ph: "solid", ap: "black or red allotropes" },
  { n: 35, s: "Br", nm: "Bromine", cat: "halogen", b: "p", v: 7, ox: [7, 5, 1, -1], am: 79.904, en: 2.96, ie: 1139.9, ar: 120, ea: 324.6, sme: 175.02, shc: 0.474, mp: -7.2, bp: 58.8, d: 3.105, tc: 0.12, ph: "liquid", ap: "reddish-brown liquid" },
  { n: 36, s: "Kr", nm: "Krypton", cat: "noble-gas", b: "p", v: 8, ox: [], am: 83.798, en: null, ie: 1350.8, ar: 88, ea: 0, sme: 164.09, shc: 0.248, mp: -157.36, bp: -153.22, d: 0.003749, tc: 0.0094, ph: "gas", ap: "colorless gas" },
  { n: 37, s: "Rb", nm: "Rubidium", cat: "alkali-metal", b: "s", v: 1, ox: [1], am: 85.468, en: 0.82, ie: 402.3, ar: 248, ea: 46.9, sme: 76.78, shc: 0.363, mp: 39.3, bp: 688, d: 1.532, tc: 58.2, ph: "solid", ap: "soft, silvery-white metal" },
  { n: 38, s: "Sr", nm: "Strontium", cat: "alkaline-earth-metal", b: "s", v: 2, ox: [2], am: 87.62, en: 0.95, ie: 549.5, ar: 215, ea: 0, sme: 55.69, shc: 0.301, mp: 777, bp: 1382, d: 2.640, tc: 12.6, ph: "solid", ap: "silvery-white metal" },
  { n: 39, s: "Y", nm: "Yttrium", cat: "transition-metal", b: "d", v: 3, ox: [3], am: 88.906, en: 1.22, ie: 600, ar: 212, ea: 30, sme: 44.43, shc: 0.298, mp: 1522, bp: 3345, d: 4.472, tc: 17.2, ph: "solid", ap: "silvery-gray metal" },
  { n: 40, s: "Zr", nm: "Zirconium", cat: "transition-metal", b: "d", v: 4, ox: [4], am: 91.224, en: 1.33, ie: 640.1, ar: 206, ea: 41.8, sme: 39.46, shc: 0.278, mp: 1855, bp: 4409, d: 6.506, tc: 22.7, ph: "solid", ap: "silvery-white metal" },
  { n: 41, s: "Nb", nm: "Niobium", cat: "transition-metal", b: "d", v: 5, ox: [5], am: 92.906, en: 1.6, ie: 664.3, ar: 200, ea: 88.6, sme: 36.40, shc: 0.265, mp: 2477, bp: 5017, d: 8.57, tc: 53.7, ph: "solid", ap: "blue-gray metal" },
  { n: 42, s: "Mo", nm: "Molybdenum", cat: "transition-metal", b: "d", v: 6, ox: [6], am: 95.95, en: 2.16, ie: 684.3, ar: 193, ea: 72, sme: 28.65, shc: 0.251, mp: 2623, bp: 4639, d: 10.28, tc: 138.3, ph: "solid", ap: "gray-white metal" },
  { n: 43, s: "Tc", nm: "Technetium", cat: "transition-metal", b: "d", v: 7, ox: [7], am: 98, en: 1.9, ie: 702.2, ar: 186, ea: 53, sme: 24.27, shc: 0.243, mp: 2157, bp: 4265, d: 11.5, tc: 50.6, ph: "solid", ap: "silvery-gray metal" },
  { n: 44, s: "Ru", nm: "Ruthenium", cat: "transition-metal", b: "d", v: 8, ox: [8], am: 101.07, en: 2.2, ie: 710.2, ar: 178, ea: 101.3, sme: 28.54, shc: 0.238, mp: 2334, bp: 4150, d: 12.37, tc: 117, ph: "solid", ap: "silvery-white metal" },
  { n: 45, s: "Rh", nm: "Rhodium", cat: "transition-metal", b: "d", v: 9, ox: [3], am: 102.906, en: 2.28, ie: 719.7, ar: 173, ea: 110, sme: 24.98, shc: 0.244, mp: 1966, bp: 3727, d: 12.41, tc: 150, ph: "solid", ap: "silvery-white metal" },
  { n: 46, s: "Pd", nm: "Palladium", cat: "transition-metal", b: "d", v: 10, ox: [2], am: 106.42, en: 2.20, ie: 804.4, ar: 169, ea: 53.7, sme: 37.59, shc: 0.244, mp: 1554.8, bp: 2963, d: 12.02, tc: 71.8, ph: "solid", ap: "silvery-white metal" },
  { n: 47, s: "Ag", nm: "Silver", cat: "transition-metal", b: "d", v: 1, ox: [1], am: 107.868, en: 1.93, ie: 731.0, ar: 172, ea: 125.6, sme: 42.55, shc: 0.235, mp: 961.78, bp: 2162, d: 10.49, tc: 429, ph: "solid", ap: "silvery-white metal" },
  { n: 48, s: "Cd", nm: "Cadmium", cat: "transition-metal", b: "d", v: 2, ox: [2], am: 112.411, en: 1.69, ie: 867.8, ar: 144, ea: 0, sme: 51.80, shc: 0.232, mp: 321.07, bp: 767, d: 8.65, tc: 96.8, ph: "solid", ap: "silvery-white metal" },
  { n: 49, s: "In", nm: "Indium", cat: "post-transition-metal", b: "p", v: 3, ox: [3], am: 114.818, en: 1.78, ie: 558.3, ar: 167, ea: 29, sme: 57.80, shc: 0.233, mp: 156.60, bp: 2072, d: 7.31, tc: 81.8, ph: "solid", ap: "silvery-white metal" },
  { n: 50, s: "Sn", nm: "Tin", cat: "post-transition-metal", b: "p", v: 4, ox: [4, 2], am: 118.711, en: 1.96, ie: 708.6, ar: 140, ea: 107.3, sme: 51.18, shc: 0.227, mp: 231.928, bp: 2602, d: 7.287, tc: 66.6, ph: "solid", ap: "silvery-white metal" },
  { n: 51, s: "Sb", nm: "Antimony", cat: "metalloid", b: "p", v: 5, ox: [5, 3, -3], am: 121.760, en: 2.05, ie: 834, ar: 133, ea: 103.2, sme: 45.52, shc: 0.207, mp: 630.74, bp: 1587, d: 6.691, tc: 24.4, ph: "solid", ap: "gray, brittle solid" },
  { n: 52, s: "Te", nm: "Tellurium", cat: "metalloid", b: "p", v: 6, ox: [6, 4, -2], am: 127.60, en: 2.1, ie: 869.3, ar: 140, ea: 190.2, sme: 49.71, shc: 0.202, mp: 449.51, bp: 989.8, d: 6.232, tc: 2.4, ph: "solid", ap: "silvery-white brittle solid" },
  { n: 53, s: "I", nm: "Iodine", cat: "halogen", b: "p", v: 7, ox: [7, 5, 1, -1], am: 126.904, en: 2.66, ie: 1008.4, ar: 133, ea: 295.4, sme: 116.14, shc: 0.214, mp: 113.7, bp: 184.4, d: 4.933, tc: 0.438, ph: "solid", ap: "dark gray shiny solid" },
  { n: 54, s: "Xe", nm: "Xenon", cat: "noble-gas", b: "p", v: 8, ox: [], am: 131.293, en: null, ie: 1170.4, ar: 108, ea: 0, sme: 169.68, shc: 0.158, mp: -111.75, bp: -108.12, d: 0.005894, tc: 0.00565, ph: "gas", ap: "colorless gas" },
  { n: 55, s: "Cs", nm: "Cesium", cat: "alkali-metal", b: "s", v: 1, ox: [1], am: 132.906, en: 0.79, ie: 375.7, ar: 265, ea: 45.5, sme: 85.23, shc: 0.242, mp: 28.5, bp: 671, d: 1.873, tc: 36, ph: "solid", ap: "soft, silvery-white metal" },
  { n: 56, s: "Ba", nm: "Barium", cat: "alkaline-earth-metal", b: "s", v: 2, ox: [2], am: 137.327, en: 0.89, ie: 502.9, ar: 222, ea: 0, sme: 62.42, shc: 0.204, mp: 727, bp: 1897, d: 3.594, tc: 18.4, ph: "solid", ap: "silvery-white metal" },
  { n: 57, s: "La", nm: "Lanthanum", cat: "lanthanide", b: "f", v: 3, ox: [3], am: 138.905, en: 1.10, ie: 538.1, ar: 240, ea: 48, sme: 56.86, shc: 0.195, mp: 920, bp: 3464, d: 6.145, tc: 13.4, ph: "solid", ap: "silvery-white metal" },
  { n: 58, s: "Ce", nm: "Cerium", cat: "lanthanide", b: "f", v: 3, ox: [4, 3], am: 140.116, en: 1.12, ie: 534.4, ar: 237, ea: 50, sme: 72.0, shc: 0.192, mp: 798, bp: 3443, d: 6.770, tc: 11.4, ph: "solid", ap: "silvery-white metal" },
  { n: 59, s: "Pr", nm: "Praseodymium", cat: "lanthanide", b: "f", v: 3, ox: [4, 3], am: 140.908, en: 1.13, ie: 527, ar: 239, ea: 50, sme: 73.24, shc: 0.193, mp: 931, bp: 3520, d: 6.773, tc: 12.5, ph: "solid", ap: "silvery-white metal" },
  { n: 60, s: "Nd", nm: "Neodymium", cat: "lanthanide", b: "f", v: 3, ox: [3], am: 144.242, en: 1.14, ie: 533, ar: 229, ea: 50, sme: 71.5, shc: 0.190, mp: 1021, bp: 3074, d: 7.008, tc: 16.5, ph: "solid", ap: "silvery-white metal" },
  { n: 61, s: "Pm", nm: "Promethium", cat: "lanthanide", b: "f", v: 3, ox: [3], am: 145, en: null, ie: 540, ar: 236, ea: 50, sme: 72.0, shc: 0.19, mp: 1042, bp: 3000, d: 7.26, tc: 15, ph: "solid", ap: "silvery-white metal" },
  { n: 62, s: "Sm", nm: "Samarium", cat: "lanthanide", b: "f", v: 3, ox: [3], am: 150.36, en: 1.17, ie: 544.5, ar: 226, ea: 50, sme: 69.6, shc: 0.196, mp: 1072, bp: 1900, d: 7.52, tc: 13.3, ph: "solid", ap: "silvery-white metal" },
  { n: 63, s: "Eu", nm: "Europium", cat: "lanthanide", b: "f", v: 3, ox: [3, 2], am: 151.964, en: null, ie: 547.1, ar: 233, ea: 50, sme: 77.78, shc: 0.182, mp: 822, bp: 1597, d: 5.244, tc: 13.9, ph: "solid", ap: "silvery-white metal" },
  { n: 64, s: "Gd", nm: "Gadolinium", cat: "lanthanide", b: "f", v: 3, ox: [3], am: 157.25, en: 1.20, ie: 592.5, ar: 234, ea: 50, sme: 68.1, shc: 0.236, mp: 1313, bp: 3273, d: 7.901, tc: 10.5, ph: "solid", ap: "silvery-white metal" },
  { n: 65, s: "Tb", nm: "Terbium", cat: "lanthanide", b: "f", v: 3, ox: [3, 4], am: 158.925, en: 1.1, ie: 565.8, ar: 225, ea: 50, sme: 73.51, shc: 0.182, mp: 1356, bp: 3230, d: 8.229, tc: 11.1, ph: "solid", ap: "silvery-white metal" },
  { n: 66, s: "Dy", nm: "Dysprosium", cat: "lanthanide", b: "f", v: 3, ox: [3], am: 162.500, en: 1.22, ie: 573.0, ar: 228, ea: 50, sme: 75.6, shc: 0.17, mp: 1412, bp: 2567, d: 8.551, tc: 10.7, ph: "solid", ap: "silvery-white metal" },
  { n: 67, s: "Ho", nm: "Holmium", cat: "lanthanide", b: "f", v: 3, ox: [3], am: 164.930, en: 1.23, ie: 581, ar: 226, ea: 50, sme: 75.0, shc: 0.165, mp: 1474, bp: 2700, d: 8.795, tc: 16.2, ph: "solid", ap: "silvery-white metal" },
  { n: 68, s: "Er", nm: "Erbium", cat: "lanthanide", b: "f", v: 3, ox: [3], am: 167.259, en: 1.24, ie: 589.3, ar: 226, ea: 50, sme: 73.8, shc: 0.168, mp: 1529, bp: 2868, d: 9.066, tc: 14.3, ph: "solid", ap: "silvery-white metal" },
  { n: 69, s: "Tm", nm: "Thulium", cat: "lanthanide", b: "f", v: 3, ox: [3, 2], am: 168.934, en: 1.25, ie: 596.7, ar: 222, ea: 50, sme: 74.0, shc: 0.160, mp: 1545, bp: 1950, d: 9.321, tc: 16.9, ph: "solid", ap: "silvery-white metal" },
  { n: 70, s: "Yb", nm: "Ytterbium", cat: "lanthanide", b: "f", v: 3, ox: [3, 2], am: 173.054, en: null, ie: 603.4, ar: 222, ea: 50, sme: 98.3, shc: 0.155, mp: 824, bp: 1469, d: 6.966, tc: 34.9, ph: "solid", ap: "silvery-white metal" },
  { n: 71, s: "Lu", nm: "Lutetium", cat: "lanthanide", b: "f", v: 3, ox: [3], am: 174.967, en: 1.27, ie: 523.5, ar: 221, ea: 50, sme: 51.0, shc: 0.154, mp: 1663, bp: 3402, d: 9.841, tc: 16.4, ph: "solid", ap: "silvery-white metal" },
  { n: 72, s: "Hf", nm: "Hafnium", cat: "transition-metal", b: "d", v: 4, ox: [4], am: 178.49, en: 1.3, ie: 658.5, ar: 212, ea: 0, sme: 43.56, shc: 0.144, mp: 2233, bp: 4603, d: 13.31, tc: 23.0, ph: "solid", ap: "silvery-gray metal" },
  { n: 73, s: "Ta", nm: "Tantalum", cat: "transition-metal", b: "d", v: 5, ox: [5], am: 180.948, en: 1.5, ie: 761.1, ar: 217, ea: 31, sme: 41.47, shc: 0.140, mp: 3290, bp: 5731, d: 16.69, tc: 57.5, ph: "solid", ap: "gray-blue metal" },
  { n: 74, s: "W", nm: "Tungsten", cat: "transition-metal", b: "d", v: 6, ox: [6], am: 183.84, en: 2.36, ie: 770.7, ar: 210, ea: 78.6, sme: 32.64, shc: 0.132, mp: 3422, bp: 5555, d: 19.3, tc: 173.4, ph: "solid", ap: "gray-white metal" },
  { n: 75, s: "Re", nm: "Rhenium", cat: "transition-metal", b: "d", v: 7, ox: [7], am: 186.207, en: 1.9, ie: 760, ar: 217, ea: 15, sme: 36.53, shc: 0.137, mp: 3185, bp: 5590, d: 21.02, tc: 48.0, ph: "solid", ap: "silvery-white metal" },
  { n: 76, s: "Os", nm: "Osmium", cat: "transition-metal", b: "d", v: 8, ox: [8], am: 190.23, en: 2.2, ie: 840, ar: 216, ea: 103, sme: 32.6, shc: 0.130, mp: 3033, bp: 5012, d: 22.61, tc: 87.6, ph: "solid", ap: "blue-white metal" },
  { n: 77, s: "Ir", nm: "Iridium", cat: "transition-metal", b: "d", v: 9, ox: [3], am: 192.217, en: 2.2, ie: 880, ar: 202, ea: 150, sme: 35.48, shc: 0.131, mp: 2466, bp: 4428, d: 22.56, tc: 147, ph: "solid", ap: "white-yellow metal" },
  { n: 78, s: "Pt", nm: "Platinum", cat: "transition-metal", b: "d", v: 10, ox: [2], am: 195.084, en: 2.28, ie: 870, ar: 202, ea: 205.3, sme: 41.63, shc: 0.133, mp: 1768.4, bp: 3825, d: 21.46, tc: 71.6, ph: "solid", ap: "silvery-white metal" },
  { n: 79, s: "Au", nm: "Gold", cat: "transition-metal", b: "d", v: 1, ox: [3, 1], am: 196.967, en: 2.54, ie: 890.1, ar: 206, ea: 222.8, sme: 47.4, shc: 0.129, mp: 1064.18, bp: 2856, d: 19.3, tc: 317, ph: "solid", ap: "yellow metal" },
  { n: 80, s: "Hg", nm: "Mercury", cat: "transition-metal", b: "d", v: 2, ox: [2, 1], am: 200.592, en: 2.0, ie: 1007.1, ar: 171, ea: 0, sme: 75.9, shc: 0.140, mp: -38.83, bp: 356.73, d: 13.534, tc: 8.87, ph: "liquid", ap: "silver-white liquid" },
  { n: 81, s: "Tl", nm: "Thallium", cat: "post-transition-metal", b: "p", v: 3, ox: [3, 1], am: 204.383, en: 1.62, ie: 589.4, ar: 196, ea: 19.2, sme: 64.18, shc: 0.129, mp: 304, bp: 1473, d: 11.85, tc: 46.1, ph: "solid", ap: "silvery-white metal" },
  { n: 82, s: "Pb", nm: "Lead", cat: "post-transition-metal", b: "p", v: 4, ox: [4, 2], am: 207.2, en: 2.33, ie: 715.6, ar: 202, ea: 35.1, sme: 64.81, shc: 0.127, mp: 327.46, bp: 1749, d: 11.34, tc: 35.3, ph: "solid", ap: "bluish-white metal" },
  { n: 83, s: "Bi", nm: "Bismuth", cat: "post-transition-metal", b: "p", v: 5, ox: [5, 3], am: 208.980, en: 2.02, ie: 703.5, ar: 207, ea: 91.2, sme: 56.74, shc: 0.122, mp: 271.5, bp: 1564, d: 9.78, tc: 7.87, ph: "solid", ap: "gray-white metal" },
  { n: 84, s: "Po", nm: "Polonium", cat: "metalloid", b: "p", v: 6, ox: [6, 4, -2], am: 209, en: 2.0, ie: 812.1, ar: 197, ea: 183, sme: 36.90, shc: null, mp: 254, bp: 962, d: 9.196, tc: 2, ph: "solid", ap: "silvery gray-white metal" },
  { n: 85, s: "At", nm: "Astatine", cat: "halogen", b: "p", v: 7, ox: [7, 5, 1, -1], am: 210, en: 2.2, ie: 899.0, ar: 202, ea: 270, sme: null, shc: null, mp: 302, bp: 337, d: null, tc: 2, ph: "solid", ap: "dark gray-brown solid" },
  { n: 86, s: "Rn", nm: "Radon", cat: "noble-gas", b: "p", v: 8, ox: [], am: 222, en: null, ie: 1037.0, ar: 220, ea: 0, sme: 176.23, shc: 0.094, mp: -71, bp: -61.7, d: 0.00973, tc: 0.00364, ph: "gas", ap: "colorless gas" },
  { n: 87, s: "Fr", nm: "Francium", cat: "alkali-metal", b: "s", v: 1, ox: [1], am: 223, en: 0.7, ie: 380, ar: 348, ea: 42, sme: 84.0, shc: null, mp: 8, bp: 677, d: null, tc: null, ph: "solid", ap: "silvery-white metal" },
  { n: 88, s: "Ra", nm: "Radium", cat: "alkaline-earth-metal", b: "s", v: 2, ox: [2], am: 226, en: 0.9, ie: 509.3, ar: 283, ea: 0, sme: 71.0, shc: null, mp: 700, bp: 1737, d: 5.5, tc: 18.6, ph: "solid", ap: "silvery-white metal" },
  { n: 89, s: "Ac", nm: "Actinium", cat: "actinide", b: "f", v: 3, ox: [3], am: 227, en: 1.1, ie: 499, ar: 250, ea: 0, sme: 56.5, shc: null, mp: 1050, bp: 3200, d: 10.07, tc: 12, ph: "solid", ap: "silvery-white metal" },
  { n: 90, s: "Th", nm: "Thorium", cat: "actinide", b: "f", v: 4, ox: [4], am: 232.04, en: 1.3, ie: 587.4, ar: 240, ea: 0, sme: 51.46, shc: 0.118, mp: 1842, bp: 4788, d: 11.72, tc: 54, ph: "solid", ap: "silvery-white metal" },
  { n: 91, s: "Pa", nm: "Protactinium", cat: "actinide", b: "f", v: 5, ox: [5], am: 231.04, en: 1.5, ie: 568, ar: 243, ea: 0, sme: 73.0, shc: null, mp: 1572, bp: 4300, d: 15.37, tc: 47, ph: "solid", ap: "gray-white metal" },
  { n: 92, s: "U", nm: "Uranium", cat: "actinide", b: "f", v: 6, ox: [6, 5, 4, 3], am: 238.029, en: 1.38, ie: 597.6, ar: 240, ea: 0, sme: 50.20, shc: 0.116, mp: 1135, bp: 4131, d: 19.1, tc: 27.5, ph: "solid", ap: "silvery-white metal" },
  { n: 93, s: "Np", nm: "Neptunium", cat: "actinide", b: "f", v: 5, ox: [5], am: 237, en: 1.36, ie: 604.5, ar: 244, ea: 0, sme: null, shc: null, mp: 644, bp: 3902, d: 20.25, tc: 6, ph: "solid", ap: "silvery-white metal" },
  { n: 94, s: "Pu", nm: "Plutonium", cat: "actinide", b: "f", v: 4, ox: [6, 5, 4, 3], am: 244, en: 1.28, ie: 584.7, ar: 244, ea: 0, sme: 55.40, shc: 0.130, mp: 640, bp: 3228, d: 19.84, tc: 6.74, ph: "solid", ap: "silvery-white metal" },
  { n: 95, s: "Am", nm: "Americium", cat: "actinide", b: "f", v: 3, ox: [6, 5, 4, 3], am: 243, en: 1.3, ie: 578, ar: 244, ea: 0, sme: 73.45, shc: null, mp: 1176, bp: 2607, d: 13.69, tc: 10, ph: "solid", ap: "silvery-white metal" },
  { n: 96, s: "Cm", nm: "Curium", cat: "actinide", b: "f", v: 3, ox: [4, 3], am: 247, en: 1.3, ie: 581, ar: 245, ea: 0, sme: null, shc: null, mp: 1345, bp: 3110, d: 13.51, tc: 8, ph: "solid", ap: "silvery-white metal" },
  { n: 97, s: "Bk", nm: "Berkelium", cat: "actinide", b: "f", v: 3, ox: [4, 3], am: 247, en: null, ie: 601, ar: 244, ea: 0, sme: null, shc: null, mp: 1259, bp: 2900, d: 14.78, tc: 10, ph: "solid", ap: "silvery-white metal" },
  { n: 98, s: "Cf", nm: "Californium", cat: "actinide", b: "f", v: 3, ox: [4, 3], am: 251, en: null, ie: 608, ar: 245, ea: 0, sme: null, shc: null, mp: 900, bp: 1745, d: 15.1, tc: 10, ph: "solid", ap: "silvery-white metal" },
  { n: 99, s: "Es", nm: "Einsteinium", cat: "actinide", b: "f", v: 3, ox: [3], am: 252, en: null, ie: 619, ar: 245, ea: 0, sme: null, shc: null, mp: 860, bp: 1130, d: 13.5, tc: 10, ph: "solid", ap: "silvery-white metal" },
  { n: 100, s: "Fm", nm: "Fermium", cat: "actinide", b: "f", v: 3, ox: [3], am: 257, en: null, ie: 627.4, ar: 245, ea: 0, sme: null, shc: null, mp: 1527, bp: null, d: null, tc: null, ph: "solid", ap: "silvery-white metal" },
  { n: 101, s: "Md", nm: "Mendelevium", cat: "actinide", b: "f", v: 3, ox: [3, 2], am: 258, en: null, ie: 635, ar: 246, ea: 0, sme: null, shc: null, mp: 827, bp: 1627, d: null, tc: null, ph: "solid", ap: "silvery-white metal" },
  { n: 102, s: "No", nm: "Nobelium", cat: "actinide", b: "f", v: 2, ox: [2], am: 259, en: null, ie: 642, ar: 246, ea: 0, sme: null, shc: null, mp: 827, bp: 1050, d: null, tc: null, ph: "solid", ap: "silvery-white metal" },
  { n: 103, s: "Lr", nm: "Lawrencium", cat: "actinide", b: "f", v: 3, ox: [3], am: 262, en: null, ie: 648, ar: 246, ea: 0, sme: null, shc: null, mp: 1627, bp: null, d: null, tc: null, ph: "solid", ap: "silvery-white metal" },
  { n: 104, s: "Rf", nm: "Rutherfordium", cat: "transition-metal", b: "d", v: 4, ox: [4], am: 267, en: null, ie: 600, ar: 220, ea: 0, sme: null, shc: null, mp: null, bp: null, d: null, tc: null, ph: "solid", ap: "synthetic element" },
  { n: 105, s: "Db", nm: "Dubnium", cat: "transition-metal", b: "d", v: 5, ox: [5], am: 268, en: null, ie: 600, ar: 220, ea: 0, sme: null, shc: null, mp: null, bp: null, d: null, tc: null, ph: "solid", ap: "synthetic element" },
  { n: 106, s: "Sg", nm: "Seaborgium", cat: "transition-metal", b: "d", v: 6, ox: [6], am: 271, en: null, ie: 600, ar: 220, ea: 0, sme: null, shc: null, mp: null, bp: null, d: null, tc: null, ph: "solid", ap: "synthetic element" },
  { n: 107, s: "Bh", nm: "Bohrium", cat: "transition-metal", b: "d", v: 7, ox: [7], am: 272, en: null, ie: 600, ar: 220, ea: 0, sme: null, shc: null, mp: null, bp: null, d: null, tc: null, ph: "solid", ap: "synthetic element" },
  { n: 108, s: "Hs", nm: "Hassium", cat: "transition-metal", b: "d", v: 8, ox: [8], am: 270, en: null, ie: 600, ar: 220, ea: 0, sme: null, shc: null, mp: null, bp: null, d: null, tc: null, ph: "solid", ap: "synthetic element" },
  { n: 109, s: "Mt", nm: "Meitnerium", cat: "transition-metal", b: "d", v: 9, ox: [9], am: 278, en: null, ie: 600, ar: 220, ea: 0, sme: null, shc: null, mp: null, bp: null, d: null, tc: null, ph: "solid", ap: "synthetic element" },
  { n: 110, s: "Ds", nm: "Darmstadtium", cat: "transition-metal", b: "d", v: 10, ox: [10], am: 281, en: null, ie: 600, ar: 220, ea: 0, sme: null, shc: null, mp: null, bp: null, d: null, tc: null, ph: "solid", ap: "synthetic element" },
  { n: 111, s: "Rg", nm: "Roentgenium", cat: "transition-metal", b: "d", v: 11, ox: [11], am: 280, en: null, ie: 600, ar: 220, ea: 0, sme: null, shc: null, mp: null, bp: null, d: null, tc: null, ph: "solid", ap: "synthetic element" },
  { n: 112, s: "Cn", nm: "Copernicium", cat: "transition-metal", b: "d", v: 12, ox: [12], am: 285, en: null, ie: 600, ar: 220, ea: 0, sme: null, shc: null, mp: 357, bp: 523, d: null, tc: null, ph: "solid", ap: "synthetic element" },
  { n: 113, s: "Nh", nm: "Nihonium", cat: "post-transition-metal", b: "p", v: 3, ox: [3], am: 286, en: null, ie: 600, ar: 220, ea: 0, sme: null, shc: null, mp: 700, bp: 1430, d: null, tc: null, ph: "solid", ap: "synthetic element" },
  { n: 114, s: "Fl", nm: "Flerovium", cat: "post-transition-metal", b: "p", v: 4, ox: [4], am: 289, en: null, ie: 600, ar: 220, ea: 0, sme: null, shc: null, mp: 61, bp: 210, d: null, tc: null, ph: "solid", ap: "synthetic element" },
  { n: 115, s: "Mc", nm: "Moscovium", cat: "post-transition-metal", b: "p", v: 5, ox: [5], am: 290, en: null, ie: 600, ar: 220, ea: 0, sme: null, shc: null, mp: 670, bp: 1340, d: null, tc: null, ph: "solid", ap: "synthetic element" },
  { n: 116, s: "Lv", nm: "Livermorium", cat: "post-transition-metal", b: "p", v: 6, ox: [6], am: 293, en: null, ie: 600, ar: 220, ea: 0, sme: null, shc: null, mp: 637, bp: 1035, d: null, tc: null, ph: "solid", ap: "synthetic element" },
  { n: 117, s: "Ts", nm: "Tennessine", cat: "halogen", b: "p", v: 7, ox: [7, 5, 1, -1], am: 294, en: null, ie: 600, ar: 220, ea: 0, sme: null, shc: null, mp: 623, bp: 723, d: null, tc: null, ph: "solid", ap: "synthetic element" },
  { n: 118, s: "Og", nm: "Oganesson", cat: "noble-gas", b: "p", v: 8, ox: [], am: 294, en: null, ie: 600, ar: 220, ea: 0, sme: null, shc: null, mp: 258, bp: 350, d: null, tc: null, ph: "gas", ap: "synthetic element" }
];

function createElement(el) {
  return {
    "atomicNumber": el.n,
    "symbol": el.s,
    "name": el.nm,
    "elementCategory": el.cat,
    "chemicalBlock": el.b,
    "valenceElectrons": el.v,
    "oxidationStates": el.ox,
    "standardUsed": "iupac",
    
    "nist": {
      "atomicMass": el.am,
      "electronegativity": el.en,
      "ionizationEnergy": el.ie,
      "atomicRadius": el.ar,
      "electronAffinity": el.ea,
      "standardMolarEntropy": el.sme,
      "specificHeatCapacity": el.shc,
      "meltingPoint": el.mp,
      "boilingPoint": el.bp,
      "density": el.d,
      "thermalConductivity": el.tc,
      "source": "NIST Chemistry WebBook 2024"
    },
    
    "iupac": {
      "atomicMass": el.am,
      "electronegativity": el.en,
      "ionizationEnergy": el.ie,
      "atomicRadius": el.ar,
      "electronAffinity": el.ea,
      "standardMolarEntropy": el.sme,
      "specificHeatCapacity": el.shc,
      "meltingPoint": el.mp,
      "boilingPoint": el.bp,
      "density": el.d,
      "thermalConductivity": el.tc,
      "source": "IUPAC Periodic Table 2024"
    },
    
    "physicalProperties": {
      "phase": el.ph,
      "appearance": el.ap,
      "uses": [],
      "notes": `Element of the ${el.cat} group`
    },
    
    "lastUpdated": "2026-01-27"
  };
}

async function generateAll118() {
  const tempDir = path.join(__dirname, '../src/data/substances/periodic-table/temp-test');
  
  // Clear old files
  if (fs.existsSync(tempDir)) {
    fs.readdirSync(tempDir).forEach(file => {
      if (file.endsWith('.json')) {
        fs.unlinkSync(path.join(tempDir, file));
      }
    });
  }
  
  console.log(`🚀 Generating all 118 elements from NIST/IUPAC data...`);
  const start = Date.now();
  
  PERIODIC_TABLE.forEach(el => {
    const formatted = createElement(el);
    const filename = `${String(el.n).padStart(3, '0')}_${el.s}_${el.cat}.json`;
    const filepath = path.join(tempDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(formatted, null, 2) + '\n');
  });
  
  const elapsed = ((Date.now() - start) / 1000).toFixed(2);
  console.log(`✅ Generated all 118 elements in ${elapsed} seconds`);
  console.log(`📁 Output: ${tempDir}`);
  console.log(`\n📊 Verify a few files:`);
  const samples = [1, 26, 79, 118];
  samples.forEach(n => {
    const el = PERIODIC_TABLE.find(x => x.n === n);
    console.log(`   ${String(n).padStart(3, '0')}_${el.s}_${el.cat}.json`);
  });
}

generateAll118().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
