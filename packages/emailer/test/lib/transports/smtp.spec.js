const smtp = require('../../../lib/transports/smtp');

describe('transports/smtp', () => {
  it('should return a nodemailer SMTP config object', () => {
    const options = {
      host: 'my.smtp.host',
      port: 25,
    };

    const result = smtp(options);

    expect(result).toEqual({
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

    const result = smtp(options);

    expect(result).toEqual({
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

    const result = smtp(options);

    expect(result).toEqual({
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

    const result = smtp(options);

    expect(result).toEqual({
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
