// Pure height rules of the BottomSheet, kept apart from the component so they can be tested.

export type Detent = 'peek' | 'half' | 'full';
export type Heights = Record<Detent, number>;

const ORDER: Detent[] = ['peek', 'half', 'full'];
// Map spec §3: «la media nunca pasa de la completa menos 68 px», so half always shows more map than full.
export const HALF_MAP_GAP = 68;
// Release speed (px/ms) from which a gesture counts as a flick and pushes one height further.
export const FLICK_VELOCITY = 0.5;

/** If the header does not fit at half height (landscape, 200 % text), half is shown as full. */
export function shownDetent(detent: Detent, headerFits: boolean): Detent {
  return detent === 'half' && !headerFits ? 'full' : detent;
}

/**
 * The grip's next step, from the height that is shown. Map spec decision 27: always back through half
 * (half → full → half → peek → half). When the header does not fit, half looks like full, so the
 * steps that would change nothing are skipped: full ↔ peek.
 */
export function nextDetent(shown: Detent, lastEdge: Detent, headerFits: boolean): Detent {
  if (!headerFits) return shown === 'full' ? 'peek' : 'half';
  if (shown !== 'half') return 'half';
  return lastEdge === 'full' ? 'peek' : 'full';
}

/** Heights from the layer and the measured content. The half height never goes above full − 68 px. */
export function measureHeights(
  full: number,
  titleBottom: number,
  headBottom: number,
): { heights: Heights; headerFits: boolean } {
  const maxHalf = full - HALF_MAP_GAP;
  return {
    heights: { peek: Math.min(full, titleBottom), half: Math.min(headBottom, maxHalf), full },
    headerFits: headBottom <= maxHalf,
  };
}

/**
 * On release: the height nearest to where the sheet is. A flick that would leave it where it started
 * pushes it one height in the gesture's direction; never more than one step past the nearest.
 */
export function snapDetent(
  heights: Heights,
  from: Detent,
  height: number,
  velocity: number,
): Detent {
  const nearest = ORDER.reduce((best, name) =>
    Math.abs(heights[name] - height) < Math.abs(heights[best] - height) ? name : best,
  );
  if (nearest !== from || Math.abs(velocity) < FLICK_VELOCITY) return nearest;
  const index = ORDER.indexOf(from) + Math.sign(velocity);
  return ORDER[Math.min(ORDER.length - 1, Math.max(0, index))] ?? from;
}
