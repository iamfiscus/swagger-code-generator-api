'use strict';

require('ssl-root-cas').inject();

const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');
const request = require('request');
const unzip = require('unzip');
const camelCase = require('camelcase');
const mkdirp = require('mkdirp');

let swagger;

// @TODO print to console using chalk
// @TODO allow for url request
// @TODO allow for custom endpoints for self endpoints
// @TODO error handling

function validateOptions(options) {
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
    const config = validateOptions(options);

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

const download = function download(downloadPath, downloadResponse) {
  return new Promise((resolve, reject) => {
    request(downloadResponse.link).pipe(fs.createWriteStream(downloadPath)).on('finish', resolve).on('error', reject);
  });
};

const unzipDownload = function unzipDownload(zipPath, toPath) {
  if (zipPath.indexOf('.zip') === -1) throw new Error(`To unzip file must be a .zip file not ${zipPath}`);
  return new Promise((resolve, reject) => {
    fs.createReadStream(zipPath).pipe(unzip.Extract({
      path: toPath,
    })).on('error', reject).on('close', resolve);
  });
};

const create = function create(options, swaggerSpec) {
  return new Promise((resolve, reject) => {
    const postUrl = `${options.endpoint}${options.language}`;

    request.post({
      url: postUrl,
      json: true,
      body: swaggerSpec,
    }, (err, req, body) => {
      if (err) {
        reject(err);
        return;
      }
      if (!isNaN(body.code)) {
        reject(body);
        return;
      }
      resolve(body);
    });
  });
};

const generate = function generate(options) {
  // @TODO clean up async data
  init(options)
    .then((initData) => {
      options.types.forEach((type) => {
        const defaults = {
          filename: `${type}-${options.action}`,
          language: type,
        };
        const config = Object.assign({}, defaults, options);

        if (initData.clientTypeList[camelCase(type)]) {
          return create(config, { spec: JSON.parse(initData.api) })
            .then((response) => {
              console.log(`${type.charAt(0).toUpperCase() + type.slice(1)} ${config.action} has been created. Downloading from ${response.link}`);

              // Similar to wget --no-check-certificate
              process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

              // Download
              download(`${config.path.archive}${config.filename}.zip`, response)
              .then(() => {
                console.log(`Download of ${config.path.archive}${config.filename}.zip complete.`);
                console.log(`Unzipping to ${config.path.output}`);

                // Unzip
                unzipDownload(`${config.path.archive}${config.filename}.zip`, config.path.output)
                .then(() => {
                  console.log(`SDK generated for ${type}`);
                }).catch((err) => {
                  console.error(`Unzip of ${config.action} ${type} failed`, err);
                });
              })
              .catch((err) => {
                console.error(`Download of ${config.action} ${type} failed`, err);
              });
            })
            .catch((err) => {
              console.error(`Creation of ${config.action} ${type} failed`, err);
            });
        }
        return true;
      });
      return 'true';
    })
    .catch((err) => {
      console.error('Initialization failed.', err);
    });
};

module.exports = {
  // type: {
  //     client: function(options) {
  //       options.action = 'client'
  //
  //       init(options)
  //         .then(function(initData) {
  //             return getTypeList(options)
  //         })
  //         .catch(function(err) {
  //             console.error('Initialization failed.', err)
  //         })
  //     },
  //     // @TODO Generate type list of servers http://generator.swagger.io/#!/servers/
  //     // server: function (){ return typeList }
  // },
  greet() {
    return 'hello friend';
  },
  generate: {
    client(options) {
      const defaults = {
        action: 'client',
      };
      const config = Object.assign({}, defaults, options);
      return generate(config);
    },
    server(options) {
      const defaults = {
        action: 'client',
      };
      const config = Object.assign({}, defaults, options);
      return generate(config);
    },
  },
};
