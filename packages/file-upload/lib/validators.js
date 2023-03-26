const _ = require('underscore');

const validators = {
  mimetype(file, ...allowedMimeTypes) {
    if (!file) {
      return true;
    }

    if (!file.mimetype) {
      return false;
    }

    return _.contains(allowedMimeTypes, file.mimetype);
  },
  fileSize(file, maxSize) {
    if (!file) {
      return true;
    }

    return file.size <= maxSize;
  },
};

module.exports = validators;
