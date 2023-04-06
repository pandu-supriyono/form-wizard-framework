'use strict';

const addressLookupMixin = require('../../../../lib/nl/postcode-api/mixin');
const _ = require('underscore');
const PostcodeApiModel = require('../../../../lib/nl/postcode-api/model');
const validators = require('../../../../lib/nl/validators');

describe('Postcode API address lookup mixin', () => {
  let BaseController, Controller, instance;
  let req, res, next;
  let options;

  beforeEach(() => {
    options = {
      route: '/index',
      template: 'index',
      addressLookup: {
        apiKey: '123',
        url: 'http://mock.test',
      },
      fields: {
        address1: {
          autocomplete: 'myaddress',
          validate: ['required', 'postcode-lookup'],
        },
        address2: {
          autocomplete: 'off',
          validate: 'postcode-lookup',
        },
        'address2-number': {
          autocomplete: 'mycomplete',
          validate: 'part-validator',
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
    Controller = addressLookupMixin(BaseController);
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
    expect(typeof addressLookupMixin).toBe('function');
  });

  it('should extend the base controller', () => {
    expect(instance).toBeInstanceOf(BaseController);
  });

  describe('configure', () => {
    beforeEach(() => {
      BaseController.prototype.configure = jest.fn();
      instance.configureLookupField.prototype = jest.fn();
    });

    it('should set a list of address field pertaining to the lookup', () => {
      instance.configure(req, res, next);
      expect(options.addressFields).toEqual(['address1', 'address2']);
    });

    it('should configure address fields on ecah address field', () => {
      const spy = jest.spyOn(instance, 'configureLookupField');
      instance.configure(req, res, next);
      expect(spy).toHaveBeenNthCalledWith(1, req, 'address1');
      expect(spy).toHaveBeenNthCalledWith(2, req, 'address2');
    });

    it('should call the super configure method', () => {
      instance.configure(req, res, next);
      expect(BaseController.prototype.configure).toHaveBeenCalledWith(
        req,
        res,
        next
      );
    });

    it('should throw if a model config is not supplied', () => {
      delete req.form.options.addressLookup;
      expect(() => instance.configure(req, res, next)).toThrow(
        'Configuration for the postcode lookup model must be supplied'
      );
    });

    it('should throw if a model url is not supplied', () => {
      delete req.form.options.addressLookup.url;
      expect(() => instance.configure(req, res, next)).toThrow(
        'Base url for the postcode lookup api must be supplied'
      );
    });

    it('should throw if a model api key is not supplied', () => {
      delete req.form.options.addressLookup.apiKey;
      expect(() => instance.configure(req, res, next)).toThrow(
        'An API key for the postcode lookup api must be supplied'
      );
    });

    it('should set up a postcode lookup model', () => {
      instance.configure(req, res, next);
      expect(req.postcodeApiModel).toBeInstanceOf(PostcodeApiModel);
    });
  });

  describe('configureLookupField', () => {
    it('should add lookup parts for the lookup field', () => {
      instance.configureLookupField(req, 'address1');
      const fields = _.keys(req.form.options.fields);
      expect(fields).toEqual(
        expect.arrayContaining([
          'address1-postcode',
          'address1-number',
          'address1-extension',
        ])
      );
    });

    it('should add a postcode validator to the postcode part', () => {
      instance.configureLookupField(req, 'address2');
      const postcodeField = req.form.options.fields['address2-postcode'];
      expect(postcodeField.validate).toEqual(
        expect.arrayContaining([validators.postcode])
      );
    });

    it('should not add a postcode validator to the non-postcode parts', () => {
      instance.configureLookupField(req, 'address2');
      const numberField = req.form.options.fields['address2-number'];
      expect(numberField.validate).not.toEqual(
        expect.arrayContaining([instance.postcode])
      );
    });

    it('should prepend required validator if the address field is required', () => {
      instance.configureLookupField(req, 'address1');
      const postcodeField = req.form.options.fields['address1-postcode'];
      expect(postcodeField.validate[0]).toEqual('required');
    });

    it('should never require the address extension to be required', () => {
      instance.configureLookupField(req, 'address1');
      const extensionField = req.form.options.fields['address1-extension'];
      expect(extensionField.validate[0]).not.toEqual(
        expect.arrayContaining(['required'])
      );
    });

    it('should add the relevant error group to the address fields', () => {
      instance.configureLookupField(req, 'address1');
      const parts = ['postcode', 'number', 'extension'];
      const errorGroups = parts.map(
        (part) => req.form.options.fields['address1-' + part].errorGroup
      );
      expect(errorGroups).toEqual([
        'address1-postcode',
        'address1-number',
        'address1-extension',
      ]);
    });

    it('should set autocomplete values of the parent address field', () => {
      instance.configureLookupField(req, 'address1');
      expect(req.form.options.fields['address1-postcode'].autocomplete).toEqual(
        'myaddress-postcode'
      );
      expect(req.form.options.fields['address1-number'].autocomplete).toEqual(
        'myaddress-number'
      );
      expect(
        req.form.options.fields['address1-extension'].autocomplete
      ).toEqual('myaddress-extension');
    });

    it('should override autocomplete values for specific parts when set', () => {
      instance.configureLookupField(req, 'address2');
      expect(req.form.options.fields['address2-postcode'].autocomplete).toEqual(
        'off'
      );
      expect(req.form.options.fields['address2-number'].autocomplete).toEqual(
        'mycomplete'
      );
      expect(
        req.form.options.fields['address2-extension'].autocomplete
      ).toEqual('off');
    });

    it('should not populate autcomplete if not specified', () => {
      delete options.fields.address1.autocomplete;
      instance.configureLookupField(req, 'address1');
      expect(
        req.form.options.fields['address1-postcode'].autocomplete
      ).toBeUndefined();
      expect(
        req.form.options.fields['address1-number'].autocomplete
      ).toBeUndefined();
      expect(
        req.form.options.fields['address1-extension'].autocomplete
      ).toBeUndefined();
    });

    it('should delete the postcode-lookup validation key from the parent validator if it is an array', () => {
      instance.configureLookupField(req, 'address1');

      expect(req.form.options.fields.address1.validate).toEqual(['required']);
    });

    it('should delete the postcode-lookup validation key from the parent validator if it a string', () => {
      instance.configureLookupField(req, 'address2');

      expect(req.form.options.fields.address2.validate).toBeUndefined();
    });
  });

  describe('getValues', () => {
    beforeEach(() => {
      options.addressFields = ['address1', 'address2'];
      BaseController.prototype.getValues = jest
        .fn()
        .mockImplementation((req, res, cb) => {
          cb(null, {
            address1: {
              postcode: '2517KC',
              number: '8',
            },
          });
        });
    });

    it('should have the lookup parts get the values out of the address field', () => {
      return new Promise((resolve, reject) => {
        instance.getValues(req, res, (err, values) => {
          if (err) {
            reject(err);
          }
          try {
            expect(values).toEqual({
              'address1-number': '8',
              'address1-postcode': '2517KC',
              address1: {
                number: '8',
                postcode: '2517KC',
              },
            });
            resolve();
          } catch (err) {
            reject(err);
          }
        });
      });
    });

    it('should have the lookup parts get values out of the individual part fields first', () => {
      req.sessionModel.get = jest.fn().mockReturnValue({
        'address1-number': '70',
        'address1-postcode': '2511BT',
      });
      return new Promise((resolve, reject) => {
        instance.getValues(req, res, (err, values) => {
          if (err) {
            reject(err);
          }
          try {
            expect(values).toEqual({
              'address1-number': '70',
              'address1-postcode': '2511BT',
              address1: {
                number: '8',
                postcode: '2517KC',
              },
            });
            resolve();
          } catch (err) {
            reject(err);
          }
        });
      });
    });

    it('should populate blank values if the value does not exist', () => {
      BaseController.prototype.getValues = jest
        .fn()
        .mockImplementation((req, res, cb) => {
          cb(null, {});
        });
      return new Promise((resolve, reject) => {
        instance.getValues(req, res, (err, values) => {
          if (err) {
            reject(err);
          }
          try {
            expect(values).toEqual({});
            resolve();
          } catch (err) {
            reject(err);
          }
        });
      });
    });

    it('can concatenate the number with extension', () => {
      BaseController.prototype.getValues = jest
        .fn()
        .mockImplementation((req, res, cb) => {
          cb(null, {
            address1: {
              postcode: '2517KC',
              number: '8',
              extension: '-b',
            },
          });
        });

      req.form.options.addressLookup.concatenateExtension = true;

      return new Promise((resolve, reject) => {
        instance.getValues(req, res, (err, values) => {
          if (err) {
            reject(err);
          }
          try {
            expect(values).toEqual({
              'address1-number': '8-b',
              'address1-postcode': '2517KC',
              address1: {
                number: '8',
                postcode: '2517KC',
                extension: '-b',
              },
            });
            resolve();
          } catch (err) {
            reject(err);
          }
        });
      });
    });
  });

  describe('process', () => {
    beforeEach(() => {
      options.addressFields = ['address1', 'address2'];
      instance.processAddressField = jest.fn();
      BaseController.prototype.process = jest.fn();
    });

    it('should run processAddressField for each date field', () => {
      instance.process(req, res, next);
      expect(instance.processAddressField).toHaveBeenCalledTimes(2);
      expect(instance.processAddressField).toHaveBeenNthCalledWith(
        1,
        req,
        'address1'
      );
      expect(instance.processAddressField).toHaveBeenNthCalledWith(
        2,
        req,
        'address2'
      );
    });

    it('should call the super process method', () => {
      instance.process(req, res, next);
      expect(BaseController.prototype.process).toHaveBeenCalledWith(
        req,
        res,
        next
      );
    });
  });

  describe('processAddressField', () => {
    beforeEach(() => {
      req.form.values = {
        'address1-postcode': '2517KC',
        'address1-number': '8',
      };
    });

    it('should use separate input fields for postcode and number', () => {
      instance.processAddressField(req, 'address1');
      expect(req.form.values['address1']).toEqual({
        number: '8',
        postcode: '2517KC',
      });
    });

    it('should process postcodes', () => {
      req.form.values['addres1-postcode'] = '2517 kc';
      instance.processAddressField(req, 'address1');
      expect(req.form.values['address1']).toEqual({
        number: '8',
        postcode: '2517KC',
      });
    });

    it('can split numbers from extensions', () => {
      req.form.values = {
        'address1-postcode': '2517KC',
        'address1-number': '8a',
      };

      instance.processAddressField(req, 'address1');
      expect(req.form.values['address1']).toEqual({
        number: '8',
        extension: 'a',
        postcode: '2517KC',
      });
    });

    it('prioritizes parsed extensions', () => {
      req.form.values = {
        'address1-postcode': '2517KC',
        'address1-number': '8a',
        'address1-extension': 'b',
      };

      instance.processAddressField(req, 'address1');
      expect(req.form.values['address1']).toEqual({
        number: '8',
        extension: 'a',
        postcode: '2517KC',
      });
    });
  });

  describe('validateFields', () => {
    let errors;

    beforeEach(() => {
      errors = {};
      options.addressFields = ['address1', 'address2'];
      BaseController.prototype.validateFields = jest
        .fn()
        .mockImplementation((req, res, cb) => {
          cb(errors);
        });
      instance.validateAddressField = jest.fn();
    });

    it('should call the super validateFields method', () => {
      instance.validateFields(req, res, next);
      expect(BaseController.prototype.validateFields).toHaveBeenCalledWith(
        req,
        res,
        expect.any(Function)
      );
    });

    it('should call validateAddressField for each address field', () => {
      instance.validateFields(req, res, next);
      expect(instance.validateAddressField).toHaveBeenNthCalledWith(
        1,
        req,
        'address1',
        {},
        expect.any(Function)
      );
      expect(instance.validateAddressField).toHaveBeenNthCalledWith(
        2,
        req,
        'address2',
        {},
        expect.any(Function)
      );
    });

    it('calls the callback when all address fields have been iterated', () => {
      instance.validateFields(req, res, (fieldErrors) => {
        expect(instance.validateAddressField).toHaveBeenCalledTimes(2);
        expect(fieldErrors).toEqual(errors);
      });
    });
  });

  describe('validateAddressField', () => {
    beforeEach(() => {
      req.form.values = {
        address1: {
          postcode: '2517KC',
          number: '8',
          extension: 'B',
        },
      };

      req.postcodeApiModel = {
        get: jest.fn(),
        set: jest.fn(),
        fetch: jest.fn().mockImplementation((cb) => cb(null)),
      };
    });

    it('calls the postcode lookup model', () => {
      return new Promise((resolve, reject) => {
        instance.validateAddressField(req, 'address1', {}, () => {
          try {
            expect(req.postcodeApiModel.set).toHaveBeenCalledWith({
              postcode: '2517KC',
              number: '8',
              extension: 'B',
            });

            expect(req.postcodeApiModel.fetch).toHaveBeenCalled();

            resolve();
          } catch (err) {
            reject(err);
          }
        });
      });
    });

    it('sets the address form value as the api call result', () => {
      const apiResult = {
        postcode: '1234AB',
        number: 8,
        street: 'Kerkstraat',
        city: 'Den Haag',
        municipality: 'Den Haag',
        province: 'Zuid-Holland',
      };

      req.postcodeApiModel.fetch = jest.fn().mockImplementation((cb) => {
        cb(null, apiResult);
      });

      return new Promise((resolve, reject) => {
        instance.validateAddressField(req, 'address1', {}, () => {
          try {
            expect(req.form.values.address1).toEqual(
              Object.assign(apiResult, {
                extension: 'B',
              })
            );
            resolve();
          } catch (err) {
            reject(err);
          }
        });
      });
    });

    it('parses api not found errors', () => {
      req.postcodeApiModel.fetch = jest.fn().mockImplementation((cb) => {
        cb({
          status: 404,
        });
      });

      const errors = {};

      return new Promise((resolve, reject) => {
        instance.validateAddressField(req, 'address1', errors, () => {
          try {
            expect(errors).toEqual(
              expect.objectContaining({
                address1: {
                  key: 'address1',
                  type: 'notFound',
                  field: 'address1-postcode',
                  errorGroup: 'address1',
                },
              })
            );
            resolve();
          } catch (err) {
            reject(err);
          }
        });
      });
    });

    it('parses api invalid format errors', () => {
      req.postcodeApiModel.fetch = jest.fn().mockImplementation((cb) => {
        cb({
          status: 400,
        });
      });

      const errors = {};

      return new Promise((resolve, reject) => {
        instance.validateAddressField(req, 'address1', errors, () => {
          try {
            expect(errors).toEqual(
              expect.objectContaining({
                address1: {
                  key: 'address1',
                  type: 'invalidFormat',
                  field: 'address1-postcode',
                  errorGroup: 'address1',
                },
              })
            );
            resolve();
          } catch (err) {
            reject(err);
          }
        });
      });
    });

    it('parses api unknown errors', () => {
      req.postcodeApiModel.fetch = jest.fn().mockImplementation((cb) => {
        cb({
          status: 500,
        });
      });

      const errors = {};

      return new Promise((resolve, reject) => {
        instance.validateAddressField(req, 'address1', errors, () => {
          try {
            expect(errors).toEqual(
              expect.objectContaining({
                address1: {
                  key: 'address1',
                  type: 'unknownError',
                  field: 'address1-postcode',
                  errorGroup: 'address1',
                },
              })
            );
            resolve();
          } catch (err) {
            reject(err);
          }
        });
      });
    });

    it('adds an error key to every address part except address extension', () => {
      req.postcodeApiModel.fetch = jest.fn().mockImplementation((cb) => {
        cb({
          status: 500,
        });
      });

      const errors = {};

      return new Promise((resolve, reject) => {
        instance.validateAddressField(req, 'address1', errors, () => {
          try {
            const errorKeys = _.keys(errors);
            expect(errorKeys).toEqual(
              expect.arrayContaining([
                'address1',
                'address1-postcode',
                'address1-number',
              ])
            );
            resolve();
          } catch (err) {
            reject(err);
          }
        });
      });
    });

    it('short circuits if there are no values', () => {
      req.form.values.address1 = undefined;

      const errors = {};

      return new Promise((resolve, reject) => {
        instance.validateAddressField(req, 'address1', errors, () => {
          try {
            expect(req.postcodeApiModel.fetch).not.toHaveBeenCalled();
            resolve();
          } catch (err) {
            reject(err);
          }
        });
      });
    });

    it('short circuits if required errors are found', () => {
      const errors = {
        'address1-postcode': {
          type: 'required',
        },
      };

      return new Promise((resolve, reject) => {
        instance.validateAddressField(req, 'address1', errors, () => {
          try {
            expect(req.postcodeApiModel.fetch).not.toHaveBeenCalled();
            resolve();
          } catch (err) {
            reject(err);
          }
        });
      });
    });

    it('does not short circuit if the required errors are not related to the address field', () => {
      const errors = {
        unrelated: {
          type: 'required',
        },
      };

      return new Promise((resolve, reject) => {
        instance.validateAddressField(req, 'address1', errors, () => {
          try {
            expect(req.postcodeApiModel.fetch).toHaveBeenCalled();
            resolve();
          } catch (err) {
            reject(err);
          }
        });
      });
    });
  });

  describe('saveValues', () => {
    beforeEach(() => {
      BaseController.prototype.saveValues = jest.fn();
      options.addressFields = ['address1', 'address2'];

      req.form.values = {
        address1: {
          postcode: '6545CA',
          number: 29,
          street: 'Waldeck Pyrmontsingel',
          city: 'Nijmegen',
          municipality: 'Nijmegen',
          province: 'Gelderland',
        },
        'address1-postcode': '6545CA',
        'address1-number': '29',
        address2: {
          postcode: '1021JT',
          number: 19,
          street: 'Hamerstraat',
          city: 'Amsterdam',
          municipality: 'Amsterdam',
          province: 'Noord-Holland',
        },
        other: 'value',
      };
    });

    it('removes the part values', () => {
      instance.saveValues(req, res, next);
      expect(req.form.values).toEqual({
        address1: {
          postcode: '6545CA',
          number: 29,
          street: 'Waldeck Pyrmontsingel',
          city: 'Nijmegen',
          municipality: 'Nijmegen',
          province: 'Gelderland',
        },
        address2: {
          postcode: '1021JT',
          number: 19,
          street: 'Hamerstraat',
          city: 'Amsterdam',
          municipality: 'Amsterdam',
          province: 'Noord-Holland',
        },
        other: 'value',
      });
    });

    it('should call the super saveValues method', () => {
      instance.saveValues(req, res, next);
      expect(BaseController.prototype.saveValues).toHaveBeenCalledWith(
        req,
        res,
        next
      );
    });
  });
});
