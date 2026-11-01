import { describe, it, expect } from 'vitest';
import { buildPrivacyNotice, NOTICE_VERSION, NOTICE_PURPOSE } from './privacy';

describe('buildPrivacyNotice', () => {
  it('deja constancia de cuándo se envió, qué versión del aviso se mostró y con qué finalidad', () => {
    const c = buildPrivacyNotice(new Date('2026-11-01T15:30:00.000Z'));
    expect(c).toEqual({ shownAt: '2026-11-01T15:30:00.000Z', version: NOTICE_VERSION, purpose: NOTICE_PURPOSE });
  });
});
