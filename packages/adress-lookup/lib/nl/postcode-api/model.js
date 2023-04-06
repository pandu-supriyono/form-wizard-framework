'use strict';

const HmpoModel = require('hmpo-model');

class PostcodeApiModel extends HmpoModel {
    constructor(attributes, options) {
        if (!options || typeof options !== 'object') {
            throw new Error('Postcode lookup model: options must be provided');
        }

        if (!options.url) {
            throw new Error('Postcode lookup model: an url must be provided as options');
        }

        if (!options.apiKey && !(options.headers && options.headers['X-Api-Key'])) {
            throw new Error(
                'Postcode lookup model: an api key must be provided as options (apiKey) or as header (X-Api-Key)'
            );
        }

        if (options.apiKey) {
            options.headers = Object.assign(
                {},
                options.headers,
                {
                    'X-Api-Key': options.apiKey,
                }
            );
        }

        super(attributes, options);
    }

    url() {
        const postcode = this.get('postcode');
        const number = this.get('number');

        return this.options.url + '/' + postcode + '/' + number;
    }
}

module.exports = PostcodeApiModel;
