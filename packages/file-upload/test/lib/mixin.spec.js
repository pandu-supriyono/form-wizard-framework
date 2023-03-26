const busboyBodyParser = require('busboy-body-parser');
const mixin = require('../../lib/mixin');
const _ = require('underscore');

jest.mock('busboy-body-parser');

describe('mixin', () => {
  let BaseController, Controller, instance;
  let req, res, next;
  let options;

  beforeEach(() => {
    options = {
      route: '/index',
      template: 'index',
      fileUpload: {
        limit: '10mb',
      },
      fields: {
        file1: {
          type: 'file',
        },
        file2: {
          type: 'file',
        },
      },
    };

    req = {
      form: {
        options,
      },
      sessionModel: {
        get: jest.fn(),
      },
    };
    res = {};
    next = jest.fn();
    BaseController = class {};
    Controller = mixin(BaseController);
    instance = new Controller();
    instance.Error = class {
      constructor(key, options) {
        this.key = key;
        _.extend(this, options);
      }
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('exports a function', () => {
    expect(typeof mixin).toBe('function');
  });

  it('should extend the base controller', () => {
    expect(instance).toBeInstanceOf(BaseController);
  });

  describe('configure', () => {
    beforeEach(() => {
      BaseController.prototype.configure = jest.fn();
    });

    it('should set a list of file fields according to the form config', () => {
      instance.configure(req, res, next);
      expect(options.files).toEqual(['file1', 'file2']);
    });

    it('should call the super configure method', () => {
      instance.configure(req, res, next);

      expect(BaseController.prototype.configure).toHaveBeenCalledWith(
        req,
        res,
        next
      );
    });
  });

  describe('middlewareSetup', () => {
    beforeEach(() => {
      BaseController.prototype.middlewareSetup = jest.fn();
      BaseController.prototype.use = jest.fn();
    });

    it('should call the super middlewareSetup method', () => {
      instance.options = options;
      instance.middlewareSetup();

      expect(BaseController.prototype.middlewareSetup).toHaveBeenCalled();
    });

    it('should use a middleware', () => {
      instance.options = options;
      instance.middlewareSetup();

      expect(BaseController.prototype.use).toHaveBeenCalled();
    });

    it('should initialize busboyBodyParser with options if provided', () => {
      instance.options = options;
      instance.middlewareSetup();

      expect(busboyBodyParser).toHaveBeenCalledWith(options.fileUpload);
    });

    it('should initialize busboyBodyParser with default options if not provided', () => {
      instance.options = {};
      instance.middlewareSetup();

      expect(busboyBodyParser).toHaveBeenCalledWith({
        limit: '5mb',
      });
    });
  });

  describe('process', () => {
    beforeEach(() => {
      BaseController.prototype.process = jest.fn();

      req.form.options.files = ['file1', 'file2'];
      req.form.values = {};

      req.files = {
        file1: {
          data: Buffer('raw file data'),
          name: 'file1.txt',
          encoding: 'utf8',
          mimetype: 'text/plain',
          truncated: false,
        },
        file2: {
          data: Buffer('raw file data'),
          name: 'file2.txt',
          encoding: 'utf8',
          mimetype: 'text/plain',
          truncated: false,
        },
      };
    });

    it('takes req.files and attaches it to form values', () => {
      instance.process(req, res, next);

      expect(req.form.values.file1).toEqual(req.files.file1);
      expect(req.form.values.file2).toEqual(req.files.file2);
    });

    it('does not map req.files if req.files does not exist', () => {
      req.files = undefined;

      instance.process(req, res, next);

      expect(req.form.values.file1).not.toBeDefined();
    });

    it('does not map req.files if the corresponding req.files key does not exist', () => {
      req.files.file1 = undefined;

      instance.process(req, res, next);

      expect(req.form.values.file1).not.toBeDefined();
    });
  });
});
