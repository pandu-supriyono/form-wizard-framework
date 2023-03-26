const EmailModel = require('../../lib/model');
const nodemailer = require('nodemailer');
const transports = require('../../lib/transports');

jest.mock('nodemailer');
jest.mock('../../lib/transports');

describe('EmailModel', () => {
  let options, sendMail, smtpTransport;

  beforeEach(() => {
    options = {
      from: 'test@email.com',
      transportOptions: {
        host: 'test.host',
        port: 25,
      },
    };

    // mock nodemailer
    sendMail = jest.fn();
    nodemailer.createTransport.mockReturnValue({
      sendMail,
    });

    // mock transports
    smtpTransport = jest.fn();
    transports.smtp = smtpTransport;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('constructor', () => {
    it('should be a function', () => {
      expect(typeof EmailModel).toEqual('function');
    });

    it('should set a default transport of smtp', () => {
      const model = new EmailModel(null, options);
      expect(smtpTransport).toHaveBeenCalledWith({
        host: 'test.host',
        port: 25,
      });
      expect(model.options.transport).toEqual('smtp');
    });

    it('passes the transport to nodemailer', () => {
      smtpTransport.mockReturnValue({
        transport: 'test-transport',
      });
      new EmailModel(null, options);
      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        transport: 'test-transport',
      });
    });

    it('should throw an error if no from or replyTo options are set', () => {
      expect(() => {
        new EmailModel(null, {});
      }).toThrow('At least one of `from` or `replyTo` options must be defined');
    });

    it('should throw options is not an object', () => {
      expect(() => {
        new EmailModel(null, 'test');
      }).toThrow('Options must be an object');
    });
  });

  describe('send', () => {
    it('should call sendMail on the emailer', () => {
      const model = new EmailModel(null, options);
      model.send(
        {
          to: 'test-recipient',
          subject: 'test',
          html: 'test',
        },
        () => {}
      );
      expect(sendMail).toHaveBeenCalled();
    });

    it('should set the from and replyTo options', () => {
      const model = new EmailModel(null, options);
      model.send(
        {
          to: 'test-recipient@email.com',
          subject: 'test',
          html: '<test></test>',
        },
        () => {}
      );
      expect(sendMail).toHaveBeenCalledWith(
        {
          to: 'test-recipient@email.com',
          subject: 'test',
          from: 'test@email.com',
          replyTo: 'test@email.com',
          attachments: [],
          html: '<test></test>',
        },
        expect.any(Function)
      );
    });

    it('should set the from and replyTo options if replyTo is set', () => {
      options = {
        replyTo: 'reply-to@email.com',
      };

      const model = new EmailModel(null, options);
      model.send(
        {
          to: 'test-recipient',
          subject: 'test',
          html: '<test></test>',
        },
        () => {}
      );
      expect(sendMail).toHaveBeenCalledWith(
        {
          to: 'test-recipient',
          subject: 'test',
          from: 'reply-to@email.com',
          replyTo: 'reply-to@email.com',
          attachments: [],
          html: '<test></test>',
        },
        expect.any(Function)
      );
    });
  });
});
