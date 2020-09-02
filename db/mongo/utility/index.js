'use strict';

const bcrypt = require('bcryptjs');

const toLowerCaseConverter = value => {
  if (typeof value === 'string') {
    return value.toLocaleLowerCase();
  }
};

const createHash = value => {
  bcrypt.genSalt(8, (err, salt) => {
    if (err) {
    } else {
      const hash = this.bcrypt.hashSync(data, salt);
      return hash;
    }
  });
};

const strToNumberTyped = value => {
  if (typeof value === 'string') {
    return parseInt(value);
  }
};

const toTitleCase = value => {
  if (typeof value === 'string') {
    return value.replace(/\w\S*/g, txt => {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  }
};

module.exports = {
  toLowerCaseConverter: toLowerCaseConverter,
  passwordEncrypt: createHash,
  strToNumberTyped,
  toTitleCase,
};
