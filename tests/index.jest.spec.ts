import { describe, it, expect } from '@jest/globals';
import * as azcodr from '../src/index.js';

describe('Jest Quality Gate: azcodr public API', () => {
  it('exports expected runtime functions and constants', () => {
    expect(typeof azcodr.scaffold).toBe('function');
    expect(typeof azcodr.validateTarget).toBe('function');
    expect(typeof azcodr.copyTemplate).toBe('function');
    expect(typeof azcodr.getTemplateDir).toBe('function');
    expect(Array.isArray(azcodr.TEMPLATE_ITEMS)).toBe(true);
    expect(typeof azcodr.ERROR_CODES).toBe('object');
  });

  it('provides working getTemplateDir', () => {
    const dir = azcodr.getTemplateDir();
    expect(typeof dir).toBe('string');
    expect(dir.length).toBeGreaterThan(0);
  });
});
