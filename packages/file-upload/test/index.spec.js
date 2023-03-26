const fileUpload = require('../index.js');

describe('file-upload', () => {
  it('should export an object', () => {
    expect(typeof fileUpload).toBe('object');
  });

  it('should export the mixin', () => {
    expect(fileUpload.mixin).toEqual(require('../lib/mixin'));
  });

  it('should export the validars', () => {
    expect(fileUpload.validators).toEqual(require('../lib/validators'));
  });
});
