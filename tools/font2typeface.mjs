// Convert a TTF into three.js typeface JSON (same conversion as three's
// TTFLoader, which would otherwise fetch opentype.js from a CDN at runtime).
//   node tools/font2typeface.mjs stage/public/fonts/TitanOne-Regular.ttf "WOBLEPARTY wobleparty" out.json
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(new URL('../stage/package.json', import.meta.url));
const opentype = require('opentype.js');

const [src, charset, dst] = process.argv.slice(2);
const font = opentype.parse(fs.readFileSync(src).buffer);
const scale = 100000 / ((font.unitsPerEm || 2048) * 72);
const round = Math.round;
const glyphs = {};
for (const ch of new Set(charset)) {
  const glyph = font.charToGlyph(ch);
  const token = { ha: round(glyph.advanceWidth * scale), x_min: round(glyph.xMin * scale), x_max: round(glyph.xMax * scale), o: '' };
  for (const c of glyph.path.commands) {
    const type = c.type.toLowerCase() === 'c' ? 'b' : c.type.toLowerCase();
    token.o += type + ' ';
    for (const [x, y] of [['x', 'y'], ['x1', 'y1'], ['x2', 'y2']]) {
      if (c[x] !== undefined && c[y] !== undefined) token.o += round(c[x] * scale) + ' ' + round(c[y] * scale) + ' ';
    }
  }
  glyphs[ch] = token;
}
fs.writeFileSync(dst, JSON.stringify({
  glyphs,
  familyName: font.getEnglishName('fullName'),
  ascender: round(font.ascender * scale),
  descender: round(font.descender * scale),
  underlinePosition: font.tables.post.underlinePosition,
  underlineThickness: font.tables.post.underlineThickness,
  boundingBox: { xMin: font.tables.head.xMin, xMax: font.tables.head.xMax, yMin: font.tables.head.yMin, yMax: font.tables.head.yMax },
  resolution: 1000,
}));
console.log('wrote', dst, Object.keys(glyphs).length, 'glyphs');
