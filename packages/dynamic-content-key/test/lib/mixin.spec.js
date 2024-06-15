const mixin = require('../../lib/mixin');

class MockController {
  middlewareSetup() {}

  use() {}
}

describe('mixin', () => {
  let Controller;
  let controller;
  let req;
  let res;
  let next;
  let controllerMiddlewareSetup;
  let controllerUse;

  beforeEach(() => {
    Controller = mixin(MockController);
    controller = new Controller();
    controllerMiddlewareSetup = jest.spyOn(
      MockController.prototype,
      'middlewareSetup'
    );
    controllerUse = jest.spyOn(MockController.prototype, 'use');
    req = {
      sessionModel: {
        get: jest.fn().mockReturnValue('baz'),
      },
      form: {
        options: {
          fields: {
            foo: {
              contentKey: [
                {
                  field: 'foo',
                  value: 'baz',
                  key: 'qux',
                },
              ],
            },
          },
        },
      },
    };
    res = {};
    next = jest.fn();
  });

  describe('middlewareSetup', () => {
    it('calls super.middlewareSetup', () => {
      controller.middlewareSetup();

      expect(controllerMiddlewareSetup).toHaveBeenCalled();
    });

    it('use the configureContentKeys middleware', () => {
      controller.middlewareSetup();

      expect(controllerUse).toHaveBeenCalledWith(
        Controller.prototype.configureContentKeys
      );
    });
  });

  describe('configureContentKeys', () => {
    it('uses the provided string content key if configured as such', () => {
      req.form.options.fields.foo.contentKey = 'foo';

      controller.configureContentKeys(req, res, next);

      expect(req.form.options.fields.foo.contentKey).toEqual('foo');
    });

    it('calls the content key using a function if provided', () => {
      req.bar = 'bar';

      req.form.options.fields.foo.contentKey = (req) => {
        return req.bar;
      };

      controller.configureContentKeys(req, res, next);

      expect(req.form.options.fields.foo.contentKey).toEqual('bar');
    });

    it('uses the first string if an array of strings or functions are provided', () => {
      req.form.options.fields.foo.contentKey = ['foo', 'bar', () => 'baz'];

      controller.configureContentKeys(req, res, next);

      expect(req.form.options.fields.foo.contentKey).toEqual('foo');
    });

    it('uses the first function if an array of strings or functions are provided', () => {
      req.form.options.fields.foo.contentKey = [() => 'foo', 'bar'];

      controller.configureContentKeys(req, res, next);

      expect(req.form.options.fields.foo.contentKey).toEqual('foo');
    });

    it('deletes the content key option if it turns out empty', () => {
      req.form.options.fields.foo.contentKey = () => {
        return;
      };

      controller.configureContentKeys(req, res, next);

      expect(req.form.options.fields.foo).not.toHaveProperty('contentKey');
    });

    it('uses the "eq" op by default', () => {
      controller.configureContentKeys(req, res, next);

      expect(req.form.options.fields.foo.contentKey).toEqual('qux');
    });

    it('can use a custom "op"', () => {
      req.foo = 'foo';
      req.form.options.fields.foo.contentKey = [
        {
          field: 'foo',
          op: (val, req) => req.foo != val,
          key: 'bar',
        },
      ];

      controller.configureContentKeys(req, res, next);

      expect(req.form.options.fields.foo.contentKey).toEqual('bar');
    });

    it('uses the ">" operator', () => {
      req.sessionModel.get.mockReturnValue(10);
      req.form.options.fields.foo.contentKey = [
        {
          field: 'foo',
          op: '>',
          value: 5,
          key: 'greaterThanFive',
        },
      ];

      controller.configureContentKeys(req, res, next);

      expect(req.form.options.fields.foo.contentKey).toEqual('greaterThanFive');
    });

    it('uses the ">=" operator', () => {
      req.sessionModel.get.mockReturnValue(5);
      req.form.options.fields.foo.contentKey = [
        {
          field: 'foo',
          op: '>=',
          value: 5,
          key: 'greaterThanOrEqualToFive',
        },
      ];

      controller.configureContentKeys(req, res, next);

      expect(req.form.options.fields.foo.contentKey).toEqual(
        'greaterThanOrEqualToFive'
      );
    });

    it('uses the "<" operator', () => {
      req.sessionModel.get.mockReturnValue(3);
      req.form.options.fields.foo.contentKey = [
        {
          field: 'foo',
          op: '<',
          value: 5,
          key: 'lessThanFive',
        },
      ];

      controller.configureContentKeys(req, res, next);

      expect(req.form.options.fields.foo.contentKey).toEqual('lessThanFive');
    });

    it('uses the "<=" operator', () => {
      req.sessionModel.get.mockReturnValue(5);
      req.form.options.fields.foo.contentKey = [
        {
          field: 'foo',
          op: '<=',
          value: 5,
          key: 'lessThanOrEqualToFive',
        },
      ];

      controller.configureContentKeys(req, res, next);

      expect(req.form.options.fields.foo.contentKey).toEqual(
        'lessThanOrEqualToFive'
      );
    });

    it('uses the "==" operator', () => {
      req.sessionModel.get.mockReturnValue(5);
      req.form.options.fields.foo.contentKey = [
        {
          field: 'foo',
          op: '==',
          value: 5,
          key: 'equalToFive',
        },
      ];

      controller.configureContentKeys(req, res, next);

      expect(req.form.options.fields.foo.contentKey).toEqual('equalToFive');
    });

    it('uses the "!=" operator', () => {
      req.sessionModel.get.mockReturnValue(3);
      req.form.options.fields.foo.contentKey = [
        {
          field: 'foo',
          op: '!=',
          value: 5,
          key: 'notEqualToFive',
        },
      ];

      controller.configureContentKeys(req, res, next);

      expect(req.form.options.fields.foo.contentKey).toEqual('notEqualToFive');
    });

    it('uses the "in" operator', () => {
      req.sessionModel.get.mockReturnValue('bar');
      req.form.options.fields.foo.contentKey = [
        {
          field: 'foo',
          op: 'in',
          value: ['bar', 'baz'],
          key: 'inArray',
        },
      ];

      controller.configureContentKeys(req, res, next);

      expect(req.form.options.fields.foo.contentKey).toEqual('inArray');
    });

    it('deletes a contentKey if condition is not met', () => {
      req.sessionModel.get.mockReturnValue('quux');
      req.form.options.fields.foo.contentKey = [
        {
          field: 'foo',
          op: '==',
          value: 'baz',
          key: 'equalToBaz',
        },
      ];

      controller.configureContentKeys(req, res, next);

      expect(req.form.options.fields.foo).not.toHaveProperty('contentKey');
    });

    it('uses a custom function as the op', () => {
      req.foo = 'foo';
      req.form.options.fields.foo.contentKey = [
        {
          field: 'foo',
          op: (val, req) => req.foo !== val,
          key: 'customFunction',
        },
      ];

      controller.configureContentKeys(req, res, next);

      expect(req.form.options.fields.foo.contentKey).toEqual('customFunction');
    });

    it('uses multiple content key conditions in an array', () => {
      req.sessionModel.get.mockReturnValue(7);
      req.form.options.fields.foo.contentKey = [
        {
          field: 'foo',
          op: '<',
          value: 5,
          key: 'lessThanFive',
        },
        {
          field: 'foo',
          op: '=',
          value: 10,
          key: 'equalsTen',
        },
        {
          field: 'foo',
          op: '==',
          value: 7,
          key: 'equalToSeven',
        },
      ];

      controller.configureContentKeys(req, res, next);

      expect(req.form.options.fields.foo.contentKey).toEqual('equalToSeven');
    });

    it('uses multiple content key conditions with a fallback string', () => {
      req.sessionModel.get.mockReturnValue(12);
      req.form.options.fields.foo.contentKey = [
        {
          field: 'foo',
          op: '>',
          value: 15,
          key: 'greaterThanFifteen',
        },
        {
          field: 'foo',
          op: '<',
          value: 10,
          key: 'lessThanTen',
        },
        'defaultKey',
      ];

      controller.configureContentKeys(req, res, next);

      expect(req.form.options.fields.foo.contentKey).toEqual('defaultKey');
    });
  });
});
