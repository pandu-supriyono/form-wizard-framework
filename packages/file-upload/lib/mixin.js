const fileUpload = require('express-fileupload');
const _ = require('underscore');

function parseLimitBytes(limit) {
  if (typeof limit === 'number') return limit;
  const match = /^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/i.exec(String(limit));
  if (!match) return 5 * 1024 * 1024;
  const units = { b: 1, kb: 1024, mb: 1048576, gb: 1073741824 };
  return Math.round(parseFloat(match[1]) * (units[(match[2] || 'b').toLowerCase()] || 1));
}

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
        fileUpload({
          limits: { fileSize: parseLimitBytes(fileUploadOptions.limit || '5mb') },
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
