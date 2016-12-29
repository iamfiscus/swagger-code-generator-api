'use strict';
require('ssl-root-cas').inject();

const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');
const request = require('request');
const unzip = require('unzip');
const camelCase = require('camelcase');
const mkdirp = require('mkdirp');

let error = null;
let config;
let serverTypeList;
let defaultOptions = [{
        path: null,
        validate: function(path) {
            return true
        },
        message: 'Must have a valid JSON or path'
    },

];

// @TODO print to console using chalk
// @TODO allow for url request
// @TODO allow for custom endpoints for self endpoints
// @TODO error handling

function validateOptions(options) {
    // @TODO Validate and define default options

    // Swagger
    if (!options.swagger) {
      throw new Error(`The swagger file path is required.`);
    }

    if (path.extname(options.swagger) !== '.yaml' && path.extname(options.swagger) !== '.json') {
      throw new Error(`The swagger file must be a YAML or JSON file.`);
    }

    // Types
    if (!options.types) {
      throw new Error(`The language 'types' are required.`);
    }

    // Endpoints
    options.endpoint = options.endpoint || `http://generator.swagger.io/api/gen/${options.action}s/`

    // Folder paths
    options.path = options.path || {}
    options.path.archive = options.path.archive || `./generated/archive/`
    options.path.output = options.path.output || `./generated/${options.action}/`
    Object.keys(options.path).forEach(function(k){
      let path = options.path[k];

      if(!path) {
        throw new Error(`Path ${k} is required.`);
      }

      mkdirp(path, function (err) {
        if (err) {
          throw new Error(`The path '${path}' does not exist and could not be created.`);
        }
      });
    })
    return options

}

let init = function(options) {
    return new Promise((resolve, reject) => {
        options = validateOptions(options);

        config = fs.readFileSync(options.swagger, 'utf8')

        if (path.extname(options.swagger) === '.yaml') {
            config = JSON.stringify(yaml.safeLoad(config))
        }

        getTypeList(options).then(function(data){
          resolve({
            clientTypeList: data,
            api: config
          })
        }).catch(function(err){
          throw new Error(`The endpoint '${options.endpoint}' does not exist or is returning an error.`);
        })

    })

}

let buildTypeList = function(types) {
    let result = {};
    types.forEach(function(type, i) {
        result[camelCase(type)] = type;
    })

    return result
}

let getTypeList = function(options) {

    return new Promise((resolve, reject) => {
        request.get({
            url: options.endpoint,
            json: true
        }, (err, req, body) => {
            if (err) {
                // @TODO throw better error
                console.log(err)
                reject(err)
                return;
            }
            if(body.code){
              console.error(`The endpoint '${options.endpoint}' does not exist or is returning an error.`, body)
              reject(body)
              return;
            }

            resolve(buildTypeList(body))
        })
    })
}

let download = function(path, downloadResponse) {

    return new Promise((resolve, reject) => {
        request(downloadResponse.link).pipe(fs.createWriteStream(path)).on("finish", resolve).on("error", reject);
    })
}
let unzipDownload = function(zipPath, toPath) {
    if (zipPath.indexOf(".zip") == -1) throw new Error("fromPath should be an zip file your path is " + zipPath)
    return new Promise((resolve, reject) => {
        fs.createReadStream(zipPath).pipe(unzip.Extract({
            path: toPath
        })).on("error", reject).on("close", resolve);
    })
}

let create = function(options, opts, swaggerSpec) {

    return new Promise((resolve, reject) => {
        // let swaggerSpec = swaggerSpec ? swaggerSpec : generateSwaggerSpec(this.app)
        let url = `${options.endpoint}${options.language}`;
        opts.spec = swaggerSpec
        request.post({
            url: url,
            json: true,
            body: opts

        }, (err, req, body) => {
            if (err) {
                reject(err)
                return;
            }
            if (!isNaN(body.code)) {
                reject(body)
                return;
            }
            resolve(body)
        })
    })
}

let generate = function(options, action) {

    // @TODO clean up async data
    init(options)
        .then(function(initData) {

            options.types.forEach(function(type, i) {
                options.filename = options.filename || `${type}-${options.action}`
                options.language = type

                if (initData.clientTypeList[camelCase(type)]) {
                    return create(options, {}, JSON.parse(initData.api)).then((response) => {
                        console.log(`${type.charAt(0).toUpperCase() + type.slice(1)} ${options.action} has been created. Downloading from ${response.link}`)

                        // Similar to wget --no-check-certificate
                        process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

                        // Download
                        download(options.path.archive + options.filename + '.zip', response).then((response) => {
                            console.log(`Download of ${options.path.archive + options.filename + '.zip'} complete.`);
                            console.log(`Unzipping to ${options.path.output}`);

                            // Unzip
                            unzipDownload(options.path.archive + options.filename + '.zip', options.path.output).then((response) => {
                                console.log(`SDK generated for ${type}`);
                            }).catch(function(err){
                              console.error(`Unzip of ${options.action} ${type} failed`, err)
                            })

                        }).catch(function(err){
                          console.error(`Download of ${options.action} ${type} failed`, err)
                        });

                    }).catch(function(err){
                      console.error(`Creation of ${options.action} ${type} failed`, err)
                    })
                }
            })
            return 'true'
        })
        .catch(function(err) {
            console.error('Initialization failed.', err)
        })
}




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
    generate: {
        client: function(options) {
            options.action = 'client'
            return generate(options)
        },
        server: function(options) {
            options.action = 'server'
            return generate(options)
        }
    }
}
