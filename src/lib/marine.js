// Marine + weather "casts" on a regular coastal grid over West/Central Africa.
// Open-Meteo Marine (waves, SST, ocean currents) + Forecast (wind) — global, free,
// no key. Returns a regular grid so the map can render smooth interpolated fields
// (BarentsWatch-style), not scattered dots.

const LAT0 = 0, LAT1 = 18, LAT_STEP = 2;     // south → north
const LNG0 = -18, LNG1 = 12, LNG_STEP = 3;   // west → east

function axis(a, b, step) {
  const out = [];
  for (let v = a; v <= b + 1e-9; v += step) out.push(+v.toFixed(3));
  return out;
}
export const LATS = axis(LAT0, LAT1, LAT_STEP);
export const LNGS = axis(LNG0, LNG1, LNG_STEP);
export const BBOX = { west: LNG0, east: LNG1, south: LAT0, north: LAT1, latStep: LAT_STEP, lngStep: LNG_STEP };

// Returns { lats, lngs, bbox, cells, points } where:
//  cells  = flat row-major (lat-outer, lng-inner) array of {wave,sst,curVel,curDir,windSpd,windDir} | null (land)
//  points = ocean cells with {lat,lng,...} for direction arrows
export async function getMarineForecast() {
  const lat = [], lng = [];
  for (const la of LATS) for (const lo of LNGS) { lat.push(la); lng.push(lo); }
  const latS = lat.join(','), lngS = lng.join(',');
  const marineUrl =
    `https://marine-api.open-meteo.com/v1/marine?latitude=${latS}&longitude=${lngS}` +
    `&current=wave_height,swell_wave_height,wave_period,sea_surface_temperature,ocean_current_velocity,ocean_current_direction`;
  const windUrl =
    `https://api.open-meteo.com/v1/forecast?latitude=${latS}&longitude=${lngS}` +
    `&current=wind_speed_10m,wind_direction_10m&wind_speed_unit=ms`;

  try {
    const [mRes, wRes] = await Promise.all([fetch(marineUrl), fetch(windUrl)]);
    const marine = await mRes.json();
    const wind = await wRes.json();
    const mArr = Array.isArray(marine) ? marine : [marine];
    const wArr = Array.isArray(wind) ? wind : [wind];

    const cells = [];
    const points = [];
    for (let i = 0; i < lat.length; i++) {
      const m = mArr[i]?.current || {};
      const w = wArr[i]?.current || {};
      if (m.wave_height == null) { cells.push(null); continue; }
      const cell = {
        wave: m.wave_height ?? 0,
        swell: m.swell_wave_height ?? null,
        period: m.wave_period ?? null,
        sst: m.sea_surface_temperature ?? null,
        curVel: m.ocean_current_velocity ?? 0,
        curDir: m.ocean_current_direction ?? 0,
        windSpd: w.wind_speed_10m ?? 0,
        windDir: w.wind_direction_10m ?? 0,
      };
      cells.push(cell);
      points.push({ lat: lat[i], lng: lng[i], ...cell });
    }
    return { lats: LATS, lngs: LNGS, bbox: BBOX, cells, points };
  } catch {
    return { lats: LATS, lngs: LNGS, bbox: BBOX, cells: [], points: [] };
  }
}
