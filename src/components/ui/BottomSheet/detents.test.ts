import { describe, expect, it } from 'vitest';
import { measureHeights, nextDetent, shownDetent, snapDetent } from './detents';

describe('nextDetent', () => {
  it('always goes back through half: half → full → half → peek → half', () => {
    let current = nextDetent('half', 'peek', true);
    expect(current).toBe('full');
    current = nextDetent(current, 'full', true);
    expect(current).toBe('half');
    current = nextDetent(current, 'full', true);
    expect(current).toBe('peek');
    current = nextDetent(current, 'peek', true);
    expect(current).toBe('half');
    expect(nextDetent(current, 'peek', true)).toBe('full');
  });

  it('when the header does not fit, cycles what is shown: full ↔ peek', () => {
    const fromFull = nextDetent(shownDetent('half', false), 'peek', false);
    expect(fromFull).toBe('peek');
    const fromPeek = nextDetent('peek', 'peek', false);
    expect(shownDetent(fromPeek, false)).toBe('full');
  });
});

describe('measureHeights', () => {
  it('measures peek and half from the content', () => {
    expect(measureHeights(636, 120, 330)).toEqual({
      heights: { peek: 120, half: 330, full: 636 },
      headerFits: true,
    });
  });

  it('never lets half go above full − 68 px, and says the header does not fit', () => {
    expect(measureHeights(376, 120, 330)).toEqual({
      heights: { peek: 120, half: 308, full: 376 },
      headerFits: false,
    });
  });

  it('accepts a header that ends exactly at full − 68 px', () => {
    expect(measureHeights(398, 120, 330).headerFits).toBe(true);
  });
});

describe('shownDetent', () => {
  it('shows half as full when the header does not fit', () => {
    expect(shownDetent('half', false)).toBe('full');
    expect(shownDetent('half', true)).toBe('half');
    expect(shownDetent('peek', false)).toBe('peek');
  });
});

describe('snapDetent', () => {
  const heights = { peek: 120, half: 330, full: 636 };

  it('snaps a slow release to the nearest height', () => {
    expect(snapDetent(heights, 'half', 200, 0)).toBe('peek');
    expect(snapDetent(heights, 'peek', 300, 0)).toBe('half');
    expect(snapDetent(heights, 'half', 520, 0)).toBe('full');
  });

  it('pushes a quick flick one height, never more', () => {
    expect(snapDetent(heights, 'peek', 150, 3)).toBe('half');
    expect(snapDetent(heights, 'half', 360, 1.5)).toBe('full');
    expect(snapDetent(heights, 'half', 300, -1.2)).toBe('peek');
    expect(snapDetent(heights, 'full', 600, 3)).toBe('full');
  });
});
