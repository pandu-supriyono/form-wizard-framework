const emailer = require('../index.js');

describe('emailer', () => {
  it('should export an object', () => {
    expect(typeof emailer).toBe('object');
  });

  it('should export the mixin', () => {
    expect(emailer.mixin).toEqual(require('../lib/mixin'));
  });

  it('should export the model', () => {
    expect(emailer.Model).toEqual(require('../lib/model'));
  });

  it('should export the transports', () => {
    expect(emailer.transports).toEqual(require('../lib/transports'));
  });
});
