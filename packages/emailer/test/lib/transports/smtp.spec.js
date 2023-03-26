const nodemailerSmtpTransport = require('nodemailer-smtp-transport');
const smtp = require('../../../lib/transports/smtp');

jest.mock('nodemailer-smtp-transport');

describe('transports/smtp', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should return a nodemailer transport', () => {
    const options = {
      host: 'my.smtp.host',
      port: 25,
    };

    smtp(options);

    expect(nodemailerSmtpTransport).toHaveBeenCalledWith({
      host: 'my.smtp.host',
      port: 25,
      ignoreTLS: false,
      secure: true,
    });
  });

  it('should throw an error if host is not provided', () => {
    const options = {
      port: 25,
    };

    expect(() => smtp(options)).toThrow('Required option `host` not found');
  });

  it('should throw an error if port is not provided', () => {
    const options = {
      host: 'my.smtp.host',
    };

    expect(() => smtp(options)).toThrow('Required option `port` not found');
  });

  it('should set ignoreTLS to true if ignoreTLS is true', () => {
    const options = {
      host: 'my.smtp.host',
      port: 25,
      ignoreTLS: true,
    };

    smtp(options);

    expect(nodemailerSmtpTransport).toHaveBeenCalledWith({
      host: 'my.smtp.host',
      port: 25,
      ignoreTLS: true,
      secure: true,
    });
  });

  it('should set secure to false if secure is false', () => {
    const options = {
      host: 'my.smtp.host',
      port: 25,
      secure: false,
    };

    smtp(options);

    expect(nodemailerSmtpTransport).toHaveBeenCalledWith({
      host: 'my.smtp.host',
      port: 25,
      ignoreTLS: false,
      secure: false,
    });
  });

  it('should set auth if user and pass are provided', () => {
    const options = {
      host: 'my.smtp.host',
      port: 25,
      auth: {
        user: 'user',
        pass: 'pass',
      },
    };

    smtp(options);

    expect(nodemailerSmtpTransport).toHaveBeenCalledWith({
      host: 'my.smtp.host',
      port: 25,
      ignoreTLS: false,
      secure: true,
      auth: {
        user: 'user',
        pass: 'pass',
      },
    });
  });
});
