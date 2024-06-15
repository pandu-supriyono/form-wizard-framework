const fileUpload = require('../index.js');

describe('dynamic-content-key', () => {
  it('should export an object', () => {
    expect(typeof fileUpload).toBe('object');
  });

  it('should export the mixin', () => {
    expect(fileUpload.mixin).toEqual(require('../lib/mixin'));
  });
});
