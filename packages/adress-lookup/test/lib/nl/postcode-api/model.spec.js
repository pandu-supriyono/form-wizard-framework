'use strict';

const PostcodeLookupModel = require('../../../../lib/nl/postcode-api/model');
const HmpoRemoteModel = require('hmpo-model');
const nock = require('nock');

describe('postcode lookup model', () => {
  let model;

  const mockBaseUrl = 'http://mock.test';

  const defaultTestOptions = {
    url: mockBaseUrl,
    apiKey: 'apiKey',
  };

  const okResponse = {
    postcode: '6545CA',
    number: 29,
    street: 'Binderskampweg',
    city: 'Nijmegen',
    municipality: 'Nijmegen',
    province: 'Gelderland',
    location: {
      type: 'Point',
      coordinates: [5.858910083770752, 51.84376540294041],
    },
  };

  beforeEach(() => {
    model = new PostcodeLookupModel({}, defaultTestOptions);
    PostcodeLookupModel.prototype.setLogger = jest.fn();

    nock(mockBaseUrl).get('/6545CA/29').reply(200, okResponse);
  });

  afterEach(() => {
    jest.clearAllMocks();
    nock.cleanAll();
  });

  it('should be an instance of RemoteModel', () => {
    model = new PostcodeLookupModel({}, defaultTestOptions);
    expect(model).toBeInstanceOf(HmpoRemoteModel);
  });

  it('should throw an error if no options are provided', () => {
    expect(() => new PostcodeLookupModel({})).toThrow(
      'Postcode lookup model: options must be provided'
    );
  });

  it('should throw an error if no url is provided in options', () => {
    expect(() => new PostcodeLookupModel({}, { apiKey: 'apiKey' })).toThrow(
      'Postcode lookup model: an url must be provided as options'
    );
  });

  it('should throw an error if no api key is provided in options or header', () => {
    expect(() => new PostcodeLookupModel({}, { url: mockBaseUrl })).toThrow(
      'Postcode lookup model: an api key must be provided as options (apiKey) or as header (X-Api-Key)'
    );
  });

  it('should not throw if an api key is provied as header', () => {
    expect(
      () =>
        new PostcodeLookupModel(
          {},
          {
            url: mockBaseUrl,
            headers: {
              'X-Api-Key': 'apiKey',
            },
          }
        )
    ).not.toThrow();
  });

  it('should fetch the API successfully', () => {
    return new Promise((resolve, reject) => {
      model.set('postcode', '6545CA');
      model.set('number', 29);

      model.fetch((err, data) => {
        if (err) {
          reject(err);
          return;
        }
        try {
          expect(data).toStrictEqual(okResponse);
          resolve();
        } catch (err) {
          resolve(err);
        }
      });
    });
  });
});
