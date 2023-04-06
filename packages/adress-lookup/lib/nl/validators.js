'use strict';

const validators = {
  postcode(value) {
    let regex = /^[1-9][0-9]{3}[\s]?[A-Za-z]{2}$/i;
    return regex.test(value);
  },
};

module.exports = validators;
