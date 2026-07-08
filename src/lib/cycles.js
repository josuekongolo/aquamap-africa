// Production cycles. Two sources, unified into the same shape:
//   { id, start, end, w0, fingerlings, species, pondLabel, closed, explicit }
// (1) EXPLICIT rows from the `cycles` table (support multi-pond, labels), and
// (2) DERIVED from stocking logs (stocking-to-stocking windows) as a fallback
// for operators created before the cycles table. FCR/survival must be scoped to
// one cycle — lifetime aggregates blend cycles/species and are meaningless.

const DAY_MS = 86400000;

// Normalize explicit `cycles` rows into the canonical shape. w0 (day-0 weight)
// comes from the matching stocking log inside the cycle window.
export function cyclesFromRows(rows = [], logs = []) {
  const sorted = [...rows].filter((c) => c.stocked_on).sort((a, b) => String(a.stocked_on).localeCompare(String(b.stocked_on)));
  return sorted.map((c, i) => {
    // The stocking log linked to this cycle (or the first one on/after stocked_on).
    const stock = logs.find((l) => l.type === 'stocking' && (l.cycle_id === c.id
      || (!l.cycle_id && l.log_date === c.stocked_on)));
    return {
      id: c.id,
      start: c.stocked_on,
      end: c.closed_on || sorted[i + 1]?.stocked_on || null,
      w0: Number(stock?.avg_weight_g) || null,
      fingerlings: c.fingerlings ?? (Number(stock?.fingerlings_count) || null),
      species: c.species || stock?.species || null,
      pondLabel: c.pond_label || null,
      closed: !!c.closed_on,
      explicit: true,
    };
  });
}

// Cycles from stocking logs, oldest → newest. Each spans one stocking's date to
// the next stocking's date (exclusive); the last cycle is open-ended.
export function buildCycles(logs = []) {
  const stockings = logs
    .filter((l) => l.type === 'stocking' && l.log_date)
    .sort((a, b) => String(a.log_date).localeCompare(String(b.log_date)));
  return stockings.map((s, i) => ({
    id: s.id,
    start: s.log_date,
    end: stockings[i + 1]?.log_date || null, // exclusive upper bound
    w0: Number(s.avg_weight_g) || null,
    fingerlings: Number(s.fingerlings_count) || null,
    species: s.species || null,
  }));
}

export function cycleWindow(cycle) {
  return {
    startTs: new Date(cycle.start).getTime(),
    endTs: cycle.end ? new Date(cycle.end).getTime() : Infinity,
  };
}

export function inCycle(dateStr, cycle) {
  if (!cycle || !dateStr) return false;
  const { startTs, endTs } = cycleWindow(cycle);
  const ts = new Date(dateStr).getTime();
  return ts >= startTs && ts < endTs;
}

// Prefer explicit cycle_id links; fall back to the date window (derived cycles,
// or explicit rows whose historical logs predate linking).
export const cycleLogs = (logs = [], cycle) => logs.filter((l) =>
  cycle?.explicit && l.cycle_id ? l.cycle_id === cycle.id : inCycle(l.log_date, cycle));
export const cycleEvents = (events = [], cycle) => events.filter((e) =>
  cycle?.explicit && e.cycle_id ? e.cycle_id === cycle.id : inCycle(e.event_date, cycle));

export function cycleDay(cycle, now = Date.now()) {
  if (!cycle) return null;
  const { startTs, endTs } = cycleWindow(cycle);
  const ref = Math.min(now, endTs === Infinity ? now : endTs);
  return Math.max(0, Math.round((ref - startTs) / DAY_MS));
}

// Feed / harvest / gain / FCR / survival within one cycle.
// Survival = stocked count − Σ mortality-event counts (details.count).
export function cycleMetrics(logs = [], events = [], cycle) {
  const inLogs = cycleLogs(logs, cycle);
  let feed = 0, harvested = 0, sold = 0, revenue = 0;
  let stockedBiomass = 0, stockedCount = 0;
  for (const l of inLogs) {
    if (l.type === 'feed') feed += Number(l.feed_kg) || 0;
    else if (l.type === 'harvest') {
      harvested += Number(l.kg_harvested) || 0;
      sold += Number(l.kg_sold) || 0;
      revenue += (Number(l.kg_sold) || 0) * (Number(l.price_per_kg) || 0);
    } else if (l.type === 'stocking') {
      stockedBiomass += ((Number(l.fingerlings_count) || 0) * (Number(l.avg_weight_g) || 0)) / 1000;
      stockedCount += Number(l.fingerlings_count) || 0;
    }
  }
  let mortality = 0;
  for (const e of cycleEvents(events, cycle)) {
    if (e.type === 'mortality') mortality += Number(e.details?.count) || 0;
  }
  const gain = harvested - stockedBiomass;
  return {
    feed, harvested, sold, revenue, stockedBiomass, stockedCount, mortality, gain,
    fcr: feed > 0 && gain > 0 ? feed / gain : null,
    survivalPct: stockedCount > 0 ? Math.max(0, Math.round((100 * (stockedCount - mortality)) / stockedCount)) : null,
  };
}

// Estimated standing biomass + projected harvest from the latest sample.
// biomass = surviving count × latest avg weight; harvest date projected from the
// species growth curve (days to reach the low end of market weight).
// Pure form-entry — no hardware, no ML (the XpertSea/sampling pattern).
export function biomassEstimate(logs = [], events = [], cycle, bench, now = Date.now()) {
  if (!cycle || !bench) return null;
  const m = cycleMetrics(logs, events, cycle);
  const surviving = cycle.fingerlings != null
    ? Math.max(0, (cycle.fingerlings || 0) - m.mortality)
    : null;
  const samples = mapSamplesToCycle(events, cycle);
  const latest = samples.length ? samples.reduce((a, b) => (b.day > a.day ? b : a)) : (cycle.w0 ? { day: 0, weightG: cycle.w0 } : null);
  if (!latest) return { surviving, biomassKg: null, projectedHarvest: null, latestWeightG: null };

  const biomassKg = surviving != null ? (surviving * latest.weightG) / 1000 : null;

  // Days from now until the growth curve reaches market weight (low end).
  const target = bench.marketWeightG?.[0];
  let projectedHarvest = null;
  if (target && latest.weightG < target) {
    const curve = bench.growthCurve || [];
    const hit = curve.find((p) => p.weightG >= target);
    if (hit) {
      const daysToMarketFromStock = hit.day;
      const daysRemaining = Math.max(0, daysToMarketFromStock - latest.day);
      projectedHarvest = { daysRemaining, atDay: daysToMarketFromStock };
    }
  } else if (target && latest.weightG >= target) {
    projectedHarvest = { daysRemaining: 0, atDay: latest.day };
  }
  return { surviving, biomassKg, latestWeightG: latest.weightG, latestDay: latest.day, projectedHarvest };
}

// Sampling events inside a cycle mapped to days-since-stocking (growth curve).
export function mapSamplesToCycle(events = [], cycle) {
  if (!cycle) return [];
  const { startTs, endTs } = cycleWindow(cycle);
  const out = [];
  for (const e of events) {
    if (e.type !== 'sampling') continue;
    const w = Number(e.details?.avg_weight_g);
    if (!w) continue;
    const ts = new Date(e.event_date).getTime();
    if (ts < startTs || ts >= endTs) continue;
    const day = Math.round((ts - startTs) / DAY_MS);
    if (day < 0) continue;
    out.push({ day, weightG: w, ts });
  }
  return out;
}
