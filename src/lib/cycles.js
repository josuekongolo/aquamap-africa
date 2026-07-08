// Production cycles derived from stocking logs (stocking-to-stocking windows).
// The FAO-correct scope for FCR/survival: lifetime aggregates blend cycles and
// species and become agronomically meaningless after the second stocking.

const DAY_MS = 86400000;

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

export const cycleLogs = (logs = [], cycle) => logs.filter((l) => inCycle(l.log_date, cycle));
export const cycleEvents = (events = [], cycle) => events.filter((e) => inCycle(e.event_date, cycle));

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
