const config = require('../index.js');

describe('eslint-config', () => {
  it('should export the correct config', () => {
    const eslintRc = require('../.eslintrc.js');
    expect(config).toEqual(eslintRc);
  });

  it('should export an object', () => {
    expect(typeof config).toBe('object');
  });
});
