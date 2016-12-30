'use strict';

const codegen = require('../src/index');
const version = require('../package.json').version;

codegen.generate.server({
  types: ['nodejs-server'],
  swagger: './example/petstore.yaml', // required json or yaml
  endpoint: 'http://generator.swagger.io/api/gen/servers/',
  path: {
    archive: `./generated/archive/${version}/`,
    output: `./generated/server/${version}/`,
  },
});
