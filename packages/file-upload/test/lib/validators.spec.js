const validators = require('../../lib/validators');

describe('validators', () => {
  describe('mimetype', () => {
    describe('should return true on valid mimetypes', () => {
      const cases = [
        [
          {
            mimetype: 'application/pdf',
          },
          'img/jpg',
          'application/pdf',
        ],
        [
          {
            mimetype: 'application/pdf',
          },
          'application/pdf',
        ],
      ];

      test.each(cases)(
        'when %s is allowed and %s is provided, it should return true',
        (...args) => {
          expect(validators.mimetype.apply(null, args)).toBeTruthy();
        }
      );
    });

    describe('should return true on invalid mimetypes', () => {
      const cases = [
        [
          {
            mimetype: 'application/pdf',
          },
          'img/jpg',
          'img/gif',
        ],
        [
          {
            mimetype: 'application/pdf',
          },
          'application/exe',
        ],
      ];

      test.each(cases)(
        'when %s is allowed and %s is provided, it should return false',
        (...args) => {
          expect(validators.mimetype.apply(null, args)).toBeFalsy();
        }
      );
    });

    it('should return true when no file is provided', () => {
      expect(
        validators.mimetype.apply(null, [undefined, 'application/pdf'])
      ).toBeTruthy();
    });

    it('should return false when no file mimetype is provided', () => {
      expect(
        validators.mimetype.apply(null, [{}, 'application/pdf'])
      ).toBeFalsy();
    });
  });

  describe('fileSize', () => {
    const validCases = [
      [{ size: 500 }, 1024],
      [{ size: 8216 }, 9000],
      [{ size: 9000 }, 9000],
    ];

    test.each(validCases)(
      'when %s is provided and %s is the limit, is should return true',
      (...args) => {
        expect(validators.fileSize.apply(null, args)).toBeTruthy();
      }
    );

    const invalidCases = [
      [{ size: 1025 }, 1024],
      [{ size: 10000 }, 9000],
    ];

    test.each(invalidCases)(
      'when %s is provided and %s is the limit, is should return false',
      (...args) => {
        expect(validators.fileSize.apply(null, args)).toBeFalsy();
      }
    );

    it('should return true when no file is provided', () => {
      expect(validators.fileSize.apply(null, [undefined, 1024])).toBeTruthy();
    });

    it('should return false when no file file size is provided', () => {
      expect(validators.mimetype.apply(null, [{}, 1024])).toBeFalsy();
    });

    it('should return false if file is not an object', () => {
      expect(validators.mimetype.apply(null, ['file', 1024])).toBeFalsy();
    });

    it('should return false if there is a file but no size', () => {
      expect(
        validators.mimetype.apply(null, [
          {
            foo: ' bar',
          },
          1024,
        ])
      ).toBeFalsy();
    });
  });
});
