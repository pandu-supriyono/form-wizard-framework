module.exports = (Controller) => {
  return class extends Controller {
    middlewareSetup() {
      super.middlewareSetup();
      this.use(this.configureContentKeys);
    }

    configureContentKeys(req, res, next) {
      const fieldsToProcess = Object.keys(req.form.options.fields).filter(
        (fieldName) => {
          const fieldOptions = req.form.options.fields[fieldName];

          return !!fieldOptions.contentKey;
        }
      );

      fieldsToProcess.forEach((fieldName) => {
        const fieldOptions = req.form.options.fields[fieldName];

        const contentKey = this.processContentKey(
          req,
          res,
          fieldOptions.contentKey
        );

        if (!contentKey) {
          delete req.form.options.fields[fieldName].contentKey;
          return;
        }

        req.form.options.fields[fieldName].contentKey = contentKey;
      });

      next();
    }

    _defaultContentKeyFunction(req, res, condition) {
      const val = req.sessionModel.get(condition.field);

      if (typeof condition.op === 'function') {
        return condition.op.call(this, val, req, res, condition);
      }

      switch (condition.op) {
        case '>':
          return val > condition.value;
        case '>=':
          return val >= condition.value;
        case '<':
          return val < condition.value;
        case '<=':
          return val <= condition.value;
        case '==':
          return val == condition.value;
        case '!=':
          return val != condition.value;
        case 'in':
          return condition.value.includes(val);
        default:
          return val === condition.value;
      }
    }

    processContentKey(req, res, contentKeyOptions) {
      while (Array.isArray(contentKeyOptions)) {
        const conditions = contentKeyOptions;
        contentKeyOptions = null;
        conditions.find((condition) => {
          if (
            typeof condition === 'string' ||
            typeof condition === 'function'
          ) {
            contentKeyOptions = condition;
            return true;
          }

          const fn = condition.fn || this._defaultContentKeyFunction;

          const result = fn.call(this, req, res, condition);

          if (result) {
            contentKeyOptions = condition.key;
            return true;
          }
        });
      }

      if (typeof contentKeyOptions == 'function') {
        return contentKeyOptions.call(this, req, res);
      }

      return contentKeyOptions;
    }
  };
};
