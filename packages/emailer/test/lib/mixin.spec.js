const mixin = require('../../lib/mixin');
const EmailModel = require('../../lib/model');

jest.mock('../../lib/model');

describe('mixin', () => {
  let BaseController, Controller, instance;
  let req, res, next;
  let options;
  let nunjucksEnv;

  beforeEach(() => {
    options = {
      emailer: {
        transport: 'smtp',
        transportOptions: {
          host: 'my.smtp.host',
          port: 25,
        },
        subject: 'Test email',
        to: 'test@recipient.com',
        template: 'some-template.html',
      },
    };

    nunjucksEnv = {
      render: jest.fn(),
    };

    req = {
      form: {
        options,
      },
      sessionModel: {
        toJSON: jest.fn(),
      },
      app: {
        get: jest.fn().mockReturnValue(nunjucksEnv),
      },
    };

    res = {};
    next = jest.fn();

    BaseController = class {};
    Controller = mixin(BaseController);
    instance = new Controller(options);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('constructor', () => {
    it('should throw an error if emailer options are not provided', () => {
      options.emailer = null;

      expect(() => new Controller(options)).toThrow(
        'Options for emailer must be specified'
      );
    });

    it('should not throw an error if emailer options is not a string', () => {
      options.emailer = 'not an object';

      expect(() => new Controller(options)).toThrow(
        'Options for emailer must be specified'
      );
    });
  });

  describe('middlewareSetup', () => {
    beforeEach(() => {
      BaseController.prototype.middlewareSetup = jest.fn();
      BaseController.prototype.use = jest.fn();
      instance.configureEmailer = jest.fn();
    });

    it('should call super middlewareSetup', () => {
      instance.middlewareSetup();
      expect(BaseController.prototype.middlewareSetup).toHaveBeenCalled();
    });

    it('should call use with the configureEmailer method', () => {
      instance.middlewareSetup();
      expect(BaseController.prototype.use).toHaveBeenCalledWith(
        instance.configureEmailer
      );
    });
  });

  describe('configureEmailer', () => {
    it('should instantiate an email model', () => {
      instance.configureEmailer(req, res, next);
      expect(EmailModel).toHaveBeenCalledWith(null, options.emailer);
    });

    it('should set the emailer property on the instance', () => {
      instance.configureEmailer(req, res, next);
      expect(instance.emailer).toBeInstanceOf(EmailModel);
    });

    it('should call next', () => {
      instance.configureEmailer(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('sendEmail', () => {
    beforeEach(() => {
      instance.emailer = {
        send: jest.fn(),
      };
    });

    it('should call the emailer send method with the correct arguments', () => {
      const callback = jest.fn();
      const html = '<p>Test email</p>';

      const expected = {
        to: options.emailer.to,
        subject: options.emailer.subject,
        html,
        attachments: [],
      };

      nunjucksEnv.render.mockImplementation((template, context, cb) => {
        cb(null, html);
      });

      instance.sendEmail(req, res, callback);
      expect(instance.emailer.send).toHaveBeenCalledWith(expected, callback);
    });

    it('should get the subject based on function if provided', () => {
      const callback = jest.fn();
      const html = '<p>Test email</p>';

      req.form.values = {
        foo: 'bar',
      };

      options.emailer.subject = (_req) => {
        return _req.form.values.foo;
      };

      nunjucksEnv.render.mockImplementation((template, context, cb) => {
        cb(null, html);
      });

      instance.sendEmail(req, res, callback);

      expect(instance.emailer.send).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: req.form.values.foo,
        }),
        callback
      );
    });

    it('should get attachments based on function if provided', () => {
      const callback = jest.fn();
      const html = '<p>Test email</p>';

      req.form.values = {
        foo: 'bar',
      };

      options.emailer.attachments = (_req) => {
        return _req.form.values;
      };

      nunjucksEnv.render.mockImplementation((template, context, cb) => {
        cb(null, html);
      });

      instance.sendEmail(req, res, callback);

      expect(instance.emailer.send).toHaveBeenCalledWith(
        expect.objectContaining({
          attachments: req.form.values,
        }),
        callback
      );
    });

    it('should get recipient based on function if provided', () => {
      const callback = jest.fn();
      const html = '<p>Test email</p>';

      req.form.values = {
        foo: 'bar',
      };

      options.emailer.to = (_req) => {
        return _req.form.values.foo;
      };

      nunjucksEnv.render.mockImplementation((template, context, cb) => {
        cb(null, html);
      });

      instance.sendEmail(req, res, callback);

      expect(instance.emailer.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: req.form.values.foo,
        }),
        callback
      );
    });

    it('should get context based on function if provided', () => {
      const callback = jest.fn();
      const html = '<p>Test email</p>';

      req.form.values = {
        foo: 'bar',
      };

      options.emailer.context = (_req) => {
        return _req.form.values;
      };

      nunjucksEnv.render.mockImplementation((template, context, cb) => {
        cb(null, html);
      });

      instance.sendEmail(req, res, callback);

      expect(nunjucksEnv.render).toHaveBeenCalledWith(
        options.emailer.template,
        Object.assign(req.form.values, {
          subject: options.emailer.subject,
        }),
        expect.any(Function)
      );
    });

    it('should get context based on object if provided', () => {
      const callback = jest.fn();
      const html = '<p>Test email</p>';

      options.emailer.context = {
        foo: 'bar',
      };

      const expectedContext = Object.assign(options.emailer.context, {
        subject: options.emailer.subject,
      });

      nunjucksEnv.render.mockImplementation((template, context, cb) => {
        cb(null, html);
      });

      instance.sendEmail(req, res, callback);

      expect(nunjucksEnv.render).toHaveBeenCalledWith(
        options.emailer.template,
        expectedContext,
        expect.any(Function)
      );
    });

    it('passes back an error if the emailer fails', () => {
      const callback = jest.fn();
      const error = new Error('some-error');
      instance._renderEmail = jest
        .fn()
        .mockImplementation((template, context, req, cb) => {
          cb(error);
        });
      instance.sendEmail(req, res, callback);
      expect(callback).toHaveBeenCalledWith(error);
    });
  });

  describe('saveValues', () => {
    beforeEach(() => {
      BaseController.prototype.saveValues = jest.fn();
    });

    it('should call super saveValues', () => {
      instance.sendEmail = jest.fn().mockImplementation((req, res, cb) => {
        cb(null);
      });
      instance.saveValues(req, res, next);
      expect(BaseController.prototype.saveValues).toHaveBeenCalled();
    });

    it('should call sendEmail', () => {
      instance.sendEmail = jest.fn().mockImplementation((req, res, cb) => {
        cb(null);
      });
      instance.saveValues(req, res, next);
      expect(instance.sendEmail).toHaveBeenCalled();
    });

    it('should pass an error into next', () => {
      const error = new Error('some-error');
      instance.sendEmail = jest.fn().mockImplementation((req, res, cb) => {
        cb(error);
      });
      instance.saveValues(req, res, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
