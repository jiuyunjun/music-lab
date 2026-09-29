import { describe, expect, it } from 'vitest';
import { buildSong } from '../../theory/song';
import { DEFAULT_PROJECT, decodeProject, encodeProject, sanitizeProject, toSpec } from './project';
import { ARRANGE_TEMPLATES } from '../../content/arrange';

describe('sanitizeProject', () => {
  it('keeps a valid project as-is', () => {
    expect(sanitizeProject(DEFAULT_PROJECT)).toEqual(DEFAULT_PROJECT);
  });

  it('repairs bad fields from untrusted input', () => {
    const p = sanitizeProject({
      keyChroma: 99,
      mode: 'evil',
      bpm: 'fast',
      progression: ['I', '<script>'],
      harmony: { instrument: 'kazoo' },
      mixer: { drums: { volume: 5 } },
    });
    expect(p.keyChroma).toBe(11);
    expect(p.mode).toBe('ionian');
    expect(p.bpm).toBe(DEFAULT_PROJECT.bpm);
    expect(p.progression).toEqual(DEFAULT_PROJECT.progression);
    expect(p.harmony.instrument).toBe('piano');
    expect(p.mixer.drums.volume).toBe(1);
  });
});

describe('encode / decode', () => {
  it('round-trips through a URL-safe string', () => {
    const project = { ...DEFAULT_PROJECT, progression: ['i', 'bVII', 'bVI', 'V'], mode: 'aeolian' as const };
    const code = encodeProject(project);
    expect(code).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(decodeProject(code)).toEqual(project);
  });

  it('rejects garbage', () => {
    expect(decodeProject('!!!not-base64')).toBeNull();
  });
});

describe('ARRANGE_TEMPLATES', () => {
  it.each(ARRANGE_TEMPLATES.map((t) => [t.id, t] as const))('%s is valid and builds', (_, template) => {
    expect(sanitizeProject(template.project)).toEqual(template.project);
    const song = buildSong(toSpec(template.project));
    expect(song.events.length).toBeGreaterThan(0);
  });
});
