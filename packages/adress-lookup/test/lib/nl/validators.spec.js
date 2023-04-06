'use strict';

const validators = require('../../../lib/nl/validators');

describe('validators', () => {
  describe('postcode format validation rules', () => {
    it('returns true if the postcode is correct', () => {
      expect(validators.postcode('2517KC')).toBeTruthy();
    });

    it('returns true with a space', () => {
      expect(validators.postcode('2517 KC')).toBeTruthy();
    });

    it('returns true in lowercase', () => {
      expect(validators.postcode('2517kc')).toBeTruthy();
    });

    it('returns true in mixed case', () => {
      expect(validators.postcode('2517Kc')).toBeTruthy();
    });

    it('returns false when not 4 digits', () => {
      expect(validators.postcode('257Kc')).toBeFalsy();
    });

    it('returns false when not 2 alpha characters', () => {
      expect(validators.postcode('2517K')).toBeFalsy();
    });
  });
});
