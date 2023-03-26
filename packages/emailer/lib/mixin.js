const EmailModel = require('./model');

module.exports = (Controller) => {
  return class extends Controller {
    constructor(options) {
      if (typeof options.emailer !== 'object' || options.emailer === null) {
        throw new Error('Options for emailer must be specified');
      }

      super(options);
    }

    middlewareSetup() {
      super.middlewareSetup();
      this.use(this.configureEmailer);
    }

    saveValues(req, res, next) {
      this.sendEmail(req, res, (err) => {
        if (err) {
          return next(err);
        }
        super.saveValues(req, res, next);
      });
    }

    configureEmailer(req, res, next) {
      const config = req.form.options.emailer;

      const model = new EmailModel(null, config);

      this.emailer = model;

      next();
    }

    sendEmail(req, res, callback) {
      const template = req.form.options.emailer.template;
      const subject = this._getSubject(req);
      const to = this._getRecipient(req);
      const attachments = this._getAttachments(req) || [];
      const context = this._getContext(req, res);

      this._renderEmail(template, context, req, (err, html) => {
        if (err) return callback(err);

        return this.emailer.send(
          {
            to,
            subject,
            html,
            attachments,
          },
          callback
        );
      });
    }

    _renderEmail(template, context, req, callback) {
      const nunjucks = req.app.get('nunjucksEnv');

      nunjucks.render(template, context, callback);
    }

    _getContext(req, res) {
      const config = req.form.options.emailer;

      const locals = res.locals || {};

      const subject = this._getSubject(req);

      if (typeof config.context === 'function') {
        const context = config.context.call(this, req);
        return Object.assign(
          locals,
          req.sessionModel.toJSON(),
          {
            subject,
          },
          context
        );
      }

      return Object.assign(locals, req.sessionModel.toJSON(), config.context);
    }

    _getAttachments(req) {
      const config = req.form.options.emailer;
      if (typeof config.attachments === 'function') {
        return config.attachments.call(this, req);
      }

      return config.attachments;
    }

    _getSubject(req) {
      const config = req.form.options.emailer;

      if (typeof config.subject === 'function') {
        return config.subject.call(this, req);
      }

      return config.subject;
    }

    _getRecipient(req) {
      const config = req.form.options.emailer;

      if (typeof config.to === 'function') {
        return config.to.call(this, req);
      }

      return config.to;
    }
  };
};
