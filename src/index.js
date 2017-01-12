'use strict';

require('ssl-root-cas').inject();

const camelCase = require('camelcase');
const list = require('./list');
const create = require('./create');
const download = require('./download');

// @TODO print to console using chalk
// @TODO allow for url request
// @TODO allow for custom endpoints for self endpoints
// @TODO error handling

const generate = function generate(options) {
  // @TODO clean up async data
  list().init(options)
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
              download().get(`${config.path.archive}${config.filename}.zip`, response.link)
              .then(() => {
                console.log(`Download of ${config.path.archive}${config.filename}.zip complete.`);
                console.log(`Unzipping to ${config.path.output}`);

                // Unzip
                download().unzip(`${config.path.archive}${config.filename}.zip`, config.path.output)
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
        action: 'server',
      };
      const config = Object.assign({}, defaults, options);
      return generate(config);
    },
  },
};
