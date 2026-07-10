// Continent-wide weather + ocean "casts" over all of Africa. Open-Meteo Forecast
// (wind, air temp — everywhere) + Marine (waves, SST, currents — ocean only) on a
// single regular grid, free/no-key. Ocean fields are null over land, so they wrap
// the whole coastline; wind/air-temp cover the entire continent. One grid → the
// map renders smooth interpolated fields, not scattered dots.

const LAT0 = -36, LAT1 = 38, LAT_STEP = 3;   // south (South Africa) → north (Tunisia)
const LNG0 = -20, LNG1 = 52, LNG_STEP = 3;   // west (Atlantic) → east (Indian Ocean)

function axis(a, b, step) {
  const out = [];
  for (let v = a; v <= b + 1e-9; v += step) out.push(+v.toFixed(3));
  return out;
}
export const LATS = axis(LAT0, LAT1, LAT_STEP);
export const LNGS = axis(LNG0, LNG1, LNG_STEP);
export const BBOX = { west: LNG0, east: LNG1, south: LAT0, north: LAT1, latStep: LAT_STEP, lngStep: LNG_STEP };

// Returns { lats, lngs, bbox, cells, points } where each cell (row-major,
// lat-outer/lng-inner) has { windSpd, windDir, temp } always, and { wave, sst,
// curVel, curDir } only over ocean (null on land). Cells are never null (wind/
// temp exist everywhere); ocean fields being null is what confines them to coasts.
export async function getContinentForecast() {
  const lat = [], lng = [];
  for (const la of LATS) for (const lo of LNGS) { lat.push(la); lng.push(lo); }
  const latS = lat.join(','), lngS = lng.join(',');
  const marineUrl =
    `https://marine-api.open-meteo.com/v1/marine?latitude=${latS}&longitude=${lngS}` +
    `&current=wave_height,sea_surface_temperature,ocean_current_velocity,ocean_current_direction`;
  const windUrl =
    `https://api.open-meteo.com/v1/forecast?latitude=${latS}&longitude=${lngS}` +
    `&current=wind_speed_10m,wind_direction_10m,temperature_2m&wind_speed_unit=ms`;

  try {
    const [mRes, wRes] = await Promise.all([fetch(marineUrl), fetch(windUrl)]);
    const [marine, wind] = await Promise.all([mRes.json(), wRes.json()]);
    const mArr = Array.isArray(marine) ? marine : [marine];
    const wArr = Array.isArray(wind) ? wind : [wind];

    const cells = [];
    const points = [];
    for (let i = 0; i < lat.length; i++) {
      const m = mArr[i]?.current || {};
      const w = wArr[i]?.current || {};
      const isOcean = m.wave_height != null;
      const cell = {
        windSpd: w.wind_speed_10m ?? 0,
        windDir: w.wind_direction_10m ?? 0,
        temp: w.temperature_2m ?? null,
        wave: isOcean ? m.wave_height : null,
        sst: isOcean ? (m.sea_surface_temperature ?? null) : null,
        curVel: isOcean ? (m.ocean_current_velocity ?? 0) : null,
        curDir: isOcean ? (m.ocean_current_direction ?? 0) : null,
      };
      cells.push(cell);
      if (isOcean) points.push({ lat: lat[i], lng: lng[i], ...cell });
    }
    return { lats: LATS, lngs: LNGS, bbox: BBOX, cells, points };
  } catch {
    return { lats: LATS, lngs: LNGS, bbox: BBOX, cells: [], points: [] };
  }
}
