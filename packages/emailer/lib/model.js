'use strict';

const LocalModel = require('hmpo-model').Local;
const nodemailer = require('nodemailer');
const transports = require('./transports');

const debug = require('debug')('simple-forms-framework:email-model');

class EmailModel extends LocalModel {
  constructor(attrs, options) {
    if (!options || typeof options != 'object') {
      throw new Error('Options must be an object');
    }

    options.transport = options.transport || 'smtp';
    debug(`Using ${options.transport} transport`);

    if (!options.from && !options.replyTo) {
      throw new Error(
        'At least one of `from` or `replyTo` options must be defined'
      );
    }

    const transport = transports[options.transport](
      options.transportOptions || {}
    );

    super(attrs, options);

    this.emailer = nodemailer.createTransport(transport);
  }

  send({ to, subject, html, attachments = [] }, callback) {
    debug(
      'sending email to %s from %s',
      to,
      this.options.from || this.options.replyTo
    );

    return this.emailer.sendMail(
      {
        to,
        subject,
        from: this.options.from || this.options.replyTo,
        replyTo: this.options.replyTo || this.options.from,
        html,
        attachments,
      },
      callback
    );
  }
}

module.exports = EmailModel;
