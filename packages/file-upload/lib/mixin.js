const busboyBodyParser = require('busboy-body-parser');
const _ = require('underscore');

module.exports = (Controller) =>
  class extends Controller {
    configure(req, res, next) {
      req.form.options.files = _.keys(
        _.pick(req.form.options.fields, (field) => field.type === 'file')
      );

      super.configure(req, res, next);
    }

    middlewareSetup() {
      super.middlewareSetup();

      const fileUploadOptions = this.options.fileUpload || {
        limit: '5mb',
      };

      this.use(
        busboyBodyParser({
          limit: fileUploadOptions.limit,
        })
      );
    }

    process(req, res, next) {
      const fileFields = req.form.options.files;

      _.forEach(fileFields, (fieldName) => {
        if (req.files && req.files[fieldName]) {
          const fileData = req.files[fieldName];

          req.form.values[fieldName] = fileData;
        }
      });

      return super.process(req, res, next);
    }
  };
