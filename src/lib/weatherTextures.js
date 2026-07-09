// Encode the Open-Meteo marine/wind grid (from marine.js) into WeatherLayers GL
// TextureData: Float32Array rasters WeatherLayers turns into GPU heatmaps and
// animated particle fields. NaN marks land / no-data. Row 0 of the texture is
// the NORTH edge (image convention), so we flip the south→north grid vertically.
//
// Direction conventions (Open-Meteo):
//   ocean_current_direction — direction the current flows TOWARD (oceanographic)
//   wind_direction_10m      — direction the wind comes FROM (meteorological)
// Both are encoded as geographic [u = eastward, v = northward] components; the
// wind is negated so particles drift the way the wind blows, not where it's from.

// WeatherLayers image bounds: [minX, minY, maxX, maxY]. Grid points are cell
// centres, so expand by half a step to cover the visible field extent.
export function forecastBounds(fc) {
  const { west, east, south, north, latStep, lngStep } = fc.bbox;
  return [west - lngStep / 2, south - latStep / 2, east + lngStep / 2, north + latStep / 2];
}

export function scalarTexture(fc, accessor) {
  const width = fc.lngs.length;
  const height = fc.lats.length;
  const data = new Float32Array(width * height);
  for (let r = 0; r < height; r++) {
    const latIdx = height - 1 - r; // texture row 0 = north
    for (let c = 0; c < width; c++) {
      const cell = fc.cells[latIdx * width + c];
      const v = cell ? accessor(cell) : null;
      data[r * width + c] = (v == null || Number.isNaN(v)) ? NaN : v;
    }
  }
  return { data, width, height };
}

// Interleaved [u, v] per pixel (bandCount 2). fromDirection negates the vector
// for FROM-conventions (wind).
export function vectorTexture(fc, velAcc, dirAcc, fromDirection = false) {
  const width = fc.lngs.length;
  const height = fc.lats.length;
  const data = new Float32Array(width * height * 2);
  for (let r = 0; r < height; r++) {
    const latIdx = height - 1 - r;
    for (let c = 0; c < width; c++) {
      const cell = fc.cells[latIdx * width + c];
      const o = (r * width + c) * 2;
      if (!cell) { data[o] = NaN; data[o + 1] = NaN; continue; }
      const spd = Number(velAcc(cell)) || 0;
      const rad = ((Number(dirAcc(cell)) || 0) * Math.PI) / 180;
      let u = spd * Math.sin(rad);   // eastward
      let v = spd * Math.cos(rad);   // northward
      if (fromDirection) { u = -u; v = -v; }
      data[o] = u; data[o + 1] = v;
    }
  }
  return { data, width, height };
}

// ── Palettes (dataviz method: SST diverging cool↔warm with a neutral midpoint,
//    NOT a rainbow; waves sequential single-family; both ColorBrewer, CB-safe) ──

// SST 18–34 °C — ColorBrewer RdBu reversed, neutral ~26 °C (tropical W-Africa mean).
export const SST_PALETTE = [
  [18, [5, 48, 97]],
  [21, [33, 102, 172]],
  [24, [103, 169, 207]],
  [26, [247, 247, 247]],
  [28, [244, 165, 130]],
  [31, [214, 96, 77]],
  [34, [103, 0, 31]],
];

// Wave height 0–4 m — ColorBrewer GnBu sequential (low→high).
export const WAVE_PALETTE = [
  [0, [240, 249, 232]],
  [1, [186, 228, 188]],
  [2, [123, 204, 196]],
  [3, [67, 162, 202]],
  [4, [8, 104, 172]],
];
