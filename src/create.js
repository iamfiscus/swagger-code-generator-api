'use strict';

const request = require('request');

module.exports = function create(options, swaggerSpec) {
  return new Promise((resolve, reject) => {
    const postUrl = `${options.endpoint}${options.language}`;

    request.post({
      url: postUrl,
      json: true,
      body: swaggerSpec,
    }, (err, req, body) => {
      if (err) {
        reject(err);
      }
      if (!isNaN(body.code)) {
        reject(body);
      }
      resolve(body);
    });
  });
};
