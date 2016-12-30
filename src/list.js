'use strict';

const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');
const request = require('request');
const camelCase = require('camelcase');
const mkdirp = require('mkdirp');

let swagger;

function validate(options) {
  // @TODO Validate and define default options

  // Swagger
  if (!options.swagger) {
    throw new Error('The swagger file path is required.');
  }

  if (path.extname(options.swagger) !== '.yaml' && path.extname(options.swagger) !== '.json') {
    throw new Error('The swagger file must be a YAML or JSON file.');
  }

  // Types
  if (!options.types) {
    throw new Error('The language \'types\' are required.');
  }

  const defaults = {
    endpoint: `http://generator.swagger.io/api/gen/${options.action}s/`,
    path: {
      archive: './generated/archive/',
      output: `./generated/${options.action}/`,
    },
  };

  const config = Object.assign({}, defaults, options);

  Object.keys(options.path).forEach((k) => {
    if (!options.path[k]) {
      throw new Error(`Path ${k} is required.`);
    }

    mkdirp(options.path[k], (err) => {
      if (err) {
        throw new Error(`The path '${path}' does not exist and could not be created.`);
      }
    });
  });

  return config;
}

const buildTypeList = function buildTypeList(types) {
  const result = {};
  types.forEach((type) => {
    result[camelCase(type)] = type;
  });

  return result;
};

const getTypeList = function getTypeList(options) {
  return new Promise((resolve, reject) => {
    request.get({
      url: options.endpoint,
      json: true,
    }, (err, req, body) => {
      if (err) {
        // @TODO throw better error
        console.log(err);
        reject(err);
        return;
      }
      if (body.code) {
        console.error(`The endpoint '${options.endpoint}' does not exist or is returning an error.`, body);
        reject(body);
        return;
      }

      resolve(buildTypeList(body));
    });
  });
};

const init = function init(options) {
  return new Promise((resolve) => {
    const config = validate(options);

    swagger = fs.readFileSync(config.swagger, 'utf8');

    if (path.extname(config.swagger) === '.yaml') {
      swagger = JSON.stringify(yaml.safeLoad(swagger));
    }

    getTypeList(config).then((data) => {
      resolve({
        clientTypeList: data,
        api: swagger,
      });
    }).catch((err) => {
      throw new Error(`The endpoint '${options.endpoint}' does not exist or is returning an error.`, err);
    });
  });
};

module.exports = function list() {
  return {
    init,
    validate,
    get: getTypeList,
    build: buildTypeList,
  };
};
