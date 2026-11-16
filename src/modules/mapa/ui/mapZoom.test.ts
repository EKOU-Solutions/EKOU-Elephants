import { describe, expect, it } from 'vitest';
import { placement, rectToRect, zoomDirection, zoomKeyframes } from './mapZoom';

describe('zoomDirection', () => {
  it('zooms in from Colombia to a department or a municipality, around its department', () => {
    expect(zoomDirection({ view: 'country' }, { view: 'department', code: '05' })).toEqual({
      direction: 'in',
      code: '05',
    });
    expect(zoomDirection({ view: 'country' }, { view: 'municipality', code: '94884' })).toEqual({
      direction: 'in',
      code: '94',
    });
  });

  it('zooms out back to Colombia, into the department it came from', () => {
    expect(zoomDirection({ view: 'municipality', code: '05001' }, { view: 'country' })).toEqual({
      direction: 'out',
      code: '05',
    });
  });

  it('does not zoom between views of the same scale', () => {
    expect(
      zoomDirection({ view: 'department', code: '05' }, { view: 'municipality', code: '05001' }),
    ).toBeUndefined();
    expect(zoomDirection({ view: 'country' }, { view: 'invalid' })).toBeUndefined();
  });
});

describe('zoom geometry', () => {
  const frame = { x: 100, y: 200, w: 600, h: 500 };
  const department = { x: 300, y: 300, w: 60, h: 50 };

  it('carries a rectangle onto another, centre on centre', () => {
    const { a, b } = rectToRect(department, frame);
    expect(a).toBe(10);
    expect(a * (department.x + department.w / 2) + b.x).toBe(frame.x + frame.w / 2);
    expect(a * (department.y + department.h / 2) + b.y).toBe(frame.y + frame.h / 2);
  });

  it('places a snapshot where it was taken when the map is the identity', () => {
    expect(placement({ a: 1, b: { x: 0, y: 0 } }, frame, 1, frame)).toBe(
      'translate(0px, 0px) scale(1)',
    );
  });

  it('starts each snapshot where the eye left it and ends the new one at rest', () => {
    const frames = zoomKeyframes(frame, department, frame, frame);
    expect(frames.old[0]?.transform).toBe('translate(0px, 0px) scale(1)');
    expect(frames.new.at(-1)?.transform).toBe('translate(0px, 0px) scale(1)');
    expect(frames.old[1]?.transform).toContain('scale(10)');
    expect(frames.new[0]?.transform).toContain('scale(0.1)');
  });
});
