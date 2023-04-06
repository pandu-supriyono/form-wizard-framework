'use strict';

const _ = require('underscore');
const async = require('async');
const PostcodeApiModel = require('./model');
const validators = require('../validators');

const POSTCODE_PART_KEY = 'postcode';
const NUMBER_PART_KEY = 'number';
const EXTENSION_PART_KEY = 'extension';
const ADDRESS_LOOKUP_PARTS = [
  POSTCODE_PART_KEY,
  NUMBER_PART_KEY,
  EXTENSION_PART_KEY,
];

module.exports = (Controller) =>
  class extends Controller {
    configure(req, res, next) {
      const modelConfig = req.form.options.addressLookup;

      if (!modelConfig) {
        throw new Error(
          'Configuration for the postcode lookup model must be supplied'
        );
      }

      if (!modelConfig.url) {
        throw new Error(
          'Base url for the postcode lookup api must be supplied'
        );
      }

      if (!modelConfig.apiKey) {
        throw new Error(
          'An API key for the postcode lookup api must be supplied'
        );
      }

      req.form.options.addressFields = _.keys(
        _.pick(
          req.form.options.fields,
          (field) =>
            field.validate === 'postcode-lookup' ||
            _.contains(field.validate, 'postcode-lookup')
        )
      );

      _.forEach(req.form.options.addressFields, (fieldName) =>
        this.configureLookupField(req, fieldName)
      );

      req.postcodeApiModel = new PostcodeApiModel({}, modelConfig);

      super.configure(req, res, next);
    }

    configureLookupField(req, fieldName) {
      const addressField = req.form.options.fields[fieldName];
      const isRequired = _.contains(addressField.validate, 'required');

      if (Array.isArray(addressField.validate)) {
        addressField.validate = addressField.validate.filter(
          (x) => x !== 'postcode-lookup'
        );
      }

      if (addressField.validate === 'postcode-lookup') {
        delete addressField.validate;
      }

      ADDRESS_LOOKUP_PARTS.forEach((part) => {
        let field = req.form.options.fields[fieldName + '-' + part];

        field = _.extend(
          {
            errorGroup: fieldName + '-' + part,
            hintId: fieldName + '-hint',
            contentKey: fieldName + '-' + part,
            autocomplete:
              addressField.autocomplete &&
              (addressField.autocomplete === 'off'
                ? 'off'
                : addressField.autocomplete + '-' + part),
            dependent: addressField.dependent,
            labelClassName: 'form-label',
          },
          field
        );

        if (!_.isArray(field.validate)) field.validate = [field.validate];

        if (part === 'postcode') {
          field.validate.unshift(validators.postcode);
        }

        // only make part required if date field is required, but not if it is an address extension
        if (isRequired && part !== 'extension')
          field.validate.unshift('required');

        field.validate = field.validate.filter(
          (validation) => validation != null
        );

        req.form.options.fields[fieldName + '-' + part] = field;
      });
    }

    getValues(req, res, callback) {
      super.getValues(req, res, (err, values) => {
        if (err) return callback(err);
        let errorValues = req.sessionModel.get('errorValues') || {};
        req.form.options.addressFields.forEach((fieldName) => {
          if (!values[fieldName]) return;

          ADDRESS_LOOKUP_PARTS.forEach((part) => {
            values[fieldName + '-' + part] =
              errorValues[fieldName + '-' + part] || values[fieldName][part];
            if (values[fieldName + '-' + part] == null) {
              delete values[fieldName + '-' + part];
            }
          });

          if (req.form.options.addressLookup.concatenateExtension) {
            const extensionKey = fieldName + '-' + EXTENSION_PART_KEY;
            const numberKey = fieldName + '-' + NUMBER_PART_KEY;

            values[numberKey] = values[numberKey] + values[extensionKey];

            delete values[extensionKey];
          }
        });
        callback(null, values);
      });
    }

    process(req, res, next) {
      _.forEach(req.form.options.addressFields, (fieldName) =>
        this.processAddressField(req, fieldName)
      );
      super.process(req, res, next);
    }

    processAddressField(req, fieldName) {
      let body = req.form.values;
      body[fieldName] = Object.assign({}, body.fieldName);

      ADDRESS_LOOKUP_PARTS.forEach((part) => {
        const partFieldName = fieldName + '-' + part;

        if (part === POSTCODE_PART_KEY) {
          body[partFieldName] = this._processPostcode(body[partFieldName]);
        }

        if (part === NUMBER_PART_KEY) {
          const { number, extension } = this._processNumberAndExtension(
            body[partFieldName]
          );
          body[partFieldName] = number;

          if (!_.isEmpty(extension)) {
            const extensionKey = fieldName + '-' + EXTENSION_PART_KEY;
            body[extensionKey] = extension;
          }
        }

        if (body[partFieldName]) {
          body[fieldName][part] = body[partFieldName];
        }
      });
    }

    validateFields(req, res, callback) {
      super.validateFields(req, res, (errors) => {
        async.forEach(
          req.form.options.addressFields,
          (fieldName, cb) => {
            this.validateAddressField(req, fieldName, errors, cb);
          },
          () => {
            callback(errors);
          }
        );
      });
    }

    validateAddressField(req, fieldName, errors, callback) {
      const possibleErrorKeys = ADDRESS_LOOKUP_PARTS.map(
        (part) => fieldName + '-' + part
      );

      const requiredErrors = _.pick(
        errors,
        (error, key) =>
          error.type === 'required' && possibleErrorKeys.includes(key)
      );

      const postcodeErrors = _.pick(
        errors,
        (error, key) =>
          error.type === 'postcode' && possibleErrorKeys.includes(key)
      );

      if (!_.isEmpty(requiredErrors) || !_.isEmpty(postcodeErrors)) {
        callback();
        return;
      }

      const values = req.form.values[fieldName];

      if (!values) {
        callback();
        return;
      }

      req.postcodeApiModel.set(values);
      req.postcodeApiModel.fetch((err, data) => {
        if (err) {
          errors[fieldName] = this._parseError(req, fieldName, err);
          ADDRESS_LOOKUP_PARTS.forEach((part) => {
            if (part !== 'extension') {
              errors[fieldName + '-' + part] = this._parseError(
                req,
                fieldName,
                err
              );
            }
          });
          callback();
          return;
        }
        this._saveResults(req, fieldName, data);
        callback();
      });
    }

    _parseError(req, fieldName, fetchError) {
      const status = fetchError.status;

      let type = 'unknownError';

      if (status == 404) {
        type = 'notFound';
      }

      if (status == 400) {
        type = 'invalidFormat';
      }

      return new this.Error(
        fieldName,
        {
          type,
          field: fieldName + '-' + 'postcode',
          errorGroup: fieldName,
        },
        req
      );
    }

    _saveResults(req, fieldName, values) {
      req.form.values[fieldName] = Object.assign(
        req.form.values[fieldName],
        values
      );
    }

    _processPostcode(value) {
      return value ? value.replace(' ', '').toUpperCase() : '';
    }

    _processNumberAndExtension(value) {
      const numberAndExtension = value.match(/^(\d+)(\D.*)?$/);

      if (!numberAndExtension) {
        return {
          number: value,
          extension: '',
        };
      }

      return {
        number: numberAndExtension[1],
        extension: numberAndExtension[2] || '',
      };
    }

    saveValues(req, res, next) {
      _.forEach(req.form.options.addressFields, (fieldName) => {
        ADDRESS_LOOKUP_PARTS.forEach((part) => {
          delete req.form.values[fieldName + '-' + part];
        });
      });
      super.saveValues(req, res, next);
    }
  };
